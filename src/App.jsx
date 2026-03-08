import React, { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import AdGrid from './components/AdGrid'
import ResearchModal from './components/ResearchModal'
import { analyzeReference, generateProfiles, generateAds, generateVariation, extractFromResearch, getDefaultApiKey } from './api'

export default function App() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // API Key — pre-filled from config, saved to localStorage
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || getDefaultApiKey())

  // Research modal
  const [showResearchModal, setShowResearchModal] = useState(false)
  const [researchContext, setResearchContext] = useState('')
  const [researchLoaded, setResearchLoaded] = useState(false)

  // Step 1: Inputs
  const [referenceFile, setReferenceFile] = useState(null)
  const [referencePreview, setReferencePreview] = useState(null)
  const [productFile, setProductFile] = useState(null)
  const [productPreview, setProductPreview] = useState(null)
  const [brandName, setBrandName] = useState('')
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [price, setPrice] = useState('')

  // Step 1 result
  const [style, setStyle] = useState(null)

  // Step 2: Profiles
  const [profiles, setProfiles] = useState([])

  // Step 3: Settings
  const [numAds, setNumAds] = useState(10)
  const [aspectRatio, setAspectRatio] = useState('4:5')
  const [useBrandKit, setUseBrandKit] = useState(true)

  // Generated ads
  const [ads, setAds] = useState([])
  const [showGrid, setShowGrid] = useState(false)

  const handleApiKeyChange = (key) => {
    setApiKey(key)
    localStorage.setItem('openai_api_key', key)
  }

  const handleResearchLoad = useCallback(async (text) => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key first')
      return
    }
    setLoading(true)
    setLoadingMessage('Extracting brand & audience data from research...')
    try {
      const extracted = await extractFromResearch(apiKey, text)
      setBrandName(extracted.brandName || '')
      setProductName(extracted.productName || '')
      setProductDescription(extracted.productDescription || '')
      setTargetAudience(extracted.targetAudience || '')
      setPrice(extracted.price || '')
      setResearchContext(extracted.researchSummary || text.substring(0, 6000))
      setResearchLoaded(true)
      setShowResearchModal(false)
    } catch (err) {
      alert('Error extracting research: ' + err.message)
    }
    setLoading(false)
  }, [apiKey])

  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], mimeType: file.type || 'image/png' })
    reader.readAsDataURL(file)
  })

  const handleAnalyzeReference = useCallback(async () => {
    if (!referenceFile || !apiKey) return
    setLoading(true)
    try {
      setLoadingMessage('Analyzing reference ad style...')
      const { base64, mimeType } = await fileToBase64(referenceFile)
      const extractedStyle = await analyzeReference(apiKey, base64, mimeType)
      setStyle(extractedStyle)

      setLoadingMessage('Generating buyer profiles from research...')
      const generatedProfiles = await generateProfiles(apiKey, {
        brandName, productName, productDescription, targetAudience, researchContext
      })
      setProfiles(generatedProfiles)
      setStep(2)
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }, [referenceFile, apiKey, brandName, productName, productDescription, targetAudience, researchContext])

  const handleGenerateAds = useCallback(async () => {
    setLoading(true)
    setLoadingMessage('Generating ad copy for all variations...')
    setShowGrid(false)
    try {
      const generatedAds = await generateAds(apiKey, {
        brandName, productName, productDescription,
        profiles, style, numAds, price, researchContext
      })
      setAds(generatedAds)
      setShowGrid(true)
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }, [apiKey, brandName, productName, productDescription, profiles, style, numAds, price, researchContext])

  const handleGenerateVariation = useCallback(async (ad) => {
    try {
      const variation = await generateVariation(apiKey, { ad, brandName, productName })
      const newAd = { ...variation, id: ads.length + 1 }
      setAds(prev => [...prev, newAd])
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }, [apiKey, ads, brandName, productName])

  const removeProfile = (idx) => setProfiles(prev => prev.filter((_, i) => i !== idx))
  const removeAd = (idx) => setAds(prev => prev.filter((_, i) => i !== idx))

  return (
    <div className="app-layout">
      <Sidebar
        step={step}
        setStep={setStep}
        loading={loading}
        loadingMessage={loadingMessage}
        apiKey={apiKey}
        setApiKey={handleApiKeyChange}
        referenceFile={referenceFile}
        setReferenceFile={setReferenceFile}
        referencePreview={referencePreview}
        setReferencePreview={setReferencePreview}
        productFile={productFile}
        setProductFile={setProductFile}
        productPreview={productPreview}
        setProductPreview={setProductPreview}
        brandName={brandName}
        setBrandName={setBrandName}
        productName={productName}
        setProductName={setProductName}
        productDescription={productDescription}
        setProductDescription={setProductDescription}
        targetAudience={targetAudience}
        setTargetAudience={setTargetAudience}
        price={price}
        setPrice={setPrice}
        style={style}
        analyzeReference={handleAnalyzeReference}
        profiles={profiles}
        removeProfile={removeProfile}
        numAds={numAds}
        setNumAds={setNumAds}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        useBrandKit={useBrandKit}
        setUseBrandKit={setUseBrandKit}
        generateAds={handleGenerateAds}
        researchLoaded={researchLoaded}
        onOpenResearch={() => setShowResearchModal(true)}
      />
      <main className="main-content">
        {showGrid ? (
          <AdGrid
            ads={ads}
            style={style}
            productPreview={productPreview}
            brandName={brandName}
            aspectRatio={aspectRatio}
            onVariation={handleGenerateVariation}
            onRemove={removeAd}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📐</div>
            <h2>Static Ads Generator</h2>
            <p>Upload a winning ad reference and product image to get started.<br/>Generate dozens of on-brand static ad variations in minutes.</p>
          </div>
        )}
      </main>

      <ResearchModal
        isOpen={showResearchModal}
        onClose={() => setShowResearchModal(false)}
        onLoad={handleResearchLoad}
        loading={loading}
      />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <p>{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}
