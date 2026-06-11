import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  TextractClient,
  AnalyzeDocumentCommand,
  type Block,
} from '@aws-sdk/client-textract'

const textractClient = new TextractClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function extractWithTextract(buffer: Buffer): Promise<{ pairs: Record<string, string>; rawText: string }> {
  const command = new AnalyzeDocumentCommand({
    Document: { Bytes: buffer },
    FeatureTypes: ['FORMS', 'TABLES'],
  })
  const response = await textractClient.send(command)
  const blocks: Block[] = response.Blocks ?? []

  const keyMap = new Map<string, Block>()
  const valueMap = new Map<string, Block>()

  for (const block of blocks) {
    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes?.includes('KEY')) keyMap.set(block.Id!, block)
      if (block.EntityTypes?.includes('VALUE')) valueMap.set(block.Id!, block)
    }
  }

  const getText = (block: Block): string =>
    (block.Relationships ?? [])
      .filter(r => r.Type === 'CHILD')
      .flatMap(r => r.Ids ?? [])
      .map(id => blocks.find(b => b.Id === id))
      .filter((b): b is Block => b?.BlockType === 'WORD')
      .map(b => b.Text ?? '')
      .join(' ')
      .trim()

  const pairs: Record<string, string> = {}
  for (const [, keyBlock] of keyMap) {
    const keyText = getText(keyBlock).toLowerCase()
    const valueId = (keyBlock.Relationships ?? []).find(r => r.Type === 'VALUE')?.Ids?.[0]
    if (valueId) {
      const valBlock = valueMap.get(valueId)
      if (valBlock) pairs[keyText] = getText(valBlock)
    }
  }

  const rawText = blocks.filter(b => b.BlockType === 'LINE').map(b => b.Text ?? '').join('\n')
  return { pairs, rawText }
}

async function extractWithClaude(base64: string, mimeType: string): Promise<{ pairs: Record<string, string>; rawText: string }> {
  const isImage = mimeType.startsWith('image/')

  const messageContent = isImage
    ? [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
        {
          type: 'text',
          text: `Analizează acest document de transport. Returnează DOAR un obiect JSON valid, fara backticks, fara text inainte sau dupa:
{"pairs":{"client":"","numar comanda":"","data":"","transportator":"","numar inmatriculare":"","semiremorca":"","sofer":"","tarif":"","moneda":"","referinta":"","expeditor":"","destinatar":"","localitate incarcare":"","localitate descarcare":"","marfa":"","termen plata":""},"rawText":"tot textul din document"}`,
        },
      ]
    : [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        {
          type: 'text',
          text: `Analizează acest document de transport. Returnează DOAR un obiect JSON valid, fara backticks, fara text inainte sau dupa:
{"pairs":{"client":"","numar comanda":"","data":"","transportator":"","numar inmatriculare":"","semiremorca":"","sofer":"","tarif":"","moneda":"","referinta":"","expeditor":"","destinatar":"","localitate incarcare":"","localitate descarcare":"","marfa":"","termen plata":""},"rawText":"tot textul din document"}`,
        },
      ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: messageContent }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Încearcă parsare directă
  try {
    const parsed = JSON.parse(content)
    return { pairs: parsed.pairs || {}, rawText: parsed.rawText || content }
  } catch {
    // Curăță backticks și încearcă din nou
    try {
      const clean = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      const parsed = JSON.parse(clean)
      return { pairs: parsed.pairs || {}, rawText: parsed.rawText || content }
    } catch {
      // Extrage JSON din mijlocul textului
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          return { pairs: parsed.pairs || {}, rawText: parsed.rawText || content }
        } catch {
          return { pairs: {}, rawText: content }
        }
      }
      return { pairs: {}, rawText: content }
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { base64, mimeType } = req.body as { base64: string; mimeType: string }
    if (!base64) return res.status(400).json({ error: 'Missing base64 content' })

    const buffer = Buffer.from(base64, 'base64')

    try {
      console.log('Trying Textract...')
      const result = await extractWithTextract(buffer)
      console.log('Textract success')
      return res.status(200).json({ ...result, source: 'textract' })
    } catch (textractErr: unknown) {
      const errMessage = textractErr instanceof Error ? textractErr.message : String(textractErr)
      const isUnavailable =
        errMessage.includes('SubscriptionRequiredException') ||
        errMessage.includes('subscription') ||
        errMessage.includes('AccessDeniedException') ||
        errMessage.includes('ENOTFOUND') ||
        errMessage.includes('UnrecognizedClientException')

      if (isUnavailable) {
        console.log('Textract unavailable, using Claude...')
        const result = await extractWithClaude(base64, mimeType || 'application/pdf')
        console.log('Claude success:', JSON.stringify(result.pairs).substring(0, 300))
        return res.status(200).json({ ...result, source: 'claude' })
      }

      throw textractErr
    }
  } catch (err) {
    console.error('Extraction error:', err)
    res.status(500).json({ error: 'Extraction failed' })
  }
}
