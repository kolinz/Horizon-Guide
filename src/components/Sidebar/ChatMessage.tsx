import React from 'react'
import type { ChatMessage as ChatMessageType } from '../../stores/aiStore'

// ──────────────────────────────────────────────
// タイムスタンプフォーマット
// ──────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  } catch {
    return ''
  }
}

// ──────────────────────────────────────────────
// ローディングドット（ストリーミング中）
// ──────────────────────────────────────────────

function LoadingDots() {
  return (
    <span className="inline-flex items-end gap-[3px] h-4" aria-label="返答を生成中">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  )
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean  // このメッセージが現在ストリーミング中か
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
      role="listitem"
    >
      {/* AI アイコン（assistantのみ） */}
      {!isUser && (
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mr-1.5 mt-0.5">
          <span className="text-[8px] text-white font-bold leading-none">AI</span>
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* バブル */}
        <div
          className={`
            relative px-3 py-2 rounded-2xl text-xs leading-relaxed break-words
            ${isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }
            ${isEmpty && isStreaming ? 'min-w-[48px] min-h-[32px] flex items-center' : ''}
          `}
        >
          {/* 本文 or ローディング */}
          {isEmpty && isStreaming ? (
            <LoadingDots />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}

          {/* ストリーミング中のカーソル点滅（本文あり） */}
          {isStreaming && !isEmpty && (
            <span className="inline-block w-0.5 h-3 bg-gray-500 ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* タイムスタンプ */}
        <span className="text-[10px] text-gray-400 mt-0.5 px-1 select-none">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
