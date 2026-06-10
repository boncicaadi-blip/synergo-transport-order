import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { base64, mimeType } = req.body as { base64: string; mimeType: string }
    if (!base64) return res.status(400).json({ error: 'Missing base64 content' })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `Analizează acest document de transport și extrage toate câmpurile relevante.
Returnează DOAR un JSON valid cu această structură (fără text suplimentar):
{
  "pairs": {
    "client": "",
    "numar comanda": "",
    "data": "",
    "transportator": "",
    "numar inmatriculare": "",
    "semiremorca": "",
    "sofer": "",
    "tarif": "",
    "moneda": "",
    "referinta": "",
    "expeditor": "",
    "destinatar": "",
    "localitate incarcare": "",
    "localitate descarcare": "",
    "marfa": "",
    "greutate": ""
  },
  "rawText": "tot textul din document"
}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude API error: ${err}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    try {
      const parsed = JSON.parse(content)
      res.status(200).json(parsed)
    } catch {
      res.status(200).json({ pairs: {}, rawText: content })
    }
  } catch (err) {
    console.error('Claude extraction error:', err)
    res.status(500).json({ error: 'Extraction failed' })
  }
}