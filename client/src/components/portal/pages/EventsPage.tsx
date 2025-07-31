// src/components/EventsPage.tsx
import React, { useState } from 'react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { AddEventForm } from './AddEventForm'
import { useAuth } from '../../../hooks/AuthContext'

import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Star,
  Heart
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { useEventsData } from '../../../hooks/useEventsData'

export const EventsPage: React.FC = () => {
  const { allEvents: filteredEvents, rsvpToEvent, refresh } = useEventsData()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [rsvpingEventId, setRsvpingEventId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { user, loading } = useAuth()
  if (loading) return <div>Loading…</div>
  if (!user)   window.location.href = '/auth'

  // Now you can read tenantId directly!
  console.log('user:', user)
  const tenantId = user.id


  const handleRSVP = async (id: string, status: 'going' | 'not_going') => {
    setRsvpingEventId(id)
    await rsvpToEvent(id, status)
    setRsvpingEventId(null)
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'social':      return 'bg-blue-100 text-blue-800'
      case 'fitness':     return 'bg-green-100 text-green-800'
      case 'educational': return 'bg-purple-100 text-purple-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      default:            return 'bg-gray-100 text-gray-800'
    }
  }
  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'social':      return <Users    className="w-4 h-4" />
      case 'fitness':     return <Heart    className="w-4 h-4" />
      case 'educational': return <Star     className="w-4 h-4" />
      case 'maintenance': return <Clock    className="w-4 h-4" />
      default:            return <Calendar className="w-4 h-4" />
    }
  }
  console.log('tenantId:', tenantId )

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Community Events
            </h1>
            <p className="text-sm text-muted-foreground">
              Discover and join upcoming community activities
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Suggest Event
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search events…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 pb-16">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || typeFilter !== 'all'
                ? 'No events match your search'
                : 'No upcoming events'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back soon for community events and activities'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 pb-24">
            {filteredEvents.map(evt => (
              <Card key={evt.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(evt.type)}`}>
                        {getTypeIcon(evt.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {evt.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Organized by {evt.organizer}
                        </p>
                      </div>
                    </div>
                    <Badge className={getTypeColor(evt.type)}>
                      {evt.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {evt.description}
                  </p>
                  {/* details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(evt.date)}</span>

                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {evt.attendees} attending
                      </span>
                    </div>
                  </div>

                  {/* RSVP */}
                  <div className="flex gap-2 pt-2">
                    {evt.rsvpStatus === 'going' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRSVP(evt.id, 'not_going')}
                        disabled={rsvpingEventId === evt.id}
                        className="flex-1"
                      >
                        {rsvpingEventId === evt.id ? '…' : 'Cancel RSVP'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleRSVP(evt.id, 'going')}
                          disabled={
                            rsvpingEventId === evt.id                          }
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          {rsvpingEventId === evt.id ? '…' : "I'm Going"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRSVP(evt.id, 'not_going')}
                          disabled={rsvpingEventId === evt.id}
                          className="flex-1"
                        >
                          Can't Make It
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add‐Event Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
        <div className="w-full sm:w-3/4 lg:w-2/3 bg-white h-full p-6 overflow-auto">
          <AddEventForm
            tenantId={tenantId}
            onSuccess={id => {
              setIsFormOpen(false)
              refresh() // reload list so newly created event shows
            }}
            onCancel={() => setIsFormOpen(false)}
          />
          </div>
        </div>
      )}
    </div>
  )
}
