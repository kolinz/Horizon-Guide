import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync, readdirSync, existsSync } from 'fs'

/**
 * マイグレーションファイルの構造
 */
interface Migration {
  version: number
  filename: string
  sql: string
}

/**
 * DatabaseMigration クラス
 * migrations/ フォルダ内の *.sql ファイルを順番に適用する。
 */
export class DatabaseMigration {
  private db: Database.Database
  private migrationsDir: string

  constructor(db: Database.Database) {
    this.db = db
    // __dirname は electron/db/ を指す
    this.migrationsDir = join(__dirname, 'migrations')
  }

  /**
   * migrations/ フォルダ内の SQL ファイルを読み込んで返す。
   * ファイル名は "001_initial.sql" のように 3桁の連番で始まること。
   */
  private loadMigrations(): Migration[] {
    if (!existsSync(this.migrationsDir)) {
      console.warn(`Migrations directory not found: ${this.migrationsDir}`)
      return []
    }

    const files = readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort() // ファイル名の昇順（001_, 002_, ...）

    return files.map((filename) => {
      const match = filename.match(/^(\d+)_/)
      if (!match) {
        throw new Error(`Invalid migration filename: ${filename}. Must start with a number (e.g. 001_initial.sql)`)
      }
      const version = parseInt(match[1], 10)
      const sql = readFileSync(join(this.migrationsDir, filename), 'utf-8')
      return { version, filename, sql }
    })
  }

  /**
   * 適用済みのバージョン一覧を返す。
   */
  private getAppliedVersions(): Set<number> {
    const rows = this.db
      .prepare('SELECT version FROM schema_versions ORDER BY version')
      .all() as { version: number }[]
    return new Set(rows.map((r) => r.version))
  }

  /**
   * 未適用のマイグレーションをすべて順番に適用する。
   */
  public run(): void {
    const migrations = this.loadMigrations()
    const applied = this.getAppliedVersions()

    const pending = migrations.filter((m) => !applied.has(m.version))

    if (pending.length === 0) {
      return // 適用済み
    }

    for (const migration of pending) {
      console.log(`Applying migration: ${migration.filename}`)

      // トランザクション内で実行
      const applyMigration = this.db.transaction(() => {
        this.db.exec(migration.sql)
        this.db
          .prepare('INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)')
          .run(migration.version, new Date().toISOString())
      })

      try {
        applyMigration()
        console.log(`Migration ${migration.filename} applied successfully.`)
      } catch (err) {
        console.error(`Failed to apply migration ${migration.filename}:`, err)
        throw err
      }
    }
  }
}

/**
 * マイグレーションを実行するヘルパー関数。
 * database.ts の initDatabase() から呼ばれる。
 */
export function runMigrations(db: Database.Database): void {
  const migration = new DatabaseMigration(db)
  migration.run()
}
