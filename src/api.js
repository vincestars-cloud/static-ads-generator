// Client-side OpenAI API calls (no backend needed)

export function getDefaultApiKey() {
  // Check localStorage first, then return empty
  return localStorage.getItem('openai_api_key') || ''
}

async function callOpenAI(apiKey, messages, maxTokens = 2000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: maxTokens
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

function extractJSON(text, type = 'object') {
  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const match = text.match(pattern)
  if (!match) throw new Error('Failed to parse AI response')
  return JSON.parse(match[0])
}

export async function analyzeReference(apiKey, imageBase64, mimeType) {
  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Analyze this static ad image and extract the visual style properties. Return ONLY valid JSON:
{
  "layoutType": "product-center" | "product-left" | "product-right" | "text-overlay",
  "backgroundColor": "#hex primary background color",
  "backgroundGradient": "CSS gradient string or null",
  "accentColor": "#hex accent/highlight color",
  "textColor": "#hex main text color",
  "headlineStyle": "bold-large" | "serif-elegant" | "clean-modern" | "playful-rounded",
  "badgeText": "text shown in badge/tag or null",
  "badgeColor": "#hex badge background color",
  "hasBulletPoints": true/false,
  "bulletIconStyle": "checkmark" | "arrow" | "dot" | "emoji" | "custom-icon",
  "ctaStyle": "bar-bottom" | "button-center" | "text-link" | "pill-button",
  "ctaColor": "#hex CTA background color",
  "fontFamily": "closest Google Font match for headline",
  "bodyFontFamily": "closest Google Font match for body",
  "borderRadius": "px value for card corners",
  "hasPrice": true/false,
  "priceFormat": "how price is shown",
  "overallVibe": "short description of the overall visual feeling"
}`
      },
      {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${imageBase64}` }
      }
    ]
  }], 1000)

  return extractJSON(text)
}

export async function generateProfiles(apiKey, { brandName, productName, productDescription, targetAudience, researchContext, numProfiles = 10 }) {
  const researchBlock = researchContext
    ? `\n\nDEEP BUYER RESEARCH (use this to create highly accurate profiles):\n${researchContext.substring(0, 6000)}`
    : ''

  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `You are an expert DTC performance marketer. Generate ${numProfiles} distinct buyer profiles for this product:

Brand: ${brandName}
Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience || 'General'}${researchBlock}

Each profile = a unique buyer type with a unique ad angle. ${researchContext ? 'USE the research data above to ground each profile in REAL pain points, fears, and language from actual customers.' : ''}

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "name": "Profile name (e.g. 'Skeptical first-time buyer')",
    "angle": "Advertising angle (e.g. 'Proof-first outcome framing with a believable result')",
    "pain": "Primary pain point (use real customer language if research provided)",
    "emotion": "Target emotion to evoke",
    "hookStyle": "Type of hook that works"
  }
]

Make each profile distinct. Adapt to the specific product.`
  }], 2000)

  return extractJSON(text, 'array')
}

export async function generateAds(apiKey, { brandName, productName, productDescription, profiles, style, numAds, price, researchContext }) {
  const adsPerProfile = Math.floor(numAds / profiles.length)
  const remainder = numAds % profiles.length
  const distribution = profiles.map((p, i) => ({
    ...p,
    adCount: adsPerProfile + (i < remainder ? 1 : 0)
  }))

  const researchBlock = researchContext
    ? `\n\nCUSTOMER RESEARCH (use real language/quotes in headlines and bullets):\n${researchContext.substring(0, 4000)}`
    : ''

  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `You are an elite DTC ad copywriter. Generate ${numAds} static ad copy variations.

Brand: ${brandName}
Product: ${productName}
Description: ${productDescription}
Price: ${price || 'Not specified'}
Style vibe: ${style?.overallVibe || 'Clean, modern DTC'}${researchBlock}

Distribute across these profiles:
${distribution.map(p => `- "${p.name}" (${p.angle}) — ${p.adCount} ads`).join('\n')}

${researchContext ? 'IMPORTANT: Use real customer language from the research. Pull exact phrases, fears, and desires into headlines and bullets.' : ''}

Return ONLY valid JSON array:
[
  {
    "id": 1,
    "profileName": "Which profile this targets",
    "profileAngle": "The angle used",
    "badge": "Short badge text (2-3 words)",
    "headline": "Bold headline (5-8 words max). Make ONE key number or word extra large.",
    "highlightWord": "ONE word/number from headline to make extra large",
    "bullets": ["benefit 1 (4-6 words)", "benefit 2", "benefit 3", "benefit 4"],
    "bulletIcons": ["✓", "🧠", "💪", "🌿"],
    "cta": "CTA text",
    "ctaHighlight": "price or key part to highlight"
  }
]

Make headlines punchy and scroll-stopping. Each ad unique while on-brand.`
  }], 4000)

  return extractJSON(text, 'array')
}

export async function generateVariation(apiKey, { ad, brandName, productName }) {
  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `Create a variation of this static ad. Same profile/angle, fresh copy.

Brand: ${brandName}, Product: ${productName}
Original: ${JSON.stringify(ad)}

Return ONLY valid JSON:
{
  "id": ${ad.id},
  "profileName": "${ad.profileName}",
  "profileAngle": "${ad.profileAngle}",
  "badge": "new badge",
  "headline": "new headline",
  "highlightWord": "word to emphasize",
  "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "bulletIcons": ["icon1", "icon2", "icon3", "icon4"],
  "cta": "new cta",
  "ctaHighlight": "highlight part"
}`
  }], 500)

  return extractJSON(text)
}

export async function extractFromResearch(apiKey, researchText) {
  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `Extract product/brand information from this research document. Return ONLY valid JSON:

{
  "brandName": "the brand name",
  "productName": "primary product or product line name",
  "productDescription": "2-3 sentence description based on the research",
  "targetAudience": "who the target buyer is, based on research data",
  "price": "price point if mentioned, or empty string",
  "researchSummary": "A dense 500-word summary of the key buyer psychology: fears, desires, frustrations, language patterns, previous failed solutions, and emotional triggers. This will be used to generate ad copy."
}

RESEARCH DOCUMENT:
${researchText.substring(0, 8000)}`
  }], 1500)

  return extractJSON(text)
}
