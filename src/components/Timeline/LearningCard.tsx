import React, { useState } from 'react'
import { Pencil, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { OutputCard } from './OutputCard'
import { MotivationPicker } from './MotivationPicker'
import { useTimelineStore } from '../../stores/timelineStore'
import type { LearningCard as LearningCardType, OutputCard as OutputCardType } from '../../types'

// ──────────────────────────────────────────────
// ラベルマップ
// ──────────────────────────────────────────────

const TYPE_LABELS: Record<LearningCardType['type'], string> = {
  class: '授業',
  self_study: '自習',
  training: '研修',
  certificate: '資格学習',
  other: 'その他',
}

const LOCATION_LABELS: Record<string, string> = {
  home: '自宅',
  university: '大学・学校',
  workplace: '職場',
  cafe: 'カフェ',
  library: '図書館',
  online: 'オンライン',
  other: 'その他',
}

const MODALITY_LABELS: Record<string, string> = {
  in_person: '対面',
  hybrid: 'ハイブリッド',
  hyflex: 'ハイフレックス',
  online: 'フルオンライン',
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface LearningCardProps {
  card: LearningCardType
  onEdit: () => void
  onAddOutput: () => void
  onEditOutput: (output: OutputCardType) => void
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function LearningCard({ card, onEdit, onAddOutput, onEditOutput }: LearningCardProps) {
  const updateCard = useTimelineStore((s) => s.updateCard)

  // フェーズ別ボーダーカラー
  const borderClass =
    card.phase === 'past'
      ? 'border-l-past'
      : card.phase === 'ongoing'
      ? 'border-l-ongoing'
      : 'border-l-future'

  // 期間テキスト
  const periodText = card.endDate
    ? `${card.startDate} ～ ${card.endDate}`
    : `${card.startDate} ～ 進行中`

  // アウトプット未設定チェック
  const hasNoOutput = card.outputs.length === 0

  // 完了マークのトグル
  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateCard({ ...card, isCompleted: !card.isCompleted })
  }

  return (
    <div className="flex flex-col items-center">
      {/* ── 学習カード本体 ── */}
      <div
        className={`
          group relative bg-white border border-gray-200 border-l-[2.5px] ${borderClass}
          rounded-lg shadow-sm hover:shadow-md transition-shadow
          w-[148px] min-h-[96px] p-3
          ${card.isCompleted ? 'opacity-60' : ''}
        `}
      >
        {/* 編集ボタン（ホバー時） */}
        <button
          onClick={onEdit}
          className="absolute top-2 right-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
          title="編集"
          aria-label="学習カードを編集"
        >
          <Pencil size={11} className="text-gray-400" />
        </button>

        {/* 完了チェックボックス */}
        <button
          onClick={handleToggleComplete}
          className="absolute top-2 left-2 text-gray-300 hover:text-past transition-colors"
          title={card.isCompleted ? '未完了に戻す' : '完了にする'}
          aria-label="完了マーク"
        >
          <CheckCircle2
            size={13}
            className={card.isCompleted ? 'text-past' : ''}
            fill={card.isCompleted ? 'currentColor' : 'none'}
          />
        </button>

        {/* アウトプット未設定バッジ */}
        {hasNoOutput && (
          <div className="absolute top-2 right-6" title="アウトプットが設定されていません">
            <AlertCircle size={12} className="text-red-400" />
          </div>
        )}

        {/* タイトル */}
        <p
          className={`
            text-xs font-semibold text-gray-800 leading-snug mt-3 mb-1.5 pr-1
            line-clamp-2
            ${card.isCompleted ? 'line-through text-gray-500' : ''}
          `}
        >
          {card.title}
        </p>

        {/* 期間 */}
        <p className="text-[10px] text-gray-400 mb-1.5 leading-tight">{periodText}</p>

        {/* 種別タグ・場所タグ行 */}
        <div className="flex flex-wrap gap-1 mb-1">
          {/* 種別 */}
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 whitespace-nowrap">
            {TYPE_LABELS[card.type]}
          </span>

          {/* 取り組み場所（設定済みの場合のみ） */}
          {card.location && (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 whitespace-nowrap">
              {LOCATION_LABELS[card.location] ?? card.location}
            </span>
          )}

          {/* 受講形態（設定済みの場合のみ） */}
          {card.modality && (
            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 whitespace-nowrap">
              {MODALITY_LABELS[card.modality] ?? card.modality}
            </span>
          )}
        </div>

        {/* モチベーション（右下） */}
        <div className="flex justify-end mt-1">
          <MotivationPicker
            cardId={card.id}
            cardTitle={card.title}
            currentLevel={card.motivationLevel}
          />
        </div>
      </div>

      {/* ── 縦線 ── */}
      <div className="w-px h-3 bg-gray-300" />

      {/* ── アウトプットカード群 ── */}
      {card.outputs.length > 0 && (
        <div className="flex flex-col items-center gap-0">
          {card.outputs.map((output, idx) => (
            <React.Fragment key={output.id}>
              <OutputCard output={output} onEdit={() => onEditOutput(output)} />
              {/* カード間の接続線（最後以外） */}
              {idx < card.outputs.length - 1 && (
                <div className="w-px h-2 bg-gray-300" />
              )}
            </React.Fragment>
          ))}
          {/* 最後のカードから＋追加ボタンへの線 */}
          <div className="w-px h-3 bg-gray-300" />
        </div>
      )}

      {/* ── ＋追加ボタン ── */}
      <button
        onClick={onAddOutput}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600 transition-colors w-[148px] justify-center"
        aria-label="アウトプットを追加"
      >
        <Plus size={11} />
        <span>追加</span>
      </button>
    </div>
  )
}
