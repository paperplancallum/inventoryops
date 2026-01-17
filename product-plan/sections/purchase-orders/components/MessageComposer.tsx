import { useState, useRef } from 'react'

type ComposerMode = 'message' | 'note'

interface MessageComposerProps {
  onSend: (content: string, attachments: File[]) => void
  onAddNote?: (content: string) => void
  disabled?: boolean
  placeholder?: string
  notePlaceholder?: string
}

const PaperclipIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const NoteIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export function MessageComposer({
  onSend,
  onAddNote,
  disabled = false,
  placeholder = 'Write a message...',
  notePlaceholder = 'Add an internal note (e.g., "Called supplier on WeChat, confirmed delivery date")',
}: MessageComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('message')
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return

    if (mode === 'note') {
      onAddNote?.(content.trim())
    } else {
      onSend(content.trim(), attachments)
    }

    setContent('')
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canSubmit = content.trim() && !disabled

  const isNoteMode = mode === 'note'

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isNoteMode
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'
    }`}>
      {/* Mode tabs */}
      <div className={`flex border-b ${
        isNoteMode
          ? 'border-amber-200 dark:border-amber-800'
          : 'border-slate-200 dark:border-slate-700'
      }`}>
        <button
          type="button"
          onClick={() => setMode('message')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            !isNoteMode
              ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Message
        </button>
        <button
          type="button"
          onClick={() => setMode('note')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            isNoteMode
              ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500 dark:border-amber-400 -mb-px'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Internal Note
        </button>
      </div>

      {/* Attachments preview (only for messages) */}
      {!isNoteMode && attachments.length > 0 && (
        <div className="px-3 pt-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 rounded text-sm"
            >
              <PaperclipIcon />
              <span className="text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                {file.name}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-xs">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isNoteMode ? notePlaceholder : placeholder}
        disabled={disabled}
        rows={3}
        className={`w-full px-3 py-3 bg-transparent resize-none focus:outline-none text-sm ${
          isNoteMode
            ? 'text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500'
            : 'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500'
        }`}
      />

      {/* Actions bar */}
      <div className={`flex items-center justify-between px-3 py-2 border-t ${
        isNoteMode
          ? 'border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/30'
          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
      }`}>
        <div className="flex items-center gap-2">
          {!isNoteMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperclipIcon />
                <span>Attach</span>
              </button>
            </>
          )}
          {isNoteMode && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Notes are only visible to your team
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs ${
            isNoteMode
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}>
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:cursor-not-allowed ${
              isNoteMode
                ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 dark:disabled:bg-amber-800 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white'
            }`}
          >
            {isNoteMode ? <NoteIcon /> : <SendIcon />}
            <span>{isNoteMode ? 'Add Note' : 'Send'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
