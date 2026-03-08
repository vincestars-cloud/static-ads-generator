import React, { useState, useRef } from 'react'

export default function ResearchModal({ isOpen, onClose, onLoad, loading }) {
  const [files, setFiles] = useState([])
  const [combinedText, setCombinedText] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [tab, setTab] = useState('drop') // 'drop' | 'paste'
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

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
    setFiles(prev => [...prev, ...newFiles])
    setCombinedText(prev => prev + (prev ? '\n\n' : '') + texts.join('\n\n'))
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    await readFiles(e.dataTransfer.files)
  }

  const handleFileSelect = async (e) => {
    await readFiles(e.target.files)
    e.target.value = ''
  }

  const handleRemoveFile = (idx) => {
    const removed = files[idx]
    setFiles(prev => prev.filter((_, i) => i !== idx))
    // Rebuild combined text without removed file
    setCombinedText(prev => {
      const sections = prev.split(/--- FILE: .+ ---\n/)
      sections.splice(idx + 1, 1)
      return sections.join('')
    })
  }

  const handleClearAll = () => {
    setFiles([])
    setCombinedText('')
  }

  const totalChars = tab === 'drop' ? combinedText.length : pastedText.length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load from Research</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'drop' ? 'active' : ''}`} onClick={() => setTab('drop')}>
            Drop Files
          </button>
          <button className={`modal-tab ${tab === 'paste' ? 'active' : ''}`} onClick={() => setTab('paste')}>
            Paste Text
          </button>
        </div>

        {tab === 'drop' && (
          <div className="modal-body">
            <p className="modal-hint">
              Drop your research files here — deep buyer research, brand guides, campaign strategies, READMEs.
              The AI will extract brand info, target audience, and buyer psychology to power your ad generation.
            </p>

            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${files.length > 0 ? 'has-files' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {files.length === 0 ? (
                <>
                  <div className="drop-icon">+</div>
                  <p className="drop-title">Drop .md or .txt files here</p>
                  <p className="drop-sub">or click to browse</p>
                  <p className="drop-hint">Best files: deep-buyer-research.md, README.md, brand-guide.md, campaign-strategy.md</p>
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
                onChange={handleFileSelect}
                hidden
              />
            </div>

            {files.length > 0 && (
              <div className="loaded-files">
                <div className="loaded-header">
                  <span>{files.length} file{files.length > 1 ? 's' : ''} loaded</span>
                  <button className="clear-all-btn" onClick={handleClearAll}>Clear all</button>
                </div>
                {files.map((f, i) => (
                  <div key={i} className="loaded-file">
                    <span className="file-icon">&#128196;</span>
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{(f.size / 1000).toFixed(1)}k chars</span>
                    <button className="file-remove" onClick={() => handleRemoveFile(i)}>&times;</button>
                  </div>
                ))}
                <div className="paste-stats">
                  {totalChars.toLocaleString()} total chars / ~{Math.ceil(totalChars / 4).toLocaleString()} tokens
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              disabled={files.length === 0 || loading}
              onClick={() => onLoad(combinedText)}
            >
              {loading ? 'Extracting...' : `Extract & Load Research (${files.length} file${files.length > 1 ? 's' : ''})`}
            </button>
          </div>
        )}

        {tab === 'paste' && (
          <div className="modal-body">
            <p className="modal-hint">
              Paste any research document — deep buyer research, market analysis, customer interviews, brand briefs.
              The AI will extract everything needed to generate targeted ads with real customer language.
            </p>
            <textarea
              className="research-textarea large"
              placeholder={`Paste your research here...\n\nWorks great with:\n- Suby 10-Tab deep buyer research\n- Business scanner output\n- Market research reports\n- Brand guides / README files\n- Campaign strategy docs`}
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
