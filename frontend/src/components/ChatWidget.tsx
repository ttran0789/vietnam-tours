import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const API = '/api'

interface Message {
  id: number
  sender: string
  name: string
  message: string
  created_at: string | null
}

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [convId, setConvId] = useState(() => localStorage.getItem('chat_conv_id') || '')
  const [guestName, setGuestName] = useState('')
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const activeConvId = convId || (user ? `user-${user.id}` : '')

  // Load messages
  const loadMessages = async () => {
    if (!activeConvId) return
    try {
      const res = await fetch(`${API}/chat/messages/${activeConvId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch {}
  }

  // Poll for new messages when chat is open
  useEffect(() => {
    if (open && activeConvId) {
      loadMessages()
      pollRef.current = setInterval(loadMessages, 3000)
      return () => clearInterval(pollRef.current)
    }
  }, [open, activeConvId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-start for logged in users
  useEffect(() => {
    if (user) setStarted(true)
  }, [user])

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          conversation_id: activeConvId,
          message: input.trim(),
          name: user?.name || guestName || 'Guest',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.conversation_id) {
          setConvId(data.conversation_id)
          localStorage.setItem('chat_conv_id', data.conversation_id)
        }
        setInput('')
        loadMessages()
      }
    } catch {}
    setSending(false)
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        )}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <strong>Travel VN Tours</strong>
            <span>We typically reply in minutes</span>
          </div>

          {!started && !user ? (
            <div className="chat-start">
              <p>Enter your name to start chatting</p>
              <input
                type="text"
                placeholder="Your name"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && guestName.trim()) setStarted(true) }}
              />
              <button
                className="btn btn-primary btn-block btn-sm"
                onClick={() => { if (guestName.trim()) setStarted(true) }}
                disabled={!guestName.trim()}
              >
                Start Chat
              </button>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <p>Hi{user ? ` ${user.name}` : ''}! How can we help you?</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-msg ${msg.sender === 'admin' ? 'chat-msg-admin' : 'chat-msg-user'}`}>
                    <div className="chat-bubble">
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !sending) handleSend() }}
                  disabled={sending}
                />
                <button onClick={handleSend} disabled={sending || !input.trim()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
