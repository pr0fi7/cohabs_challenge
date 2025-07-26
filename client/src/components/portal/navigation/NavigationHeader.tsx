import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Menu } from 'lucide-react';
import heroImage from '../../../assets/cohabs-hero.jpg';
import { cn } from '../../../lib/utils';
import { navItems } from '../navigation/BottomNavigation';
import { useAuth } from '@/hooks/AuthContext';
import { AccountPage } from '../pages/AccountPage';
import { useState } from 'react';
type ActivePanel = 'chat' | 'tickets' | 'events' | 'billing' | 'account';

interface NavigationHeaderProps {
  userName: string;
  userAvatar: string;
  onMenuClick: () => void;
  isMobileMenuOpen?: boolean;
  activePanel: ActivePanel;
  onPanelChange: (panel: ActivePanel) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  userName,
  userAvatar,
  onMenuClick,
  isMobileMenuOpen = false,
  activePanel,
  onPanelChange
}) => {

  const handleAccountClick = () => {
    onPanelChange('account')
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Side - Menu (mobile) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Cohabs Logo */}
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/8a6eddba-7b32-49fa-ba1f-3e0055f76aa4.png" 
              alt="Cohabs Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-semibold text-foreground hidden sm:inline">Cohabs</span>
          </div>
        </div>

        {/* Center - Main Navigation */}
<div className="flex-1 hidden lg:flex items-center justify-center">
  <nav
    className="flex items-center space-x-8 border-border bg-card/50 backdrop-blur-sm px-8 py-3"
    role="tablist"
    aria-label="Main navigation"
  >
    {navItems.map(item => {
      const Icon = item.icon;
      const isActive = activePanel === item.id;

      return (
        <Button
          key={item.id}
          variant="ghost"
          size="sm"
          onClick={() => onPanelChange(item.id)}
          role="tab"
          aria-selected={isActive}
          aria-label={item.ariaLabel}
          className={cn(
            "relative flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              isActive && "scale-110 text-primary"
            )}
          />
          <span className="text-xs font-medium">{item.label}</span>

          {/* Active underline */}
          {isActive && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
          )}
        </Button>
      );
    })}
  </nav>
</div>



        {/* Right Side - User Greeting */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              Hi {userName}! 👋
            </p>
            <p className="text-xs text-muted-foreground">
              How can I help you today?
            </p>
          </div>

          <Avatar className="w-9 h-9 ring-2 ring-primary/20 cursor-pointer  " onClick={handleAccountClick}>

            <AvatarImage src={userAvatar} alt={`${userName}'s avatar`} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};