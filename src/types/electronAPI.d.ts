import type {
  LearningCard,
  OutputCard,
  CareerGoal,
  WellbeingGoal,
  AIConfig,
  ActionLogEntry,
  MotivationLogEntry,
  GoalLogEntry,
} from './index'

export interface ElectronAPI {
  // ──────────────────────────────────────
  // 学習カード CRUD
  // ──────────────────────────────────────
  getLearningCards: () => Promise<LearningCard[]>
  upsertLearningCard: (card: LearningCard) => Promise<void>
  deleteLearningCard: (id: string) => Promise<void>
  updateMotivation: (id: string, level: number | null) => Promise<void>

  // ──────────────────────────────────────
  // アウトプットカード CRUD
  // ──────────────────────────────────────
  upsertOutputCard: (card: OutputCard) => Promise<void>
  deleteOutputCard: (id: string) => Promise<void>

  // ──────────────────────────────────────
  // ゴール
  // ──────────────────────────────────────
  getCareerGoal: () => Promise<CareerGoal | null>
  saveCareerGoal: (goal: CareerGoal) => Promise<void>
  getWellbeingGoal: () => Promise<WellbeingGoal | null>
  saveWellbeingGoal: (goal: WellbeingGoal) => Promise<void>

  // ──────────────────────────────────────
  // AI設定・呼び出し
  // ──────────────────────────────────────
  saveAIConfig: (config: AIConfig) => Promise<void>
  loadAIConfig: () => Promise<AIConfig | null>
  chatAI: (message: string, context: string) => Promise<string>
  analyzeAI: (context: string) => Promise<string>

  // ──────────────────────────────────────
  // データ管理
  // ──────────────────────────────────────
  exportCSV: () => Promise<{ success: boolean; path?: string; error?: string }>
  exportResearchLog: (
    anonymize: boolean
  ) => Promise<{ success: boolean; path?: string; error?: string }>
  resetDatabase: () => Promise<void>

  // ──────────────────────────────────────
  // 研究用ログ記録（レンダラーから呼ぶ）
  // ──────────────────────────────────────
  logAction: (entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => Promise<void>
  logMotivation: (entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>) => Promise<void>
  logGoal: (entry: Omit<GoalLogEntry, 'id' | 'timestamp'>) => Promise<void>

  // APIキー管理
  saveApiKey?: (provider: string, apiKey: string) => Promise<void>
  loadApiKey?: (provider: string) => Promise<string | null>

  // PDFエクスポート
  exportPDFPortfolio: () => Promise<{ success: boolean; path?: string; error?: string }>
  exportPDFTimeline: () => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
