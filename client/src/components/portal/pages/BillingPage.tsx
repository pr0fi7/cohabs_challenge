import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { 
  CreditCard,
  Calendar,
  Download,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  Receipt
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { useBillingData } from '../../../hooks/useBillingData';

interface BillingPageProps {
  onOpenBillingPanel: () => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onOpenBillingPanel }) => {
  const { currentBill, paymentHistory, paymentMethods } = useBillingData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('2024');

  const filteredPayments = paymentHistory.filter(payment => {
    const matchesSearch = payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.method.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesYear = payment.date.getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Billing & Payments</h1>
            <p className="text-sm text-muted-foreground">
              Manage your rent payments and billing information
            </p>
          </div>
          <Button 
            onClick={onOpenBillingPanel}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>

        {/* Current Bill Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {formatCurrency(currentBill.amount)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Due {formatDate(currentBill.dueDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(currentBill.status)}>
                  {currentBill.status}
                </Badge>
                <Button className="bg-primary hover:bg-primary/90">
                  Pay Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <div 
  className="flex-1 overflow-y-auto p-4 pb-16" /* ← space for bottom nav */
  style={{ paddingBottom: '4rem' }} /* matches Tailwind’s pb-16 = 4rem */
> 
  {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment History List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment History</h2>
          
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No payments found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Your payment history will appear here'
                }
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.date)} • {payment.method}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {payment.reference}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="p-2">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">•••• {method.lastFour}</p>
                        <p className="text-xs text-muted-foreground">
                          {method.type}
                          {method.expiryMonth > 0 && ` • Expires ${method.expiryMonth}/${method.expiryYear}`}
                        </p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed pb-16">
              <CardContent className="p-4 flex items-center justify-center">
                <Button variant="ghost" className="w-full h-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Method
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};