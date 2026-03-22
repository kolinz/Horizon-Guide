import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { LearningCard } from './LearningCard'
import { useTimelineStore } from '../../stores/timelineStore'
import type { LearningCard as LearningCardType, OutputCard } from '../../types'

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────

const COL_WIDTH = 160      // px：1列（= 1ヶ月スロット）の幅
const RULER_HEIGHT = 48    // px：月ルーラーの高さ
const PAST_MONTHS = 12     // 現在より前に表示する月数
const FUTURE_MONTHS = 12   // 現在より後に表示する月数

// ──────────────────────────────────────────────
// ユーティリティ
// ──────────────────────────────────────────────

/** "YYYY-MM" → Date（その月の1日 0:00） */
function ymToDate(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

/** Date → "YYYY-MM" */
function dateToYM(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** "YYYY-MM" に months を加算した "YYYY-MM" を返す */
function addMonths(ym: string, months: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + months, 1)
  return dateToYM(d)
}

/** a が b より前かどうか（YYYY-MM 比較） */
function ymBefore(a: string, b: string): boolean {
  return a < b
}

/** a が b より後かどうか（YYYY-MM 比較） */
function ymAfter(a: string, b: string): boolean {
  return a > b
}

/**
 * 2枚のカードの期間が重なるか判定。
 * 終了日 null は「現在以降ずっと続く」として扱う。
 */
function periodsOverlap(a: LearningCardType, b: LearningCardType): boolean {
  const aEnd = a.endDate ?? '9999-12'
  const bEnd = b.endDate ?? '9999-12'
  // a.start <= b.end && b.start <= a.end
  return a.startDate <= bEnd && b.startDate <= aEnd
}

/**
 * 学習カードを「同時期グループ」にまとめる。
 * 同じグループのカードは同一列（縦スタック）に表示する。
 *
 * アルゴリズム:
 *   startDate 昇順 → createdAt 昇順でソート後、
 *   既存グループのいずれかと期間が重なるカードを同グループに追加。
 *   重ならない場合は新グループを作成。
 */
function groupByOverlap(cards: LearningCardType[]): LearningCardType[][] {
  const sorted = [...cards].sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1
    return a.createdAt < b.createdAt ? -1 : 1
  })

  const groups: LearningCardType[][] = []

  for (const card of sorted) {
    // 既存グループの中で期間が重なるものを探す
    const targetGroup = groups.find((g) => g.some((gc) => periodsOverlap(gc, card)))
    if (targetGroup) {
      targetGroup.push(card)
    } else {
      groups.push([card])
    }
  }

  return groups
}

// ──────────────────────────────────────────────
// 月ルーラー生成
// ──────────────────────────────────────────────

interface MonthSlot {
  ym: string          // "YYYY-MM"
  label: string       // "2024年4月" など
  isCurrentMonth: boolean
  offsetIndex: number // 0始まりの列インデックス
}

