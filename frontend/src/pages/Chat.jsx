import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import { PageLoader, EmptyState } from '../components/ui/States'
import { format, isToday, isYesterday } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function formatMessageTime(date) {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'dd MMM HH:mm')
}

export default function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([]) // accepted interests
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load conversations (accepted interests where user is involved)
  useEffect(() => {
    const load = async () => {
      try {
        const endpoint = user.role === 'TENANT' ? '/interests' : '/interests/received'
        const { data } = await api.get(endpoint)
        const arr = Array.isArray(data) ? data : (data.data || [])
        const accepted = arr.filter((i) => i.status === 'ACCEPTED')
        setConversations(accepted)
        if (accepted.length > 0) setActiveConv(accepted[0])
      } catch (e) {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('nivasai_token')
    const socket = io('/', {
      auth: { token },
      path: '/socket.io',
    })

    socket.on('connect', () => setSocketConnected(true))
    socket.on('disconnect', () => setSocketConnected(false))
    socket.on('error', (err) => toast.error(err.message || 'Socket error'))

    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        // avoid duplicate
        if (prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setTimeout(scrollToBottom, 50)
    })

    socketRef.current = socket
    return () => socket.disconnect()
  }, [])

  // Join room when active conversation changes
  useEffect(() => {
    if (!activeConv || !socketRef.current) return
    socketRef.current.emit('joinRoom', { interestId: activeConv.id })
    // Load existing messages
    const loadMessages = async () => {
      try {
        const { data } = await api.get(`/chat/messages/${activeConv.id}`)
        setMessages(data.data || [])
        setTimeout(scrollToBottom, 100)
      } catch (e) {
        setMessages([])
      }
    }
    loadMessages()
  }, [activeConv])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      socketRef.current.emit('sendMessage', {
        interestId: activeConv.id,
        content,
      })
      // Optimistically add message
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          content,
          senderId: user.id,
          createdAt: new Date().toISOString(),
          sender: { name: user.name },
        },
      ])
      setTimeout(scrollToBottom, 50)
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getOtherParty = (conv) => {
    if (user.role === 'TENANT') return conv.listing?.owner?.name || 'Owner'
    return conv.tenant?.name || 'Tenant'
  }

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>

  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest">
      {/* Conversation list */}
      <div className={clsx(
        'flex flex-col border-r border-outline-variant/20 bg-surface-bright',
        'w-full md:w-[300px] lg:w-[360px] shrink-0',
        activeConv ? 'hidden md:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20">
          <h1 className="text-title-md font-semibold text-on-surface">Messages</h1>
          <div className="flex items-center gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-outline'}`} />
            <span className="text-body-sm text-on-surface-variant text-[12px]">
              {socketConnected ? 'Connected' : 'Connecting…'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll">
          {conversations.length === 0 ? (
            <EmptyState
              icon="forum"
              title="No conversations yet"
              description="Interests need to be accepted before you can chat."
            />
          ) : (
            conversations.map((conv) => {
              const isActive = activeConv?.id === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={clsx(
                    'w-full px-4 py-3 flex items-start gap-3 transition-colors border-l-2 text-left',
                    isActive
                      ? 'bg-primary/5 border-primary'
                      : 'border-transparent hover:bg-surface-container-low'
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-body-md font-semibold text-on-surface truncate">{getOtherParty(conv)}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant truncate text-[12px]">
                      {conv.listing?.title}
                    </p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-medium">
                      <span className="material-symbols-outlined mr-0.5 text-[10px]">auto_awesome</span>
                      {conv.compatibilityScore ?? '?'}% Match
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat pane */}
      {activeConv ? (
        <div className={clsx('flex-1 flex flex-col', activeConv ? 'flex' : 'hidden md:flex')}>
          {/* Chat header */}
          <div className="h-16 border-b border-outline-variant/20 px-4 flex items-center gap-3 bg-surface shrink-0">
            <button
              className="md:hidden text-on-surface-variant mr-1"
              onClick={() => setActiveConv(null)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            </div>
            <div>
              <p className="text-body-md font-semibold text-on-surface">{getOtherParty(activeConv)}</p>
              <p className="text-body-sm text-on-surface-variant text-[12px] truncate">{activeConv.listing?.title}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-body-sm text-on-surface-variant">No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id
              return (
                <div
                  key={msg.id}
                  className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={clsx(
                      'max-w-[70%] px-4 py-2.5 rounded-2xl text-body-md',
                      isMine
                        ? 'bg-primary text-on-primary rounded-br-sm'
                        : 'bg-surface-container text-on-surface rounded-bl-sm'
                    )}
                  >
                    <p>{msg.content}</p>
                    <p className={clsx('text-[10px] mt-1', isMine ? 'text-on-primary/60' : 'text-on-surface-variant')}>
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t border-outline-variant/20 bg-surface flex gap-3 items-center"
          >
            <input
              className="input-base flex-1"
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary py-2.5 px-4 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <EmptyState
            icon="forum"
            title="Select a conversation"
            description="Choose a conversation from the left to start chatting."
          />
        </div>
      )}
    </div>
  )
}
