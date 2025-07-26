// src/components/AddEventForm.tsx
import React, { useState, FormEvent } from 'react'
import axios from 'axios'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

interface AddEventFormProps {
  tenantId: string
  onSuccess?: (eventId: string) => void
  onCancel?: () => void
}

export const AddEventForm: React.FC<AddEventFormProps> = ({
  tenantId, onSuccess, onCancel
}) => {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation]       = useState('')
  const [startsAt, setStartsAt]       = useState('')  // ISO datetime‑local string
  const [endsAt, setEndsAt]           = useState('')
  const [capacity, setCapacity]       = useState<number | ''>('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title || !startsAt || !location || !capacity) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        tenantId,
        title,
        description,
        location,
        capacity,
        startsAt,               // e.g. "2025-07-21T14:30"
        endsAt: endsAt || null   // if blank, send `null`
      }
      const { data } = await axios.post<{ id: string }>(
        'http://localhost:3000/api/add_event',
        payload,
        { withCredentials: true }
      )
      if (onSuccess) onSuccess(data.id)
      // reset
      setTitle('')
      setDescription('')
      setLocation('')
      setStartsAt('')
      setEndsAt('')
      setCapacity('')
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to create event.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="event-title">Title*</Label>
            <Input
              id="event-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="event-desc">Description</Label>
            <textarea
              id="event-desc"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          {/* Starts At */}
          <div>
            <Label htmlFor="event-starts">Starts At*</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="event-starts"
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                required
                className="h-12 pl-10 text-lg"
              />
            </div>
          </div>

          {/* Ends At */}
          <div>
            <Label htmlFor="event-ends">Ends At</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="event-ends"
                type="datetime-local"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="h-12 pl-10 text-lg"
              />
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event-location">Location*</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="event-location"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-capacity">Capacity*</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="event-capacity"
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(+e.target.value || '')}
                  required
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
