import { useCallback, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'

interface Props {
  onExtracted: (pairs: Record<string, string>, rawText: string) => void
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

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type }),
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
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? 'border-nova-blue bg-blue-50 scale-[1.01]'
          : 'border-gray-300 bg-gray-50 hover:border-nova-indigo hover:bg-indigo-50'
        }
      `}
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
        <div className="flex flex-col items-center gap-3 text-nova-blue">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm">Se procesează cu Amazon Textract...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {fileName
            ? <FileText className="w-10 h-10 text-nova-indigo" />
            : <Upload className="w-10 h-10 text-gray-400" />
          }
          <div>
            <p className="font-medium text-gray-700">
              {fileName ?? 'Trage un document PDF aici'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              sau click pentru selectare • PDF, JPG, PNG
            </p>
          </div>
        </div>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}
