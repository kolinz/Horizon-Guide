import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import { runMigrations } from './migrate'

let db: Database.Database | null = null

/**
 * SQLiteデータベースを初期化して返す。
 * 2回目以降の呼び出しは既存のインスタンスを返す（シングルトン）。
 */
export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'horizon-guide.db')

  db = new Database(dbPath, {
    // verbose: console.log, // デバッグ時は有効化
  })

  // WALモードで書き込みパフォーマンス向上
  db.pragma('journal_mode = WAL')
  // 外部キー制約を有効化
  db.pragma('foreign_keys = ON')

  // schema_versions テーブルを最初に作成（マイグレーション管理用）
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version     INTEGER PRIMARY KEY,
      applied_at  TEXT NOT NULL
    )
  `)

  // マイグレーション実行
  runMigrations(db)

  return db
}

/**
 * 現在のDBインスタンスを返す。
 * initDatabase() を先に呼んでいない場合はエラー。
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database is not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * DBを閉じてインスタンスをリセットする（初期化・テスト用）。
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * DBファイルを削除して再作成する（データ初期化用）。
 * アプリ再起動時に initDatabase() を呼ぶことでリセット完了。
 */
export function resetDatabase(): void {
  closeDatabase()

  const dbPath = join(app.getPath('userData'), 'horizon-guide.db')

  try {
    const { unlinkSync, existsSync } = require('fs') as typeof import('fs')
    if (existsSync(dbPath)) {
      unlinkSync(dbPath)
    }
    // WALファイルも削除
    if (existsSync(dbPath + '-wal')) unlinkSync(dbPath + '-wal')
    if (existsSync(dbPath + '-shm')) unlinkSync(dbPath + '-shm')
  } catch (err) {
    console.error('Failed to delete database file:', err)
    throw err
  }

  // 再初期化
  initDatabase()
}
