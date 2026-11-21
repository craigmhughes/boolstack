'use client'

import { useId, useRef, useState } from 'react'
import { FileText, TriangleAlert, Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type FileUploadProps = {
  label?: string
  accept?: string[]
  maxSizeMB?: number
  onFileChange?: (file: File | null) => void
  name?: string
  required?: boolean
}

const BYTES_PER_MB = 1024 * 1024

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < BYTES_PER_MB) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`
}

function getExtension(file: File) {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
}

export function FileUpload({
  label = 'Attachment',
  accept = ['.pdf', '.png', '.jpg', '.docx'],
  maxSizeMB = 500,
  onFileChange,
  name,
  required,
}: FileUploadProps) {
  const inputId = useId()
  const descriptionId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const typeList = accept.map((type) => type.replace('.', '').toUpperCase()).join(', ')
  const isOversized = file ? file.size > maxSizeMB * BYTES_PER_MB : false

  function selectFile(next: File | null) {
    setFile(next)
    onFileChange?.(next)
  }

  function clearFile() {
    selectFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={name}
        required={required}
        accept={accept.join(',')}
        aria-describedby={descriptionId}
        className="peer sr-only"
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
      />

      {file ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border bg-card p-3',
            isOversized ? 'border-destructive/50' : 'border-border',
          )}
        >
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="size-5" aria-hidden="true" />
            <span className="absolute -bottom-1.5 rounded-sm bg-foreground px-1 text-[9px] font-semibold leading-tight tracking-wide text-background">
              {getExtension(file)}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-sm font-medium text-foreground" title={file.name}>
              {file.name}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">{file.type || 'Unknown type'}</span>
              <span aria-hidden="true">·</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium tabular-nums',
                  isOversized
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {isOversized && <TriangleAlert className="size-3" aria-hidden="true" />}
                {formatSize(file.size)}
                {isOversized && (
                  <span className="sr-only">{`exceeds the ${maxSizeMB} MB limit`}</span>
                )}
              </span>
            </div>
            {isOversized && (
              <p className="text-xs text-destructive" role="alert">
                {`File exceeds the ${maxSizeMB} MB limit.`}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearFile}
            aria-label={`Remove ${file.name}`}
          >
            <X />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            selectFile(event.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
            'hover:border-ring hover:bg-muted/50',
            'peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
            isDragging ? 'border-ring bg-muted/50' : 'border-border',
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="size-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-foreground">
            <span className="font-medium underline underline-offset-4">Click to upload</span>
            {' or drag and drop'}
          </p>
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {`${typeList} · Max ${maxSizeMB} MB`}
          </p>
        </label>
      )}
    </div>
  )
}
