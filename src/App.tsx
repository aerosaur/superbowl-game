import { useState, useEffect, useCallback } from 'react'
import { supabase, savePrediction, deletePrediction, getPredictions, getResults, subscribeToResults, getPartyLeaderboard, saveProfile, getCurrentUserFirstName, updateDisplayName, getMyProfile, getMyParties, type LeaderboardEntry, type Party } from './lib/supabase'
import { categories, categoryGroups, type Category, type Option } from './data/categories'
import { PartySelector } from './PartySelector'
import type { User } from '@supabase/supabase-js'
import {
  Trophy,
  ChartBar,
  Target,
  Timer,
  NumberCircleOne,
  Star,
  PersonSimpleRun,
  Football,
  SneakerMove,
  HandGrabbing,
  CurrencyCircleDollar,
  Microphone,
  Drop,
  ListNumbers,
  ArrowsClockwise,
  Clock,
  Lock,
  Check,
  X,
  StarFour,
  Hourglass,
  UsersThree,
  MusicNotes,
  Dog,
  FilmSlate,
  Robot,
  ChartLine,
  PencilSimple,
  CaretDown,
  Copy
} from '@phosphor-icons/react'
import './App.css'

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Trophy,
  ChartBar,
  Target,
  Timer,
  NumberCircleOne,
  Star,
  PersonSimpleRun,
  Football,
  SneakerMove,
  HandGrabbing,
  CurrencyCircleDollar,
  Microphone,
  Drop,
  ListNumbers,
  ArrowsClockwise,
  Hourglass,
  UsersThree,
  MusicNotes,
  Dog,
  FilmSlate,
  Robot,
}

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
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserFirstName, setCurrentUserFirstName] = useState<string>('You')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Party state
  const [currentParty, setCurrentParty] = useState<Party | null>(null)
  const [myParties, setMyParties] = useState<(Party & { member_count: number })[]>([])
  const [showPartyMenu, setShowPartyMenu] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Auth state
  useEffect(() => {
    const loadUserProfile = async (user: User) => {
      try {
        const savedName = await getMyProfile(user.id)
        if (savedName) {
          setCurrentUserFirstName(savedName)
        } else {
          setCurrentUserFirstName(getCurrentUserFirstName(user))
          saveProfile().catch(console.error)
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        setCurrentUserFirstName(getCurrentUserFirstName(user))
      }
    }

    const loadUserParties = async () => {
      try {
        const parties = await getMyParties()
        setMyParties(parties)
        // Auto-select first party if user has any
        if (parties.length > 0) {
          setCurrentParty(parties[0])
        }
      } catch (error) {
        console.error('Failed to load parties:', error)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user)
        loadUserParties()
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Failed to get session:', error)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user)
        loadUserParties()
      } else {
        setCurrentParty(null)
        setMyParties([])
      }
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

  // Load leaderboard when results change or when opened
  useEffect(() => {
    if (showLeaderboard && user && currentParty) {
      getPartyLeaderboard(currentParty.id, results).then(setLeaderboard).catch(console.error)
    } else if (!currentParty) {
      setLeaderboard([])
    }
  }, [showLeaderboard, results, user, currentParty])

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const diff = LOCKOUT_TIME.getTime() - now.getTime()

      if (diff <= 0) {
        setIsLocked(true)
        setTimeLeft('Locked')
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

    const currentSelection = predictions.get(categoryId)
    setSaving(categoryId)

    try {
      if (currentSelection === optionId) {
        // Toggle off - delete prediction
        await deletePrediction(categoryId)
        setPredictions(prev => {
          const newMap = new Map(prev)
          newMap.delete(categoryId)
          return newMap
        })
      } else {
        // Select new option
        await savePrediction(categoryId, optionId)
        setPredictions(prev => new Map(prev).set(categoryId, optionId))
      }
    } catch (error) {
      console.error('Failed to save prediction:', error)
    } finally {
      setSaving(null)
    }
  }, [isLocked, user, predictions])

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

  // Find current user's rank
  const currentUserRank = leaderboard.findIndex(e => e.user_id === user?.id) + 1

  const handleEditName = () => {
    setEditNameValue(currentUserFirstName)
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (!editNameValue.trim()) return
    setSavingName(true)
    try {
      await updateDisplayName(editNameValue.trim())
      setCurrentUserFirstName(editNameValue.trim())
      setIsEditingName(false)
    } catch (error) {
      console.error('Failed to update name:', error)
    } finally {
      setSavingName(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditNameValue('')
  }

  const handleSelectParty = async (party: Party) => {
    setCurrentParty(party)
    // Refresh parties list to get updated member counts
    const parties = await getMyParties()
    setMyParties(parties)
  }

  const handleSwitchParty = (party: Party) => {
    setCurrentParty(party)
    setShowPartyMenu(false)
    setShowLeaderboard(false) // Reset leaderboard view
  }

  const handleLeaveParty = () => {
    setCurrentParty(null)
    setShowPartyMenu(false)
  }

  const handleCopyInviteCode = async () => {
    if (currentParty) {
      await navigator.clipboard.writeText(currentParty.invite_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

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
            <div className="football">
              <Football size={48} weight="fill" />
            </div>
          </div>
          <h1>Super Bowl LX</h1>
          <p className="matchup">Seahawks vs Patriots</p>
          <p className="date">Sunday, Feb 8 · 6:30 PM ET</p>
          <p className="venue">Levi's Stadium, Santa Clara</p>
          <button className="sign-in-btn" onClick={handleSignIn}>
            <svg viewBox="0 0 24 24" width="18" height="18">
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

  // Show party selector if no party is selected
  if (!currentParty) {
    return (
      <div className="app">
        <PartySelector onSelectParty={handleSelectParty} onSignOut={handleSignOut} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">
            <Football size={24} weight="fill" />
          </span>
          <h1>Super Bowl LX</h1>
        </div>
        <div className="header-center">
          <div className="timer" data-locked={isLocked}>
            {isLocked ? <Lock size={14} /> : <Clock size={14} />}
            {timeLeft}
          </div>
        </div>
        <div className="header-right">
          <button
            className={`leaderboard-toggle ${showLeaderboard ? 'active' : ''}`}
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            <ChartLine size={16} />
            <span className="leaderboard-toggle-text">Leaderboard</span>
          </button>

          {/* Party Switcher */}
          <div className="party-switcher">
            <button
              className="party-switcher-btn"
              onClick={() => setShowPartyMenu(!showPartyMenu)}
            >
              <UsersThree size={16} />
              <span className="party-name-text">{currentParty.name}</span>
              <CaretDown size={14} />
            </button>
          </div>

          <button className="sign-out-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {/* Party Menu (shared between desktop and mobile) */}
      {showPartyMenu && (
        <div className="party-menu-overlay" onClick={() => setShowPartyMenu(false)}>
          <div className="party-menu" onClick={e => e.stopPropagation()}>
            <div className="party-menu-header">
              <span>Current Party</span>
              <button
                className="copy-code-btn-small"
                onClick={handleCopyInviteCode}
                title="Copy invite code"
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{currentParty.invite_code}</span>
              </button>
            </div>

            {myParties.length > 1 && (
              <>
                <div className="party-menu-divider" />
                <div className="party-menu-label">Switch Party</div>
                {myParties
                  .filter(p => p.id !== currentParty.id)
                  .map(party => (
                    <button
                      key={party.id}
                      className="party-menu-item"
                      onClick={() => handleSwitchParty(party)}
                    >
                      {party.name}
                      <span className="party-member-count">{party.member_count}</span>
                    </button>
                  ))}
              </>
            )}

            <div className="party-menu-divider" />
            <button className="party-menu-item manage" onClick={handleLeaveParty}>
              <UsersThree size={16} />
              Manage Parties
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sub-Nav (sticky below header) */}
      <nav className="mobile-subnav">
        <button
          className={`mobile-subnav-item ${showLeaderboard ? 'active' : ''}`}
          onClick={() => setShowLeaderboard(!showLeaderboard)}
        >
          <ChartLine size={18} />
          <span>Leaderboard</span>
        </button>
        <button
          className="mobile-subnav-item"
          onClick={() => setShowPartyMenu(!showPartyMenu)}
        >
          <UsersThree size={18} />
          <span>{currentParty.name}</span>
        </button>
      </nav>

      {/* Score Bar */}
      <div className="score-bar">
        <div className="score-bar-left">
          <div className="score-bar-name">
            {isEditingName ? (
              <div className="edit-name-form">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  placeholder="Your name"
                  className="edit-name-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <button className="edit-name-save" onClick={handleSaveName} disabled={savingName}>
                  {savingName ? '...' : <Check size={14} weight="bold" />}
                </button>
                <button className="edit-name-cancel" onClick={handleCancelEdit}>
                  <X size={14} weight="bold" />
                </button>
              </div>
            ) : (
              <>
                <span className="display-name">{currentUserFirstName}</span>
                <button className="edit-name-btn" onClick={handleEditName} title="Edit display name">
                  <PencilSimple size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="score-bar-stats">
          <div className="score-stat">
            <span className="score-stat-value">{score}</span>
            <span className="score-stat-label">Score</span>
          </div>
          <div className="score-stat">
            <span className="score-stat-value">{totalPredictions}</span>
            <span className="score-stat-label">Picks</span>
          </div>
          <div className="score-stat">
            <span className="score-stat-value">{categories.length - totalPredictions}</span>
            <span className="score-stat-label">Left</span>
          </div>
          {totalResults > 0 && currentUserRank > 0 && (
            <div className="score-stat rank">
              <span className="score-stat-value">#{currentUserRank}</span>
              <span className="score-stat-label">Rank</span>
            </div>
          )}
        </div>
      </div>

      {showLeaderboard && (
        <div className="leaderboard-panel">
          <h2>Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="empty-state">No predictions yet</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Picks</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => (
                  <tr
                    key={player.user_id}
                    className={`${index < 3 ? `rank-${index + 1}` : ''} ${player.user_id === user?.id ? 'is-you' : ''}`}
                  >
                    <td className="rank">{index + 1}</td>
                    <td className="player-name">
                      {player.user_id === user?.id ? `${currentUserFirstName} (You)` : player.first_name}
                    </td>
                    <td className="score">{player.score}{totalResults > 0 ? `/${totalResults}` : ''}</td>
                    <td className="total">{player.total}/{categories.length}</td>
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
        <p>Super Bowl LX Predictions</p>
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
  const IconComponent = iconMap[category.icon]

  return (
    <div className={`category-card ${hasResult ? 'has-result' : ''} ${isCorrect ? 'correct' : hasResult && selectedOption ? 'incorrect' : ''}`}>
      <div className="category-header">
        <span className="category-icon">
          {IconComponent && <IconComponent size={18} />}
        </span>
        <span className="category-name">{category.name}</span>
        {isSaving && <span className="saving-indicator">Saving...</span>}
        {hasResult && (
          <span className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
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
      {isSelected && <span className="check"><Check size={12} weight="bold" /></span>}
      {isResult && !isSelected && <span className="result-marker"><StarFour size={14} weight="fill" /></span>}
    </button>
  )
}

export default App
