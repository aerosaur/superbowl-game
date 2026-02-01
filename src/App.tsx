import { useState, useEffect, useCallback } from 'react'
import { supabase, savePrediction, getPredictions, getResults, subscribeToResults } from './lib/supabase'
import { categories, categoryGroups, type Category, type Option } from './data/categories'
import type { User } from '@supabase/supabase-js'
import './App.css'

// Feb 8, 2026 at 6:30pm ET = Feb 8, 2026 23:30 UTC
const LOCKOUT_TIME = new Date('2026-02-08T23:30:00Z')

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<Map<string, string>>(new Map())
  const [results, setResults] = useState<Map<string, string>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isLocked, setIsLocked] = useState(false)

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load predictions when user logs in
  useEffect(() => {
    if (user) {
      getPredictions().then(preds => {
        const predMap = new Map<string, string>()
        preds.forEach(p => predMap.set(p.category, p.selection))
        setPredictions(predMap)
      })
    } else {
      setPredictions(new Map())
    }
  }, [user])

  // Load results and subscribe to changes
  useEffect(() => {
    getResults().then(res => {
      const resMap = new Map<string, string>()
      res.forEach(r => resMap.set(r.category, r.selection))
      setResults(resMap)
    })

    const unsubscribe = subscribeToResults((res) => {
      const resMap = new Map<string, string>()
      res.forEach(r => resMap.set(r.category, r.selection))
      setResults(resMap)
    })

    return () => unsubscribe()
  }, [])

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const diff = LOCKOUT_TIME.getTime() - now.getTime()

      if (diff <= 0) {
        setIsLocked(true)
        setTimeLeft('Predictions locked')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleSelect = useCallback(async (categoryId: string, optionId: string) => {
    if (isLocked || !user) return

    setSaving(categoryId)
    try {
      await savePrediction(categoryId, optionId)
      setPredictions(prev => new Map(prev).set(categoryId, optionId))
    } catch (error) {
      console.error('Failed to save prediction:', error)
    } finally {
      setSaving(null)
    }
  }, [isLocked, user])

  // Calculate score
  const score = categories.reduce((acc, cat) => {
    const prediction = predictions.get(cat.id)
    const result = results.get(cat.id)
    if (prediction && result && prediction === result) {
      return acc + 1
    }
    return acc
  }, 0)

  const totalPredictions = predictions.size
  const totalResults = results.size

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <div className="login-screen">
          <div className="login-graphic">
            <div className="field-lines">
              <div className="yard-line"></div>
              <div className="yard-line"></div>
              <div className="yard-line"></div>
              <div className="yard-line"></div>
              <div className="yard-line"></div>
              <div className="center-circle"></div>
            </div>
            <div className="football">🏈</div>
          </div>
          <h1>Super Bowl LX</h1>
          <p className="matchup">Seahawks vs Patriots</p>
          <p className="date">Sunday, Feb 8 · 6:30 PM ET</p>
          <p className="venue">Levi's Stadium, Santa Clara</p>
          <button className="sign-in-btn" onClick={handleSignIn}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">🏈</span>
          <div className="header-title">
            <h1>Super Bowl LX</h1>
            <span className="matchup-small">SEA vs NE · Feb 8</span>
          </div>
        </div>
        <div className="header-right">
          <div className="timer" data-locked={isLocked}>
            {isLocked ? '🔒' : '⏱️'} {timeLeft}
          </div>
          <div className="user-menu">
            <span className="user-email">{user.email}</span>
            <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="score-bar">
        <div className="score-item">
          <span className="score-label">Predictions</span>
          <span className="score-value">{totalPredictions}/{categories.length}</span>
        </div>
        {totalResults > 0 && (
          <div className="score-item highlight">
            <span className="score-label">Score</span>
            <span className="score-value">{score}/{totalResults}</span>
          </div>
        )}
      </div>

      <main className="main">
        {Object.entries(categoryGroups).map(([key, group]) => (
          <section key={key} className="category-group">
            <div className="group-header">
              <h2>{group.title}</h2>
              <p>{group.subtitle}</p>
            </div>
            <div className="categories">
              {group.categories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  selectedOption={predictions.get(category.id)}
                  result={results.get(category.id)}
                  onSelect={handleSelect}
                  isLocked={isLocked}
                  isSaving={saving === category.id}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="footer">
        <p>Made with 🏈 for Super Bowl LX</p>
      </footer>
    </div>
  )
}

function CategoryCard({
  category,
  selectedOption,
  result,
  onSelect,
  isLocked,
  isSaving
}: {
  category: Category
  selectedOption?: string
  result?: string
  onSelect: (categoryId: string, optionId: string) => void
  isLocked: boolean
  isSaving: boolean
}) {
  const hasResult = !!result
  const isCorrect = hasResult && selectedOption === result

  return (
    <div className={`category-card ${hasResult ? 'has-result' : ''} ${isCorrect ? 'correct' : hasResult && selectedOption ? 'incorrect' : ''}`}>
      <div className="category-header">
        <span className="category-emoji">{category.emoji}</span>
        <span className="category-name">{category.name}</span>
        {isSaving && <span className="saving-indicator">Saving...</span>}
        {hasResult && (
          <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓' : '✗'}
          </span>
        )}
      </div>
      <div className="options">
        {category.options.map(option => (
          <OptionButton
            key={option.id}
            option={option}
            isSelected={selectedOption === option.id}
            isResult={result === option.id}
            isLocked={isLocked}
            onClick={() => onSelect(category.id, option.id)}
          />
        ))}
      </div>
    </div>
  )
}

function OptionButton({
  option,
  isSelected,
  isResult,
  isLocked,
  onClick
}: {
  option: Option
  isSelected: boolean
  isResult: boolean
  isLocked: boolean
  onClick: () => void
}) {
  const isSeahawks = option.label.includes('Seahawks') || option.sublabel?.includes('SEA')
  const isPatriots = option.label.includes('Patriots') || option.sublabel?.includes('NE')

  return (
    <button
      className={`option-btn ${isSelected ? 'selected' : ''} ${isResult ? 'result' : ''} ${isSeahawks ? 'seahawks' : ''} ${isPatriots ? 'patriots' : ''}`}
      onClick={onClick}
      disabled={isLocked}
    >
      <span className="option-label">{option.label}</span>
      {option.sublabel && <span className="option-sublabel">{option.sublabel}</span>}
      {isSelected && <span className="check">✓</span>}
      {isResult && !isSelected && <span className="result-marker">★</span>}
    </button>
  )
}

export default App
