import { create } from 'zustand'
import type { AIConfig } from '../types'

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIState {
  messages: ChatMessage[]
  isStreaming: boolean
  config: AIConfig | null

  loadConfig: () => Promise<void>
  saveConfig: (config: AIConfig) => Promise<void>
  sendChat: (userMessage: string, context: string) => Promise<void>
  sendAnalyze: (context: string) => Promise<void>
  clearMessages: () => void
}

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

// ──────────────────────────────────────────────
// ストア
// ──────────────────────────────────────────────

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isStreaming: false,
  config: null,

  // ────────────────────────────────
  // AI設定を読み込む
  // ────────────────────────────────
  loadConfig: async () => {
    const config = await window.electronAPI.loadAIConfig()
    set({ config })
  },

  // ────────────────────────────────
  // AI設定を保存する
  // ────────────────────────────────
  saveConfig: async (config) => {
    await window.electronAPI.saveAIConfig(config)
    set({ config })
  },

  // ────────────────────────────────
  // Chat mode：ユーザーメッセージを送信
  // ────────────────────────────────
  sendChat: async (userMessage, context) => {
    // ユーザーメッセージをストアに追加
    const userMsg: ChatMessage = {
      id: newId(),
      role: 'user',
      content: userMessage,
      timestamp: now(),
    }

    // AI応答のプレースホルダー（ストリーミング表示用）
    const assistantMsgId = newId()
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: now(),
    }

    set((state) => ({
      messages: [...state.messages, userMsg, assistantPlaceholder],
      isStreaming: true,
    }))

    try {
      const response = await window.electronAPI.chatAI(userMessage, context)

      // 応答でプレースホルダーを置き換え
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: response, timestamp: now() }
            : msg
        ),
        isStreaming: false,
      }))
    } catch (err) {
      console.error('sendChat error:', err)

      // エラー時はエラーメッセージを表示
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
                timestamp: now(),
              }
            : msg
        ),
        isStreaming: false,
      }))
    }
  },

  // ────────────────────────────────
  // Analyze mode：「AI 助言」ボタンで発火
  // ────────────────────────────────
  sendAnalyze: async (context) => {
    // Analyze mode では「AI が分析中」というプレースホルダーを先に表示
    const assistantMsgId = newId()
    const placeholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: now(),
    }

    set((state) => ({
      messages: [...state.messages, placeholder],
      isStreaming: true,
    }))

    try {
      const response = await window.electronAPI.analyzeAI(context)

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: response, timestamp: now() }
            : msg
        ),
        isStreaming: false,
      }))
    } catch (err) {
      console.error('sendAnalyze error:', err)

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
                timestamp: now(),
              }
            : msg
        ),
        isStreaming: false,
      }))
    }
  },

  // ────────────────────────────────
  // チャット履歴をクリア
  // ────────────────────────────────
  clearMessages: () => {
    set({ messages: [] })
  },
}))
