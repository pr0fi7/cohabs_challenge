import React from 'react';
import { Button } from '../../ui/button';
import { 
  MessageCircle, 
  Ticket, 
  Calendar, 
  CreditCard, 
  User,
  X,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';

type ActivePanel = 'chat' | 'tickets' | 'events' | 'billing' | 'account';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
  userName: string;
}

const menuItems = [
  { 
    id: 'chat' as ActivePanel, 
    label: 'Chat Assistant', 
    icon: MessageCircle,
    description: 'Get help and ask questions'
  },
  { 
    id: 'tickets' as ActivePanel, 
    label: 'Support Tickets', 
    icon: Ticket,
    description: 'View and create maintenance requests'
  },
  { 
    id: 'events' as ActivePanel, 
    label: 'Community Events', 
    icon: Calendar,
    description: 'Upcoming events and activities'
  },
  { 
    id: 'billing' as ActivePanel, 
    label: 'Billing & Payments', 
    icon: CreditCard,
    description: 'Rent payments and invoices'
  },
  { 
    id: 'account' as ActivePanel, 
    label: 'Account Settings', 
    icon: User,
    description: 'Profile and preferences'
  }
];

const additionalItems = [
  { icon: Settings, label: 'App Settings', action: () => {} },
  { icon: HelpCircle, label: 'Help & Support', action: () => {} },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activePanel,
  onPanelChange,
  userName
}) => {
  const handlePanelSelect = (panel: ActivePanel) => {
    onPanelChange(panel);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/8a6eddba-7b32-49fa-ba1f-3e0055f76aa4.png" 
              alt="Cohabs Logo" 
              className="w-8 h-8 object-contain"
            />
            <div>
              <SheetTitle className="text-lg text-left">Cohabs</SheetTitle>
              <p className="text-sm text-muted-foreground">Hi {userName}!</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Main Navigation */}
          <nav className="flex-1 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePanel === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handlePanelSelect(item.id)}
                    className={cn(
                      "w-full justify-start gap-3 h-auto py-4 px-4",
                      isActive 
                        ? "bg-primary/10 text-primary border-l-4 border-primary" 
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-border"></div>

            {/* Additional Items */}
            <div className="space-y-1">
              {additionalItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={item.action}
                  className="w-full justify-start gap-3 py-3 px-4 text-foreground hover:bg-muted/50"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};