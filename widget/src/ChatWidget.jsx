import React, { useState, useRef, useEffect } from 'react'

const styles = {
  // Launcher bubble
  launcher: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    boxShadow: '0 4px 24px rgba(99,102,241,0.45)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    zIndex: 2147483647,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  // Chat window
  window: {
    position: 'fixed',
    bottom: '96px',
    right: '24px',
    width: '380px',
    height: '560px',
    background: '#0f0f1a',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 2147483647,
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    animation: 'slideUp 0.25s ease',
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#fff',
  },
  headerAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  headerText: { flex: 1 },
  headerTitle: { fontWeight: 700, fontSize: '15px', margin: 0 },
  headerSub: { fontSize: '12px', opacity: 0.8, margin: 0 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#333 transparent',
  },
  messageBubble: (isUser) => ({
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isUser
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
      : 'rgba(255,255,255,0.06)',
    color: '#f0f0f0',
    fontSize: '14px',
    lineHeight: '1.5',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  typingDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#8b5cf6',
    margin: '0 2px',
    animation: 'bounce 1.2s infinite',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    background: '#0f0f1a',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#f0f0f0',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.4',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '18px',
    flexShrink: 0,
    alignSelf: 'flex-end',
    transition: 'opacity 0.15s',
  },
  keyframes: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30%           { transform: translateY(-6px); }
    }
  `,
}

export default function ChatWidget({ agentId, apiBase }) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [agentName, setAgentName] = useState('AI Support')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Start session when widget opens for the first time
  useEffect(() => {
    if (open && !sessionId && agentId) {
      initSession()
    }
  }, [open])

  async function initSession() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId }),
      })
      const data = await res.json()
      setSessionId(data.session_id)
      setAgentName(data.agent_name || 'AI Support')
      setMessages([{
        role: 'ai',
        content: `Hi! I'm ${data.agent_name || 'your AI assistant'}. How can I help you today?`
      }])
    } catch (e) {
      console.error('Widget: failed to start session', e)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || streaming || !sessionId) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setStreaming(true)

    // Add a placeholder AI message we'll stream into
    setMessages(prev => [...prev, { role: 'ai', content: '' }])

    try {
      const res = await fetch(`${apiBase}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.chunk) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'ai',
                    content: updated[updated.length - 1].content + json.chunk
                  }
                  return updated
                })
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', content: 'Sorry, something went wrong. Please try again.' }
      ])
    } finally {
      setStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style>{styles.keyframes}</style>

      {/* Chat window */}
      {open && (
        <div style={styles.window}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerAvatar}>🤖</div>
            <div style={styles.headerText}>
              <p style={styles.headerTitle}>{agentName}</p>
              <p style={styles.headerSub}>
                {streaming ? 'Typing…' : 'Online · Typically replies instantly'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
              aria-label="Close chat"
            >×</button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {loading && (
              <p style={{ color: '#aaa', fontSize: '13px', textAlign: 'center' }}>Connecting…</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={styles.messageBubble(msg.role === 'user')}>
                {msg.content || (streaming && i === messages.length - 1
                  ? <span>
                      <span style={{...styles.typingDot, animationDelay: '0s'}} />
                      <span style={{...styles.typingDot, animationDelay: '0.2s'}} />
                      <span style={{...styles.typingDot, animationDelay: '0.4s'}} />
                    </span>
                  : ''
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={styles.inputArea}>
            <textarea
              style={styles.input}
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={streaming || loading}
            />
            <button
              style={{ ...styles.sendBtn, opacity: (streaming || !input.trim()) ? 0.5 : 1 }}
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Launcher button */}
      <button
        style={styles.launcher}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open
          ? <span style={{ color: '#fff', fontSize: '22px' }}>×</span>
          : <span style={{ fontSize: '24px' }}>💬</span>
        }
      </button>
    </>
  )
}
