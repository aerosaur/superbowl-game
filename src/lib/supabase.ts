import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TYPES
// ============================================

export type Party = {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export type PartyMember = {
  party_id: string
  user_id: string
  joined_at: string
}

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

export async function getMyProfile(userId?: string): Promise<string | null> {
  try {
    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      uid = user.id
    }

    const { data, error } = await supabase
      .from('sb_profiles')
      .select('first_name')
      .eq('user_id', uid)
      .maybeSingle()

    if (error || !data) return null
    return data.first_name
  } catch {
    return null
  }
}

// ============================================
// PARTY FUNCTIONS
// ============================================

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createParty(name: string): Promise<Party> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Generate unique invite code (retry if collision)
  let inviteCode = generateInviteCode()
  let attempts = 0

  while (attempts < 5) {
    const { data, error } = await supabase
      .from('sb_parties')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: user.id
      })
      .select()
      .single()

    if (error?.code === '23505') {
      // Unique violation - try a new code
      inviteCode = generateInviteCode()
      attempts++
      continue
    }

    if (error) throw error

    // Auto-join the party as creator
    await supabase
      .from('sb_party_members')
      .insert({
        party_id: data.id,
        user_id: user.id
      })

    return data
  }

  throw new Error('Failed to generate unique invite code')
}

export async function joinParty(inviteCode: string): Promise<Party> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Find party by invite code
  const { data: party, error: findError } = await supabase
    .from('sb_parties')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (findError || !party) {
    throw new Error('Invalid invite code')
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('sb_party_members')
    .select('party_id')
    .eq('party_id', party.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return party // Already a member
  }

  // Join the party
  const { error: joinError } = await supabase
    .from('sb_party_members')
    .insert({
      party_id: party.id,
      user_id: user.id
    })

  if (joinError) throw joinError

  return party
}

export async function leaveParty(partyId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('sb_party_members')
    .delete()
    .eq('party_id', partyId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function getMyParties(): Promise<(Party & { member_count: number })[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get parties user is a member of
  const { data: memberships, error: memberError } = await supabase
    .from('sb_party_members')
    .select('party_id')
    .eq('user_id', user.id)

  if (memberError) throw memberError
  if (!memberships || memberships.length === 0) return []

  const partyIds = memberships.map(m => m.party_id)

  // Get party details
  const { data: parties, error: partyError } = await supabase
    .from('sb_parties')
    .select('*')
    .in('id', partyIds)

  if (partyError) throw partyError
  if (!parties) return []

  // Get member counts
  const { data: counts, error: countError } = await supabase
    .from('sb_party_members')
    .select('party_id')
    .in('party_id', partyIds)

  if (countError) throw countError

  const countMap = new Map<string, number>()
  for (const c of counts || []) {
    countMap.set(c.party_id, (countMap.get(c.party_id) || 0) + 1)
  }

  return parties.map(p => ({
    ...p,
    member_count: countMap.get(p.id) || 0
  }))
}

export async function getPartyLeaderboard(partyId: string, resultsMap: Map<string, string>): Promise<LeaderboardEntry[]> {
  // Get party members
  const { data: members, error: memberError } = await supabase
    .from('sb_party_members')
    .select('user_id')
    .eq('party_id', partyId)

  if (memberError) throw memberError
  if (!members || members.length === 0) return []

  const memberIds = members.map(m => m.user_id)

  // Get predictions for party members only
  const { data: predictions, error: predError } = await supabase
    .from('sb_predictions')
    .select('user_id, category, selection')
    .in('user_id', memberIds)
    .order('user_id')

  if (predError) throw predError
  if (!predictions) return []

  // Get profiles
  const { data: profiles, error: profileError } = await supabase
    .from('sb_profiles')
    .select('user_id, first_name')
    .in('user_id', memberIds)

  if (profileError) console.error('Failed to load profiles:', profileError)

  const profileMap = new Map<string, string>()
  for (const profile of profiles || []) {
    profileMap.set(profile.user_id, profile.first_name)
  }

  // Calculate scores
  const scores = new Map<string, LeaderboardEntry>()

  // Initialize all members (even those without predictions)
  for (const userId of memberIds) {
    scores.set(userId, {
      user_id: userId,
      first_name: profileMap.get(userId) || 'Player',
      score: 0,
      total: 0
    })
  }

  // Count predictions and scores
  for (const row of predictions) {
    const userScore = scores.get(row.user_id)!
    userScore.total++

    const result = resultsMap.get(row.category)
    if (result && row.selection === result) {
      userScore.score++
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || b.total - a.total)
}

export async function getPartyByInviteCode(inviteCode: string): Promise<Party | null> {
  const { data, error } = await supabase
    .from('sb_parties')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle()

  if (error) return null
  return data
}
