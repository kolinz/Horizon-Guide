import React, { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ModalBase } from './ModalBase'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useTimelineStore } from '../../stores/timelineStore'
import type { OutputCard, OutputType } from '../../types'

// ──────────────────────────────────────────────
// 選択肢定義
// ──────────────────────────────────────────────

const TYPE_OPTIONS: { value: OutputType; label: string }[] = [
  { value: 'article',       label: 'ブログ記事・Qiita' },
  { value: 'repository',    label: 'リポジトリ（GitHub等）' },
  { value: 'certificate',   label: '資格・検定' },
  { value: 'presentation',  label: '発表・LT' },
  { value: 'project',       label: '個人開発・制作物' },
  { value: 'other',         label: 'その他' },
]

// ──────────────────────────────────────────────
// フォーム状態
// ──────────────────────────────────────────────

interface FormState {
  title: string
  type: OutputType
  url: string
  status: 'done' | 'planned'
}

function buildInitialForm(output?: OutputCard): FormState {
  if (output) {
    return {
      title: output.title,
      type: output.type,
      url: output.url ?? '',
      status: output.status,
    }
  }
  return {
    title: '',
    type: 'article',
    url: '',
    status: 'planned',
  }
}

// ──────────────────────────────────────────────
// バリデーション
// ──────────────────────────────────────────────

interface ValidationErrors {
  title?: string
  url?: string
}

function validate(form: FormState): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!form.title.trim()) errors.title = 'タイトルは必須です'
  if (form.url && !/^https?:\/\/.+/.test(form.url)) {
    errors.url = 'URLは http:// または https:// から始めてください'
  }
  return errors
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface OutputCardModalProps {
  isOpen: boolean
  onClose: () => void
  learningCardId: string
  output?: OutputCard
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function OutputCardModal({
  isOpen,
  onClose,
  learningCardId,
  output,
}: OutputCardModalProps) {
  const addOutputCard    = useTimelineStore((s) => s.addOutputCard)
  const updateOutputCard = useTimelineStore((s) => s.updateOutputCard)
  const deleteOutputCard = useTimelineStore((s) => s.deleteOutputCard)

  const isEdit = !!output

  const [form, setForm]           = useState<FormState>(() => buildInitialForm(output))
  const [errors, setErrors]       = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialForm(output))
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, output])

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
    []
  )

  // ──────────────────────────────────────────────
  // 送信
  // ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        learningCardId,
        title: form.title.trim(),
        type: form.type,
        url: form.url.trim() || null,
        status: form.status,
      }

      if (isEdit && output) {
        await updateOutputCard({ ...output, ...payload })
      } else {
        await addOutputCard(payload)
      }
      onClose()
    } catch (err) {
      console.error('OutputCardModal submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ──────────────────────────────────────────────
  // 削除
  // ──────────────────────────────────────────────

  const handleDelete = async () => {
    if (!output) return
    setIsSubmitting(true)
    try {
      await deleteOutputCard(output.id)
      setShowDeleteConfirm(false)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // ──────────────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────────────

  return (
    <>
      <ModalBase
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'アウトプットを編集' : 'アウトプットを追加'}
        widthClass="max-w-md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">

            {/* タイトル */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="例：Qiita記事「pandas入門」、AWS SAA合格"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                  ${errors.title
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                  }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 種別 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">種別</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as OutputType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                URL
                <span className="ml-1 text-gray-400 font-normal">任意</span>
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => set('url', e.target.value)}
                placeholder="https://example.com"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                  ${errors.url
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                  }`}
              />
              {errors.url && (
                <p className="mt-1 text-xs text-red-500">{errors.url}</p>
              )}
            </div>

            {/* ステータス（ラジオボタン） */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">ステータス</label>
              <div className="flex gap-4">
                {/* 予定 */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="status"
                      value="planned"
                      checked={form.status === 'planned'}
                      onChange={() => set('status', 'planned')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      form.status === 'planned'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300 group-hover:border-purple-300'
                    }`}>
                      {form.status === 'planned' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${form.status === 'planned' ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                    予定
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">予定</span>
                </label>

                {/* 完了 */}
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      type="radio"
                      name="status"
                      value="done"
                      checked={form.status === 'done'}
                      onChange={() => set('status', 'done')}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      form.status === 'done'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 group-hover:border-green-300'
                    }`}>
                      {form.status === 'done' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <span className={`text-sm ${form.status === 'done' ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                    完了
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">完了</span>
                </label>
              </div>
            </div>

          </div>

          {/* フッターボタン */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            {isEdit ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                削除
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSubmitting ? '保存中...' : isEdit ? '更新する' : '追加する'}
              </button>
            </div>
          </div>
        </form>
      </ModalBase>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="アウトプットを削除"
        message={`「${output?.title}」を削除します。この操作は元に戻せません。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
