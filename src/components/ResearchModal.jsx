import React, { useState, useRef, useEffect } from 'react'

export default function ResearchModal({ isOpen, onClose, onLoad, loading }) {
  const [clients, setClients] = useState([])
  const [clientsLoaded, setClientsLoaded] = useState(false)
  const [tab, setTab] = useState('clients') // 'clients' | 'drop' | 'paste'
  const [pastedText, setPastedText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState([])
  const [droppedText, setDroppedText] = useState('')
  const fileInputRef = useRef(null)

  // Auto-load clients JSON on mount
  useEffect(() => {
    if (clientsLoaded) return
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}clients-data.json`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setClients(data); setClientsLoaded(true) })
      .catch(() => setClientsLoaded(true))
  }, [clientsLoaded])

  if (!isOpen) return null

  // --- Clients tab ---
  const handleClientSelect = (client) => {
    onLoad(client.combinedText)
  }

  // --- Drop tab ---
  const readFiles = async (fileList) => {
    const newFiles = []
    const texts = []
    for (const file of fileList) {
      if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.type.startsWith('text/')) {
        const text = await file.text()
        newFiles.push({ name: file.name, size: text.length })
        texts.push(`--- FILE: ${file.name} ---\n${text}`)
      }
    }
    setDroppedFiles(prev => [...prev, ...newFiles])
    setDroppedText(prev => prev + (prev ? '\n\n' : '') + texts.join('\n\n'))
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    await readFiles(e.dataTransfer.files)
  }

  const handleClearDrop = () => {
    setDroppedFiles([])
    setDroppedText('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load from Research</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>
            Clients {clients.length > 0 && `(${clients.length})`}
          </button>
          <button className={`modal-tab ${tab === 'drop' ? 'active' : ''}`} onClick={() => setTab('drop')}>
            Drop Files
          </button>
          <button className={`modal-tab ${tab === 'paste' ? 'active' : ''}`} onClick={() => setTab('paste')}>
            Paste Text
          </button>
        </div>

        {/* CLIENTS TAB — one-click load */}
        {tab === 'clients' && (
          <div className="modal-body">
            {clients.length === 0 ? (
              <p className="modal-hint">No client research data found. Use the Drop Files or Paste Text tab instead, or regenerate the clients-data.json file.</p>
            ) : (
              <>
                <p className="modal-hint">Click a client to instantly load all their research. Brand info, target audience, and buyer psychology will be auto-extracted.</p>
                <div className="client-grid">
                  {clients.map(client => (
                    <button
                      key={client.slug}
                      className="client-card-btn"
                      onClick={() => handleClientSelect(client)}
                      disabled={loading}
                    >
                      <strong>{client.name}</strong>
                      <span className="client-desc">{client.description}</span>
                      <span className="client-meta">
                        {client.fileCount} files &middot; {(client.totalChars / 1000).toFixed(0)}k chars
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DROP FILES TAB */}
        {tab === 'drop' && (
          <div className="modal-body">
            <p className="modal-hint">
              For new clients not in the list — drop research files here.
            </p>

            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${droppedFiles.length > 0 ? 'has-files' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {droppedFiles.length === 0 ? (
                <>
                  <div className="drop-icon">+</div>
                  <p className="drop-title">Drop .md or .txt files here</p>
                  <p className="drop-sub">or click to browse</p>
                  <p className="drop-hint">Best: deep-buyer-research.md, README.md, brand-guide.md</p>
                </>
              ) : (
                <>
                  <div className="drop-icon-small">+</div>
                  <p className="drop-sub">Drop more files or click to add</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.markdown,text/*"
                multiple
                onChange={async (e) => { await readFiles(e.target.files); e.target.value = '' }}
                hidden
              />
            </div>

            {droppedFiles.length > 0 && (
              <div className="loaded-files">
                <div className="loaded-header">
                  <span>{droppedFiles.length} file{droppedFiles.length > 1 ? 's' : ''} loaded</span>
                  <button className="clear-all-btn" onClick={handleClearDrop}>Clear all</button>
                </div>
                {droppedFiles.map((f, i) => (
                  <div key={i} className="loaded-file">
                    <span className="file-icon">&#128196;</span>
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{(f.size / 1000).toFixed(1)}k chars</span>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn-primary"
              disabled={droppedFiles.length === 0 || loading}
              onClick={() => onLoad(droppedText)}
            >
              {loading ? 'Extracting...' : `Extract & Load (${droppedFiles.length} file${droppedFiles.length > 1 ? 's' : ''})`}
            </button>
          </div>
        )}

        {/* PASTE TAB */}
        {tab === 'paste' && (
          <div className="modal-body">
            <p className="modal-hint">
              Paste any research document — the AI will extract everything needed.
            </p>
            <textarea
              className="research-textarea large"
              placeholder="Paste research here..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows={16}
            />
            {pastedText.length > 0 && (
              <div className="paste-stats">
                {pastedText.length.toLocaleString()} chars / ~{Math.ceil(pastedText.length / 4).toLocaleString()} tokens
              </div>
            )}
            <button
              className="btn-primary"
              disabled={!pastedText.trim() || loading}
              onClick={() => onLoad(pastedText)}
            >
              {loading ? 'Extracting...' : 'Extract & Load Research'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
