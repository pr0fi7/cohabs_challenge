import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminPanel() {
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
