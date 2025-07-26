import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

import { 
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  Settings,
  Bell,
  Shield,
  LogOut,
  Edit,
  Save,
  X,
  Camera,
  MapPin,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import { Switch } from '../../ui/switch';
import { useAuth } from '@/hooks/AuthContext';

interface AccountPageProps {
  onOpenAccountPanel: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  apartment: string;
  building: string;
  moveInDate: Date;
  leaseEndDate: Date;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  eventReminders: boolean;
  billingAlerts: boolean;
  maintenanceUpdates: boolean;
}



export const AccountPage: React.FC<AccountPageProps> = ({ onOpenAccountPanel }) => {
  const myUser = useAuth().user;
  console.log('myUser :', myUser);
  const { logout } = useAuth();


  const [user, setUser] = useState<UserProfile>({
    name: myUser?.fullName,
    email: myUser?.email,
    phone: "+1 (555) 123-4567",
    avatar: "/api/placeholder/80/80",
    apartment: "Unit 4B",
    building: "Cohabs Downtown",
    moveInDate: new Date("2023-06-15"),
    leaseEndDate: new Date("2024-06-14")
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    billingAlerts: true,
    maintenanceUpdates: true
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile>(user);

  const handleSaveProfile = () => {
    setUser(editedUser);
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    setEditedUser(user);
    setIsEditingProfile(false);
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const quickActions = [
    { icon: Settings, label: 'General Settings', action: onOpenAccountPanel },
    { icon: Bell, label: 'Notification Preferences', action: () => {} },
    { icon: Shield, label: 'Privacy & Security', action: () => {} },
    { icon: Home, label: 'Lease Documents', action: () => {} },
  ];

  return (
    <div className="h-screen flex flex-col bg-background pb-16 ">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
<div
  className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 pb-16" 
>
        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Profile Information</CardTitle>
              {!isEditingProfile ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveProfile}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditingProfile && (
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.apartment} • {user.building}
                </p>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditingProfile ? (
                  <Input
                    id="name"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditingProfile ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditingProfile ? (
                  <Input
                    id="phone"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Apartment</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{user.apartment}, {user.building}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lease Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lease Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Move-in Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.moveInDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Lease End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.leaseEndDate)}
                  </p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              View Lease Agreement
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {key === 'emailNotifications' && 'Receive updates via email'}
                    {key === 'pushNotifications' && 'Get push notifications on your device'}
                    {key === 'eventReminders' && 'Reminders for upcoming community events'}
                    {key === 'billingAlerts' && 'Notifications about rent and payments'}
                    {key === 'maintenanceUpdates' && 'Updates on your maintenance requests'}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => updateNotificationSetting(key as keyof NotificationSettings, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={action.action}
              >
                <action.icon className="w-4 h-4" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card>
          <CardContent className="p-4 ">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => {
            logout();    // then clear auth and redirect
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};