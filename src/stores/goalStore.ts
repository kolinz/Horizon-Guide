import { create } from 'zustand'
import type {
  CareerGoal,
  WellbeingGoal,
  UserProfile,
  LearnerType,
  AcademicFieldMaster,
} from '../types'

// ──────────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────────

interface GoalState {
  careerGoal: CareerGoal | null
  wellbeingGoal: WellbeingGoal | null
  isLoading: boolean

  // FR-19: 学習者プロフィール
  userProfile: UserProfile | null
  academicFieldMaster: AcademicFieldMaster[]

  loadGoals: () => Promise<void>
  saveCareerGoal: (
    goal: Omit<CareerGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>
  saveWellbeingGoal: (
    goal: Omit<WellbeingGoal, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>

  // FR-19: 学習者プロフィール操作
  loadUserProfile: () => Promise<void>
  saveUserProfile: (learnerType: LearnerType | null, academicField: string | null) => Promise<void>
  addAcademicField: (label: string) => Promise<void>
  deleteAcademicField: (id: string) => Promise<void>
  reorderAcademicFields: (ids: string[]) => Promise<void>
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

  // FR-19 初期値
  userProfile: null,
  academicFieldMaster: [],

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

    const isNew = current === null
    const eventType = isNew ? 'goal_created' : 'goal_updated'

    const goal: CareerGoal = {
      id: current?.id ?? newId(),
      ...goalInput,
      createdAt: current?.createdAt ?? now(),
      updatedAt: now(),
    }

    await window.electronAPI.saveCareerGoal(goal)

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

  // ────────────────────────────────
  // FR-19: 学習者プロフィール読み込み
  // ────────────────────────────────
  loadUserProfile: async () => {
    try {
      const [profileData, masterData] = await Promise.all([
        window.electronAPI.getUserProfile(),
        window.electronAPI.getAcademicFieldMaster(),
      ])
      // DB行（camelCase済み）をUserProfile型にマッピング
      const userProfile: UserProfile | null = profileData
        ? {
            id: profileData.id,
            learnerType: profileData.learnerType as LearnerType | null,
            academicField: profileData.academicField,
            createdAt: profileData.createdAt,
            updatedAt: profileData.updatedAt,
          }
        : null
      set({ userProfile, academicFieldMaster: masterData })
    } catch (e) {
      console.error('loadUserProfile:', e)
    }
  },

  // ────────────────────────────────
  // FR-19: 学習者プロフィール保存
  // ────────────────────────────────
  saveUserProfile: async (learnerType, academicField) => {
    await window.electronAPI.saveUserProfile(learnerType, academicField)
    await get().loadUserProfile()
  },

  // ────────────────────────────────
  // FR-19: 学問区分 追加
  // ────────────────────────────────
  addAcademicField: async (label) => {
    await window.electronAPI.addAcademicField(label)
    const masterData = await window.electronAPI.getAcademicFieldMaster()
    set({ academicFieldMaster: masterData })
  },

  // ────────────────────────────────
  // FR-19: 学問区分 削除（論理削除）
  // ────────────────────────────────
  deleteAcademicField: async (id) => {
    await window.electronAPI.deleteAcademicField(id)
    const masterData = await window.electronAPI.getAcademicFieldMaster()
    set({ academicFieldMaster: masterData })
  },

  // ────────────────────────────────
  // FR-19: 学問区分 並び替え
  // ────────────────────────────────
  reorderAcademicFields: async (ids) => {
    await window.electronAPI.reorderAcademicFields(ids)
    const masterData = await window.electronAPI.getAcademicFieldMaster()
    set({ academicFieldMaster: masterData })
  },
}))
