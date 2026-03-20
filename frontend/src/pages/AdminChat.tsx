import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'

const API = '/api'
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

interface Conversation {
  conversation_id: string
  name: string
  last_message: string
  last_sender: string
  last_at: string | null
  total_messages: number
}

interface Message {
  id: number
  sender: string
  name: string
  message: string
  created_at: string | null
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API}/admin/chat/conversations`, { headers: headers() })
      if (res.ok) setConversations(await res.json())
    } catch {}
  }

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`${API}/chat/messages/${convId}`)
      if (res.ok) setMessages(await res.json())
    } catch {}
  }

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selected) {
      loadMessages(selected)
      // Mark as read
      fetch(`${API}/admin/chat/read/${selected}`, { method: 'POST', headers: headers() }).catch(() => {})
      pollRef.current = setInterval(() => loadMessages(selected), 3000)
      return () => clearInterval(pollRef.current)
    }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await fetch(`${API}/admin/chat/reply`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ conversation_id: selected, message: reply.trim() }),
      })
      setReply('')
      loadMessages(selected)
    } catch {}
    setSending(false)
  }

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="container">
      <SEO title="Chat" />
      <h1 className="page-title">Live Chat</h1>

      <div className="admin-chat-layout">
        <div className="admin-chat-sidebar">
          {conversations.length === 0 ? (
            <p className="admin-images-hint">No conversations yet.</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.conversation_id}
                className={`admin-chat-conv ${selected === conv.conversation_id ? 'admin-chat-conv-active' : ''}`}
                onClick={() => setSelected(conv.conversation_id)}
              >
                <div className="admin-chat-conv-name">{conv.name}</div>
                <div className="admin-chat-conv-preview">
                  {conv.last_sender === 'admin' ? 'You: ' : ''}{conv.last_message.substring(0, 50)}
                </div>
                <div className="admin-chat-conv-time">{timeAgo(conv.last_at)}</div>
              </button>
            ))
          )}
        </div>

        <div className="admin-chat-main">
          {!selected ? (
            <div className="admin-chat-empty">Select a conversation</div>
          ) : (
            <>
              <div className="admin-chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-msg ${msg.sender === 'admin' ? 'chat-msg-admin' : 'chat-msg-user'}`}>
                    <div className="chat-bubble">{msg.message}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="admin-chat-input">
                <input
                  type="text"
                  placeholder="Type a reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !sending) handleReply() }}
                  disabled={sending}
                />
                <button className="btn btn-primary btn-sm" onClick={handleReply} disabled={sending || !reply.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
