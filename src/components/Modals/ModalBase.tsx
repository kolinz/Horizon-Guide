import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalBaseProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** モーダル幅クラス（デフォルト: max-w-md） */
  widthClass?: string
}

/**
 * 共通モーダルラッパー。
 * - オーバーレイクリックで閉じる
 * - Escape キーで閉じる
 * - フォーカストラップ（先頭要素にフォーカス）
 */
export function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  widthClass = 'max-w-md',
}: ModalBaseProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape で閉じる
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // 開いたとき最初のフォーカス可能要素にフォーカス
  useEffect(() => {
    if (!isOpen) return
    const el = dialogRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-close])'
    )
    el?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={dialogRef}
        className={`relative z-10 w-full ${widthClass} mx-4 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 id="modal-title" className="text-sm font-semibold text-gray-800">
            {title}
          </h2>
          <button
            data-close
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
