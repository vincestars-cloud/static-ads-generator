import React, { useCallback } from 'react'
import { toPng } from 'html-to-image'
import AdCard from './AdCard'

export default function AdGrid({ ads, style, productPreview, brandName, aspectRatio, onVariation, onRemove }) {
  const downloadAll = useCallback(async () => {
    const cards = document.querySelectorAll('.ad-card')
    for (let i = 0; i < cards.length; i++) {
      try {
        const dataUrl = await toPng(cards[i], { pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `ad-${i + 1}-${brandName.toLowerCase().replace(/\s+/g, '-')}.png`
        link.href = dataUrl
        link.click()
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error(`Failed to download ad ${i + 1}:`, err)
      }
    }
  }, [brandName])

  return (
    <div className="ad-grid-container">
      <div className="grid-header">
        <div>
          <h2>Generated Ads</h2>
          <p>{ads.length} ads generated across {new Set(ads.map(a => a.profileName)).size} profiles</p>
        </div>
        <div className="grid-actions">
          <button className="btn-secondary" onClick={downloadAll}>
            Download All ({ads.length})
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <button className="tab active">All ({ads.length})</button>
        {[...new Set(ads.map(a => a.profileName))].map(name => (
          <button key={name} className="tab">
            {name} ({ads.filter(a => a.profileName === name).length})
          </button>
        ))}
      </div>

      <div className="ad-grid">
        {ads.map((ad, i) => (
          <AdCard
            key={`${ad.id}-${i}`}
            ad={ad}
            style={style}
            productImage={productPreview}
            brandName={brandName}
            aspectRatio={aspectRatio}
            onVariation={onVariation}
            onRemove={onRemove}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
