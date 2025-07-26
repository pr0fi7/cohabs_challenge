import React from 'react';
import { Button } from '../../ui/button';
import { 
  MessageCircle, 
  Ticket, 
  Calendar, 
  CreditCard, 
  User 
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import exp from 'constants';

type ActivePanel = 'chat' | 'tickets' | 'events' | 'billing' | 'account';

interface BottomNavigationProps {
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

const navItems = [
  { 
    id: 'chat' as ActivePanel, 
    label: 'Chat', 
    icon: MessageCircle,
    ariaLabel: 'Chat with assistant'
  },
  { 
    id: 'tickets' as ActivePanel, 
    label: 'Tickets', 
    icon: Ticket,
    ariaLabel: 'View support tickets'
  },
  { 
    id: 'events' as ActivePanel, 
    label: 'Events', 
    icon: Calendar,
    ariaLabel: 'Community events'
  },
  { 
    id: 'billing' as ActivePanel, 
    label: 'Billing', 
    icon: CreditCard,
    ariaLabel: 'Billing information'
  },
  { 
    id: 'account' as ActivePanel, 
    label: 'Account', 
    icon: User,
    ariaLabel: 'Account settings'
  }
];
export { navItems };

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activePanel,
  onPanelChange
}) => {
  return (
    <nav 
      className="border-t border-border bg-card/95 backdrop-blur-sm"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onPanelChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 h-auto min-w-0 transition-all duration-200",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={item.ariaLabel}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
              
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};