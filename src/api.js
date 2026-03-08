// Client-side OpenAI API calls (no backend needed)

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
        text: `Analyze this static ad image and extract the visual style properties. Return ONLY valid JSON with these fields:
{
  "layoutType": "product-center" | "product-left" | "product-right" | "text-overlay",
  "backgroundColor": "#hex primary background color",
  "backgroundGradient": "CSS gradient string or null",
  "accentColor": "#hex accent/highlight color",
  "textColor": "#hex main text color",
  "headlineStyle": "bold-large" | "serif-elegant" | "clean-modern" | "playful-rounded",
  "badgeText": "text shown in badge/tag (e.g. 'Just Added', 'New', 'Sale') or null",
  "badgeColor": "#hex badge background color",
  "hasBulletPoints": true/false,
  "bulletIconStyle": "checkmark" | "arrow" | "dot" | "emoji" | "custom-icon",
  "ctaStyle": "bar-bottom" | "button-center" | "text-link" | "pill-button",
  "ctaColor": "#hex CTA background color",
  "fontFamily": "closest Google Font match for the headline",
  "bodyFontFamily": "closest Google Font match for body text",
  "borderRadius": "px value for card corners",
  "hasPrice": true/false,
  "priceFormat": "description of how price is shown",
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

export async function generateProfiles(apiKey, { brandName, productName, productDescription, targetAudience, numProfiles = 10 }) {
  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `You are an expert DTC performance marketer. Generate ${numProfiles} distinct buyer profiles/customer avatars for this product:

Brand: ${brandName}
Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience || 'General'}

Each profile represents a different type of buyer with a unique advertising angle. Return ONLY valid JSON array:
[
  {
    "id": 1,
    "name": "Profile name (e.g. 'Skeptical first-time buyer')",
    "angle": "Advertising angle (e.g. 'Proof-first outcome framing with a believable result')",
    "pain": "Primary pain point this person has",
    "emotion": "Target emotion to evoke (e.g. 'Trust and relief')",
    "hookStyle": "Type of hook that works (e.g. 'Social proof', 'Before/after', 'Problem agitation')"
  }
]

Make each profile distinct — cover skeptics, value-seekers, busy people, results-focused, ingredient-conscious, category switchers, social-proof seekers, routine builders, quality-focused, and gift buyers. Adapt to the specific product.`
  }], 2000)

  return extractJSON(text, 'array')
}

export async function generateAds(apiKey, { brandName, productName, productDescription, profiles, style, numAds, price }) {
  const adsPerProfile = Math.floor(numAds / profiles.length)
  const remainder = numAds % profiles.length
  const distribution = profiles.map((p, i) => ({
    ...p,
    adCount: adsPerProfile + (i < remainder ? 1 : 0)
  }))

  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `You are an elite DTC ad copywriter. Generate static ad copy for ${numAds} Facebook/Instagram static ads.

Brand: ${brandName}
Product: ${productName}
Description: ${productDescription}
Price: ${price || 'Not specified'}

Style reference vibe: ${style?.overallVibe || 'Clean, modern DTC'}

Generate ads distributed across these buyer profiles:
${distribution.map(p => `- "${p.name}" (${p.angle}) — ${p.adCount} ads`).join('\n')}

For each ad, vary the headline and bullets so no two ads are identical. Return ONLY valid JSON array:
[
  {
    "id": 1,
    "profileName": "Which profile this targets",
    "profileAngle": "The angle used",
    "badge": "Short badge text (2-3 words, e.g. 'Just Added', 'Best Seller', 'New Formula')",
    "headline": "Bold attention-grabbing headline (5-8 words max). Make ONE key number or word extra large.",
    "highlightWord": "The ONE word or number from the headline to make extra large/bold",
    "bullets": ["benefit 1 (short, 4-6 words)", "benefit 2", "benefit 3", "benefit 4"],
    "bulletIcons": ["✓", "🧠", "💪", "🌿"],
    "cta": "CTA text (e.g. '28 daily packs for $1.25 per pack')",
    "ctaHighlight": "The price or key part to highlight in CTA"
  }
]

Make headlines punchy and scroll-stopping. Use specific numbers when possible. Each ad should feel unique while staying on-brand.`
  }], 4000)

  return extractJSON(text, 'array')
}

export async function generateVariation(apiKey, { ad, brandName, productName }) {
  const text = await callOpenAI(apiKey, [{
    role: 'user',
    content: `Create a variation of this static ad. Keep the same profile/angle but change the headline and bullets.

Brand: ${brandName}, Product: ${productName}
Original ad: ${JSON.stringify(ad)}

Return ONLY valid JSON with the same structure but with fresh copy:
{
  "id": ${ad.id},
  "profileName": "${ad.profileName}",
  "profileAngle": "${ad.profileAngle}",
  "badge": "new badge text",
  "headline": "new headline",
  "highlightWord": "word to emphasize",
  "bullets": ["new bullet 1", "new bullet 2", "new bullet 3", "new bullet 4"],
  "bulletIcons": ["icon1", "icon2", "icon3", "icon4"],
  "cta": "new cta",
  "ctaHighlight": "highlight part"
}`
  }], 500)

  return extractJSON(text)
}
