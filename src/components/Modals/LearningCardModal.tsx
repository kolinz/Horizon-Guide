import React, { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ModalBase } from './ModalBase'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useTimelineStore } from '../../stores/timelineStore'
import type { LearningCard, LearningType, LearningLocation, LearningModality } from '../../types'

// ──────────────────────────────────────────────
// 選択肢定義
// ──────────────────────────────────────────────

const TYPE_OPTIONS: { value: LearningType; label: string }[] = [
  { value: 'class',       label: '授業・講義' },
  { value: 'self_study',  label: '自習' },
  { value: 'training',    label: '研修・BootCamp' },
  { value: 'certificate', label: '資格学習' },
  { value: 'other',       label: 'その他' },
]

const LOCATION_OPTIONS: { value: LearningLocation | ''; label: string }[] = [
  { value: '',            label: '未設定' },
  { value: 'home',        label: '自宅' },
  { value: 'university',  label: '大学・学校' },
  { value: 'workplace',   label: '職場' },
  { value: 'cafe',        label: 'カフェ・コワーキング' },
  { value: 'library',     label: '図書館' },
  { value: 'online',      label: 'オンライン' },
  { value: 'other',       label: 'その他' },
]

const MODALITY_OPTIONS: { value: LearningModality | ''; label: string }[] = [
  { value: '',           label: '未設定' },
  { value: 'in_person',  label: '教室対面' },
  { value: 'hybrid',     label: 'ハイブリッド型' },
  { value: 'hyflex',     label: 'ハイフレックス型' },
  { value: 'online',     label: 'フルオンライン' },
]

// ──────────────────────────────────────────────
// フォーム状態の初期値
// ──────────────────────────────────────────────

interface FormState {
  title: string
  startDate: string
  endDate: string
  noEndDate: boolean        // 終了未定チェックボックス
  type: LearningType
  location: LearningLocation | ''
  modality: LearningModality | ''
  memo: string
}

function buildInitialForm(card?: LearningCard): FormState {
  if (card) {
    return {
      title: card.title,
      startDate: card.startDate,
      endDate: card.endDate ?? '',
      noEndDate: card.endDate === null,
      type: card.type,
      location: card.location ?? '',
      modality: card.modality ?? '',
      memo: card.memo,
    }
  }
  // 新規デフォルト：今月を開始日に
  const today = new Date()
  const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return {
    title: '',
    startDate: ym,
    endDate: '',
    noEndDate: false,
    type: 'self_study',
    location: '',
    modality: '',
    memo: '',
  }
}

// ──────────────────────────────────────────────
// バリデーション
// ──────────────────────────────────────────────

interface ValidationErrors {
  title?: string
  startDate?: string
  endDate?: string
}

function validate(form: FormState): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!form.title.trim()) errors.title = 'タイトルは必須です'
  if (!form.startDate)    errors.startDate = '開始年月は必須です'
  if (!form.noEndDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = '終了年月は開始年月以降にしてください'
  }
  return errors
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface LearningCardModalProps {
  isOpen: boolean
  onClose: () => void
  card?: LearningCard
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function LearningCardModal({ isOpen, onClose, card }: LearningCardModalProps) {
  const addCard    = useTimelineStore((s) => s.addCard)
  const updateCard = useTimelineStore((s) => s.updateCard)
  const deleteCard = useTimelineStore((s) => s.deleteCard)

  const isEdit = !!card

  const [form, setForm]           = useState<FormState>(() => buildInitialForm(card))
  const [errors, setErrors]       = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialForm(card))
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, card])

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      // 入力のたびにそのフィールドのエラーをクリア
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
        title:    form.title.trim(),
        startDate: form.startDate,
        endDate:  form.noEndDate ? null : (form.endDate || null),
        type:     form.type,
        location: form.location || null,
        modality: form.modality || null,
        memo:     form.memo,
        // phase はストア / DB 側で自動計算
        phase:     'ongoing' as const,
        isCompleted: false,
        motivationLevel: null,
      }

      if (isEdit && card) {
        await updateCard({ ...card, ...payload })
      } else {
        await addCard(payload)
      }
      onClose()
    } catch (err) {
      console.error('LearningCardModal submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ──────────────────────────────────────────────
  // 削除
  // ──────────────────────────────────────────────

  const handleDelete = async () => {
    if (!card) return
    setIsSubmitting(true)
    try {
      await deleteCard(card.id)
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
        title={isEdit ? '学習カードを編集' : '学習カードを追加'}
        widthClass="max-w-lg"
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
                placeholder="例：Python基礎、統計学入門"
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

            {/* 開始年月 / 終了年月 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 開始年月 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  開始年月 <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                    ${errors.startDate
                      ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                      : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                    }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>

              {/* 終了年月 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  終了年月
                </label>
                <input
                  type="month"
                  value={form.noEndDate ? '' : form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  disabled={form.noEndDate}
                  className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
                    ${form.noEndDate ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
                    ${errors.endDate
                      ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                      : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                    }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
                )}
                {/* 終了未定チェック */}
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.noEndDate}
                    onChange={(e) => {
                      set('noEndDate', e.target.checked)
                      if (e.target.checked) set('endDate', '')
                    }}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                  />
                  <span className="text-xs text-gray-500">終了未定</span>
                </label>
              </div>
            </div>

            {/* 種別 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">種別</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as LearningType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 取り組み場所 / 受講形態（2カラム） */}
            <div className="grid grid-cols-2 gap-3">
              {/* 取り組み場所 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  取り組み場所
                  <span className="ml-1 text-gray-400 font-normal">任意</span>
                </label>
                <select
                  value={form.location}
                  onChange={(e) => set('location', e.target.value as LearningLocation | '')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* 受講形態 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  受講形態
                  <span className="ml-1 text-gray-400 font-normal">任意</span>
                </label>
                <select
                  value={form.modality}
                  onChange={(e) => set('modality', e.target.value as LearningModality | '')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors bg-white"
                >
                  {MODALITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                メモ
                <span className="ml-1 text-gray-400 font-normal">任意</span>
              </label>
              <textarea
                value={form.memo}
                onChange={(e) => set('memo', e.target.value)}
                rows={3}
                placeholder="学習の内容・目的など自由に記録できます"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors resize-none"
              />
            </div>

          </div>

          {/* フッターボタン */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            {/* 削除ボタン（編集時のみ） */}
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
        title="学習カードを削除"
        message={`「${card?.title}」を削除します。紐づくアウトプットカードもすべて削除されます。この操作は元に戻せません。`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
