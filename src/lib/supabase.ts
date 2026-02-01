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

export async function savePrediction(category: string, selection: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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

  // Group by user - use user_id as identifier since we can't get emails easily
  const grouped = new Map<string, { odbc: string; predictions: Prediction[] }>()

  for (const row of data || []) {
    const odbc = row.user_id

    if (!grouped.has(odbc)) {
      grouped.set(odbc, { odbc, predictions: [] })
    }
    grouped.get(odbc)!.predictions.push(row)
  }

  return Array.from(grouped.values()).map(g => ({
    user_email: g.odbc.slice(0, 8) + '...', // Use truncated user_id as identifier
    predictions: g.predictions
  }))
}

export async function getLeaderboard(resultsMap: Map<string, string>): Promise<{ odbc: string; odbc_short: string; score: number; total: number }[]> {
  const { data, error } = await supabase
    .from('sb_predictions')
    .select('user_id, category, selection')
    .order('user_id')

  if (error) throw error
  if (!data) return []

  // Group by user and calculate scores
  const scores = new Map<string, { odbc: string; score: number; total: number }>()

  for (const row of data) {
    const odbc = row.user_id
    if (!scores.has(odbc)) {
      scores.set(odbc, { odbc, score: 0, total: 0 })
    }
    const userScore = scores.get(odbc)!
    userScore.total++

    const result = resultsMap.get(row.category)
    if (result && row.selection === result) {
      userScore.score++
    }
  }

  return Array.from(scores.values())
    .map(s => ({ ...s, odbc_short: s.odbc.slice(0, 8) }))
    .sort((a, b) => b.score - a.score || b.total - a.total)
}
