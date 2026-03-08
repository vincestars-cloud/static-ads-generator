import React, { useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'

const ASPECT_RATIOS = {
  '4:5': { width: 400, height: 500 },
  '1:1': { width: 400, height: 400 },
  '9:16': { width: 360, height: 640 },
  '16:9': { width: 640, height: 360 },
}

export default function AdCard({ ad, style, productImage, brandName, aspectRatio, onVariation, onRemove, index }) {
  const cardRef = useRef(null)
  const dims = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['4:5']

  const bg = style?.backgroundColor || '#F5A623'
  const accent = style?.accentColor || '#2D7D3A'
  const textColor = style?.textColor || '#1A1A1A'
  const badgeColor = style?.badgeColor || '#E85D2A'
  const ctaColor = style?.ctaColor || accent
  const borderRadius = style?.borderRadius || '12px'

  // Create headline with highlight word
  const renderHeadline = () => {
    if (!ad.highlightWord) return ad.headline
    const parts = ad.headline.split(new RegExp(`(${ad.highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'))
    return parts.map((part, i) =>
      part.toLowerCase() === ad.highlightWord.toLowerCase()
        ? <span key={i} className="highlight-word">{part}</span>
        : part
    )
  }

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: dims.width * 2,
        height: dims.height * 2,
        style: { transform: 'scale(2)', transformOrigin: 'top left' },
        pixelRatio: 2
      })
      const link = document.createElement('a')
      link.download = `ad-${ad.id || index + 1}-${brandName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }, [ad, brandName, dims, index])

  return (
    <div className="ad-card-wrapper">
      <div
        ref={cardRef}
        className="ad-card"
        style={{
          width: dims.width,
          height: dims.height,
          backgroundColor: bg,
          color: textColor,
          borderRadius,
          fontFamily: style?.fontFamily || "'DM Sans', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Badge */}
        {ad.badge && (
          <div className="ad-badge" style={{ backgroundColor: badgeColor }}>
            {ad.badge}
          </div>
        )}

        {/* Headline */}
        <div className="ad-headline" style={{ color: textColor }}>
          {renderHeadline()}
        </div>

        {/* Product Image + Bullets */}
        <div className="ad-body">
          <div className="ad-product-area">
            {productImage && (
              <img
                src={productImage}
                alt={brandName}
                className="ad-product-img"
                crossOrigin="anonymous"
              />
            )}
          </div>
          <div className="ad-bullets">
            {ad.bullets?.map((bullet, i) => (
              <div key={i} className="ad-bullet">
                <span className="bullet-icon">{ad.bulletIcons?.[i] || '✓'}</span>
                <span className="bullet-text">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Bar */}
        <div className="ad-cta" style={{ backgroundColor: ctaColor }}>
          <span className="cta-text">
            {ad.ctaHighlight ? (
              <>
                {ad.cta.split(ad.ctaHighlight).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <strong className="cta-highlight">{ad.ctaHighlight}</strong>}
                  </React.Fragment>
                ))}
              </>
            ) : ad.cta}
          </span>
          <span className="cta-brand">{brandName.toLowerCase()}</span>
        </div>
      </div>

      {/* Card meta + actions */}
      <div className="ad-meta">
        <span className="ad-id">#{ad.id || index + 1}</span>
        <span className="ad-profile-label">{ad.profileAngle}</span>
      </div>
      <div className="ad-actions">
        <button className="action-btn" onClick={() => onVariation(ad)} title="Generate variation">
          🔄 Variation
        </button>
        <button className="action-btn" onClick={handleDownload} title="Download as PNG">
          ⬇️ Download
        </button>
        <button className="action-btn action-delete" onClick={() => onRemove(index)} title="Delete">
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}
