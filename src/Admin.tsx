import { useState, useEffect } from 'react'
import { getResults, saveResult, deleteResult, getAllPredictions } from './lib/supabase'
import { categories, categoryGroups } from './data/categories'
import './App.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'superbowl60'

function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [results, setResults] = useState<Map<string, string>>(new Map())
  const [saving, setSaving] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<{ email: string; score: number; total: number }[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    if (authenticated) {
      loadData()
    }
  }, [authenticated])

  const loadData = async () => {
    const res = await getResults()
    const resMap = new Map<string, string>()
    res.forEach(r => resMap.set(r.category, r.selection))
    setResults(resMap)

    // Load all predictions for leaderboard
    try {
      const allPredictions = await getAllPredictions()
      const scores = allPredictions.map(({ user_email, predictions }) => {
        const score = predictions.reduce((acc, p) => {
          const result = resMap.get(p.category)
          if (result && p.selection === result) return acc + 1
          return acc
        }, 0)
        return { email: user_email, score, total: predictions.length }
      })
      scores.sort((a, b) => b.score - a.score)
      setLeaderboard(scores)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
    } else {
      alert('Incorrect password')
    }
  }

  const handleResultSelect = async (categoryId: string, optionId: string) => {
    setSaving(categoryId)
    try {
      await saveResult(categoryId, optionId)
      setResults(prev => new Map(prev).set(categoryId, optionId))
      await loadData() // Refresh leaderboard
    } catch (error) {
      console.error('Failed to save result:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleClearResult = async (categoryId: string) => {
    setSaving(categoryId)
    try {
      await deleteResult(categoryId)
      setResults(prev => {
        const newMap = new Map(prev)
        newMap.delete(categoryId)
        return newMap
      })
      await loadData()
    } catch (error) {
      console.error('Failed to clear result:', error)
    } finally {
      setSaving(null)
    }
  }

  if (!authenticated) {
    return (
      <div className="app">
        <div className="login-screen admin-login">
          <h1>🏈 Admin Panel</h1>
          <p>Super Bowl LX Results Entry</p>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="admin-password-input"
            />
            <button type="submit" className="sign-in-btn">
              Enter Admin
            </button>
          </form>
        </div>
      </div>
    )
  }

  const totalResults = results.size

  return (
    <div className="app admin-app">
      <header className="header">
        <div className="header-left">
          <span className="logo">🏈</span>
          <div className="header-title">
            <h1>Admin Panel</h1>
            <span className="matchup-small">Super Bowl LX Results</span>
          </div>
        </div>
        <div className="header-right">
          <button
            className={`leaderboard-toggle ${showLeaderboard ? 'active' : ''}`}
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            📊 Leaderboard
          </button>
        </div>
      </header>

      <div className="score-bar">
        <div className="score-item">
          <span className="score-label">Results Entered</span>
          <span className="score-value">{totalResults}/{categories.length}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Players</span>
          <span className="score-value">{leaderboard.length}</span>
        </div>
      </div>

      {showLeaderboard && (
        <div className="leaderboard-panel">
          <h2>🏆 Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="empty-state">No predictions yet</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Predictions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr key={player.email} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td className="email">{player.email}</td>
                    <td className="score">{player.score}/{totalResults}</td>
                    <td className="total">{player.total}/15</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <main className="main">
        {Object.entries(categoryGroups).map(([key, group]) => (
          <section key={key} className="category-group">
            <div className="group-header">
              <h2>{group.title}</h2>
              <p>Select the correct answer for each category</p>
            </div>
            <div className="categories admin-categories">
              {group.categories.map(category => {
                const currentResult = results.get(category.id)
                const isSaving = saving === category.id

                return (
                  <div key={category.id} className={`category-card admin-card ${currentResult ? 'has-result' : ''}`}>
                    <div className="category-header">
                      <span className="category-emoji">{category.emoji}</span>
                      <span className="category-name">{category.name}</span>
                      {isSaving && <span className="saving-indicator">Saving...</span>}
                      {currentResult && (
                        <button
                          className="clear-btn"
                          onClick={() => handleClearResult(category.id)}
                          disabled={isSaving}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="options admin-options">
                      {category.options.map(option => (
                        <button
                          key={option.id}
                          className={`option-btn admin-option ${currentResult === option.id ? 'selected result' : ''}`}
                          onClick={() => handleResultSelect(category.id, option.id)}
                          disabled={isSaving}
                        >
                          <span className="option-label">{option.label}</span>
                          {option.sublabel && <span className="option-sublabel">{option.sublabel}</span>}
                          {currentResult === option.id && <span className="check">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>

      <footer className="footer">
        <p>Admin Panel · Super Bowl LX</p>
      </footer>
    </div>
  )
}

export default Admin
