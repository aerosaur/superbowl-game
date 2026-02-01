import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Prediction = {
  id: string
  user_id: string
  category: string
  selection: string
  created_at: string
  updated_at: string
}

export type Result = {
  id: string
  category: string
  selection: string
  announced_at: string
}

export type Profile = {
  user_id: string
  first_name: string
}

// Extract first name from full name or email
function extractFirstName(fullName?: string, email?: string): string {
  if (fullName) {
    return fullName.split(' ')[0]
  }
  if (email) {
    const localPart = email.split('@')[0]
    // Remove numbers and split by common separators
    const name = localPart.replace(/[0-9]/g, '').split(/[._-]/)[0]
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
  return 'Player'
}

export async function saveProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const firstName = extractFirstName(
    user.user_metadata?.full_name || user.user_metadata?.name,
    user.email
  )

  const { error } = await supabase
    .from('sb_profiles')
    .upsert({
      user_id: user.id,
      first_name: firstName,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) console.error('Failed to save profile:', error)
}

export async function savePrediction(category: string, selection: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Save profile on first prediction
  await saveProfile()

  const { error } = await supabase
    .from('sb_predictions')
    .upsert({
      user_id: user.id,
      category,
      selection,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,category'
    })

  if (error) throw error
}

export async function getPredictions(): Promise<Prediction[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sb_predictions')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw error
  return data || []
}

export async function deletePrediction(category: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('sb_predictions')
    .delete()
    .eq('user_id', user.id)
    .eq('category', category)

  if (error) throw error
}

export async function getResults(): Promise<Result[]> {
  const { data, error } = await supabase
    .from('sb_results')
    .select('*')

  if (error) throw error
  return data || []
}

export async function saveResult(category: string, selection: string) {
  const { error } = await supabase
    .from('sb_results')
    .upsert({
      category,
      selection,
      announced_at: new Date().toISOString()
    }, {
      onConflict: 'category'
    })

  if (error) throw error
}

export async function deleteResult(category: string) {
  const { error } = await supabase
    .from('sb_results')
    .delete()
    .eq('category', category)

  if (error) throw error
}

export function subscribeToResults(callback: (results: Result[]) => void) {
  const channel = supabase
    .channel('results-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sb_results' },
      async () => {
        const results = await getResults()
        callback(results)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function getAllPredictions(): Promise<{ user_email: string; predictions: Prediction[] }[]> {
  const { data, error } = await supabase
    .from('sb_predictions')
    .select('*')
    .order('user_id')

  if (error) throw error

  const grouped = new Map<string, { odbc: string; predictions: Prediction[] }>()

  for (const row of data || []) {
    const odbc = row.user_id

    if (!grouped.has(odbc)) {
      grouped.set(odbc, { odbc, predictions: [] })
    }
    grouped.get(odbc)!.predictions.push(row)
  }

  return Array.from(grouped.values()).map(g => ({
    user_email: g.odbc.slice(0, 8) + '...',
    predictions: g.predictions
  }))
}

export type LeaderboardEntry = {
  user_id: string
  first_name: string
  score: number
  total: number
}

export async function getLeaderboard(resultsMap: Map<string, string>): Promise<LeaderboardEntry[]> {
  // Get all predictions
  const { data: predictions, error: predError } = await supabase
    .from('sb_predictions')
    .select('user_id, category, selection')
    .order('user_id')

  if (predError) throw predError
  if (!predictions) return []

  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('sb_profiles')
    .select('user_id, first_name')

  if (profileError) console.error('Failed to load profiles:', profileError)

  const profileMap = new Map<string, string>()
  for (const profile of profiles || []) {
    profileMap.set(profile.user_id, profile.first_name)
  }

  // Group by user and calculate scores
  const scores = new Map<string, LeaderboardEntry>()

  for (const row of predictions) {
    const userId = row.user_id
    if (!scores.has(userId)) {
      scores.set(userId, {
        user_id: userId,
        first_name: profileMap.get(userId) || 'Player',
        score: 0,
        total: 0
      })
    }
    const userScore = scores.get(userId)!
    userScore.total++

    const result = resultsMap.get(row.category)
    if (result && row.selection === result) {
      userScore.score++
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || b.total - a.total)
}

export function getCurrentUserFirstName(user: { email?: string; user_metadata?: { full_name?: string; name?: string } }): string {
  return extractFirstName(
    user.user_metadata?.full_name || user.user_metadata?.name,
    user.email
  )
}

export async function updateDisplayName(newName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('sb_profiles')
    .upsert({
      user_id: user.id,
      first_name: newName.trim(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })

  if (error) throw error
}

export async function getMyProfile(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('sb_profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return null
    return data.first_name
  } catch {
    return null
  }
}
