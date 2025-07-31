import { useAuth } from '@/hooks/AuthContext'
import { Link } from 'react-router-dom'

export default function AdminPortal() {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading…</div>
  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access denied</h2>
        <p>You must be an admin to view this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <div className="bg-white p-6 rounded-2xl shadow">
        <p className="mb-4">Manage your RAG database ingestion and documents here.</p>
        <Link to="/admin/upload" className="inline-block px-4 py-2 bg-teal-600 text-white rounded-2xl hover:bg-teal-700">
          Go to Upload Page
        </Link>
      </div>
    </div>
  )
}
