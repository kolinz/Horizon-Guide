import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, ShieldAlert, Loader2, ChevronRight } from 'lucide-react'

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────

/** 確定に必要な入力文字列 */
const CONFIRM_WORD = '初期化'

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface ResetConfirmModalProps {
  isOpen: boolean
  onCancel: () => void
}

// ──────────────────────────────────────────────
// ステップ型
// ──────────────────────────────────────────────

type Step = 1 | 2

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function ResetConfirmModal({ isOpen, onCancel }: ResetConfirmModalProps) {
  const [step, setStep]           = useState<Step>(1)
  const [inputValue, setInputValue] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError]         = useState('')

  const inputRef    = useRef<HTMLInputElement>(null)
  const overlayRef  = useRef<HTMLDivElement>(null)

  // 開くたびに状態をリセット
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setInputValue('')
      setError('')
      setIsResetting(false)
    }
  }, [isOpen])

  // ステップ2に進んだらインプットにフォーカス
  useEffect(() => {
    if (step === 2 && isOpen) {
      // DOM 更新後にフォーカス
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [step, isOpen])

  // Escape で閉じる
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResetting) onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, isResetting, onCancel])

  if (!isOpen) return null

  // ── ステップ1 → 2 ──────────────────────────

  const handleProceed = () => {
    setStep(2)
    setInputValue('')
    setError('')
  }

  // ── 最終確定（DBリセット） ──────────────────

  const handleConfirm = async () => {
    if (inputValue !== CONFIRM_WORD) {
      setError(`「${CONFIRM_WORD}」と正確に入力してください`)
      inputRef.current?.focus()
      return
    }

    setIsResetting(true)
    setError('')

    try {
      await window.electronAPI.resetDatabase()
      // 初期化完了 → ページリロードでオンボーディングへ
      window.location.reload()
    } catch (err) {
      setError(
        `初期化に失敗しました: ${err instanceof Error ? err.message : String(err)}`
      )
      setIsResetting(false)
    }
  }

  // Enter キーで確定（入力条件を満たした場合のみ）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue === CONFIRM_WORD && !isResetting) {
      handleConfirm()
    }
  }

  const canConfirm = inputValue === CONFIRM_WORD && !isResetting

  // ──────────────────────────────────────────────
  // レンダリング
  // ──────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      {/* オーバーレイ */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={() => { if (!isResetting) onCancel() }}
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── ステップインジケーター ── */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0">
          {/* ステップ1 */}
          <div className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${step >= 1 ? 'text-red-600' : 'text-gray-300'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${step >= 1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              1
            </span>
            確認
          </div>
          <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
          {/* ステップ2 */}
          <div className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${step >= 2 ? 'text-red-600' : 'text-gray-300'}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${step >= 2 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </span>
            テキスト入力
          </div>
        </div>

        {/* ── ステップ1：警告メッセージ ── */}
        {step === 1 && (
          <div className="px-5 py-5">
            {/* アイコン + タイトル */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2
                  id="reset-modal-title"
                  className="text-sm font-bold text-gray-900 mb-1"
                >
                  データを初期化しますか？
                </h2>
                <p className="text-xs text-red-600 font-medium">
                  この操作は元に戻せません
                </p>
              </div>
            </div>

            {/* 削除対象の説明 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 space-y-1.5">
              <p className="text-xs font-medium text-red-800 mb-2">削除されるデータ：</p>
              {[
                'すべての学習カードとアウトプット',
                'キャリアゴール・WBゴール',
                'AI助言履歴',
                '行動ログ・モチベーションログ',
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-red-700">
                  <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* 保持されるデータの説明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ShieldAlert size={12} className="text-gray-400 flex-shrink-0" />
                <span>AI接続設定（APIキー等）は保持されます</span>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors font-medium"
              >
                続ける →
              </button>
            </div>
          </div>
        )}

        {/* ── ステップ2：テキスト入力確認 ── */}
        {step === 2 && (
          <div className="px-5 py-5">
            {/* タイトル */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert size={20} className="text-red-600" />
              </div>
              <div>
                <h2
                  id="reset-modal-title"
                  className="text-sm font-bold text-gray-900 mb-1"
                >
                  最終確認
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  操作を確定するには、下のテキストボックスに
                  <span className="font-bold text-red-600 mx-0.5">「{CONFIRM_WORD}」</span>
                  と入力してください
                </p>
              </div>
            </div>

            {/* テキスト入力 */}
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder={`「${CONFIRM_WORD}」と入力してください`}
                disabled={isResetting}
                className={`
                  w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-colors
                  ${isResetting ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : ''}
                  ${error
                    ? 'border-red-400 focus:ring-1 focus:ring-red-400 bg-red-50'
                    : inputValue === CONFIRM_WORD
                      ? 'border-green-400 focus:ring-1 focus:ring-green-400 bg-green-50'
                      : 'border-gray-300 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                  }
                `}
                aria-label="初期化確認テキスト入力"
                autoComplete="off"
                spellCheck={false}
              />

              {/* バリデーション状態の表示 */}
              <div className="mt-1.5 min-h-[16px]">
                {error && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    {error}
                  </p>
                )}
                {!error && inputValue === CONFIRM_WORD && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ 確認できました。確定ボタンを押してください
                  </p>
                )}
                {!error && inputValue && inputValue !== CONFIRM_WORD && (
                  <p className="text-xs text-gray-400">
                    「{CONFIRM_WORD}」と入力してください（{inputValue.length}文字）
                  </p>
                )}
              </div>
            </div>

            {/* ローディング中メッセージ */}
            {isResetting && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-4">
                <Loader2 size={13} className="animate-spin text-red-500" />
                データを初期化しています...
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep(1); setInputValue(''); setError('') }}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  px-4 py-2.5 text-sm font-medium rounded-xl transition-all
                  ${canConfirm
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
                aria-disabled={!canConfirm}
              >
                {isResetting
                  ? <><Loader2 size={13} className="animate-spin" />初期化中...</>
                  : <>初期化する</>
                }
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
