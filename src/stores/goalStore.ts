import { create } from 'zustand'
import type { CareerGoal, WellbeingGoal } from '../types'

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface GoalState {
  careerGoal: CareerGoal | null
  wellbeingGoal: WellbeingGoal | null
  isLoading: boolean

  loadGoals: () => Promise<void>
  saveCareerGoal: (
    goal: Omit<CareerGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  saveWellbeingGoal: (
    goal: Omit<WellbeingGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
}

// ──────────────────────────────────────────────
// ヘルパー
// ──────────────────────────────────────────────

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

// ──────────────────────────────────────────────
// ストア
// ──────────────────────────────────────────────

export const useGoalStore = create<GoalState>((set, get) => ({
  careerGoal: null,
  wellbeingGoal: null,
  isLoading: false,

  // ────────────────────────────────
  // 両ゴールを読み込む
  // ────────────────────────────────
  loadGoals: async () => {
    set({ isLoading: true })
    try {
      const [careerGoal, wellbeingGoal] = await Promise.all([
        window.electronAPI.getCareerGoal(),
        window.electronAPI.getWellbeingGoal(),
      ])
      set({ careerGoal, wellbeingGoal })
    } finally {
      set({ isLoading: false })
    }
  },

  // ────────────────────────────────
  // キャリアゴール保存
  // ────────────────────────────────
  saveCareerGoal: async (goalInput) => {
    const current = get().careerGoal

    // 初回か更新かを判定
    const isNew = current === null
    const eventType = isNew ? 'goal_created' : 'goal_updated'

    // 既存ゴールを引き継ぐ（id / createdAt は新規生成 or 既存を使用）
    const goal: CareerGoal = {
      id: current?.id ?? newId(),
      ...goalInput,
      createdAt: current?.createdAt ?? now(),
      updatedAt: now(),
    }

    await window.electronAPI.saveCareerGoal(goal)

    // goal_log 記録（ベストエフォート）
    window.electronAPI
      .logGoal({
        eventType,
        goalType: 'career',
        previousValue: current ? JSON.stringify({ text: current.text, targetDate: current.targetDate }) : null,
        newValue: JSON.stringify({ text: goal.text, targetDate: goal.targetDate }),
      })
      .catch((e) => console.error('logGoal(career):', e))

    set({ careerGoal: goal })
  },

  // ────────────────────────────────
  // ウェルビーイングゴール保存
  // ────────────────────────────────
  saveWellbeingGoal: async (goalInput) => {
    const current = get().wellbeingGoal

    const isNew = current === null
    const eventType = isNew ? 'goal_created' : 'goal_updated'

    const goal: WellbeingGoal = {
      id: current?.id ?? newId(),
      ...goalInput,
      createdAt: current?.createdAt ?? now(),
      updatedAt: now(),
    }

    await window.electronAPI.saveWellbeingGoal(goal)

    // goal_log 記録（ベストエフォート）
    window.electronAPI
      .logGoal({
        eventType,
        goalType: 'wellbeing',
        previousValue: current
          ? JSON.stringify({
              text: current.text,
              personal: current.axes.personal,
              social: current.axes.social,
              planet: current.axes.planet,
            })
          : null,
        newValue: JSON.stringify({
          text: goal.text,
          personal: goal.axes.personal,
          social: goal.axes.social,
          planet: goal.axes.planet,
        }),
      })
      .catch((e) => console.error('logGoal(wellbeing):', e))

    set({ wellbeingGoal: goal })
  },
}))
