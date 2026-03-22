import React from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import type { OutputCard as OutputCardType } from '../../types'

// ──────────────────────────────────────────────
// ラベルマップ
// ──────────────────────────────────────────────

const OUTPUT_TYPE_LABELS: Record<OutputCardType['type'], string> = {
  article: 'ブログ記事',
  repository: 'リポジトリ',
  certificate: '資格・検定',
  presentation: '発表・LT',
  project: '個人開発',
  other: 'その他',
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface OutputCardProps {
  output: OutputCardType
  onEdit: () => void
}

// ──────────────────────────────────────────────
// コンポーネント
// ──────────────────────────────────────────────

export function OutputCard({ output, onEdit }: OutputCardProps) {
  const isDone = output.status === 'done'

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow w-[148px]">
      {/* 編集ボタン（ホバー時表示） */}
      <button
        onClick={onEdit}
        className="absolute top-1.5 right-1.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
        title="編集"
        aria-label="アウトプットを編集"
      >
        <Pencil size={10} className="text-gray-400" />
      </button>

      {/* タイトル */}
      <p className="text-xs font-medium text-gray-800 leading-snug pr-4 line-clamp-2 mb-1.5">
        {output.title}
      </p>

      {/* バッジ行 */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* 種別バッジ */}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 whitespace-nowrap">
          {OUTPUT_TYPE_LABELS[output.type]}
        </span>

        {/* ステータスバッジ */}
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap font-medium ${
            isDone
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {isDone ? '完了' : '予定'}
        </span>

        {/* URLリンクアイコン */}
        {output.url && (
          <a
            href={output.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors ml-auto"
            title={output.url}
            aria-label="リンクを開く"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  )
}