function buildMonthSlots(todayYM: string): MonthSlot[] {
  const slots: MonthSlot[] = []
  const total = PAST_MONTHS + 1 + FUTURE_MONTHS // 計25ヶ月

  for (let i = 0; i < total; i++) {
    const offset = i - PAST_MONTHS
    const ym = addMonths(todayYM, offset)
    const [y, m] = ym.split('-').map(Number)
    const label = offset === 0 ? `${y}年${m}月` : `${m}月` // 年跨ぎは年も表示
    const showYear = m === 1 || ym === todayYM // 1月 or 現在月は年を付ける

    slots.push({
      ym,
      label: showYear ? `${y}年${m}月` : `${m}月`,
      isCurrentMonth: offset === 0,
      offsetIndex: i,
    })
  }
  return slots
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface TimelineViewProps {
  onAddCard: () => void
  onEditCard: (card: LearningCardType) => void
  onAddOutput: (learningCardId: string) => void
  onEditOutput: (output: OutputCard) => void
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function TimelineView({
  onAddCard,
  onEditCard,
  onAddOutput,
  onEditOutput,
}: TimelineViewProps) {
  const learningCards = useTimelineStore((s) => s.learningCards)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 初期表示時に現在月を中央に表示
  useEffect(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    // 現在月の左端位置
    const currentX = currentMonthIndex * COL_WIDTH
    // コンテナ幅の半分を引いて中央寄せ
    const scrollTo = currentX - container.clientWidth / 2 + COL_WIDTH / 2
    container.scrollLeft = Math.max(0, scrollTo)
  }, [])

  // 今月の YYYY-MM
  const todayYM = useMemo(() => dateToYM(new Date()), [])

  // 月スロット一覧
  const monthSlots = useMemo(() => buildMonthSlots(todayYM), [todayYM])

  // 現在月スロットの列インデックス
  const currentMonthIndex = PAST_MONTHS // 0-indexed

  // カードを「重なりグループ」にまとめる
  const cardGroups = useMemo(() => groupByOverlap(learningCards), [learningCards])

  /**
   * グループを月スロットに配置する。
   * グループの「代表開始月」= グループ内最も早い startDate の月スロット。
   * ルーラーに存在しない月は最も近いスロットに寄せる。
   */
  const groupsWithSlot = useMemo(() => {
    return cardGroups.map((group) => {
      // グループ内の最早 startDate
      const earliestStart = group.reduce(
        (min, c) => (c.startDate < min ? c.startDate : min),
        group[0].startDate
      )

      // 対応する月スロットのインデックスを探す
      let slotIndex = monthSlots.findIndex((s) => s.ym === earliestStart)

      if (slotIndex === -1) {
        // ルーラー範囲外：最も近いスロットにクランプ
        if (ymBefore(earliestStart, monthSlots[0].ym)) {
          slotIndex = 0
        } else {
          slotIndex = monthSlots.length - 1
        }
      }

      return { group, slotIndex }
    })
  }, [cardGroups, monthSlots])

  // タイムライン全幅 = 月スロット数 * COL_WIDTH + カード配置分 + 余白
  const totalWidth = monthSlots.length * COL_WIDTH + 200

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* 横スクロールコンテナ */}
      <div
        ref={scrollRef}
        className="timeline-scroll flex-1 overflow-x-auto overflow-y-auto relative"
      >
        <div style={{ minWidth: totalWidth }} className="relative">

          {/* ── 月ルーラー ── */}
          <div
            className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-sm"
            style={{ height: RULER_HEIGHT }}
          >
            {monthSlots.map((slot) => (
              <div
                key={slot.ym}
                className={`
                  flex-shrink-0 flex items-end justify-start px-3 pb-2
                  border-r border-gray-100 relative
                  ${slot.isCurrentMonth ? 'bg-blue-50' : ''}
                `}
                style={{ width: COL_WIDTH }}
              >
                <span
                  className={`text-xs font-medium leading-none ${
                    slot.isCurrentMonth ? 'text-blue-600 font-bold' : 'text-gray-400'
                  }`}
                >
                  {slot.label}
                </span>

                {/* 「現在」ラベル */}
                {slot.isCurrentMonth && (
                  <span className="absolute top-2 left-3 text-[10px] text-blue-500 font-semibold">
                    現在
                  </span>
                )}
              </div>
            ))}

            {/* 追加ボタン分のヘッダー余白 */}
            <div className="flex-shrink-0" style={{ width: 200 }} />
          </div>

          {/* ── 現在月の縦区切り線 ── */}
          <div
            className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{
              left: currentMonthIndex * COL_WIDTH,
              width: 0,
            }}
          >
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-300 opacity-60"
              style={{ left: 0 }}
            />
          </div>

          {/* ── カードエリア ── */}
          <div className="flex items-start pt-4 pb-8 relative">
            {/* 月グリッド背景（クリック不可のガイドライン） */}
            <div className="absolute inset-0 flex pointer-events-none">
              {monthSlots.map((slot) => (
                <div
                  key={slot.ym}
                  className={`flex-shrink-0 border-r border-gray-50 ${
                    slot.isCurrentMonth ? 'bg-blue-50/20' : ''
                  }`}
                  style={{ width: COL_WIDTH }}
                />
              ))}
            </div>

            {/* カードグループの絶対配置 */}
            <div className="relative" style={{ width: monthSlots.length * COL_WIDTH }}>
              {groupsWithSlot.map(({ group, slotIndex }, gIdx) => (
                <div
                  key={gIdx}
                  className="absolute top-0 flex flex-col gap-3"
                  style={{
                    left: slotIndex * COL_WIDTH + 8,
                    width: COL_WIDTH - 16,
                  }}
                >
                  {group.map((card) => (
                    <LearningCard
                      key={card.id}
                      card={card}
                      onEdit={() => onEditCard(card)}
                      onAddOutput={() => onAddOutput(card.id)}
                      onEditOutput={onEditOutput}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* ── ＋ 学習を追加ボタン ── */}
            <div
              className="flex-shrink-0 flex items-start pt-0 pl-4"
              style={{ width: 200 }}
            >
              <button
                onClick={onAddCard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors whitespace-nowrap"
                aria-label="学習を追加"
              >
                <Plus size={14} />
                <span>学習を追加</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
