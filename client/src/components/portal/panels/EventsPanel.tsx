import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useEventsData } from '../../../hooks/useEventsData';

interface EventsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ isOpen, onClose }) => {
  const { events, rsvpToEvent } = useEventsData();
  const [rsvpingEventId, setRsvpingEventId] = useState<string | null>(null);

  const handleRSVP = async (eventId: string, status: 'going' | 'not_going') => {
    setRsvpingEventId(eventId);
    await rsvpToEvent(eventId, status);
    setRsvpingEventId(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">
            Community Events
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-border rounded-2xl p-4 space-y-3 bg-card"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
                <Badge
                  variant={event.type === 'social' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {event.type}
                </Badge>
              </div>

              {/* Event Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(event.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees} attending</span>
                </div>
              </div>

              {/* RSVP Actions */}
              <div className="flex gap-2 pt-2">
                {event.rsvpStatus === 'going' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRSVP(event.id, 'not_going')}
                    disabled={rsvpingEventId === event.id}
                    className="flex-1"
                  >
                    Cancel RSVP
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleRSVP(event.id, 'going')}
                      disabled={rsvpingEventId === event.id}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {rsvpingEventId === event.id ? "..." : "I'm Going"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRSVP(event.id, 'not_going')}
                      disabled={rsvpingEventId === event.id}
                      className="flex-1"
                    >
                      Can't Make It
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                No upcoming events
              </h3>
              <p className="text-sm text-muted-foreground">
                Check back soon for community events and activities.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};