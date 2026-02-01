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
    .select('*, user:user_id(email)')
    .order('user_id')

  if (error) throw error

  // Group by user
  const grouped = new Map<string, { email: string; predictions: Prediction[] }>()

  for (const row of data || []) {
    const userId = row.user_id
    const email = (row as { user: { email: string } | null }).user?.email || 'Unknown'

    if (!grouped.has(userId)) {
      grouped.set(userId, { email, predictions: [] })
    }
    grouped.get(userId)!.predictions.push(row)
  }

  return Array.from(grouped.values()).map(g => ({
    user_email: g.email,
    predictions: g.predictions
  }))
}
