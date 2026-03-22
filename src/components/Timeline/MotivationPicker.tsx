import React, { useState, useRef, useEffect } from 'react'
import { useTimelineStore } from '../../stores/timelineStore'
import type { MotivationLevel } from '../../types'

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────

export const MOTIVATION_ICONS: Record<number, string> = {
  1: '😣',
  2: '😞',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export const MOTIVATION_LABELS: Record<number, string> = {
  1: 'つらい',
  2: 'しんどい',
  3: 'ふつう',
  4: 'たのしい',
  5: '最高',
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface MotivationPickerProps {
  cardId: string
  cardTitle: string
  currentLevel: MotivationLevel | null
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function MotivationPicker({ cardId, cardTitle, currentLevel }: MotivationPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const updateMotivation = useTimelineStore((s) => s.updateMotivation)

  // ポップオーバー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = async (level: MotivationLevel) => {
    setOpen(false)
    await updateMotivation(cardId, level)
  }

  // 数値の色（レベル1=赤、レベル2=オレンジ、それ以外=通常）
  const levelColor =
    currentLevel === 1
      ? 'text-red-600 font-bold'
      : currentLevel === 2
      ? 'text-orange-500 font-bold'
      : 'text-gray-600'

  return (
    <div ref={ref} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 rounded px-1 py-0.5 text-sm hover:bg-gray-100 transition-colors"
        title="モチベーションを設定"
        aria-label="モチベーション設定"
      >
        <span className="text-base leading-none">
          {currentLevel ? MOTIVATION_ICONS[currentLevel] : '😶'}
        </span>
        <span className={`text-xs leading-none tabular-nums ${currentLevel ? levelColor : 'text-gray-300'}`}>
          {currentLevel ?? '–'}
        </span>
      </button>

      {/* ポップオーバー */}
      {open && (
        <div className="absolute bottom-full right-0 mb-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <p className="text-[10px] text-gray-400 mb-1.5 text-center whitespace-nowrap">モチベーション</p>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as MotivationLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleSelect(level)}
                className={`
                  flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-md text-xs
                  transition-colors hover:bg-gray-100
                  ${currentLevel === level ? 'bg-gray-100 ring-1 ring-gray-300' : ''}
                `}
                title={MOTIVATION_LABELS[level]}
              >
                <span className="text-lg leading-none">{MOTIVATION_ICONS[level]}</span>
                <span
                  className={`leading-none tabular-nums ${
                    level === 1
                      ? 'text-red-600 font-bold'
                      : level === 2
                      ? 'text-orange-500 font-bold'
                      : 'text-gray-500'
                  }`}
                >
                  {level}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
