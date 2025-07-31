// src/components/portal/pages/TicketsPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import {
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  User
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { TicketModal } from '../modals/TicketModal' // adjust path if needed
import { useToast } from '../../../hooks/use-toast'

interface RawTicket {
  id:           string
  title:        string
  description:  string
  status:       'open' | 'in_progress' | 'resolved' | 'closed'
  priority:     'low' | 'medium' | 'high' | 'urgent'
  category:     string
  created_at:   string
  updated_at:   string
  assignee?:    string
  tenant_id?:   string
}

interface Ticket {
  id:           string
  title:        string
  description:  string
  status:       RawTicket['status']
  priority:     RawTicket['priority']
  category:     string
  createdDate:  Date
  updatedDate:  Date
  assignee?:    string
  
}

export const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RawTicket['status'] | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<RawTicket['priority'] | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()


  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get<RawTicket[]>('http://localhost:3000/api/get_tickets', {
        withCredentials: true
      })
      const mapped: Ticket[] = res.data.map(rt => ({
        id:          rt.id,
        title:       rt.title,
        description: rt.description,
        status:      rt.status,
        priority:    rt.priority,
        category:    rt.category,
        createdDate: new Date(rt.created_at),
        updatedDate: new Date(rt.updated_at),
        assignee:    rt.assignee ?? rt.tenant_id
      }))
      setTickets(mapped)
    } catch (err: any) {
      console.error('Failed to load tickets', err)
      setError(err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleCreated = () => {
    toast({ title: 'Ticket Created', description: 'Refreshing list…' })
    fetchTickets()
    setIsModalOpen(false)
  }

  if (loading) {
    return <div className="p-4">Loading tickets…</div>
  }

  // coloring helpers
  const getStatusColor = (s: Ticket['status']) => {
    switch (s) {
      case 'open':        return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved':    return 'bg-green-100 text-green-800'
      case 'closed':      return 'bg-gray-100 text-gray-800'
      default:            return 'bg-gray-100 text-gray-800'
    }
  }
  const getPriorityColor = (p: Ticket['priority']) => {
    switch (p) {
      case 'low':    return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high':   return 'text-orange-600'
      case 'urgent': return 'text-red-600'
      default:       return 'text-gray-600'
    }
  }

  // filter logic
  const filtered = tickets.filter(t => {
    const matchesText =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter

    return matchesText && matchesStatus && matchesPriority
  })

  return (
    <div className="h-screen flex flex-col bg-background pb-16">
      {/* Header */}
      <div className="border-b bg-card/50 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your maintenance requests
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary">
            <Plus className="w-4 h-4 mr-2" /> New Ticket
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-18" style={{ paddingBottom: '4rem' }}>
        {error && (
          <div className="text-red-600 mb-4">
            {error}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg">{searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tickets match your filters'
              : 'No tickets found'}</h3>
          </div>
        ) : (
          filtered.map(ticket => (
            <Card key={ticket.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                      <p className="text-sm text-muted-foreground">#{ticket.id}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{ticket.createdDate.toLocaleDateString()}</span>
                    </div>
                    {ticket.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{ticket.assignee}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Badge className={`${getPriorityColor(ticket.priority)} bg-transparent border-current`}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  )
}
