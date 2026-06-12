import type { VercelRequest, VercelResponse } from '@vercel/node'

async function extractLotWithClaude(pdfText: string): Promise<Record<string, unknown>> {
  const prompt = `Ești un expert în documente vamale și de transport internațional. Analizează textul următor dintr-un document vamal (poate fi în turcă, engleză, română, bulgară sau altă limbă) și extrage datele în română.

TEXT DOCUMENT:
${pdfText.substring(0, 4000)}

Returnează DOAR un obiect JSON valid, fără backticks, fără explicații:
{
  "lot": {
    "mrn": "",
    "lrn": "",
    "urn": "",
    "tsdCrn": "",
    "data": "",
    "valuta": "",
    "regim": "",
    "vama": "",
    "ddt": "",
    "dataR2": "",
    "pozitieR2": "",
    "totalItemuri": "",
    "totalGreutateBruta": "",
    "tranzitSuplimentar": "",
    "articole": [
      {
        "nrCrt": 1,
        "hsCod": "",
        "cal": "",
        "descriere": "",
        "expeditor": "",
        "adresaExpeditor": "",
        "orasExpeditor": "",
        "taraExpeditor": "",
        "codPostalExpeditor": "",
        "destinatar": "",
        "adresaDestinatar": "",
        "orasDestinatar": "",
        "taraDestinatar": "",
        "codPostalDestinatar": "",
        "greutateBruta": "",
        "greutateNeta": "",
        "val": "",
        "observatii": ""
      }
    ],
    "entitati": [
      {
        "declarant": "",
        "taraExpeditor": "",
        "taraDestinatar": "",
        "observatii": ""
      }
    ],
    "transport": [
      {
        "nrAuto": "",
        "taraTransportator": "",
        "codVamaExpeditor": "",
        "codVamaDestinatar": "",
        "ruta": "",
        "nrSigiliu": "",
        "observatii": ""
      }
    ]
  }
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: 'Ești expert în documente vamale. Returnezi DOAR JSON pur fără backticks sau text suplimentar. Primul caracter este {',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  const content = data.content[0].text.trim()
  console.log('Claude lot response:', content.substring(0, 300))

  // Parse robust
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(content.slice(start, end + 1))
      // Adaugă id-uri la articole, entitati, transport
      if (parsed.lot?.articole) {
        parsed.lot.articole = parsed.lot.articole.map((a: Record<string, unknown>, i: number) => ({ ...a, id: `art-${i + 1}-${Date.now()}` }))
      }
      if (parsed.lot?.entitati) {
        parsed.lot.entitati = parsed.lot.entitati.map((e: Record<string, unknown>, i: number) => ({ ...e, id: `ent-${i + 1}-${Date.now()}` }))
      }
      if (parsed.lot?.transport) {
        parsed.lot.transport = parsed.lot.transport.map((t: Record<string, unknown>, i: number) => ({ ...t, id: `tr-${i + 1}-${Date.now()}` }))
      }
      return parsed
    } catch {
      throw new Error('JSON parse failed')
    }
  }
  throw new Error('No JSON found in response')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { pdfText } = req.body as { pdfText?: string }

    if (!pdfText || pdfText.trim().length < 10) {
      return res.status(400).json({ error: 'PDF text not available' })
    }

    console.log('Extracting lot from PDF text, length:', pdfText.length)
    const result = await extractLotWithClaude(pdfText)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Lot extraction error:', err)
    res.status(500).json({ error: 'Extraction failed' })
  }
}
