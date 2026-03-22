import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from 'react'
import { Send, Trash2, Bot, Wifi, WifiOff } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { useAIStore } from '../../stores/aiStore'
import { useGoalStore } from '../../stores/goalStore'
import { useTimelineStore } from '../../stores/timelineStore'
import { buildContext } from '../../utils/contextBuilder'

// ──────────────────────────────────────────────
// 接続状態バッジ
// ──────────────────────────────────────────────

function ConnectionBadge({ provider }: { provider: string | null }) {
  if (!provider) {
    return (
      <span className="flex items-center gap-1 text-[10px] text-gray-400">
        <WifiOff size={10} />
        未接続
      </span>
    )
  }

  const label =
    provider === 'dify'     ? 'Dify 接続中' :
    provider === 'langflow' ? 'Langflow 接続中' :
                              'LLM 接続中'

  return (
    <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
      <Wifi size={9} />
      {label}
    </span>
  )
}

// ──────────────────────────────────────────────
// 空状態（メッセージゼロ時）
// ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        <Bot size={20} className="text-blue-400" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">AI 助言</p>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          質問を入力するか、上部の「AI 助言」ボタンでタイムライン全体の分析を依頼できます
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// AISidebar 本体
// ──────────────────────────────────────────────

export function AISidebar() {
  const { messages, isStreaming, config, sendChat, clearMessages } = useAIStore()
  const { careerGoal, wellbeingGoal } = useGoalStore()
  const learningCards = useTimelineStore((s) => s.learningCards)

  const [inputText, setInputText]     = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // ────────────────────────────────
  // 自動スクロール（新メッセージ追加時）
  // ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // ────────────────────────────────
  // テキストエリアの高さ自動調整
  // ────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px` // 最大4行分
  }, [inputText])

  // ────────────────────────────────
  // 送信処理
  // ────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return

    setInputText('')

    const context = buildContext(careerGoal, wellbeingGoal, learningCards)
    await sendChat(text, context)

    // 送信後テキストエリアにフォーカスを戻す
    textareaRef.current?.focus()
  }, [inputText, isStreaming, careerGoal, wellbeingGoal, learningCards, sendChat])

  // Cmd+Enter / Ctrl+Enter で送信
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ────────────────────────────────
  // 最後のメッセージがストリーミング中か
  // ────────────────────────────────
  const lastMsg = messages[messages.length - 1]
  const isLastStreaming = isStreaming && lastMsg?.role === 'assistant'

  // ────────────────────────────────
  // リサイズ
  // ────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(600, Math.max(200, startWidth.current + delta))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [sidebarWidth])

  // レンダリング
  // ────────────────────────────────
  return (
    <aside
      className="flex flex-col bg-white border-l border-gray-200 flex-shrink-0 relative"
      style={{ width: sidebarWidth }}
      aria-label="AI助言パネル"
    >
      {/* リサイズハンドル */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-10"
        title="ドラッグして幅を調整"
      />
      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🤖</span>
          <span className="text-xs font-semibold text-gray-700">AI 助言</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 接続状態バッジ */}
          <ConnectionBadge provider={config?.provider ?? null} />

          {/* 履歴クリアボタン（メッセージが1件以上あるとき） */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="会話履歴をクリア"
              aria-label="会話履歴をクリア"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* クリア確認バー（インライン表示） */}
      {showClearConfirm && (
        <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-b border-red-100 text-[11px] flex-shrink-0">
          <span className="text-red-600">履歴を削除しますか？</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
            <button
              onClick={() => { clearMessages(); setShowClearConfirm(false) }}
              className="text-red-600 font-medium hover:text-red-700"
            >
              削除
            </button>
          </div>
        </div>
      )}

      {/* ── メッセージ一覧 ── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        role="list"
        aria-label="会話履歴"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg, idx) => {
              // 最後のassistantメッセージかつストリーミング中はカーソル表示
              const streaming = isLastStreaming && idx === messages.length - 1
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={streaming}
                />
              )
            })}
          </>
        )}
        {/* スクロールアンカー */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 区切り線 ── */}
      <div className="border-t border-gray-100 flex-shrink-0" />

      {/* ── 入力エリア ── */}
      <div className="flex-shrink-0 px-3 py-2.5">
        <div className="flex items-end gap-1.5">
          {/* テキストエリア */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="質問を入力… (⌘+Enter で送信)"
            disabled={isStreaming}
            rows={1}
            className={`
              flex-1 px-2.5 py-2 text-xs border rounded-xl outline-none resize-none
              leading-relaxed overflow-hidden transition-colors
              ${isStreaming
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white'
              }
            `}
            style={{ minHeight: 36, maxHeight: 96 }}
            aria-label="メッセージを入力"
          />

          {/* 送信ボタン */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming}
            className={`
              flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
              transition-all duration-150
              ${!inputText.trim() || isStreaming
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm'
              }
            `}
            aria-label="送信"
            title="送信（⌘+Enter）"
          >
            <Send size={13} />
          </button>
        </div>

        {/* ショートカットヒント */}
        <p className="text-[10px] text-gray-300 mt-1 text-right select-none">
          ⌘+Enter で送信
        </p>
      </div>
    </aside>
  )
}
