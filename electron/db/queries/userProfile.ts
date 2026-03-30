import { getDatabase } from '../database'

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────

export interface UserProfileRow {
  id: string
  learner_type: string | null
  academic_field: string | null
  created_at: string
  updated_at: string
}

export interface AcademicFieldRow {
  id: string
  label: string
  sort_order: number
  is_active: number
}

// ─────────────────────────────────────────────
// 学習者プロフィール
// ─────────────────────────────────────────────

/**
 * 学習者プロフィールを取得する。
 * レコードは常に1行（id='profile' 固定）。存在しない場合は null を返す。
 */
export function getUserProfile(): UserProfileRow | null {
  const db = getDatabase()
  const row = db
    .prepare('SELECT * FROM user_profile WHERE id = ?')
    .get('profile') as UserProfileRow | undefined
  return row ?? null
}

/**
 * 学習者プロフィールを保存する（upsert）。
 * id='profile' 固定で常に1レコードのみ管理する。
 */
export function saveUserProfile(
  learnerType: string | null,
  academicField: string | null
): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  const existing = db
    .prepare('SELECT id FROM user_profile WHERE id = ?')
    .get('profile')

  if (existing) {
    db.prepare(
      `UPDATE user_profile
       SET learner_type = ?, academic_field = ?, updated_at = ?
       WHERE id = ?`
    ).run(learnerType, academicField, now, 'profile')
  } else {
    db.prepare(
      `INSERT INTO user_profile (id, learner_type, academic_field, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run('profile', learnerType, academicField, now, now)
  }
}

// ─────────────────────────────────────────────
// 学問分野マスタ
// ─────────────────────────────────────────────

/**
 * アクティブな学問分野マスタを sort_order 昇順で取得する。
 */
export function getAcademicFieldMaster(): AcademicFieldRow[] {
  const db = getDatabase()
  return db
    .prepare(
      `SELECT id, label, sort_order, is_active
       FROM academic_field_master
       WHERE is_active = 1
       ORDER BY sort_order ASC`
    )
    .all() as AcademicFieldRow[]
}

/**
 * 新しい学問分野を追加する。
 * sort_order は現在の最大値 + 1。追加したレコードを返す。
 */
export function addAcademicField(label: string): AcademicFieldRow {
  const db = getDatabase()

  // 現在の最大 sort_order を取得（レコードが0件の場合は0）
  const maxRow = db
    .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM academic_field_master')
    .get() as { max_order: number }
  const nextOrder = maxRow.max_order + 1

  // Node.js v24: crypto.randomUUID() はグローバルで使用可能
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  db.prepare(
    `INSERT INTO academic_field_master (id, label, sort_order, is_active)
     VALUES (?, ?, ?, 1)`
  ).run(id, label, nextOrder)

  return {
    id,
    label,
    sort_order: nextOrder,
    is_active: 1,
  }
}

/**
 * 学問分野を論理削除する（is_active = 0）。
 * 物理削除はしない（過去に選択済みのユーザーデータを保持するため）。
 */
export function deleteAcademicField(id: string): void {
  const db = getDatabase()
  db.prepare(
    'UPDATE academic_field_master SET is_active = 0 WHERE id = ?'
  ).run(id)
}

/**
 * 学問分野の表示順を更新する。
 * ids 配列の順番に従って sort_order を 1, 2, 3... と設定する。
 * better-sqlite3 の transaction を使って一括更新する。
 */
export function reorderAcademicFields(ids: string[]): void {
  const db = getDatabase()
  const update = db.prepare(
    'UPDATE academic_field_master SET sort_order = ? WHERE id = ?'
  )

  const reorder = db.transaction((orderedIds: string[]) => {
    orderedIds.forEach((id, index) => {
      update.run(index + 1, id)
    })
  })

  reorder(ids)
}
