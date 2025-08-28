import React, { useState } from 'react'
import axios from 'axios'
import './app.css'
import config from './config'

export default function App() {
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [summary, setSummary] = useState(null)
  const [mode, setMode] = useState('heuristic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState(null)
  const [indexedId, setIndexedId] = useState('doc1')

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return setError('Please select a file')
    setLoading(true)
    setError(null)
    setSummary(null)
    const data = new FormData()
    data.append('file', file)
    try {
      const resp = await axios.post(config.backendUrl + '/api/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setText(resp.data.text)
      await summarizeText(resp.data.text)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  async function summarizeText(txt) {
    setLoading(true)
    setError(null)
    try {
      if (mode === 'heuristic') {
        const r = await axios.post(config.backendUrl + '/api/summarize/heuristic', { text: txt })
        setSummary(r.data.summary)
      } else {
        const r = await axios.post(config.backendUrl + '/api/summarize/llm', { text: txt })
        setSummary(r.data.summary || r.data.raw)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Summarization failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleIndex() {
    if (!text) return setError('No text to index. Upload a file first.')
    setLoading(true)
    setError(null)
    try {
      const r = await axios.post(config.backendUrl + '/api/index', { id: indexedId, text })
      alert('Indexed: ' + JSON.stringify(r.data))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Index failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleQuery(e) {
    e.preventDefault()
    if (!query) return setError('Please enter a query')
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      const r = await axios.post(config.backendUrl + '/api/query', { query, topK: 3 })
      setAnswer(r.data.answer)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Intelligent Legal Assistant</h1>
        <p className="app-subtitle">Upload contracts, summarize, and query documents efficiently.</p>
      </header>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Processing...</div>}

      <div className="main-layout">
        {/* Upload & Summary */}
        <div className="card">
          <h3>Upload Contract</h3>
          <form onSubmit={handleUpload}>
            <div className="file-input-wrapper">
              <input type="file" className="file-input" accept=".pdf,.txt,.md" onChange={e => setFile(e.target.files[0])} />
              <label className="file-input-label">Click or drag file to upload</label>
            </div>

            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" checked={mode === 'heuristic'} onChange={() => setMode('heuristic')} /> Heuristic (offline)
              </label>
              <label className="radio-option">
                <input type="radio" checked={mode === 'llm'} onChange={() => setMode('llm')} /> LLM (requires backend API)
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </form>

          {text && (
            <>
              <h4>Document text (preview)</h4>
              <div className="text-preview">{text.slice(0, 2000)}</div>

              <div style={{ marginTop: 10 }}>
                <label>Index ID:
                  <input value={indexedId} onChange={e => setIndexedId(e.target.value)} className="form-input" />
                </label>
                <button className="btn btn-secondary" onClick={handleIndex} disabled={loading} style={{ marginLeft: 10 }}>
                  Index Document (RAG)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="card">
          <h3>Summary</h3>
          {summary && <div className="summary-display">{JSON.stringify(summary, null, 2)}</div>}
        </div>
      </div>

      {/* Query Section */}
      <div className="query-section">
        <h3>Query Indexed Documents (RAG)</h3>
        <form className="query-form" onSubmit={handleQuery}>
          <input className="form-input query-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. What are the termination notice periods?" />
          <button type="submit" className="btn btn-primary" disabled={loading}>Ask</button>
        </form>

        {answer && (
          <div className="answer-display">
            <h4>Answer</h4>
            <div>{answer}</div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="notes-section">
        <h3>Notes</h3>
        <ul>
          <li>To use LLM summarization and RAG you must add GEMINI_API_KEY to backend/.env and restart the server.</li>
          <li>The vector store is a simple on-disk JSON used for demo. For production, use Pinecone/Weaviate/Milvus.</li>
        </ul>
      </div>
    </div>
  )
}
