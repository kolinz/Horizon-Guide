import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { ModalBase } from './ModalBase'
import { useGoalStore } from '../../stores/goalStore'
import { useAIStore } from '../../stores/aiStore'

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

export type GoalModalMode = 'career' | 'wellbeing'

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  mode: GoalModalMode
}

// ──────────────────────────────────────────────
// キャリアゴール編集フォーム
// ──────────────────────────────────────────────

function CareerGoalForm({ onClose }: { onClose: () => void }) {
  const { careerGoal, saveCareerGoal } = useGoalStore()

  const [text, setText]           = useState(careerGoal?.text ?? '')
  const [targetDate, setTargetDate] = useState(careerGoal?.targetDate ?? '')
  const [userName, setUserName]   = useState(careerGoal?.userName ?? '')
  const [error, setError]         = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setText(careerGoal?.text ?? '')
    setTargetDate(careerGoal?.targetDate ?? '')
    setUserName(careerGoal?.userName ?? '')
    setError('')
  }, [careerGoal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) { setError('キャリアゴールを入力してください'); return }
    setIsSubmitting(true)
    try {
      await saveCareerGoal({
        text: text.trim(),
        targetDate: targetDate || null,
        userName: userName.trim() || null,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* ゴールテキスト */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            キャリアゴール <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError('') }}
            rows={3}
            placeholder="例：データサイエンティストに転職する"
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors resize-none
              ${error
                ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
              }`}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* 目標時期 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            目標時期
            <span className="ml-1 text-gray-400 font-normal">任意</span>
          </label>
          <input
            type="month"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
          />
        </div>

        {/* 氏名（PDF用） */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            氏名
            <span className="ml-1 text-gray-400 font-normal">PDFポートフォリオ出力時に使用・任意</span>
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="例：山田 太郎"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* フッター */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
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
          className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isSubmitting ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────
// WBゴール編集フォーム
// ──────────────────────────────────────────────

function WellbeingGoalForm({ onClose }: { onClose: () => void }) {
  const { wellbeingGoal, careerGoal, saveWellbeingGoal } = useGoalStore()
  const config = useAIStore((s) => s.config)

  const [personal, setPersonal] = useState(wellbeingGoal?.axes.personal ?? '')
  const [social,   setSocial]   = useState(wellbeingGoal?.axes.social   ?? '')
  const [planet,   setPlanet]   = useState(wellbeingGoal?.axes.planet   ?? '')
  const [goalText, setGoalText] = useState(wellbeingGoal?.text ?? '')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    setPersonal(wellbeingGoal?.axes.personal ?? '')
    setSocial(wellbeingGoal?.axes.social   ?? '')
    setPlanet(wellbeingGoal?.axes.planet   ?? '')
    setGoalText(wellbeingGoal?.text ?? '')
    setAiGenerated(false)
    setError('')
  }, [wellbeingGoal])

  // AI に WBゴール全体テキストを生成させる
  const handleGenerate = async () => {
    if (!careerGoal) {
      setError('先にキャリアゴールを設定してください')
      return
    }
    setIsGenerating(true)
    try {
      const prompt = `以下の3軸の価値観と、キャリアゴール「${careerGoal.text}」をもとに、
ウェルビーイングゴール（なぜそのキャリアを目指すのかという根本的な動機）を
日本語で一文（30〜50字程度）で生成してください。
文章のみ出力し、説明や前置きは不要です。

個人軸（自己成長・ウェルネス）: ${personal || '未記入'}
社会軸（コミュニティ・貢献）: ${social || '未記入'}
地球軸（持続可能性・次世代）: ${planet || '未記入'}`

      const context = `キャリアゴール: ${careerGoal.text}`
      const result = await window.electronAPI.chatAI(prompt, context)
      // 余分な記号・改行を除去
      setGoalText(result.replace(/^["「『]|["」』]$/g, '').trim())
      setAiGenerated(true)
    } catch (err) {
      setError('AI生成に失敗しました。AI接続設定を確認してください。')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalText.trim()) { setError('WBゴールのテキストを入力または生成してください'); return }
    setIsSubmitting(true)
    try {
      await saveWellbeingGoal({
        text: goalText.trim(),
        axes: {
          personal: personal.trim() || null,
          social:   social.trim()   || null,
          planet:   planet.trim()   || null,
        },
        aiGenerated,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* OECD説明バッジ */}
        <div className="flex items-start gap-2 p-3 bg-wb-bg rounded-lg border border-wb-green/20">
          <span className="text-base flex-shrink-0">🌱</span>
          <p className="text-xs text-wb-green leading-relaxed">
            OECD Education 2030「Learning Compass」に基づく概念です。
            「なぜそのキャリアを目指すのか」という根本的な動機・価値観を
            個人・社会・地球の3軸で表現します。
          </p>
        </div>

        {/* 3軸入力 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 個人軸 */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              🧘 個人軸
            </label>
            <textarea
              value={personal}
              onChange={(e) => setPersonal(e.target.value)}
              rows={3}
              placeholder="自己成長・自己実現・ウェルネスに関する価値観"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40 transition-colors resize-none"
            />
          </div>
          {/* 社会軸 */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              🤝 社会軸
            </label>
            <textarea
              value={social}
              onChange={(e) => setSocial(e.target.value)}
              rows={3}
              placeholder="コミュニティ・他者への貢献に関する価値観"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40 transition-colors resize-none"
            />
          </div>
          {/* 地球軸 */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              🌍 地球軸
            </label>
            <textarea
              value={planet}
              onChange={(e) => setPlanet(e.target.value)}
              rows={3}
              placeholder="持続可能性・環境・次世代への責任に関する価値観"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40 transition-colors resize-none"
            />
          </div>
        </div>

        {/* AI生成ボタン */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-wb-green bg-wb-bg border border-wb-green/30 hover:bg-wb-green/10 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isGenerating
            ? <><Loader2 size={14} className="animate-spin" /> AI生成中...</>
            : <><Sparkles size={14} /> AIにWBゴールを生成してもらう</>
          }
        </button>

        {/* 生成結果 / 手動入力エリア */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            WBゴール（全体テキスト）
            <span className="text-red-500 ml-0.5">*</span>
            {aiGenerated && (
              <span className="ml-2 text-[10px] text-wb-green bg-wb-bg px-1.5 py-0.5 rounded">
                ✨ AI生成
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-base pointer-events-none">🌱</span>
            <input
              type="text"
              value={goalText}
              onChange={(e) => { setGoalText(e.target.value); setAiGenerated(false); setError('') }}
              placeholder="例：地域のデジタル格差をなくして次世代の可能性を広げたい"
              className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none transition-colors
                ${error
                  ? 'border-red-400 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-300 focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40'
                }`}
            />
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {/* フッター */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
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
          className="px-4 py-2 text-sm text-white bg-wb-green hover:opacity-90 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isSubmitting ? '保存中...' : 'このゴールを採用する'}
        </button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────
// GoalModal（メイン export）
// ──────────────────────────────────────────────

export function GoalModal({ isOpen, onClose, mode }: GoalModalProps) {
  const title = mode === 'career'
    ? 'キャリアゴールを編集'
    : 'ウェルビーイングゴールを編集'

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      widthClass={mode === 'wellbeing' ? 'max-w-2xl' : 'max-w-md'}
    >
      {mode === 'career'
        ? <CareerGoalForm onClose={onClose} />
        : <WellbeingGoalForm onClose={onClose} />
      }
    </ModalBase>
  )
}
