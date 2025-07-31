import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '@/hooks/AuthContext'

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf']
const ALLOWED_MIMES = ['text/plain', 'text/markdown', 'application/pdf']

function isValidFile(file: File) {
  const lower = file.name.toLowerCase()
  const hasExt = ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext))
  const validMime = ALLOWED_MIMES.includes(file.type)
  return hasExt && validMime
}

export default function UploadPage() {
  const { user, loading } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      setError('You do not have permission to access this page.')
    }
  }, [user, loading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selected = e.target.files?.[0] || null
    if (selected && !isValidFile(selected)) {
      setError('Invalid file type. Only .txt, .md, .pdf are allowed.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('No file selected.')
      return
    }
    if (!isValidFile(file)) {
      setError('Invalid file type.')
      return
    }
    if (!user || user.role !== 'admin') {
      setError('Unauthorized.')
      return
    }

    const formData = new FormData()
    formData.append('doc', file)

    try {
      setStatus('Uploading...')
      setError(null)
      const res = await axios.post(
        'http://localhost:3000/api/ingest',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      )
      setStatus(`Upload successful! Ingested ${res.data.chunks} chunks from ${res.data.file}`)
    } catch (err: any) {
      console.error(err)
      if (err.response?.data?.error) {
        setError(`Upload failed: ${err.response.data.error}`)
      } else {
        setError('Upload failed due to network or server error.')
      }
      setStatus('')
    }
  }

  if (loading) return <div>Loading…</div>
  if (error && (!user || user.role !== 'admin')) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access error</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Upload Documents</h2>
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <input
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileChange}
          aria-label="Select document to upload"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 disabled:opacity-50"
          disabled={!file || !!error}
        >
          Upload to RAG DB
        </button>
        {status && <p className="text-sm text-green-600">{status}</p>}
      </div>
    </div>
  )
}
