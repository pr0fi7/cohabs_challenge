import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

// export interface CommunityEvent {
//   id: string;
//   title: string;
//   description: string;
//   date: Date;
//   location: string;
//   type: 'social' | 'fitness' | 'educational' | 'maintenance';
//   attendees: number;
//   maxAttendees?: number;
//   rsvpStatus: 'going' | 'not_going' | 'pending';
//   organizer: string;
// }

// // Sample events data
// const sampleEvents: CommunityEvent[] = [
//   {
//     id: '1',
//     title: 'Rooftop BBQ & Social',
//     description: 'Join us for a community BBQ on the rooftop terrace. Food, drinks, and great company!',
//     date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
//     location: 'Rooftop Terrace',
//     type: 'social',
//     attendees: 24,
//     maxAttendees: 40,
//     rsvpStatus: 'pending',
//     organizer: 'Community Team'
//   },
//   {
//     id: '2',
//     title: 'Morning Yoga Session',
//     description: 'Start your day with a relaxing yoga session. All levels welcome!',
//     date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
//     location: 'Community Garden',
//     type: 'fitness',
//     attendees: 12,
//     maxAttendees: 20,
//     rsvpStatus: 'going',
//     organizer: 'Wellness Committee'
//   },
//   {
//     id: '3',
//     title: 'Financial Planning Workshop',
//     description: 'Learn budgeting and investment basics from financial experts.',
//     date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
//     location: 'Common Room',
//     type: 'educational',
//     attendees: 8,
//     maxAttendees: 15,
//     rsvpStatus: 'pending',
//     organizer: 'Educational Committee'
//   },
//   {
//     id: '4',
//     title: 'Building Maintenance Info Session',
//     description: 'Learn about upcoming building improvements and maintenance schedules.',
//     date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
//     location: 'Lobby',
//     type: 'maintenance',
//     attendees: 5,
//     rsvpStatus: 'pending',
//     organizer: 'Building Management'
//   }
// ];


export interface RawEvent {
  id:         string
  title:      string
  description:string
  starts_at:  string
  ends_at:    string
  location:   string
  capacity:   number
  created_by: string
}

export interface CommunityEvent {
  id:           string
  title:        string
  description:  string
  date:         Date
  location:     string
  type:         string
  attendees:    number
  maxAttendees: number
  rsvpStatus:   'pending' | 'going' | 'not_going'
  organizer:    string
}

async function fetchEvents(): Promise<CommunityEvent[]> {
  const res = await axios.get<RawEvent[]>('http://localhost:3000/api/events', {
    withCredentials: true
  })
  return res.data.map(evt => ({
    id:           evt.id,
    title:        evt.title,
    description:  evt.description,
    date:         new Date(evt.starts_at),
    location:     evt.location,
    type:         'social',            // hard‑coded for now
    attendees:    0,                   
    maxAttendees: evt.capacity,
    rsvpStatus:   'pending',
    organizer:    'Community Team'     
  }))
}

export const useEventsData = () => {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ① fetch on mount
  useEffect(() => {
    (async () => {
      try {
        const evts = await fetchEvents()
        console.log('Fetched events:', evts)  
        setEvents(evts)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load events')
      } finally {
        setLoading(false)
      }
    })()
  }, [])
// inside useEventsData
const fetchAndSet = useCallback(async () => {
  try {
    const evts = await fetchEvents()
    setEvents(evts)
    setError(null)
  } catch (err: any) {
    console.error(err)
    setError(err.message || 'Failed to load events')
  } finally {
    setLoading(false)
  }
}, [])

useEffect(() => {
  fetchAndSet()
}, [fetchAndSet])



  // ② RSVP mutator
  const rsvpToEvent = useCallback(async (eventId: string, status: 'going' | 'not_going') => {
    // simulate
    await new Promise(r => setTimeout(r, 500))
    setEvents(prev =>
      prev.map(e => {
        if (e.id !== eventId) return e
        const diff =
          status === 'going' && e.rsvpStatus !== 'going' ? 1 :
          status !== 'going' && e.rsvpStatus === 'going' ? -1 : 0
        return {
          ...e,
          rsvpStatus: status,
          attendees:  Math.max(0, e.attendees + diff)
        }
      })
    )
  }, [])

  // ③ computed getters
  const upcoming = useCallback(
    () => events.filter(e => e.date > new Date()),
    [events]
  )
  const byType = useCallback(
    (t: string) => events.filter(e => e.type === t),
    [events]
  )

  return {
    events:      upcoming(),
    allEvents:   events,
    loading,
    error,
    rsvpToEvent,
    getEventsByType: byType,
    refresh: fetchAndSet, // <<< expose refresh

  }
}