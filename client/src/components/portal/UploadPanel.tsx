import React, { useState } from 'react'
import axios from 'axios'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('doc', file)

    try {
      setStatus('Uploading...')
      await axios.post('http://localhost:3000/api/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStatus('Upload successful!')
    } catch (err) {
      console.error(err)
      setStatus('Upload failed.')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Upload Documents</h2>
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <input type="file" accept=".txt,.md,.pdf" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 disabled:opacity-50"
          disabled={!file}
        >
          Upload to RAG DB
        </button>
        {status && <p>{status}</p>}
      </div>
    </div>
  )
}