import React from 'react'

export default function Sidebar({
  step, setStep, loading,
  apiKey, setApiKey,
  referenceFile, setReferenceFile, referencePreview, setReferencePreview,
  productFile, setProductFile, productPreview, setProductPreview,
  brandName, setBrandName, productName, setProductName,
  productDescription, setProductDescription, targetAudience, setTargetAudience,
  price, setPrice, style, analyzeReference,
  profiles, removeProfile,
  numAds, setNumAds, aspectRatio, setAspectRatio,
  useBrandKit, setUseBrandKit, generateAds
}) {

  const handleFileChange = (setter, previewSetter) => (e) => {
    const file = e.target.files[0]
    if (file) {
      setter(file)
      const reader = new FileReader()
      reader.onload = (ev) => previewSetter(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const canProceedStep1 = referenceFile && productFile && brandName && productName && productDescription && apiKey
  const canGenerate = profiles.length > 0 && numAds > 0

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Static Ads Generator</h1>
      </div>

      <div className="sidebar-body">
        {/* API KEY */}
        <div className="api-key-section" style={{ margin: '12px 24px 4px' }}>
          <label>OpenAI API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
          />
          <small>Stored in your browser only. Never sent to any server except OpenAI directly.</small>
        </div>

        {/* STEP 1 */}
        <section className={`step-section ${step >= 1 ? 'active' : ''}`}>
          <div className="step-header" onClick={() => setStep(1)}>
            <span className={`step-number ${style ? 'done' : ''}`}>{style ? '✓' : '1'}</span>
            <span>Reference + Product Inputs</span>
          </div>

          {step === 1 && (
            <div className="step-content">
              <label className="upload-area">
                <span className="upload-label">Winning Style Reference <span className="req">Required</span></span>
                {referencePreview ? (
                  <img src={referencePreview} alt="Reference" className="upload-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>Click to upload reference ad</span>
                    <small>This controls composition and style</small>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange(setReferenceFile, setReferencePreview)} hidden />
              </label>

              <label className="upload-area">
                <span className="upload-label">Product Identity Image <span className="req">Required</span></span>
                {productPreview ? (
                  <img src={productPreview} alt="Product" className="upload-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>Click to upload product image</span>
                    <small>Product identity preserved exactly</small>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange(setProductFile, setProductPreview)} hidden />
              </label>

              <div className="form-group">
                <label>Brand Name</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Grüns" />
              </div>
              <div className="form-group">
                <label>Product Name</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Daily Gummy Vitamins" />
              </div>
              <div className="form-group">
                <label>Product Description</label>
                <textarea value={productDescription} onChange={e => setProductDescription(e.target.value)}
                  placeholder="Describe the product, key benefits, ingredients, what makes it unique..." rows={3} />
              </div>
              <div className="form-group">
                <label>Target Audience <span className="opt">(optional)</span></label>
                <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Health-conscious parents, 25-45" />
              </div>
              <div className="form-group">
                <label>Price / CTA <span className="opt">(optional)</span></label>
                <input value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. $1.25 per pack" />
              </div>

              <button className="btn-primary" disabled={!canProceedStep1 || loading} onClick={analyzeReference}>
                Analyze & Generate Profiles
              </button>
            </div>
          )}
        </section>

        {/* STEP 2 */}
        <section className={`step-section ${step >= 2 ? 'active' : ''}`}>
          <div className="step-header" onClick={() => profiles.length > 0 && setStep(2)}>
            <span className={`step-number ${profiles.length > 0 && step > 2 ? 'done' : ''}`}>
              {profiles.length > 0 && step > 2 ? '✓' : '2'}
            </span>
            <span>Campaign Brief</span>
            {profiles.length > 0 && <span className="step-badge">{profiles.length} profiles</span>}
          </div>

          {step === 2 && profiles.length > 0 && (
            <div className="step-content">
              <div className="profiles-list">
                {profiles.map((p, i) => (
                  <div key={i} className="profile-card">
                    <div className="profile-header">
                      <strong>{p.name}</strong>
                      <button className="remove-btn" onClick={() => removeProfile(i)}>Remove</button>
                    </div>
                    <div className="profile-detail"><span>Angle:</span> {p.angle}</div>
                    <div className="profile-detail"><span>Pain:</span> {p.pain}</div>
                    <div className="profile-detail"><span>Emotion:</span> {p.emotion}</div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => setStep(3)}>
                Continue to Output Settings
              </button>
            </div>
          )}
        </section>

        {/* STEP 3 */}
        <section className={`step-section ${step >= 3 ? 'active' : ''}`}>
          <div className="step-header" onClick={() => profiles.length > 0 && setStep(3)}>
            <span className="step-number">3</span>
            <span>Output Volume</span>
          </div>

          {step === 3 && (
            <div className="step-content">
              <div className="output-settings">
                <div className="setting-row">
                  <label>Use Brand Kit</label>
                  <input type="checkbox" checked={useBrandKit} onChange={e => setUseBrandKit(e.target.checked)} />
                </div>

                <div className="form-group">
                  <label>How many new ads do you want?</label>
                  <input type="number" min={1} max={60} value={numAds}
                    onChange={e => setNumAds(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))} />
                  <small>Enter a number from 1 to 60.</small>
                </div>

                <div className="form-group">
                  <label>Aspect Ratio</label>
                  <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}>
                    <option value="4:5">4:5 Portrait (Feed - recommended)</option>
                    <option value="1:1">1:1 Square</option>
                    <option value="9:16">9:16 Story/Reel</option>
                    <option value="16:9">16:9 Landscape</option>
                  </select>
                </div>

                <div className="distribution-info">
                  <p>Profiles selected: <strong>{profiles.length}</strong></p>
                  <p>Requested ads: <strong>{numAds}</strong></p>
                  <p className="dist-note">Distribution: {numAds} ads sampled across {profiles.length} profiles.
                    {numAds > profiles.length ? ' Profiles will be reused/cycled.' : ''}</p>
                </div>
              </div>

              {/* Preview Plan */}
              <div className="preview-plan">
                <h3>Preview Plan</h3>
                <div className="plan-stats">
                  <div className="stat"><span className="stat-num">{numAds}</span><span className="stat-label">Planned</span></div>
                  <div className="stat"><span className="stat-num">{profiles.length}</span><span className="stat-label">Profiles</span></div>
                  <div className="stat"><span className="stat-num">{numAds}</span><span className="stat-label">Requested</span></div>
                </div>
                <div className="plan-profiles">
                  {profiles.map((p, i) => (
                    <div key={i} className="plan-profile-pill">
                      {p.name} · {p.angle.substring(0, 50)}{p.angle.length > 50 ? '...' : ''}
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-generate" disabled={!canGenerate || loading} onClick={generateAds}>
                Generate {numAds} Ads
              </button>
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
