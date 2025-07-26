import React, { useState } from 'react';
import { ChatWindow } from './chat/ChatWindow';
import { NavigationHeader } from './navigation/NavigationHeader';
import { BottomNavigation } from './navigation/BottomNavigation';
import { MobileMenu } from './navigation/MobileMenu';
import { TicketModal } from './modals/TicketModal';
import { EventsPanel } from './panels/EventsPanel';
import { BillingPanel } from './panels/BillingPanel';
import { AccountPanel } from './panels/AccountPanel';
import { TicketsPage } from './pages/TicketsPage';
import { EventsPage } from './pages/EventsPage';
import { BillingPage } from './pages/BillingPage';
import { AccountPage } from './pages/AccountPage';
import { useAuth } from '@/hooks/AuthContext';
import { ChatHistoryPanel } from './pages/ChatHistory';

type ActivePanel = 'chat' | 'tickets' | 'events' | 'billing' | 'account';

interface TenantPortalProps {
  userName?: string;
  userAvatar?: string;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({
  userName = useAuth().user?.fullName || "User",
  userAvatar = "/api/placeholder/40/40"
}) => {
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isEventsPanelOpen, setIsEventsPanelOpen] = useState(false);
  const [isBillingPanelOpen, setIsBillingPanelOpen] = useState(false);
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    () => localStorage.getItem('chatThreadId')
  )
  const {user, loading} = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) window.location.href = '/auth';

  const handleSelectThread = (id: string) => {
    setActivePanel('chat')
    // force a change so our hook reloads
    setActiveThreadId(null)
    setTimeout(() => setActiveThreadId(id), 0)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'view_events':
        setIsEventsPanelOpen(true);
        break;
      case 'report_issue':
        setIsTicketModalOpen(true);
        break;
      case 'view_billing':
        setIsBillingPanelOpen(true);
        break;
      case 'view_account':
        setIsAccountPanelOpen(true);
        break;
    }
  };

  const renderMainContent = () => {
    switch (activePanel) {
      case 'chat':
        return (
        <ChatWindow
          threadId={activeThreadId}
          onThreadCreated={setActiveThreadId}
          onQuickAction={handleQuickAction}
        />
        );
      case 'tickets':
        return <TicketsPage onCreateTicket={() => setIsTicketModalOpen(true)} />;
      case 'events':
        return <EventsPage onOpenEventsPanel={() => setIsEventsPanelOpen(true)} />;
      case 'billing':
        return <BillingPage onOpenBillingPanel={() => setIsBillingPanelOpen(true)} />;
      case 'account':
        return <AccountPage onOpenAccountPanel={() => setIsAccountPanelOpen(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Navigation Header */}
      <NavigationHeader 
        userName={userName}
        userAvatar={userAvatar}
        onMenuClick={() => setIsMobileMenuOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:w-80 border-r border-border">
          <ChatWindow
            threadId={activeThreadId}
            onThreadCreated={setActiveThreadId}
            onQuickAction={handleQuickAction}
          />
        </div>

        {/* Main Panel - Chat on mobile, selected panel on desktop */}
        <div className="flex-1 flex flex-col lg:hidden">
          {renderMainContent()}
        </div>

        {/* Desktop Right Panel */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col">
          {activePanel !== 'chat'
            ? renderMainContent()
            : <ChatHistoryPanel onSelectThread={handleSelectThread} />
          }
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <div className="lg:hidden">
        <BottomNavigation 
          activePanel={activePanel}
          onPanelChange={setActivePanel}
        />
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        userName={userName}
      />

      {/* Modals and Panels */}
      <TicketModal 
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
      
      <EventsPanel 
        isOpen={isEventsPanelOpen}
        onClose={() => setIsEventsPanelOpen(false)}
      />
      
      <BillingPanel 
        isOpen={isBillingPanelOpen}
        onClose={() => setIsBillingPanelOpen(false)}
      />
      
      <AccountPanel 
        isOpen={isAccountPanelOpen}
        onClose={() => setIsAccountPanelOpen(false)}
      />
    </div>
  );
};