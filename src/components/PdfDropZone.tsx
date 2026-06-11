import { useCallback, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()

interface Props {
  onExtracted: (pairs: Record<string, string>, rawText: string) => void
}

async function extractTextFromPdf(base64: string): Promise<string> {
  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText.trim()
  } catch (err) {
    console.error('PDF text extraction failed:', err)
    return ''
  }
}

export default function PdfDropZone({ onExtracted }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      setError('Acceptă doar fișiere PDF sau imagini (JPG, PNG)')
      return
    }
    setFileName(file.name)
    setIsLoading(true)
    setError(null)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      let pdfText = ''
      if (file.type.includes('pdf')) {
        pdfText = await extractTextFromPdf(base64)
      }

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          base64, 
          mimeType: file.type,
          pdfText: pdfText || undefined,
        }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const { pairs, rawText } = await response.json()
      onExtracted(pairs, rawText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extracție eșuată')
    } finally {
      setIsLoading(false)
    }
  }, [onExtracted])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${isDragging ? '#2980DA' : '#d1d5db'}`,
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragging ? '#f0f4ff' : '#f9fafb',
        transition: 'all 0.2s',
      }}
      onClick={() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/pdf,image/*'
        input.onchange = e => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) processFile(file)
        }
        input.click()
      }}
    >
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#2980DA' }}>
          <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '13px', margin: 0 }}>Se procesează documentul...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {fileName
            ? <FileText style={{ width: '40px', height: '40px', color: '#0B178B' }} />
            : <Upload style={{ width: '40px', height: '40px', color: '#9ca3af' }} />
          }
          <div>
            <p style={{ margin: 0, fontWeight: '500', color: '#374151', fontSize: '13px' }}>
              {fileName ?? 'Trage un document PDF aici'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              sau click pentru selectare • PDF, JPG, PNG
            </p>
          </div>
        </div>
      )}
      {error && (
        <p style={{ marginTop: '12px', fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>{error}</p>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
