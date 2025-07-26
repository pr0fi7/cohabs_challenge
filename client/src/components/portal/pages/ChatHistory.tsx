// src/components/portal/panels/ChatHistoryPanel.tsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/card'

interface ChatSummary {
  id: string
  snippet: string
  updatedAt: string
}

interface ChatHistoryPanelProps {
  onSelectThread: (threadId: string) => void
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ onSelectThread }) => {
  const [history, setHistory] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get<ChatSummary[]>('http://localhost:3000/api/chats', { withCredentials: true })
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  console.log('Chat history:', history)

  

  if (loading) {
    return <div className="p-4 text-center">Loading chat history…</div>
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No previous chats found.
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto space-y-3">
      <h3 className="text-lg font-semibold mb-2">Your Chat History</h3>
      {history.map(h => (
        <Card
          key={h.id}
          className="hover:shadow-sm cursor-pointer"
          onClick={() => onSelectThread(h.id)}
        >
          <CardHeader>
            <CardTitle className="text-sm">
              {new Date(h.updatedAt).toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground line-clamp-2">
            {h.snippet}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
