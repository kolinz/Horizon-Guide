import { registerAIHandlers, setAIConfigGetter } from './ai-bridge'
import {
  app, BrowserWindow, ipcMain, dialog, shell, Menu,
} from 'electron'
import type { WebContentsPrintOptions } from 'electron'
import { join } from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import keytar from 'keytar'
import Papa from 'papaparse'
import JSZip from 'jszip'

// DB
import { initDatabase, resetDatabase as resetDB } from './db/database'
import {
  getAllLearningCards,
  upsertLearningCard,
  deleteLearningCard,
  updateMotivationLevel,
} from './db/queries/learningCards'
import { upsertOutputCard, deleteOutputCard } from './db/queries/outputCards'
import { getCareerGoal, saveCareerGoal, getWellbeingGoal, saveWellbeingGoal } from './db/queries/goals'
import { insertAIHistory, getAllAIHistory } from './db/queries/aiHistory'
import {
  insertActionLog,
  insertMotivationLog,
  insertGoalLog,
  insertSessionLog,
  getAllActionLogs,
  getAllMotivationLogs,
  getAllGoalLogs,
  getAllSessionLogs,
} from './db/queries/researchLog'
// ── FR-19: 学習者プロフィール ─────────────────
import {
  getUserProfile,
  saveUserProfile,
  getAcademicFieldMaster,
  addAcademicField,
  deleteAcademicField,
  reorderAcademicFields,
} from './db/queries/userProfile'

import type { AIConfig, LearningCard, WellbeingGoal, CareerGoal } from '../src/types'

