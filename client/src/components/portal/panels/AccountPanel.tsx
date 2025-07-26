import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Settings, 
  Bell,
  Shield,
  LogOut,
  Edit
} from 'lucide-react';
import { useAuth } from '@/hooks/AuthContext';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  const user = {
    name: "Maria Rodriguez",
    email: "maria.rodriguez@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "/api/placeholder/80/80",
    apartment: "Unit 4B",
    building: "Cohabs Downtown",
    moveInDate: new Date("2023-06-15"),
    leaseEndDate: new Date("2024-06-14")
  };

  const menuItems = [
    { icon: Settings, label: "Account Settings", action: () => {} },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: Shield, label: "Privacy & Security", action: () => {} },
    { icon: Home, label: "Lease Information", action: () => {} },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">
            Account
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user.apartment} • {user.building}
                  </p>
                </div>
                
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{user.phone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {user.apartment}, {user.building}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lease Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Lease Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Move-in Date</span>
                <span className="text-sm font-medium">
                  {user.moveInDate.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lease End Date</span>
                <span className="text-sm font-medium">
                  {user.leaseEndDate.toLocaleDateString()}
                </span>
              </div>
              
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  View Lease Agreement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Settings Menu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={item.action}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => {
            onClose();   // first close the panel
            logout();    // then clear auth and redirect
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};