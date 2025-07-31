// src/hooks/useChatMessages.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import { ChatMessage } from '../components/portal/chat/MessageBubble'
import { useAuth } from './AuthContext'

interface QuickReply {
  label: string
  action: string
}

// function generateIntentResponse(
//   userMessage: string,
//   userName: string | undefined
// ): ChatMessage | null {
//   const lower = userMessage.toLowerCase()
//   const now = new Date()

//   if (/\b(?:hi|hello|hey)\b/.test(lower)) {
//     return {
//       id: now.getTime().toString(),
//       type: 'bot',
//       timestamp: now,
//       content: `Hi ${userName ?? 'there'}! 👋 What can I help you with today?`,
//       quickReplies: [
//         { label: 'View Events', action: 'view_events' },
//         { label: 'Report Issue', action: 'report_issue' },
//         { label: 'Check Billing', action: 'view_billing' }
//       ]
//     }
//   }

//   if (/(maintenance|repair|broken)/.test(lower)) {
//     return {
//       id: now.getTime().toString(),
//       type: 'bot',
//       timestamp: now,
//       content: "I'd be happy to help you report a maintenance issue…",
//       quickReplies: [
//         { label: 'Report Issue', action: 'report_issue' },
//         { label: 'Check Status', action: 'view_tickets' }
//       ]
//     }
//   }

//   if (/(events|activities)/.test(lower)) {
//     return {
//       id: now.getTime().toString(),
//       type: 'bot',
//       timestamp: now,
//       content: "Sure! Here are the upcoming events in your community.",
//       quickReplies: [
//         { label: 'View Events', action: 'view_events' },
//         { label: 'RSVP Now', action: 'rsvp_events' }
//       ]
//     }
//   }

//   return null
// }

export function useChatMessages(
  threadId: string | null,
  onThreadCreated: (id: string | null) => void
) {
  const { user } = useAuth()
  const userName = user?.fullName

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const initialLoadRef = useRef(true)
useEffect(() => {
  if (!threadId) return
  initialLoadRef.current = true
  setMessages([])

  const controller = new AbortController()

  fetch(`http://localhost:3000/api/chats/${threadId}`, {
    method: 'GET', // explicit, though default is GET
    credentials: 'include',
    signal: controller.signal
  })
    .then(async r => {
      if (r.status === 404) {
        onThreadCreated(null)
        return [] as ChatMessage[]
      }
      if (!r.ok) {
        throw new Error(`Failed to fetch thread: ${r.status} ${r.statusText}`)
      }
      return r.json() as Promise<ChatMessage[]>
    })
    .then(msgs => {
      const hydrated = msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
      setMessages(hydrated)
    })
    .catch(err => {
      if (err.name === 'AbortError') return
      console.error('Error loading thread:', err)
    })
    .finally(() => {
      initialLoadRef.current = false
    })

  return () => {
    controller.abort()
  }
}, [threadId, onThreadCreated])


  // Persist helper for existing thread only
  const persist = useCallback(
    async (all: ChatMessage[]) => {
      if (!user) return
      const body = JSON.stringify({ messages: all })

      if (!threadId) {
        // do NOT auto-create thread here anymore
        return
      }

      await fetch(`http://localhost:3000/api/update_chats/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body
      })
    },
    [user, threadId]
  )

  // Auto-persist, but skip if:
  // - we're still in initial load
  // - there's no thread yet and the only message is the welcome (i.e., don't create thread for welcome)
  useEffect(() => {
    if (!threadId) return
    if (initialLoadRef.current) return
    persist(messages).catch(console.error)
  }, [messages, threadId, persist])

const sendMessage = useCallback(
  async (content: string, attachments?: File[]) => {
    const now = new Date()
    const userMsg: ChatMessage = {
      id: now.getTime().toString(),
      type: 'user',
      timestamp: now,
      content,
      attachments: attachments?.map(f => ({
        url: URL.createObjectURL(f),
        name: f.name,
        type: f.type
      }))
    }

    let currentThreadId = threadId

    // 1) If there's no thread yet, create it and wait for the new ID
    if (!currentThreadId) {
      const res = await fetch('http://localhost:3000/api/create_chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messages: [userMsg] })
      })
      const { id } = await res.json()
      currentThreadId = id
      onThreadCreated(id)
      setMessages([userMsg]) // seed with user message
    } else {
      setMessages(prev => [...prev, userMsg])
    }

    setIsTyping(true)

    // 2) generate bot reply (now with guaranteed thread id)
    let botMsg = null

    if (!botMsg) {
      // only call query if we have a valid thread
      const queryRes = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: content, threadId: currentThreadId })
      }).then(r => r.json())

      botMsg = {
        id: String(now.getTime() + 1),
        type: 'bot',
        timestamp: new Date(),
        content: queryRes.answer,
        quickReplies: [
          { label: 'Report Issue', action: 'report_issue' },
          { label: 'View Events', action: 'view_events' },
          { label: 'Check Billing', action: 'view_billing' }
        ]
      }
    }

    setMessages(prev => [...prev, botMsg!])
    setIsTyping(false)
  },
  [userName, threadId, onThreadCreated]
)

  // Welcome only when there is absolutely no thread and no messages yet
  useEffect(() => {
    if (threadId) return
    if (!userName) return
    if (messages.length > 0) return
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        timestamp: new Date(Date.now() - 30_000),
        content: `Hi ${userName}! 👋 Welcome to your Cohabs portal. What can I help you with today?`,
        quickReplies: [
          { label: 'View Events', action: 'view_events' },
          { label: 'Report Issue', action: 'report_issue' },
          { label: 'Check Billing', action: 'view_billing' }
        ]
      }
    ])
  }, [threadId, userName, messages.length])

  return { messages, sendMessage, isTyping }
}