const KEYTAR_SERVICE = 'horizon-guide'
let aiConfigStore: AIConfig | null = null
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    show: false, autoHideMenuBar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true, nodeIntegration: false,
      sandbox: false, webSecurity: true,
    },
  })
  mainWindow.on('ready-to-show', () => { mainWindow?.show() })
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  setAIConfigGetter(() => aiConfigStore)
  registerAIHandlers()
  try { insertSessionLog('app_launched') } catch (e) { console.error('session launch log failed:', e) }
  createWindow()
  createMenu()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('before-quit', () => {
  try { insertSessionLog('app_closed') } catch (e) { console.error('session close log failed:', e) }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── ヘルパー ──────────────────────────────────

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
}

function todayJa(): string {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
}

function fmtYM(ym: string | null | undefined): string {
  if (!ym) return '未設定'
  const [y, m] = ym.split('-').map(Number)
  return `${y}年${m}月`
}

function escHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

// ── IPC: 学習カード CRUD ──────────────────────

ipcMain.handle('db-get-learning-cards', () => getAllLearningCards())
ipcMain.handle('db-upsert-learning-card', (_e, card) => upsertLearningCard(card))
ipcMain.handle('db-delete-learning-card', (_e, id: string) => deleteLearningCard(id))
ipcMain.handle('db-update-motivation', (_e, { id, level }: { id: string; level: number | null }) =>
  updateMotivationLevel(id, level))

// ── IPC: アウトプットカード CRUD ──────────────

ipcMain.handle('db-upsert-output-card', (_e, card) => upsertOutputCard(card))
ipcMain.handle('db-delete-output-card', (_e, id: string) => deleteOutputCard(id))

// ── IPC: ゴール ───────────────────────────────

ipcMain.handle('db-get-career-goal',     () => getCareerGoal())
ipcMain.handle('db-save-career-goal',    (_e, goal) => saveCareerGoal(goal))
ipcMain.handle('db-get-wellbeing-goal',  () => getWellbeingGoal())
ipcMain.handle('db-save-wellbeing-goal', (_e, goal) => saveWellbeingGoal(goal))

// ── IPC: 学習者プロフィール（FR-19） ──────────

ipcMain.handle('db-get-user-profile', () => {
  const row = getUserProfile()
  if (!row) return null
  return {
    id: row.id,
    learnerType: row.learner_type,
    academicField: row.academic_field,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
})

ipcMain.handle('db-save-user-profile', (_e, { learnerType, academicField }) => {
  saveUserProfile(learnerType ?? null, academicField ?? null)
})

// ── IPC: 学問区分マスタ（FR-19） ──────────────

ipcMain.handle('db-get-academic-field-master', () => {
  return getAcademicFieldMaster().map((r) => ({
    id: r.id,
    label: r.label,
    sortOrder: r.sort_order,
    isActive: r.is_active === 1,
  }))
})

ipcMain.handle('db-add-academic-field', (_e, { label }) => {
  const row = addAcademicField(label)
  return { id: row.id, label: row.label, sortOrder: row.sort_order, isActive: row.is_active === 1 }
})

ipcMain.handle('db-delete-academic-field', (_e, { id }) => {
  deleteAcademicField(id)
})

ipcMain.handle('db-reorder-academic-fields', (_e, { ids }) => {
  reorderAcademicFields(ids)
})

// ── IPC: AI設定 ───────────────────────────────

ipcMain.handle('save-ai-config', async (_e, config: AIConfig) => { aiConfigStore = config })
ipcMain.handle('load-ai-config', async () => aiConfigStore)
ipcMain.handle('save-api-key', async (_e, { provider, apiKey }: { provider: string; apiKey: string }) => {
  await keytar.setPassword(KEYTAR_SERVICE, provider, apiKey)
})
ipcMain.handle('load-api-key', async (_e, provider: string) => {
  return await keytar.getPassword(KEYTAR_SERVICE, provider)
})

// chat-ai / analyze-ai は registerAIHandlers() で登録

// ── IPC: CSVエクスポート（全データ5種 ZIP） ────

ipcMain.handle('export-csv', async () => {
  try {
    const zip = new JSZip()
    const BOM = '\uFEFF'
    const cards = getAllLearningCards()

    zip.file('learning_cards.csv', BOM + Papa.unparse(cards.map((c) => ({
      id: c.id, title: c.title, start_date: c.startDate, end_date: c.endDate ?? '',
      type: c.type, location: c.location ?? '', modality: c.modality ?? '',
      phase: c.phase, is_completed: c.isCompleted ? 1 : 0,
      motivation_level: c.motivationLevel ?? '', memo: c.memo,
      created_at: c.createdAt, updated_at: c.updatedAt,
    }))))

    zip.file('output_cards.csv', BOM + Papa.unparse(cards.flatMap((c) =>
      c.outputs.map((o) => ({
        id: o.id, learning_card_id: o.learningCardId, learning_card_title: c.title,
        title: o.title, type: o.type, url: o.url ?? '', status: o.status,
        created_at: o.createdAt, updated_at: o.updatedAt,
      }))
    )))

    const cg = getCareerGoal()
    zip.file('career_goal.csv', BOM + Papa.unparse(
      cg ? [{ id: cg.id, text: cg.text, target_date: cg.targetDate ?? '',
               user_name: cg.userName ?? '', created_at: cg.createdAt, updated_at: cg.updatedAt }] : []
    ))

    const wg = getWellbeingGoal()
    zip.file('wellbeing_goal.csv', BOM + Papa.unparse(
      wg ? [{ id: wg.id, text: wg.text, personal_axis: wg.axes.personal ?? '',
               social_axis: wg.axes.social ?? '', planet_axis: wg.axes.planet ?? '',
               ai_generated: wg.aiGenerated ? 1 : 0, created_at: wg.createdAt, updated_at: wg.updatedAt }] : []
    ))

    const ai = getAllAIHistory()
    zip.file('ai_history.csv', BOM + Papa.unparse(ai.map((h) => ({
      id: h.id, mode: h.mode, user_message: h.userMessage ?? '',
      ai_response: h.aiResponse, provider: h.provider,
      model_or_endpoint: h.modelOrEndpoint ?? '', timestamp: h.timestamp,
    }))))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
      title: 'CSVエクスポート',
      defaultPath: `horizon-guide-export-${todayStr()}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    })
    if (canceled || !filePath) return { success: false, error: 'キャンセルされました' }
    writeFileSync(filePath, zipBuffer)
    return { success: true, path: filePath }
  } catch (err) {
    console.error('export-csv error:', err)
    return { success: false, error: String(err) }
  }
})

// ── IPC: 研究用行動ログエクスポート（匿名化対応） ─

ipcMain.handle('export-research-log', async (_e, { anonymize }: { anonymize: boolean }) => {
  try {
    const zip = new JSZip()
    const BOM = '\uFEFF'
    const ANON = '[anonymized]'

    zip.file('action_log.csv', BOM + Papa.unparse(getAllActionLogs().map((log) => ({
      id: log.id, event_type: log.eventType, target_type: log.targetType,
      target_id: log.targetId,
      target_title: anonymize ? ANON : log.targetTitle,
      before_value: anonymize ? (log.beforeValue ? ANON : '') : (log.beforeValue ?? ''),
      after_value:  anonymize ? (log.afterValue  ? ANON : '') : (log.afterValue  ?? ''),
      timestamp: log.timestamp,
    }))))

    zip.file('motivation_log.csv', BOM + Papa.unparse(getAllMotivationLogs().map((log) => ({
      id: log.id, learning_card_id: log.learningCardId,
      learning_card_title: anonymize ? ANON : log.learningCardTitle,
      previous_level: log.previousLevel ?? '', new_level: log.newLevel,
      timestamp: log.timestamp,
    }))))

    zip.file('goal_log.csv', BOM + Papa.unparse(getAllGoalLogs().map((log) => ({
      id: log.id, event_type: log.eventType, goal_type: log.goalType,
      previous_value: anonymize ? (log.previousValue ? ANON : '') : (log.previousValue ?? ''),
      new_value: anonymize ? ANON : log.newValue,
      timestamp: log.timestamp,
    }))))

    zip.file('session_log.csv', BOM + Papa.unparse(getAllSessionLogs().map((log) => ({
      id: log.id, event_type: log.eventType, timestamp: log.timestamp,
    }))))

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
      title: '研究データエクスポート',
      defaultPath: `horizon-guide-research-${todayStr()}.zip`,
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    })
    if (canceled || !filePath) return { success: false, error: 'キャンセルされました' }
    writeFileSync(filePath, zipBuffer)
    return { success: true, path: filePath }
  } catch (err) {
    console.error('export-research-log error:', err)
    return { success: false, error: String(err) }
  }
})

// ── PDFポートフォリオ用 HTMLテンプレート ─────────

const MOTIVATION_ICONS: Record<number, string> = {
  1: '😣', 2: '😞', 3: '😐', 4: '🙂', 5: '😄',
}

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  article: 'ブログ記事', repository: 'リポジトリ', certificate: '資格・検定',
  presentation: '発表・LT', project: '個人開発', other: 'その他',
}

const LEARNING_TYPE_LABELS: Record<string, string> = {
  class: '授業', self_study: '自習', training: '研修',
  certificate: '資格学習', other: 'その他',
}

function renderCard(c: LearningCard): string {
  const period = c.endDate
    ? `${fmtYM(c.startDate)} ～ ${fmtYM(c.endDate)}`
    : `${fmtYM(c.startDate)} ～ 進行中`
  const motIcon = c.motivationLevel ? MOTIVATION_ICONS[c.motivationLevel] : '😶'
  const motNum  = c.motivationLevel ? String(c.motivationLevel) : '–'
  const completedMark = c.isCompleted ? ' ✓完了' : ''

  const outputsHtml = c.outputs.length > 0
    ? c.outputs.map((o) => {
        const urlPart = o.url
          ? ` <span class="url">（<a href="${escHtml(o.url)}">${escHtml(o.url)}</a>）</span>`
          : ''
        return `<li>
          <span class="output-title">${escHtml(o.title)}</span>
          <span class="badge output-type">${OUTPUT_TYPE_LABELS[o.type] ?? o.type}</span>
          <span class="badge ${o.status === 'done' ? 'badge-done' : 'badge-planned'}">${o.status === 'done' ? '完了' : '予定'}</span>
          ${urlPart}
        </li>`
      }).join('\n')
    : '<li class="no-output">（アウトプットなし）</li>'

  return `
  <div class="card">
    <div class="card-header">
      <span class="card-title">${escHtml(c.title)}${completedMark}</span>
      <span class="motivation">${motIcon} ${motNum}</span>
    </div>
    <div class="card-meta">
      <span class="period">${period}</span>
      <span class="badge type-badge">${LEARNING_TYPE_LABELS[c.type] ?? c.type}</span>
      ${c.location ? `<span class="badge loc-badge">${escHtml(c.location)}</span>` : ''}
      ${c.modality ? `<span class="badge mod-badge">${escHtml(c.modality)}</span>` : ''}
    </div>
    ${c.memo ? `<p class="memo">${escHtml(c.memo)}</p>` : ''}
    <ul class="outputs">${outputsHtml}</ul>
  </div>`
}

function renderSection(title: string, sectionCards: LearningCard[], color: string): string {
  if (sectionCards.length === 0) return ''
  return `
<section>
  <h2 style="border-left:4px solid ${color};padding-left:8px;color:${color};">
    ${title}（${sectionCards.length}件）
  </h2>
  ${sectionCards.map(renderCard).join('\n')}
</section>`
}

function buildPortfolioHTML(
  careerGoal: CareerGoal | null,
  wellbeingGoal: WellbeingGoal | null,
  cards: LearningCard[]
): string {
  const userName = careerGoal?.userName ?? ''
  const past    = cards.filter((c) => c.phase === 'past')
  const ongoing = cards.filter((c) => c.phase === 'ongoing')
  const future  = cards.filter((c) => c.phase === 'future')

  return `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans JP',sans-serif;font-size:11pt;color:#1a1a1a;line-height:1.6}
.doc-header{border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:20px}
.doc-header h1{font-size:20pt;font-weight:700}
.doc-header .meta{font-size:9pt;color:#666;margin-top:4px}
section{margin-bottom:24px;page-break-inside:avoid}
section h2{font-size:12pt;font-weight:700;margin-bottom:10px}
.goal-box{background:#f8f8f8;border:1px solid #e0e0e0;border-radius:6px;padding:12px 14px;margin-bottom:8px}
.goal-box .goal-text{font-size:12pt;font-weight:500}
.goal-box .axes{margin-top:6px;font-size:9pt;color:#444}
.goal-box .axes li{list-style:none;padding-left:1em;position:relative}
.goal-box .axes li::before{content:'・';position:absolute;left:0}
.goal-box .target-date{font-size:9pt;color:#666;margin-top:4px}
.card{border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:8px;page-break-inside:avoid}
.card-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
.card-title{font-size:11pt;font-weight:700}
.motivation{font-size:10pt;color:#555;white-space:nowrap;margin-left:8px}
.card-meta{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:6px}
.period{font-size:9pt;color:#555;margin-right:4px}
.memo{font-size:9pt;color:#555;margin-bottom:6px;font-style:italic}
.badge{display:inline-block;font-size:8pt;padding:1px 6px;border-radius:3px;border:1px solid #ccc;color:#555;white-space:nowrap}
.type-badge{background:#f3f4f6;border-color:#d1d5db}
.loc-badge{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
.mod-badge{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
.output-type{background:#f3f4f6;border-color:#d1d5db}
.badge-done{background:#dcfce7;border-color:#86efac;color:#166534}
.badge-planned{background:#f3e8ff;border-color:#d8b4fe;color:#6b21a8}
.outputs{margin-top:4px;padding-left:0;border-top:1px dashed #e5e7eb;padding-top:6px}
.outputs li{list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:2px 0;font-size:9pt}
.output-title{font-weight:500}
.no-output{color:#9ca3af;font-style:italic;font-size:9pt}
.url{color:#2563eb;font-size:8pt}
.url a{color:inherit}
</style></head><body>
<header class="doc-header">
  <h1>Learning Portfolio</h1>
  <p class="meta">${userName ? escHtml(userName) + '\u3000' : ''}出力日：${todayJa()}</p>
</header>
${wellbeingGoal ? `
<section>
  <h2 style="border-left:4px solid #27500A;padding-left:8px;color:#27500A;">ウェルビーイングゴール（Why）</h2>
  <div class="goal-box">
    <p class="goal-text">🌱 ${escHtml(wellbeingGoal.text)}</p>
    <ul class="axes">
      ${wellbeingGoal.axes.personal ? `<li>個人: ${escHtml(wellbeingGoal.axes.personal)}</li>` : ''}
      ${wellbeingGoal.axes.social   ? `<li>社会: ${escHtml(wellbeingGoal.axes.social)}</li>`   : ''}
      ${wellbeingGoal.axes.planet   ? `<li>地球: ${escHtml(wellbeingGoal.axes.planet)}</li>`   : ''}
    </ul>
  </div>
</section>` : ''}
${careerGoal ? `
<section>
  <h2 style="border-left:4px solid #633806;padding-left:8px;color:#633806;">キャリアゴール（What）</h2>
  <div class="goal-box">
    <p class="goal-text">${escHtml(careerGoal.text)}</p>
    ${careerGoal.targetDate ? `<p class="target-date">目標時期: ${fmtYM(careerGoal.targetDate)}</p>` : ''}
  </div>
</section>` : ''}
${renderSection('過去の学習',    past,    '#1D9E75')}
${renderSection('進行中の学習',  ongoing, '#EF9F27')}
${renderSection('今後の学習計画', future, '#534AB7')}
</body></html>`
}

// ── IPC: PDFポートフォリオ（A4縦、puppeteer） ───

ipcMain.handle('export-pdf-portfolio', async () => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
      title: 'PDFポートフォリオを保存',
      defaultPath: `horizon-guide-portfolio-${todayStr()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (canceled || !filePath) return { success: false, error: 'キャンセルされました' }

    const cards      = getAllLearningCards()
    const careerGoal = getCareerGoal()
    const wbGoal     = getWellbeingGoal()
    const html       = buildPortfolioHTML(careerGoal, wbGoal, cards)

    // 一時HTMLファイルを書き出す
    const tmpDir  = join(app.getPath('userData'), 'tmp')
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
    const tmpPath = join(tmpDir, `portfolio-${Date.now()}.html`)
    writeFileSync(tmpPath, html, 'utf-8')

    const puppeteer = await import('puppeteer')
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      await page.goto(`file://${tmpPath}`, { waitUntil: 'networkidle0', timeout: 30_000 })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
      })
      writeFileSync(filePath, pdfBuffer)
    } finally {
      await browser.close()
      try { require('fs').unlinkSync(tmpPath) } catch { /* ignore */ }
    }

    return { success: true, path: filePath }
  } catch (err) {
    console.error('export-pdf-portfolio error:', err)
    return { success: false, error: String(err) }
  }
})

// ── IPC: PDFタイムライン印刷（A3横、webContents.print） ─

ipcMain.handle('export-pdf-timeline', async () => {
  if (!mainWindow) return { success: false, error: 'ウィンドウが見つかりません' }
  try {
    // 印刷用CSSを注入（サイドパネル非表示・背景色保持）
    await mainWindow.webContents.executeJavaScript(`
      (() => {
        const existing = document.getElementById('__hg-print-style__')
        if (existing) existing.remove()
        const style = document.createElement('style')
        style.id = '__hg-print-style__'
        style.textContent = \`
          @media print {
            aside, header button, footer { display: none !important; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .timeline-scroll { overflow: visible !important; }
          }
        \`
        document.head.appendChild(style)
      })()
    `)

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const printOptions: WebContentsPrintOptions = {
        silent: false,
        printBackground: true,
        landscape: true,
        pageSize: 'A3',
        margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      }
      mainWindow!.webContents.print(printOptions, (success, errorType) => {
        mainWindow?.webContents.executeJavaScript(
          `document.getElementById('__hg-print-style__')?.remove()`
        ).catch(() => {})
        if (success) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: errorType === 'cancelled' ? 'キャンセルされました' : (errorType ?? '印刷失敗') })
        }
      })
    })
  } catch (err) {
    console.error('export-pdf-timeline error:', err)
    return { success: false, error: String(err) }
  }
})

// ── IPC: データ初期化 ──────────────────────────

ipcMain.handle('reset-database', async () => {
  try { resetDB() } catch (err) { console.error('reset-database error:', err); throw err }
})

// ── IPC: 研究用ログ記録（ベストエフォート） ────

ipcMain.handle('db-log-action',     (_e, entry) => { try { insertActionLog(entry)     } catch (e) { console.error('db-log-action:', e)     } })
ipcMain.handle('db-log-motivation', (_e, entry) => { try { insertMotivationLog(entry) } catch (e) { console.error('db-log-motivation:', e) } })
ipcMain.handle('db-log-goal',       (_e, entry) => { try { insertGoalLog(entry)       } catch (e) { console.error('db-log-goal:', e)       } })

// ── アプリケーションメニュー ────────────────────

function createMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    {
      label: '編集',
      submenu: [
        { role: 'undo' as const,      label: '元に戻す' },
        { role: 'redo' as const,      label: 'やり直す' },
        { type: 'separator' as const },
        { role: 'cut' as const,       label: '切り取り' },
        { role: 'copy' as const,      label: 'コピー' },
        { role: 'paste' as const,     label: '貼り付け' },
        { role: 'selectAll' as const, label: 'すべて選択' },
      ],
    },

    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'GitHubリポジトリ',
          click: () => shell.openExternal('https://github.com/kolinz/Horizon-Guide'),
        },
      ],
    },

    ...(process.env.NODE_ENV === 'development' ? [{
      label: '開発',
      submenu: [
        { role: 'reload' as const,          label: 'リロード' },
        { role: 'forceReload' as const,     label: '強制リロード' },
        { role: 'toggleDevTools' as const,  label: 'DevToolsを開く' },
      ],
    }] : []),
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
