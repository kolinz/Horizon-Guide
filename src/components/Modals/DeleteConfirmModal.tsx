import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { ModalBase } from './ModalBase'

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function DeleteConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      widthClass="max-w-sm"
    >
      {/* アイコン + メッセージ */}
      <div className="flex gap-3 items-start mb-6">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>

      {/* ボタン行 */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          削除する
        </button>
      </div>
    </ModalBase>
  )
}
