import React, { useState } from 'react'

// Known clients from Obsidian vault — user can also paste custom research
const KNOWN_CLIENTS = [
  {
    name: 'Oma Organics',
    slug: 'oma-organics',
    description: 'Premium African-inspired clean beauty brand',
    files: ['research/deep-buyer-research.md', 'README.md', 'brand-guide.md', 'strategy/campaign-strategy.md']
  },
  {
    name: 'BookedSolid Pro (HomeLeads)',
    slug: 'homeleads-pro',
    description: 'Homeowner lead list reselling platform',
    files: ['research/deep-buyer-research.md', 'research/market-research.md', 'README.md', 'brand-guide.md']
  },
  {
    name: 'Retirement Annuities',
    slug: 'retirement-annuities',
    description: 'Annuity producer lead generation',
    files: ['research/market-research.md', 'README.md', 'playbook/profile.md', 'playbook/angles.md']
  },
  {
    name: 'OpenClaw Roofers',
    slug: 'openclaw-roofers',
    description: 'Roofing contractor marketing',
    files: ['research/market-research.md', 'README.md', 'strategy/offer.md']
  },
  {
    name: 'FocusFlow',
    slug: 'focusflow',
    description: 'Productivity/focus app',
    files: ['research_brief.md', 'market_competitor_analysis.md']
  },
  {
    name: 'ScalingSOS',
    slug: 'scalingsos',
    description: 'Business scaling coaching',
    files: ['README.md', 'strategy/campaign-strategy.md']
  },
  {
    name: 'inLeap',
    slug: 'inleap',
    description: 'AI/tech product',
    files: ['README.md', 'brief.md']
  },
  {
    name: 'Didaa Handcrafted',
    slug: 'didaa-handcrafted',
    description: 'Handcrafted goods brand',
    files: ['brief.md', 'README.md']
  },
  {
    name: 'NarrowGate Financial',
    slug: 'narrowgate-financial',
    description: 'Financial services',
    files: ['brief.md', 'README.md']
  },
  {
    name: 'The Remedy Effect',
    slug: 'the-remedy-effect',
    description: 'Health/wellness brand',
    files: ['brief.md', 'README.md']
  }
]

export default function ResearchModal({ isOpen, onClose, onLoad, loading }) {
  const [tab, setTab] = useState('clients') // 'clients' | 'paste'
  const [pastedText, setPastedText] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [fileContents, setFileContents] = useState('')

  if (!isOpen) return null

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    // Show instructions on how to load files
    setFileContents('')
  }

  const handleLoadClient = () => {
    if (selectedClient && fileContents) {
      onLoad(fileContents)
    }
  }

  const handlePasteLoad = () => {
    if (pastedText.trim()) {
      onLoad(pastedText)
    }
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
            Existing Clients
          </button>
          <button className={`modal-tab ${tab === 'paste' ? 'active' : ''}`} onClick={() => setTab('paste')}>
            Paste Research
          </button>
        </div>

        {tab === 'clients' && (
          <div className="modal-body">
            <p className="modal-hint">Select a client to load their research data. The AI will extract brand info, target audience, and buyer psychology.</p>
            <div className="client-grid">
              {KNOWN_CLIENTS.map(client => (
                <div
                  key={client.slug}
                  className={`client-card ${selectedClient?.slug === client.slug ? 'selected' : ''}`}
                  onClick={() => handleClientSelect(client)}
                >
                  <strong>{client.name}</strong>
                  <span className="client-desc">{client.description}</span>
                  <span className="client-files">{client.files.length} research files</span>
                </div>
              ))}
            </div>

            {selectedClient && (
              <div className="client-load-section">
                <p className="load-instructions">
                  Paste the research content for <strong>{selectedClient.name}</strong> below.
                  Best files to paste:
                </p>
                <div className="file-chips">
                  {selectedClient.files.map(f => (
                    <span key={f} className="file-chip">{f}</span>
                  ))}
                </div>
                <p className="load-hint">
                  Obsidian path: <code>Clients/{selectedClient.slug}/</code>
                </p>
                <textarea
                  className="research-textarea"
                  placeholder={`Paste research content here...\n\nTip: Open the deep-buyer-research.md or README.md in Obsidian, select all (Ctrl+A), copy, and paste here.`}
                  value={fileContents}
                  onChange={e => setFileContents(e.target.value)}
                  rows={10}
                />
                <button
                  className="btn-primary"
                  disabled={!fileContents.trim() || loading}
                  onClick={handleLoadClient}
                >
                  {loading ? 'Extracting...' : `Load ${selectedClient.name} Research`}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'paste' && (
          <div className="modal-body">
            <p className="modal-hint">
              Paste any research document — deep buyer research, market analysis, customer interviews, competitor analysis, or a brand brief. The AI will extract everything needed to generate targeted ads.
            </p>
            <p className="modal-hint" style={{ marginTop: 8 }}>
              <strong>Best formats:</strong> Sabri Suby 10-Tab research, business scanner output, campaign strategy docs, or any document with customer pain points and language.
            </p>
            <textarea
              className="research-textarea large"
              placeholder={`Paste your research here...\n\nExamples of what works well:\n- Deep buyer research (10-tab framework)\n- Market research reports\n- Customer interview transcripts\n- Competitor analysis\n- Brand briefs / README files\n- Campaign strategy docs`}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows={16}
            />
            <div className="paste-stats">
              {pastedText.length > 0 && (
                <span>{pastedText.length.toLocaleString()} chars / ~{Math.ceil(pastedText.length / 4).toLocaleString()} tokens</span>
              )}
            </div>
            <button
              className="btn-primary"
              disabled={!pastedText.trim() || loading}
              onClick={handlePasteLoad}
            >
              {loading ? 'Extracting...' : 'Extract & Load Research'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
