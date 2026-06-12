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

function parseClaudeJson(content: string, fallbackText: string): { pairs: Record<string, string>; rawText: string } {
  const stripped = content
    .replace(/^[\s\S]*?(\{)/m, '$1')
    .replace(/\}[\s\S]*$/, '}')
    .trim()
  
  try {
    const parsed = JSON.parse(stripped)
    if (parsed.pairs) return { pairs: parsed.pairs, rawText: fallbackText }
  } catch {
    // fall through
  }

  const attempts = [
    content,
    content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim(),
    content.replace(/```json/gi, '').replace(/```/g, '').trim(),
  ]
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt)
      if (parsed.pairs) return { pairs: parsed.pairs, rawText: fallbackText }
    } catch {
      // continue
    }
  }
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.pairs) return { pairs: parsed.pairs, rawText: fallbackText }
    } catch {
      // continue
    }
  }
  return { pairs: {}, rawText: fallbackText }
}

async function extractWithClaude(pdfText: string): Promise<{ pairs: Record<string, string>; rawText: string }> {
  const prompt = `Analizează textul urmator dintr-un document de transport si extrage campurile cerute. IMPORTANT: returneaza DOAR obiectul JSON, fara backticks, fara explicatii, fara text in plus.

TEXT:
${pdfText.substring(0, 3000)}

RASPUNS (doar JSON):
{"pairs":{"client":"","numar comanda":"","data":"","transportator":"","numar inmatriculare":"","semiremorca":"","sofer":"","tarif":"","moneda":"","referinta":"","expeditor":"","destinatar":"","localitate incarcare":"","localitate descarcare":"","marfa":"","termen plata":""},"rawText":""}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: 'Raspunzi DOAR cu JSON pur, fara backticks, fara markdown, fara text suplimentar. Primul caracter din raspuns trebuie sa fie {',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  const content = data.content[0].text.trim()
  console.log('Claude raw response:', content.substring(0, 300))
  return parseClaudeJson(content, pdfText)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { base64, mimeType, pdfText } = req.body as { base64: string; mimeType: string; pdfText?: string }
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
        console.log('Textract unavailable, using Claude with text...')
        if (!pdfText || pdfText.trim().length < 10) {
          return res.status(200).json({ pairs: {}, rawText: '', source: 'none' })
        }
        const result = await extractWithClaude(pdfText)
        console.log('Claude success:', JSON.stringify(result.pairs).substring(0, 200))
        return res.status(200).json({ ...result, source: 'claude' })
      }
      throw textractErr
    }
  } catch (err) {
    console.error('Extraction error:', err)
    res.status(500).json({ error: 'Extraction failed' })
  }
}
