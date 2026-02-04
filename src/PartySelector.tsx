import { useState, useEffect } from 'react'
import { createParty, joinParty, getMyParties, type Party } from './lib/supabase'
import { Football, Users, Plus, SignIn, Copy, Check, CaretRight } from '@phosphor-icons/react'

type PartyWithCount = Party & { member_count: number }

type Props = {
  onSelectParty: (party: Party) => void
  onSignOut: () => void
}

export function PartySelector({ onSelectParty, onSignOut }: Props) {
  const [parties, setParties] = useState<PartyWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list')
  const [partyName, setPartyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    loadParties()
  }, [])

  const loadParties = async () => {
    try {
      const myParties = await getMyParties()
      setParties(myParties)
    } catch (err) {
      console.error('Failed to load parties:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyName.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const party = await createParty(partyName.trim())
      onSelectParty(party)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const party = await joinParty(inviteCode.trim())
      onSelectParty(party)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join party')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCode = async (party: PartyWithCount) => {
    const message = `🏈 Join my Super Bowl party "${party.name}"!\n\nCode: ${party.invite_code}\n\nhttps://superbowl-game-one.vercel.app`
    await navigator.clipboard.writeText(message)
    setCopiedCode(party.invite_code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <div className="party-selector">
        <div className="loading">Loading your parties...</div>
      </div>
    )
  }

  return (
    <div className="party-selector">
      <div className="party-header">
        <div className="party-logo">
          <Football size={32} weight="fill" />
        </div>
        <h1>Super Bowl LX</h1>
        <p className="party-subtitle">Select or create a party to play</p>
      </div>

      {mode === 'list' && (
        <div className="party-list-container">
          {parties.length > 0 && (
            <>
              <h2>Your Parties</h2>
              <div className="party-list">
                {parties.map(party => (
                  <div key={party.id} className="party-card">
                    <div className="party-card-info">
                      <span className="party-name">{party.name}</span>
                      <span className="party-members">
                        <Users size={14} />
                        {party.member_count} {party.member_count === 1 ? 'player' : 'players'}
                      </span>
                    </div>
                    <div className="party-card-actions">
                      <button
                        className="copy-code-btn"
                        onClick={() => handleCopyCode(party)}
                        title="Copy invite message"
                      >
                        {copiedCode === party.invite_code ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                        <span className="code">{party.invite_code}</span>
                      </button>
                      <button
                        className="enter-party-btn"
                        onClick={() => onSelectParty(party)}
                      >
                        Enter
                        <CaretRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="party-actions">
            <button className="party-action-btn primary" onClick={() => setMode('create')}>
              <Plus size={20} />
              Create New Party
            </button>
            <button className="party-action-btn" onClick={() => setMode('join')}>
              <SignIn size={20} />
              Join with Code
            </button>
          </div>

          <button className="sign-out-link" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form className="party-form" onSubmit={handleCreate}>
          <h2>Create a Party</h2>
          <p>Give your party a name. You'll get an invite code to share.</p>

          <input
            type="text"
            placeholder="Party name (e.g., Smith Family)"
            value={partyName}
            onChange={e => setPartyName(e.target.value)}
            autoFocus
            maxLength={50}
          />

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => { setMode('list'); setError(''); }}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting || !partyName.trim()}>
              {submitting ? 'Creating...' : 'Create Party'}
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form className="party-form" onSubmit={handleJoin}>
          <h2>Join a Party</h2>
          <p>Enter the 6-character invite code from your party host.</p>

          <input
            type="text"
            placeholder="Invite code (e.g., ABC123)"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            autoFocus
            maxLength={6}
            className="invite-code-input"
          />

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => { setMode('list'); setError(''); }}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting || inviteCode.length !== 6}>
              {submitting ? 'Joining...' : 'Join Party'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
