import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '@electron-toolkit/preload'

// electron-vite v5 のビルド出力は out/preload/index.mjs（ESM形式）
// main.ts の preload パスは join(__dirname, '../preload/index.mjs') とすること

contextBridge.exposeInMainWorld('electronAPI', {
  // ─────────────────────────────────────────────
  // 学習カード CRUD
  // ─────────────────────────────────────────────
  getLearningCards: () =>
    ipcRenderer.invoke('db-get-learning-cards'),
  upsertLearningCard: (card: unknown) =>
    ipcRenderer.invoke('db-upsert-learning-card', card),
  deleteLearningCard: (id: string) =>
    ipcRenderer.invoke('db-delete-learning-card', id),

  // ─────────────────────────────────────────────
  // モチベーション更新
  // ─────────────────────────────────────────────
  updateMotivation: (id: string, level: number | null) =>
    ipcRenderer.invoke('db-update-motivation', { id, level }),

  // ─────────────────────────────────────────────
  // アウトプットカード CRUD
  // ─────────────────────────────────────────────
  upsertOutputCard: (card: unknown) =>
    ipcRenderer.invoke('db-upsert-output-card', card),
  deleteOutputCard: (id: string) =>
    ipcRenderer.invoke('db-delete-output-card', id),

  // ─────────────────────────────────────────────
  // ゴール
  // ─────────────────────────────────────────────
  getCareerGoal: () =>
    ipcRenderer.invoke('db-get-career-goal'),
  saveCareerGoal: (goal: unknown) =>
    ipcRenderer.invoke('db-save-career-goal', goal),
  getWellbeingGoal: () =>
    ipcRenderer.invoke('db-get-wellbeing-goal'),
  saveWellbeingGoal: (goal: unknown) =>
    ipcRenderer.invoke('db-save-wellbeing-goal', goal),

  // ─────────────────────────────────────────────
  // 学習者プロフィール（FR-19）
  // ─────────────────────────────────────────────
  getUserProfile: () =>
    ipcRenderer.invoke('db-get-user-profile'),
  saveUserProfile: (learnerType: string | null, academicField: string | null) =>
    ipcRenderer.invoke('db-save-user-profile', { learnerType, academicField }),

  // 学問区分マスタ（FR-19）
  getAcademicFieldMaster: () =>
    ipcRenderer.invoke('db-get-academic-field-master'),
  addAcademicField: (label: string) =>
    ipcRenderer.invoke('db-add-academic-field', { label }),
  deleteAcademicField: (id: string) =>
    ipcRenderer.invoke('db-delete-academic-field', { id }),
  reorderAcademicFields: (ids: string[]) =>
    ipcRenderer.invoke('db-reorder-academic-fields', { ids }),

  // ─────────────────────────────────────────────
  // AI設定・呼び出し
  // ─────────────────────────────────────────────
  saveAIConfig: (config: unknown) =>
    ipcRenderer.invoke('save-ai-config', config),
  loadAIConfig: () =>
    ipcRenderer.invoke('load-ai-config'),
  saveApiKey: (provider: string, apiKey: string) =>
    ipcRenderer.invoke('save-api-key', { provider, apiKey }),
  loadApiKey: (provider: string) =>
    ipcRenderer.invoke('load-api-key', provider),
  chatAI: (message: string, context: string) =>
    ipcRenderer.invoke('chat-ai', { message, context }),
  analyzeAI: (context: string) =>
    ipcRenderer.invoke('analyze-ai', { context }),

  // ─────────────────────────────────────────────
  // データ管理
  // ─────────────────────────────────────────────
  exportCSV: () =>
    ipcRenderer.invoke('export-csv'),
  exportResearchLog: (anonymize: boolean) =>
    ipcRenderer.invoke('export-research-log', { anonymize }),
  resetDatabase: () =>
    ipcRenderer.invoke('reset-database'),

  // ─────────────────────────────────────────────
  // 研究用行動ログ
  // ─────────────────────────────────────────────
  logAction: (entry: unknown) =>
    ipcRenderer.invoke('db-log-action', entry),
  logMotivation: (entry: unknown) =>
    ipcRenderer.invoke('db-log-motivation', entry),
  logGoal: (entry: unknown) =>
    ipcRenderer.invoke('db-log-goal', entry),
})

// @electron-toolkit/preload の型宣言（IPC以外のElectron APIアクセス用）
declare global {
  interface Window {
    electron: ElectronAPI
  }
}
