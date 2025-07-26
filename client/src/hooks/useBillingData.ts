import axios from 'axios';
import { useAuth } from './AuthContext';
import { useEffect } from 'react';
import { useState } from 'react';

export interface BillInfo {
  id: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  breakdown: {
    rent: number;
    utilities: number;
    fees: number;
  };
}

export interface PaymentHistory {
  id: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  reference: string;
}

export interface PaymentMethod {
  id: string;
  type: 'Credit Card' | 'Debit Card' | 'Bank Account';
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export const useBillingData = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  // Current bill
  const [currentBill] = useState<BillInfo>({
    id: 'bill-2024-01',
    amount: 2850,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    status: 'pending',
    description: 'January 2024 Rent + Utilities',
    breakdown: {
      rent: 2500,
      utilities: 300,
      fees: 50
    }
  });

async function fetchPayments(tenantId: string): Promise<PaymentHistory[]> {
  const res = await axios.get<PaymentHistory[]>(
    'http://localhost:3000/api/get_all_payments', 
    {
      params:    { tenantId },
      withCredentials: true
    }
  )
  return res.data
}

useEffect(() => {
  if (user?.tenantId) {
    fetchPayments(user.tenantId).then(data => {
      console.log('Fetched payments:', data)
      setPayments(data)
    })
  }
}, [user?.tenantId])


  // Payment methods
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm-1',
      type: 'Credit Card',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true
    },
    {
      id: 'pm-2',
      type: 'Bank Account',
      lastFour: '6789',
      expiryMonth: 0,
      expiryYear: 0,
      isDefault: false
    }
  ]);

  const makePayment = async (amount: number, paymentMethodId: string) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would make an API call
    console.log(`Processing payment of $${amount} with method ${paymentMethodId}`);
    
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      message: 'Payment processed successfully'
    };
  };

  const addPaymentMethod = async (paymentData: Omit<PaymentMethod, 'id'>) => {
    // Simulate adding payment method
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMethod: PaymentMethod = {
      ...paymentData,
      id: `pm-${Date.now()}`
    };
    
    // In a real app, this would update state
    console.log('Added payment method:', newMethod);
    
    return newMethod;
  };

  return {
    currentBill,
    paymentHistory: payments,
    paymentMethods,
    makePayment,
    addPaymentMethod
  };
};