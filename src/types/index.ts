// ────────────────────────────────────────────────
// 基本型
// ────────────────────────────────────────────────

export type LearningType =
  | 'class'        // 授業・講義
  | 'self_study'   // 自習
  | 'training'     // 研修・BootCamp
  | 'certificate'  // 資格学習
  | 'other'

export type LearningLocation =
  | 'home'        // 自宅
  | 'university'  // 大学・学校
  | 'workplace'   // 職場
  | 'cafe'        // カフェ・コワーキング
  | 'library'     // 図書館
  | 'online'      // オンライン
  | 'other'

export type LearningModality =
  | 'in_person'  // 教室対面
  | 'hybrid'     // ハイブリッド型
  | 'hyflex'     // ハイフレックス型
  | 'online'     // フルオンライン

export type LearningPhase = 'past' | 'ongoing' | 'future'

export type OutputType =
  | 'article'       // ブログ記事・Qiita
  | 'repository'    // GitHubリポジトリ
  | 'certificate'   // 資格・検定
  | 'presentation'  // 発表・LT
  | 'project'       // 個人開発・制作物
  | 'other'

export type AIProvider = 'llm' | 'local' | 'dify' | 'langflow'

export type MotivationLevel = 1 | 2 | 3 | 4 | 5

// ────────────────────────────────────────────────
// ゴール
// ────────────────────────────────────────────────

export interface CareerGoal {
  id: string
  text: string
  targetDate: string | null  // "2027-03" 形式
  userName: string | null
  createdAt: string
  updatedAt: string
}

export interface WellbeingGoal {
  id: string
  text: string
  axes: {
    personal: string | null  // 個人軸
    social: string | null    // 社会軸
    planet: string | null    // 地球軸
  }
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────────
// 学習カード
// ────────────────────────────────────────────────

export interface LearningCard {
  id: string
  title: string
  startDate: string       // "2024-04" 形式
  endDate: string | null  // null = 終了未定
  type: LearningType
  location: LearningLocation | null  // null = 未設定
  modality: LearningModality | null  // null = 未設定
  phase: LearningPhase
  isCompleted: boolean
  motivationLevel: MotivationLevel | null  // null = 未設定
  memo: string
  outputs: OutputCard[]
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────────
// アウトプットカード
// ────────────────────────────────────────────────

export interface OutputCard {
  id: string
  learningCardId: string
  title: string
  type: OutputType
  url: string | null
  status: 'done' | 'planned'
  createdAt: string
  updatedAt: string
}

// ────────────────────────────────────────────────
// AI設定
// ────────────────────────────────────────────────

export interface AIConfig {
  provider: AIProvider
  llm?: {
    service: 'gemini' | 'claude' | 'openai'
    model: string
  }
  local?: {
    endpoint: string  // 例: http://localhost:11434/api/chat
    model: string     // 例: llama3.2
  }
  dify?: {
    endpoint: string
  }
}

// ────────────────────────────────────────────────
// 研究用ログ
// ────────────────────────────────────────────────

export interface ActionLogEntry {
  id: string
  eventType:
    | 'card_created'
    | 'card_updated'
    | 'card_deleted'
    | 'card_completed'
    | 'card_imported'
    | 'output_created'
    | 'output_updated'
    | 'output_deleted'
  targetType: 'learning_card' | 'output_card'
  targetId: string
  targetTitle: string
  beforeValue: string | null  // JSON文字列
  afterValue: string | null   // JSON文字列
  timestamp: string
}

export interface MotivationLogEntry {
  id: string
  learningCardId: string
  learningCardTitle: string
  previousLevel: MotivationLevel | null  // null = 初回設定
  newLevel: MotivationLevel
  timestamp: string
}

export interface GoalLogEntry {
  id: string
  eventType: 'goal_created' | 'goal_updated'
  goalType: 'career' | 'wellbeing'
  previousValue: string | null  // JSON文字列
  newValue: string              // JSON文字列
  timestamp: string
}

export interface SessionLogEntry {
  id: string
  eventType: 'app_launched' | 'app_closed'
  timestamp: string
}

// ────────────────────────────────────────────────
// 学習者プロフィール（FR-19）
// ────────────────────────────────────────────────

/** 属性（学校種別） */
export type LearnerType =
  | 'working_adult'      // 社会人
  | 'professional_univ'  // 専門職大学
  | 'university'         // 大学
  | 'vocational'         // 専門学校
  | 'high_school'        // 高校

/** 学問分野マスタエントリ（academic_field_master テーブルの1行） */
export interface AcademicFieldMaster {
  id: string
  label: string
  sortOrder: number
  isActive: boolean
}

/** 学習者プロフィール */
export interface UserProfile {
  id: string
  learnerType: LearnerType | null
  academicField: string | null  // academic_field_master.id を参照
  createdAt: string
  updatedAt: string
}

/** 属性ラベルマップ（ハードコード） */
export const LEARNER_TYPE_LABELS: Record<LearnerType, string> = {
  working_adult:     '社会人',
  professional_univ: '専門職大学',
  university:        '大学',
  vocational:        '専門学校',
  high_school:       '高校',
}
