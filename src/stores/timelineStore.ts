import { create } from 'zustand'
import type { LearningCard, OutputCard, MotivationLevel } from '../types'

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface TimelineState {
  learningCards: LearningCard[]
  isLoading: boolean

  // ── 学習カード ──
  loadCards: () => Promise<void>
  addCard: (
    card: Omit<LearningCard, 'id' | 'createdAt' | 'updatedAt' | 'outputs'>
  ) => Promise<void>
  updateCard: (card: LearningCard) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  updateMotivation: (id: string, level: MotivationLevel | null) => Promise<void>

  // ── アウトプットカード ──
  addOutputCard: (
    output: Omit<OutputCard, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  updateOutputCard: (output: OutputCard) => Promise<void>
  deleteOutputCard: (id: string) => Promise<void>

  // ── CSVインポート（v1.1 向け・card_imported ログ）──
  importCards: (cards: LearningCard[]) => Promise<void>
}

// ──────────────────────────────────────────────
// ヘルパー：now / uuid
// ──────────────────────────────────────────────

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

// ──────────────────────────────────────────────
// ストア
// ──────────────────────────────────────────────

export const useTimelineStore = create<TimelineState>((set, get) => ({
  learningCards: [],
  isLoading: false,

  // ────────────────────────────────
  // 全カード読み込み
  // ────────────────────────────────
  loadCards: async () => {
    set({ isLoading: true })
    try {
      const cards = await window.electronAPI.getLearningCards()
      set({ learningCards: cards })
    } finally {
      set({ isLoading: false })
    }
  },

  // ────────────────────────────────
  // 学習カード追加
  // ────────────────────────────────
  addCard: async (cardInput) => {
    const card: LearningCard = {
      ...cardInput,
      id: newId(),
      outputs: [],
      createdAt: now(),
      updatedAt: now(),
    }

    await window.electronAPI.upsertLearningCard(card)

    // 行動ログ（ベストエフォート）
    window.electronAPI
      .logAction({
        eventType: 'card_created',
        targetType: 'learning_card',
        targetId: card.id,
        targetTitle: card.title,
        beforeValue: null,
        afterValue: JSON.stringify({ title: card.title, type: card.type, phase: card.phase }),
      })
      .catch((e) => console.error('logAction(card_created):', e))

    // ストアを最新状態に更新
    await get().loadCards()
  },

  // ────────────────────────────────
  // 学習カード更新
  // ────────────────────────────────
  updateCard: async (card) => {
    // 変更前の状態を取得（ログ用）
    const before = get().learningCards.find((c) => c.id === card.id)
    const beforeValue = before
      ? JSON.stringify({ title: before.title, type: before.type, phase: before.phase, isCompleted: before.isCompleted })
      : null

    const updated: LearningCard = { ...card, updatedAt: now() }
    await window.electronAPI.upsertLearningCard(updated)

    // 完了マーク変化の判定
    const eventType =
      before && !before.isCompleted && updated.isCompleted
        ? 'card_completed'
        : 'card_updated'

    window.electronAPI
      .logAction({
        eventType,
        targetType: 'learning_card',
        targetId: updated.id,
        targetTitle: updated.title,
        beforeValue,
        afterValue: JSON.stringify({ title: updated.title, type: updated.type, phase: updated.phase, isCompleted: updated.isCompleted }),
      })
      .catch((e) => console.error('logAction(card_updated):', e))

    await get().loadCards()
  },

  // ────────────────────────────────
  // 学習カード削除
  // ────────────────────────────────
  deleteCard: async (id) => {
    const before = get().learningCards.find((c) => c.id === id)

    await window.electronAPI.deleteLearningCard(id)

    window.electronAPI
      .logAction({
        eventType: 'card_deleted',
        targetType: 'learning_card',
        targetId: id,
        targetTitle: before?.title ?? id,
        beforeValue: before
          ? JSON.stringify({ title: before.title, type: before.type, phase: before.phase })
          : null,
        afterValue: null,
      })
      .catch((e) => console.error('logAction(card_deleted):', e))

    // ローカルからも即時削除
    set((state) => ({
      learningCards: state.learningCards.filter((c) => c.id !== id),
    }))
  },

  // ────────────────────────────────
  // モチベーション更新
  // ────────────────────────────────
  updateMotivation: async (id, level) => {
    const before = get().learningCards.find((c) => c.id === id)
    const previousLevel = before?.motivationLevel ?? null

    await window.electronAPI.updateMotivation(id, level)

    // motivation_log 記録
    if (before) {
      window.electronAPI
        .logMotivation({
          learningCardId: id,
          learningCardTitle: before.title,
          previousLevel: previousLevel as MotivationLevel | null,
          newLevel: level as MotivationLevel,
        })
        .catch((e) => console.error('logMotivation:', e))
    }

    // ストアをローカル更新（再フェッチなし）
    set((state) => ({
      learningCards: state.learningCards.map((c) =>
        c.id === id ? { ...c, motivationLevel: level, updatedAt: now() } : c
      ),
    }))
  },

  // ────────────────────────────────
  // アウトプットカード追加
  // ────────────────────────────────
  addOutputCard: async (outputInput) => {
    const output: OutputCard = {
      ...outputInput,
      id: newId(),
      createdAt: now(),
      updatedAt: now(),
    }

    await window.electronAPI.upsertOutputCard(output)

    window.electronAPI
      .logAction({
        eventType: 'output_created',
        targetType: 'output_card',
        targetId: output.id,
        targetTitle: output.title,
        beforeValue: null,
        afterValue: JSON.stringify({ title: output.title, type: output.type, status: output.status }),
      })
      .catch((e) => console.error('logAction(output_created):', e))

    await get().loadCards()
  },

  // ────────────────────────────────
  // アウトプットカード更新
  // ────────────────────────────────
  updateOutputCard: async (output) => {
    // 変更前の状態（ログ用）
    const parentCard = get().learningCards.find((c) => c.id === output.learningCardId)
    const before = parentCard?.outputs.find((o) => o.id === output.id)

    const updated: OutputCard = { ...output, updatedAt: now() }
    await window.electronAPI.upsertOutputCard(updated)

    window.electronAPI
      .logAction({
        eventType: 'output_updated',
        targetType: 'output_card',
        targetId: updated.id,
        targetTitle: updated.title,
        beforeValue: before
          ? JSON.stringify({ title: before.title, type: before.type, status: before.status })
          : null,
        afterValue: JSON.stringify({ title: updated.title, type: updated.type, status: updated.status }),
      })
      .catch((e) => console.error('logAction(output_updated):', e))

    await get().loadCards()
  },

  // ────────────────────────────────
  // アウトプットカード削除
  // ────────────────────────────────
  deleteOutputCard: async (id) => {
    // 削除前の情報を取得（ログ用）
    let beforeTitle = id
    let beforeValue: string | null = null
    for (const card of get().learningCards) {
      const output = card.outputs.find((o) => o.id === id)
      if (output) {
        beforeTitle = output.title
        beforeValue = JSON.stringify({ title: output.title, type: output.type, status: output.status })
        break
      }
    }

    await window.electronAPI.deleteOutputCard(id)

    window.electronAPI
      .logAction({
        eventType: 'output_deleted',
        targetType: 'output_card',
        targetId: id,
        targetTitle: beforeTitle,
        beforeValue,
        afterValue: null,
      })
      .catch((e) => console.error('logAction(output_deleted):', e))

    await get().loadCards()
  },

  // ────────────────────────────────
  // CSVインポート（v1.1）
  // card_imported として記録することで card_created と区別可能
  // ────────────────────────────────
  importCards: async (cards) => {
    for (const card of cards) {
      await window.electronAPI.upsertLearningCard(card)

      window.electronAPI
        .logAction({
          eventType: 'card_imported',
          targetType: 'learning_card',
          targetId: card.id,
          targetTitle: card.title,
          beforeValue: null,
          afterValue: JSON.stringify({ title: card.title, type: card.type, phase: card.phase }),
        })
        .catch((e) => console.error('logAction(card_imported):', e))
    }

    await get().loadCards()
  },
}))
