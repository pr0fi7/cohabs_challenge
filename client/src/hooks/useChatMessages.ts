// src/hooks/useChatMessages.ts
import { useState, useCallback } from 'react'
import { ChatMessage } from '../components/portal/chat/MessageBubble'
import { useAuth } from './AuthContext'
import { useEffect, useRef } from 'react'

interface QuickReply {
  label: string
  action: string
}

// 1) Move intent‐matcher _out_ of calling `useAuth()`
function generateIntentResponse(
  userMessage: string,
  userName: string | undefined
): ChatMessage | null {
  const lower = userMessage.toLowerCase()
  const now   = new Date()

  // note: userName is passed in
  if (/(hi|hello|hey)/.test(lower)) {
    return {
      id:      now.getTime().toString(),
      type:    'bot',
      timestamp: now,
      content: `Hi ${userName ?? 'there'}! 👋 What can I help you with today?`,
      quickReplies: [
        { label: "View Events",   action: "view_events" },
        { label: "Report Issue",  action: "report_issue" },
        { label: "Check Billing", action: "view_billing" }
      ]
    }
  }

  if (/(maintenance|repair|broken)/.test(lower)) {
    return {
      id: now.getTime().toString(),
      type: 'bot',
      timestamp: now,
      content: "I'd be happy to help you report a maintenance issue…",
      quickReplies: [
        { label: "Report Issue", action: "report_issue" },
        { label: "Check Status", action: "view_tickets" }
      ]
    }
  }

  if (/(events|activities)/.test(lower)) {
    return {
      id: now.getTime().toString(),
      type: 'bot',
      timestamp: now,
      content: "Sure! Here are the upcoming events in your community.",
      quickReplies: [
        { label: "View Events", action: "view_events" },
        { label: "RSVP Now",   action: "rsvp_events" }
      ]
    }
  }

  // … other intent patterns …

  return null
}

export function useChatMessages(
  threadId: string | null,
  onThreadCreated: (id: string) => void
) {
  const { user } = useAuth()
  const userName  = user?.fullName

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // 1) Track initial load vs subsequent updates:
  const initialLoadRef = useRef(true)

  // 2) Fetch a new thread only once when threadId changes:
  useEffect(() => {
    if (!threadId) return
    initialLoadRef.current = true                // mark that next save should be skipped
    setMessages([])                              // clear old messages
    fetch(`http://localhost:3000/api/chats/${threadId}`, { credentials:'include' })
      .then(r => r.json())
      .then((msgs: ChatMessage[]) => {
        // hydrate timestamp strings → Date
        const hydrated = msgs.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
        setMessages(hydrated)
      })
      .catch(console.error)
      .finally(() => { initialLoadRef.current = false })
  }, [threadId])

  // 3) Persist helper (POST or PATCH)
  const persist = useCallback(async (all: ChatMessage[]) => {
    if (!user) return
    const body = JSON.stringify({ messages: all })
    if (!threadId) {
      const res = await fetch('http://localhost:3000/api/create_chats', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        credentials:'include',
        body
      })
      const { id } = await res.json()
      onThreadCreated(id)
    } else {
      await fetch(`http://localhost:3000/api/update_chats/${threadId}`, {
        method: 'PATCH',
        headers:{ 'Content-Type':'application/json' },
        credentials:'include',
        body
      })
    }
  }, [user, threadId, onThreadCreated])

  // 4) Any time messages change *after* the initial load, persist:
  useEffect(() => {
    if (!threadId) return
    if (initialLoadRef.current) return     // skip the effect triggered by our own fetch()
    persist(messages).catch(console.error)
  }, [messages, threadId, persist])

  // 5) sendMessage just appends the two messages; persistence is now fully handled by the effect:
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    const now = new Date()
    const userMsg: ChatMessage = {
      id:        now.getTime().toString(),
      type:      'user',
      timestamp: now,
      content,
      attachments: attachments?.map(f => ({
        url: URL.createObjectURL(f),
        name: f.name,
        type: f.type
      }))
    }

    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    let botMsg = generateIntentResponse(content, userName)
    if (!botMsg) {
      const { answer } = await fetch('http://localhost:3000/api/query', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ message: content, threadId })
      }).then(r => r.json())
      botMsg = {
        id:        String(now.getTime()+1),
        type:      'bot',
        timestamp: new Date(),
        content:   answer,
        quickReplies: [
          { label:'Report Issue',  action:'report_issue' },
          { label:'View Events',   action:'view_events' },
          { label:'Check Billing', action:'view_billing' }
        ]
      }
    }

    setMessages(prev => [...prev, botMsg!])
    setIsTyping(false)
  }, [userName, threadId])

  // 6) Initial “welcome” if there’s no thread yet:
  useEffect(() => {
    if (!threadId && userName && messages.length === 0) {
      setMessages([{
        id:        'welcome',
        type:      'bot',
        timestamp: new Date(Date.now()-30_000),
        content:   `Hi ${userName}! 👋 Welcome to your Cohabs portal. What can I help you with today?`,
        quickReplies: [
          { label:'View Events',   action:'view_events' },
          { label:'Report Issue',  action:'report_issue' },
          { label:'Check Billing', action:'view_billing' }
        ]
      }])
    }
  }, [threadId, userName])

  return { messages, sendMessage, isTyping }
}
