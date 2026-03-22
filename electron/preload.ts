import { contextBridge, ipcRenderer } from 'electron'
import type {
  LearningCard,
  OutputCard,
  CareerGoal,
  WellbeingGoal,
  AIConfig,
  ActionLogEntry,
  MotivationLogEntry,
  GoalLogEntry,
} from '../src/types'

/**
 * レンダラープロセスに公開する electronAPI。
 * メインプロセスとの通信はすべてここを経由する。
 * nodeIntegration: false / contextIsolation: true を維持するため、
 * 直接 Node.js API をレンダラーに渡さない。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ──────────────────────────────────────
  // 学習カード CRUD
  // ──────────────────────────────────────
  getLearningCards: (): Promise<LearningCard[]> =>
    ipcRenderer.invoke('db-get-learning-cards'),

  upsertLearningCard: (card: LearningCard): Promise<void> =>
    ipcRenderer.invoke('db-upsert-learning-card', card),

  deleteLearningCard: (id: string): Promise<void> =>
    ipcRenderer.invoke('db-delete-learning-card', id),

  updateMotivation: (id: string, level: number | null): Promise<void> =>
    ipcRenderer.invoke('db-update-motivation', { id, level }),

  // ──────────────────────────────────────
  // アウトプットカード CRUD
  // ──────────────────────────────────────
  upsertOutputCard: (card: OutputCard): Promise<void> =>
    ipcRenderer.invoke('db-upsert-output-card', card),

  deleteOutputCard: (id: string): Promise<void> =>
    ipcRenderer.invoke('db-delete-output-card', id),

  // ──────────────────────────────────────
  // ゴール
  // ──────────────────────────────────────
  getCareerGoal: (): Promise<CareerGoal | null> =>
    ipcRenderer.invoke('db-get-career-goal'),

  saveCareerGoal: (goal: CareerGoal): Promise<void> =>
    ipcRenderer.invoke('db-save-career-goal', goal),

  getWellbeingGoal: (): Promise<WellbeingGoal | null> =>
    ipcRenderer.invoke('db-get-wellbeing-goal'),

  saveWellbeingGoal: (goal: WellbeingGoal): Promise<void> =>
    ipcRenderer.invoke('db-save-wellbeing-goal', goal),

  // ──────────────────────────────────────
  // AI設定・呼び出し
  // ──────────────────────────────────────
  saveAIConfig: (config: AIConfig): Promise<void> =>
    ipcRenderer.invoke('save-ai-config', config),

  loadAIConfig: (): Promise<AIConfig | null> =>
    ipcRenderer.invoke('load-ai-config'),

  chatAI: (message: string, context: string): Promise<string> =>
    ipcRenderer.invoke('chat-ai', { message, context }),

  analyzeAI: (context: string): Promise<string> =>
    ipcRenderer.invoke('analyze-ai', { context }),

  // ──────────────────────────────────────
  // データ管理
  // ──────────────────────────────────────
  exportCSV: (): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('export-csv'),

  exportResearchLog: (
    anonymize: boolean
  ): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('export-research-log', { anonymize }),

  resetDatabase: (): Promise<void> =>
    ipcRenderer.invoke('reset-database'),

  // ──────────────────────────────────────
  // 研究用ログ記録（レンダラーから呼ぶ）
  // ──────────────────────────────────────
  logAction: (entry: Omit<ActionLogEntry, 'id' | 'timestamp'>): Promise<void> =>
    ipcRenderer.invoke('db-log-action', entry),

  logMotivation: (entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>): Promise<void> =>
    ipcRenderer.invoke('db-log-motivation', entry),

  logGoal: (entry: Omit<GoalLogEntry, 'id' | 'timestamp'>): Promise<void> =>
    ipcRenderer.invoke('db-log-goal', entry),

  // ──────────────────────────────────────
  // APIキー管理（keytarへの直接保存・読み込み）
  // ──────────────────────────────────────
  saveApiKey: (provider: string, apiKey: string): Promise<void> =>
    ipcRenderer.invoke('save-api-key', { provider, apiKey }),

  loadApiKey: (provider: string): Promise<string | null> =>
    ipcRenderer.invoke('load-api-key', provider),

  // ──────────────────────────────────────
  // PDFエクスポート
  // ──────────────────────────────────────
  exportPDFPortfolio: (): Promise<{ success: boolean; path?: string; error?: string }> =>
    ipcRenderer.invoke('export-pdf-portfolio'),

  exportPDFTimeline: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-pdf-timeline'),
})
