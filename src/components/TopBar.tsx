import React, { useState, useCallback } from 'react'
import { Settings, Loader2, Sparkles, ChevronRight, Plus } from 'lucide-react'
import { GoalModal, type GoalModalMode } from './Modals/GoalModal'
import { useGoalStore } from '../stores/goalStore'
import { useTimelineStore } from '../stores/timelineStore'
import { useAIStore } from '../stores/aiStore'
import { buildContext } from '../utils/contextBuilder'

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface TopBarProps {
  onOpenSettings: () => void
  onAddCard: () => void
  onOpenSidebar: () => void
}

// ──────────────────────────────────────────────
// 目標時期フォーマット（"2027-03" → "2027年3月"）
// ──────────────────────────────────────────────

function formatTargetDate(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${y}年${m}月`
}

// ──────────────────────────────────────────────
// WBゴールピル
// ──────────────────────────────────────────────

interface WBGoalPillProps {
  text: string | null
  onClick: () => void
}

function WBGoalPill({ text, onClick }: WBGoalPillProps) {
  const isSet = !!text

  return (
    <button
      onClick={onClick}
      title={isSet ? text! : 'WBゴールを設定する'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        transition-all duration-150 min-w-0 flex-1 max-w-xs
        border border-transparent
        ${isSet
          ? 'bg-wb-bg text-wb-green hover:border-wb-green/30 hover:shadow-sm'
          : 'bg-wb-bg/60 text-wb-green/50 hover:bg-wb-bg hover:text-wb-green/80 border-dashed border-wb-green/20'
        }
      `}
      aria-label={isSet ? `WBゴール: ${text}` : 'WBゴールを設定'}
    >
      <span className="text-base leading-none flex-shrink-0">🌱</span>
      <span className="truncate text-xs font-medium leading-none">
        {isSet ? text : '+ WBゴールを設定'}
      </span>
    </button>
  )
}

// ──────────────────────────────────────────────
// キャリアゴールピル
// ──────────────────────────────────────────────

interface CareerGoalPillProps {
  text: string | null
  targetDate: string | null
  onClick: () => void
}

function CareerGoalPill({ text, targetDate, onClick }: CareerGoalPillProps) {
  const isSet = !!text

  const displayText = isSet
    ? targetDate
      ? `${text}（${formatTargetDate(targetDate)}）`
      : text
    : null

  return (
    <button
      onClick={onClick}
      title={displayText ?? 'キャリアゴールを設定する'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        transition-all duration-150 min-w-0 flex-1
        border border-transparent
        ${isSet
          ? 'bg-career-bg text-career-brown hover:border-career-brown/30 hover:shadow-sm'
          : 'bg-career-bg/60 text-career-brown/50 hover:bg-career-bg hover:text-career-brown/80 border-dashed border-career-brown/20'
        }
      `}
      aria-label={isSet ? `キャリアゴール: ${text}` : 'キャリアゴールを設定'}
    >
      <span className="truncate text-xs font-medium leading-none">
        {isSet ? displayText : '+ キャリアゴールを設定'}
      </span>
    </button>
  )
}

// ──────────────────────────────────────────────
// TopBar 本体
// ──────────────────────────────────────────────

export function TopBar({ onOpenSettings, onAddCard, onOpenSidebar }: TopBarProps) {
  const { careerGoal, wellbeingGoal } = useGoalStore()
  const learningCards = useTimelineStore((s) => s.learningCards)
  const { sendAnalyze, isStreaming } = useAIStore()

  const [goalModal, setGoalModal] = useState<{ open: boolean; mode: GoalModalMode }>({
    open: false,
    mode: 'career',
  })

  const openGoalModal = useCallback((mode: GoalModalMode) => {
    setGoalModal({ open: true, mode })
  }, [])

  const closeGoalModal = useCallback(() => {
    setGoalModal((prev) => ({ ...prev, open: false }))
  }, [])

  // 「AI 助言」ボタン：サイドバーを開いてから Analyze mode を実行
  const handleAnalyze = useCallback(async () => {
    if (isStreaming) return
    onOpenSidebar()
    const context = buildContext(careerGoal, wellbeingGoal, learningCards)
    await sendAnalyze(context)
  }, [isStreaming, onOpenSidebar, careerGoal, wellbeingGoal, learningCards, sendAnalyze])

  return (
    <>
      {/* ────────────────────────────────────────
          トップバー本体
      ──────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">

        {/* 1行目：アプリ名 + 操作ボタン */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
          {/* アプリ名 */}
          <div className="flex items-center gap-2">
            <span className="text-base">🧭</span>
            <h1 className="text-sm font-bold text-gray-800 tracking-tight select-none">
              Horizon Guide
            </h1>
          </div>

          {/* 右側ボタン群 */}
          <div className="flex items-center gap-2">
            {/* AI 助言ボタン */}
            <button
              onClick={handleAnalyze}
              disabled={isStreaming}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-150
                ${isStreaming
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow'
                }
              `}
              aria-label="AI助言（Analyze mode）"
              title="タイムライン全体をAIが分析して助言します"
            >
              {isStreaming
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />
              }
              <span>AI 助言</span>
            </button>

            {/* 学習を追加ボタン */}
            <button
              onClick={onAddCard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm hover:shadow transition-all duration-150"
              aria-label="学習カードを追加"
              title="学習カードを追加"
            >
              <Plus size={13} />
              <span>学習を追加</span>
            </button>

            {/* 設定ボタン */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="設定を開く"
              title="設定"
            >
              <Settings size={14} />
              <span>設定</span>
            </button>
          </div>
        </div>

        {/* 2行目：ゴールピル */}
        <div className="flex items-center gap-2 px-4 pb-2.5">
          {/* WBゴールピル */}
          <WBGoalPill
            text={wellbeingGoal?.text ?? null}
            onClick={() => openGoalModal('wellbeing')}
          />

          {/* 矢印（→）*/}
          <ChevronRight
            size={14}
            className="flex-shrink-0 text-gray-300"
            aria-hidden="true"
          />

          {/* キャリアゴールピル */}
          <CareerGoalPill
            text={careerGoal?.text ?? null}
            targetDate={careerGoal?.targetDate ?? null}
            onClick={() => openGoalModal('career')}
          />
        </div>

      </header>

      {/* ゴール編集モーダル */}
      <GoalModal
        isOpen={goalModal.open}
        onClose={closeGoalModal}
        mode={goalModal.mode}
      />
    </>
  )
}
