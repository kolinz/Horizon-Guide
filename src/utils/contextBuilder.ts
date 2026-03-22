import type { CareerGoal, WellbeingGoal, LearningCard } from '../types'

/**
 * AI助言に渡すコンテキスト文字列を生成する。
 * Chat mode / Analyze mode の両方で使用。
 */
export function buildContext(
  careerGoal: CareerGoal | null,
  wellbeingGoal: WellbeingGoal | null,
  learningCards: LearningCard[]
): string {
  if (!careerGoal) {
    return '【キャリアゴール】未設定\n【学習タイムライン】データなし'
  }

  const wbSection = wellbeingGoal
    ? `${wellbeingGoal.text}
  - 個人: ${wellbeingGoal.axes.personal ?? '未設定'}
  - 社会: ${wellbeingGoal.axes.social  ?? '未設定'}
  - 地球: ${wellbeingGoal.axes.planet  ?? '未設定'}`
    : '未設定'

  const cardSection = learningCards.length === 0
    ? '（学習カードなし）'
    : learningCards
        .map((card) => {
          const phase =
            card.phase === 'past'    ? '過去' :
            card.phase === 'ongoing' ? '進行中' : '未来'
          const period = card.endDate
            ? `${card.startDate} ～ ${card.endDate}`
            : `${card.startDate} ～ 進行中`
          const motivation = card.motivationLevel
            ? `${card.motivationLevel}/5`
            : '未設定'
          const outputs = card.outputs.length > 0
            ? card.outputs
                .map((o) => `  ・${o.title}（${o.type}）[${o.status === 'done' ? '完了' : '予定'}]`)
                .join('\n')
            : '  （なし）'

          return `- [${phase}] ${card.title}
  期間: ${period}
  種別: ${card.type}
  モチベーション: ${motivation}
  アウトプット:
${outputs}`
        })
        .join('\n')

  return `【ウェルビーイングゴール（Why）】
${wbSection}

【キャリアゴール（What）】
${careerGoal.text}
目標時期: ${careerGoal.targetDate ?? '未設定'}

【学習タイムライン】
${cardSection}`.trim()
}
