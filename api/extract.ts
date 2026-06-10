import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  TextractClient,
  AnalyzeDocumentCommand,
  type Block,
} from '@aws-sdk/client-textract'

const client = new TextractClient({
  rregion: process.env.AWS_REGION ?? 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { base64 } = req.body as { base64: string; mimeType: string }
    if (!base64) return res.status(400).json({ error: 'Missing base64 content' })

    const buffer = Buffer.from(base64, 'base64')

    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: buffer },
      FeatureTypes: ['FORMS', 'TABLES'],
    })

    const response = await client.send(command)
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
      const valueId = (keyBlock.Relationships ?? [])
        .find(r => r.Type === 'VALUE')
        ?.Ids?.[0]
      if (valueId) {
        const valBlock = valueMap.get(valueId)
        if (valBlock) pairs[keyText] = getText(valBlock)
      }
    }

    const rawText = blocks
      .filter(b => b.BlockType === 'LINE')
      .map(b => b.Text ?? '')
      .join('\n')

    res.status(200).json({ pairs, rawText })
  } catch (err) {
    console.error('Textract error:', err)
    res.status(500).json({ error: 'Textract extraction failed' })
  }
}