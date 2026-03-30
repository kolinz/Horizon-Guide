// Horizon Guide — electronAPI 型定義
// HG-SDD-001 v0.9.8

// ─────────────────────────────────────────────
// ドメイン型
// ─────────────────────────────────────────────

interface LearningCard {
  id: string
  title: string
  startDate: string
  endDate: string | null
  type: string
  location: string | null
  modality: string | null
  phase: 'past' | 'ongoing' | 'future'
  isCompleted: boolean
  motivationLevel: 1 | 2 | 3 | 4 | 5 | null
  memo: string
  outputs: OutputCard[]
  createdAt: string
  updatedAt: string
}

interface OutputCard {
  id: string
  learningCardId: string
  title: string
  type: string
  url: string | null
  status: 'done' | 'planned'
  createdAt: string
  updatedAt: string
}

interface CareerGoal {
  id: string
  text: string
  targetDate: string | null
  userName: string | null
  createdAt: string
  updatedAt: string
}

interface WellbeingGoal {
  id: string
  text: string
  axes: {
    personal: string | null
    social: string | null
    planet: string | null
  }
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

interface AIConfig {
  provider: 'llm' | 'local' | 'dify' | 'langflow'
  llm?: {
    service: 'gemini' | 'claude' | 'openai'
    model: string
  }
  local?: {
    endpoint: string
    model: string
  }
  dify?: {
    endpoint: string
  }
}

// ─────────────────────────────────────────────
// 学習者プロフィール関連型（FR-19）
// ─────────────────────────────────────────────

/** 学習者プロフィール（レンダラー側で使用するcamelCase型） */
interface UserProfileData {
  id: string
  learnerType: string | null   // working_adult / professional_univ / university / vocational / high_school
  academicField: string | null // academic_field_master.id を参照
  createdAt: string
  updatedAt: string
}

/** 学問区分マスタエントリ（レンダラー側で使用するcamelCase型） */
interface AcademicFieldMaster {
  id: string
  label: string
  sortOrder: number
  isActive: boolean
}

// ─────────────────────────────────────────────
// 研究用行動ログ型
// ─────────────────────────────────────────────

interface ActionLogEntry {
  id: string
  eventType: string
  targetType: string
  targetId: string
  targetTitle: string
  beforeValue: string | null
  afterValue: string | null
  timestamp: string
}

interface MotivationLogEntry {
  id: string
  learningCardId: string
  learningCardTitle: string
  previousLevel: number | null
  newLevel: number
  timestamp: string
}

interface GoalLogEntry {
  id: string
  eventType: string
  goalType: string
  previousValue: string | null
  newValue: string
  timestamp: string
}

// ─────────────────────────────────────────────
// electronAPI インターフェース
// ─────────────────────────────────────────────

interface ElectronAPIType {
  // 学習カード CRUD
  getLearningCards: () => Promise<LearningCard[]>
  upsertLearningCard: (card: LearningCard) => Promise<void>
  deleteLearningCard: (id: string) => Promise<void>

  // モチベーション更新
  updateMotivation: (id: string, level: number | null) => Promise<void>

  // アウトプットカード CRUD
  upsertOutputCard: (card: OutputCard) => Promise<void>
  deleteOutputCard: (id: string) => Promise<void>

  // ゴール
  getCareerGoal: () => Promise<CareerGoal | null>
  saveCareerGoal: (goal: CareerGoal) => Promise<void>
  getWellbeingGoal: () => Promise<WellbeingGoal | null>
  saveWellbeingGoal: (goal: WellbeingGoal) => Promise<void>

  // 学習者プロフィール（FR-19）
  getUserProfile: () => Promise<UserProfileData | null>
  saveUserProfile: (learnerType: string | null, academicField: string | null) => Promise<void>

  // 学問区分マスタ（FR-19）
  getAcademicFieldMaster: () => Promise<AcademicFieldMaster[]>
  addAcademicField: (label: string) => Promise<AcademicFieldMaster>
  deleteAcademicField: (id: string) => Promise<void>
  reorderAcademicFields: (ids: string[]) => Promise<void>

  // AI設定・呼び出し
  saveAIConfig: (config: AIConfig) => Promise<void>
  loadAIConfig: () => Promise<AIConfig | null>
  saveApiKey: (provider: string, apiKey: string) => Promise<void>
  loadApiKey: (provider: string) => Promise<string | null>
  chatAI: (message: string, context: string) => Promise<{ text?: string; error?: string }>
  analyzeAI: (context: string) => Promise<{ text?: string; error?: string }>

  // データ管理
  exportCSV: () => Promise<{ success?: boolean; canceled?: boolean; error?: string }>
  exportResearchLog: (anonymize: boolean) => Promise<{ success?: boolean; canceled?: boolean; error?: string }>
  resetDatabase: () => Promise<{ success?: boolean; error?: string }>

  // 研究用行動ログ
  logAction: (entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => Promise<void>
  logMotivation: (entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>) => Promise<void>
  logGoal: (entry: Omit<GoalLogEntry, 'id' | 'timestamp'>) => Promise<void>
}

// ─────────────────────────────────────────────
// Window 型拡張
// ─────────────────────────────────────────────

declare global {
  interface Window {
    electronAPI: ElectronAPIType
  }
}

export {}
