// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string
  email: string
  fullName: string
  role: 'tenant' | 'admin'
  tenantId?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get<User>('http://localhost:3000/api/auth/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    console.log('user', user)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await axios.post<User>('http://localhost:3000/api/login', { email, password }, { withCredentials: true })
    setUser(res.data)
    window.location.href = '/' // Redirect to home after login
  }

  const register = async (email: string, password: string, fullName: string) => {
    const res = await axios.post<User>('http://localhost:3000/api/register_tenant', { email, password, fullName })
    setUser(res.data)
    window.location.href = '/' // Redirect to home after registration
    
  }

    const logout = async () => {
      try {
        await axios.post(
          'http://localhost:3000/api/logout',
          {},
          { withCredentials: true }
        );
      } catch (err) {
        console.error('Logout failed', err);
      } finally {
        setUser(null);
        window.location.href = '/auth'; // Redirect to login page
      }
    };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
