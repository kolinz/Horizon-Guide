あなたは **Horizon Guide** というElectronデスクトップアプリの開発パートナーです。
このプロジェクトでは、設計・実装・レビュー・デバッグをともに行います。

## 実行環境

- **Node.js**: v24（LTS）
- **npm**: v10以上（Node.js v24に同梱）
- **OS**: Windows 10/11 または macOS 12 Monterey 以降

Node.js v24の主な特徴（活用してください）：
- `fetch` APIがグローバルで使用可能（node-fetchは不要）
- `URL` / `URLSearchParams` がグローバルで使用可能
- Web Crypto API がグローバルで使用可能（`uuid`生成に活用可）
- ESM（ES Modules）を標準として使用する

---

## プロダクト概要

**Horizon Guide** は、学習者がキャリアゴールとウェルビーイングゴールを起点に、過去・未来の学習をタイムライン上で自ら設計・記録し、AI（DifyまたはLLM）から助言を得ながら学習とアウトプットを継続的に管理するElectronデスクトップアプリケーションです。

### コアコンセプト

```
ウェルビーイングゴール（Why）── OECD 2030：個人・社会・地球の3軸
      ↓
キャリアゴール（What）
      ↓
過去の学習 ── 進行中 ── 現在 ── 未来の学習
  └ アウトプット紐づけ        └ アウトプット紐づけ（予定）
      ↕
    AI助言（Chat mode / Analyze mode）
```

- **学習の主体はユーザー**：AIが計画を自動生成しない
- **AIは支援・助言役**：WBゴール・キャリアゴール・タイムライン全体を参照して助言
- **アウトプット駆動**：各学習に成果物（記事・資格・リポジトリ等）を必ず紐づける
- **OECD Education 2030対応**：Student Agency / AARサイクル / ウェルビーイングの思想を実装
- **研究用行動ログ**：D論実証実験向けに、カード操作・モチベーション変化・ゴール設定・セッションを自動記録し、匿名化してエクスポートできる

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| **実行環境** | **Node.js v24（LTS）** |
| デスクトップ | Electron 41+（Node.js v24対応版） |
| フロントエンド | React 18+ + TypeScript |
| ビルドツール | Vite v7 + electron-vite v5（vite v8はelectron-vite未対応のためv7固定） |
| スタイリング | Tailwind CSS v3 |
| 状態管理 | Zustand |
| データ永続化 | better-sqlite3 v12.8+（SQLite）（v12.8以降でElectron 41対応） |
| DBマイグレーション | カスタムマイグレーション（migrate.ts） |
| APIキー保存 | keytar（OSキーチェーン） |
| AI接続 | Dify Chat API（優先）/ Gemini API（LLM直接優先・無料枠）/ Anthropic API / OpenAI API / ローカルLLM（Ollama等・APIキー不要） |
| PDFポートフォリオ | puppeteer |
| CSVエクスポート | papaparse + jszip |
| パッケージャ | electron-builder（Windows NSIS / Mac dmg） |

---

## セットアップ手順（確定版）

```powershell
# 1. 依存パッケージのインストール（--ignore-scripts 必須）
npm install --ignore-scripts

# 2. Electronバイナリ取得 + ネイティブモジュールリビルド
npm run setup

# 3. 開発モードで起動
npm run dev
```

`npm install`（引数なし）は**使用禁止**。`better-sqlite3` のビルドスクリプトが自動実行されエラーになる。
`npm run setup` の内容：`node node_modules/electron/install.js && node ./node_modules/@electron/rebuild/lib/cli.js -f -w better-sqlite3,keytar --version 41.0.3`

---

## package.json（確定版）

```json
{
  "name": "horizon-guide",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=24.0.0" },
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:all": "npm run build && electron-builder --win --mac",
    "rebuild": "node ./node_modules/@electron/rebuild/lib/cli.js -f -w better-sqlite3,keytar --version 41.0.3",
    "setup": "node node_modules/electron/install.js && node ./node_modules/@electron/rebuild/lib/cli.js -f -w better-sqlite3,keytar --version 41.0.3"
  },
  "dependencies": {
    "better-sqlite3": "^12.8.0",
    "jszip": "^3.10.1",
    "keytar": "^7.9.0",
    "lucide-react": "^0.511.0",
    "papaparse": "^5.4.1",
    "puppeteer": "^22.0.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/tsconfig": "^2.0.0",
    "@electron-toolkit/utils": "^3.0.0",
    "@electron/rebuild": "^4.0.3",
    "@types/better-sqlite3": "^7.6.9",
    "@types/keytar": "^4.4.2",
    "@types/node": "^20.12.7",
    "@types/papaparse": "^5.3.14",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.4.19",
    "electron": "^41.0.3",
    "electron-builder": "^26.8.1",
    "electron-vite": "^5.0.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^7.0.0"
  }
},
  "build": {
    "electronRebuildConfig": {
      "onlyModules": ["better-sqlite3", "keytar"],
      "force": true
    }
  }
}
```

---

## ディレクトリ構成

```
horizon-guide/
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   ├── ai-bridge.ts
│   └── db/
│       ├── database.ts
│       ├── schema.sql
│       ├── migrate.ts
│       ├── migrations/
│       │   └── 001_initial.sql
│       └── queries/
│           ├── learningCards.ts
│           ├── outputCards.ts
│           ├── goals.ts
│           ├── aiHistory.ts
│           └── researchLog.ts
├── src/
│   ├── index.html
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Timeline/
│   │   │   ├── TimelineView.tsx
│   │   │   ├── LearningCard.tsx
│   │   │   ├── MotivationPicker.tsx
│   │   │   └── OutputCard.tsx
│   │   ├── Sidebar/
│   │   │   ├── AISidebar.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── Modals/
│   │   │   ├── LearningCardModal.tsx
│   │   │   ├── OutputCardModal.tsx
│   │   │   ├── GoalModal.tsx
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   └── ResetConfirmModal.tsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.tsx
│   │   ├── TopBar.tsx
│   │   └── Onboarding/
│   │       └── OnboardingFlow.tsx
│   ├── stores/
│   │   ├── timelineStore.ts
│   │   ├── goalStore.ts
│   │   └── aiStore.ts
│   ├── utils/
│   │   ├── contextBuilder.ts
│   │   └── dateUtils.ts
│   └── types/
│       ├── index.ts
│       └── electronAPI.d.ts
├── electron.vite.config.ts
├── package.json
├── electron-builder.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## electron.vite.config.ts（確定版）

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// マイグレーションファイルを out/main/migrations/ にコピーするプラグイン
const copyMigrationsPlugin = {
  name: 'copy-migrations',
  closeBundle() {
    const src = path.resolve('electron/db/migrations')
    const dest = path.resolve('out/main/migrations')
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((f) => {
      fs.copyFileSync(path.join(src, f), path.join(dest, f))
    })
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrationsPlugin],
    build: {
      lib: { entry: { index: resolve('electron/main.ts') } },
      rollupOptions: { external: ['better-sqlite3', 'keytar'] },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: { index: resolve('electron/preload.ts') } },
      rollupOptions: { external: ['better-sqlite3', 'keytar'] },
    },
  },
  renderer: {
    root: resolve('src'),
    plugins: [react()],
    build: {
      rollupOptions: { input: resolve('src/index.html') },
    },
  },
})
```

> **注意**：electron-vite v5のビルド出力は `out/preload/index.mjs`（ESM形式）。
> `electron/main.ts` の preload パスは `join(__dirname, '../preload/index.mjs')` とすること。

---

## SQLiteスキーマ

```sql
CREATE TABLE career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,
  user_name   TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE wellbeing_goals (
  id             TEXT PRIMARY KEY,
  text           TEXT NOT NULL,
  personal_axis  TEXT,
  social_axis    TEXT,
  planet_axis    TEXT,
  ai_generated   INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE learning_cards (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  start_date       TEXT NOT NULL,
  end_date         TEXT,
  type             TEXT NOT NULL,
  location         TEXT,
  modality         TEXT,
  phase            TEXT NOT NULL,
  is_completed     INTEGER NOT NULL DEFAULT 0,
  motivation_level INTEGER,
  memo             TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE output_cards (
  id               TEXT PRIMARY KEY,
  learning_card_id TEXT NOT NULL REFERENCES learning_cards(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,
  url              TEXT,
  status           TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE ai_history (
  id                TEXT PRIMARY KEY,
  mode              TEXT NOT NULL,
  user_message      TEXT,
  ai_response       TEXT NOT NULL,
  provider          TEXT NOT NULL,
  model_or_endpoint TEXT,
  timestamp         TEXT NOT NULL
);

CREATE TABLE action_log (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  target_title  TEXT NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  timestamp     TEXT NOT NULL
);

CREATE TABLE motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

CREATE TABLE goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  goal_type       TEXT NOT NULL,
  previous_value  TEXT,
  new_value       TEXT NOT NULL,
  timestamp       TEXT NOT NULL
);

CREATE TABLE session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL
);
```

---

## TypeScript型定義

```typescript
type LearningType = 'class' | 'self_study' | 'training' | 'certificate' | 'other'
type LearningLocation = 'home' | 'university' | 'workplace' | 'cafe' | 'library' | 'online' | 'other'
type LearningModality = 'in_person' | 'hybrid' | 'hyflex' | 'online'
type LearningPhase = 'past' | 'ongoing' | 'future'
type OutputType = 'article' | 'repository' | 'certificate' | 'presentation' | 'project' | 'other'
type AIProvider = 'llm' | 'local' | 'dify' | 'langflow'
type MotivationLevel = 1 | 2 | 3 | 4 | 5

interface CareerGoal {
  id: string
  text: string
  targetDate: string | null
  userName: string | null
  createdAt: string
  updatedAt: string
}

interface WellbeingGoal {
  id: string
  text: string
  axes: {
    personal: string | null
    social: string | null
    planet: string | null
  }
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

interface LearningCard {
  id: string
  title: string
  startDate: string
  endDate: string | null
  type: LearningType
  location: LearningLocation | null
  modality: LearningModality | null
  phase: LearningPhase
  isCompleted: boolean
  motivationLevel: MotivationLevel | null
  memo: string
  outputs: OutputCard[]
  createdAt: string
  updatedAt: string
}

interface OutputCard {
  id: string
  learningCardId: string
  title: string
  type: OutputType
  url: string | null
  status: 'done' | 'planned'
  createdAt: string
  updatedAt: string
}

interface AIConfig {
  provider: AIProvider
  llm?: {
    service: 'gemini' | 'claude' | 'openai'
    model: string
  }
  local?: {
    endpoint: string  // 例: http://localhost:11434
    model: string     // 例: gemma3:4b（APIキー不要）
  }
  dify?: {
    endpoint: string
  }
}
```

---

## IPC通信設計（preload.ts）

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  getLearningCards: () => ipcRenderer.invoke('db-get-learning-cards'),
  upsertLearningCard: (card: LearningCard) => ipcRenderer.invoke('db-upsert-learning-card', card),
  deleteLearningCard: (id: string) => ipcRenderer.invoke('db-delete-learning-card', id),
  updateMotivation: (id: string, level: number | null) =>
    ipcRenderer.invoke('db-update-motivation', { id, level }),
  upsertOutputCard: (card: OutputCard) => ipcRenderer.invoke('db-upsert-output-card', card),
  deleteOutputCard: (id: string) => ipcRenderer.invoke('db-delete-output-card', id),
  getCareerGoal: () => ipcRenderer.invoke('db-get-career-goal'),
  saveCareerGoal: (goal: CareerGoal) => ipcRenderer.invoke('db-save-career-goal', goal),
  getWellbeingGoal: () => ipcRenderer.invoke('db-get-wellbeing-goal'),
  saveWellbeingGoal: (goal: WellbeingGoal) => ipcRenderer.invoke('db-save-wellbeing-goal', goal),
  saveAIConfig: (config: AIConfig) => ipcRenderer.invoke('save-ai-config', config),
  loadAIConfig: () => ipcRenderer.invoke('load-ai-config'),
  saveApiKey: (provider: string, apiKey: string) =>
    ipcRenderer.invoke('save-api-key', { provider, apiKey }),
  loadApiKey: (provider: string) => ipcRenderer.invoke('load-api-key', provider),
  chatAI: (message: string, context: string) =>
    ipcRenderer.invoke('chat-ai', { message, context }),
  analyzeAI: (context: string) =>
    ipcRenderer.invoke('analyze-ai', { context }),
  exportCSV: () => ipcRenderer.invoke('export-csv'),
  exportResearchLog: (anonymize: boolean) =>
    ipcRenderer.invoke('export-research-log', { anonymize }),
  resetDatabase: () => ipcRenderer.invoke('reset-database'),
  logAction: (entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-action', entry),
  logMotivation: (entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-motivation', entry),
  logGoal: (entry: Omit<GoalLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-goal', entry),
})
```

---

## AIコンテキスト生成関数

```typescript
function buildContext(
  careerGoal: CareerGoal,
  wellbeingGoal: WellbeingGoal | null,
  learningCards: LearningCard[]
): string {
  return `
【ウェルビーイングゴール（Why）】
${wellbeingGoal
  ? `${wellbeingGoal.text}
  - 個人: ${wellbeingGoal.axes.personal ?? '未設定'}
  - 社会: ${wellbeingGoal.axes.social ?? '未設定'}
  - 地球: ${wellbeingGoal.axes.planet ?? '未設定'}`
  : '未設定'}

【キャリアゴール（What）】
${careerGoal.text}
目標時期: ${careerGoal.targetDate ?? '未設定'}

【学習タイムライン】
${learningCards.map(card => `
- [${card.phase === 'past' ? '過去' : card.phase === 'ongoing' ? '進行中' : '未来'}] ${card.title}
  期間: ${card.startDate} ～ ${card.endDate ?? '進行中'}
  種別: ${card.type}
  モチベーション: ${card.motivationLevel ? `${card.motivationLevel}/5` : '未設定'}
  アウトプット:
  ${card.outputs.map(o =>
    `  ・${o.title}（${o.type}）[${o.status === 'done' ? '完了' : '予定'}]`
  ).join('\n') || '  （なし）'}
`).join('\n')}
  `.trim()
}
```

---

## UIの主要仕様

### ホーム画面レイアウト

```
┌──────────────────────────────────────────────────────────┬──────────────┐
│ Horizon Guide        [AI 助言] [＋ 学習を追加] [設定]    │  AI 助言     │
│ [WB: 🌱 ゴールテキスト] → [Career: DS転職（2027.03）]    │  LLM接続中   │
│ ─────────────────────────────────────────────────────    │──────────────│
│  月ルーラー（横スクロール）               現在             │ AI発言       │
│  ┌──────────────┐  ┌──────┐            │  ┌──────┐      │              │
│  │ 学習カード   │  │      │            │  │      │      │ ユーザー発言 │
│  │ 😄5          │  │      │            │  │      │      │──────────────│
│  └──────────────┘  └──────┘            │                │ [入力][送信] │
│     │（縦線）                           │                │              │
│  ┌──────────────┐                                        │ ← ドラッグで │
│  │ アウトプット │                                        │   幅変更可   │
│  └──────────────┘                      │                │ （200〜600px）│
└──────────────────────────────────────────────────────────┴──────────────┘
```

### オンボーディング（4ステップ）

1. ウェルカム画面
2. AI接続設定（Gemini / ローカルLLM 選択・スキップ可）
   - 2択カードUI：☁️ Gemini（クラウド）/ 💻 ローカルLLM
   - Gemini選択時：APIキー入力 → keytarに保存、provider='llm', model='gemini-2.5-flash-lite'
   - ローカルLLM選択時：エンドポイントURL（デフォルト: http://localhost:11434）＋モデル名（デフォルト: gemma3:4b）、provider='local'、APIキー不要
3. キャリアゴール入力（必須）
4. WBゴール設定（任意・AIによる提案あり）

### 学習カードの仕様

- **過去**：緑の左ボーダー（`border-left: 2.5px solid #1D9E75`）
- **進行中**：オレンジの左ボーダー（`border-left: 2.5px solid #EF9F27`）
- **未来**：紫の左ボーダー（`border-left: 2.5px solid #534AB7`）
- カード右下にモチベーション顔アイコン＋数値
  - 😣1 / 😞2 / 😐3 / 🙂4 / 😄5、未設定は😶「–」を薄く表示
- 起動時にタイムラインの現在月が画面中央に自動スクロール

### AIサイドバーの仕様

- デフォルト幅：280px
- 左端ドラッグでリサイズ可能（最小200px〜最大600px）
- リサイズハンドル：左端に1px幅（ホバーで青くなる）

### 設定画面のAI接続設定

```
○ LLM直接接続（クラウド）  Gemini優先
  Gemini: gemini-2.5-flash-lite（無料枠あり）
  Claude: claude-haiku-4-5-20251001
  ChatGPT: gpt-5o-mini

○ ローカルLLM接続          APIキー不要
  エンドポイントURL: [http://localhost:11434]
  モデル名:         [gemma3:4b]
  ※ ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。

○ Dify                     優先推奨
○ Langflow                 近日対応
```

---

## AI接続仕様

### Dify接続

```typescript
POST {endpoint}/v1/chat-messages
Authorization: Bearer {apiKey}
{
  "inputs": { "timeline_context": "{buildContext()の出力}" },
  "query": "{ユーザーの質問}",
  "response_mode": "streaming",
  "user": "horizon-guide-user"
}
```

### Gemini API接続（LLM直接接続のデフォルト）

```typescript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key={apiKey}
{
  "system_instruction": { "parts": [{ "text": "あなたは学習設計の専門家AIです。..." }] },
  "contents": [{ "role": "user", "parts": [{ "text": "{context}\n\n{userMessage}" }] }],
  "generationConfig": { "temperature": 0.7, "maxOutputTokens": 1024 }
}
```

### ローカルLLM接続（Ollama等）

```typescript
// API形式の自動判別
// URLに /api/chat を含む or /v1/ を含まない → Ollama ネイティブAPI
// それ以外 → OpenAI互換API

// Ollama ネイティブAPI
POST {endpoint}/api/chat
{
  "model": "{config.local.model}",  // 例: gemma3:4b
  "messages": [
    { "role": "system", "content": "あなたは学習設計の専門家AIです。..." },
    { "role": "user",   "content": "{context}\n\n{userMessage}" }
  ],
  "stream": false
}
// レスポンス: data.message.content

// OpenAI互換API（LM Studio等）
POST {endpoint}/v1/chat/completions
{
  "model": "{config.local.model}",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 1024
}
// レスポンス: data.choices[0].message.content

// APIキー不要、provider: 'local' として ai_history に記録
```

### Analyze mode プロンプト（固定テンプレート）

```
以下のウェルビーイングゴール・キャリアゴール・学習タイムラインをもとに、
総合的な助言をしてください。

{context}

【助言してほしい観点】
1. WBゴール・キャリアゴールと現在の学習進捗の整合性
2. アウトプットが不足している学習があれば具体的に指摘
3. 今後の学習計画で追加・修正を推奨する内容
4. キャリアゴール達成に向けた優先アクション（3つ以内）

日本語で、具体的かつ簡潔に回答してください。
```

---

## 機能要件サマリー（MVP）

| ID | 機能 | 優先度 |
|----|------|--------|
| FR-01 | キャリアゴール設定（設定画面＋ゴールピル両方） | Must |
| FR-01b | WBゴール設定（AIチャットで提案・3軸） | Should |
| FR-02 | 学習カードCRUD | Must |
| FR-03 | アウトプットカードCRUD（親子紐づけ） | Must |
| FR-04 | 横軸時系列タイムライン（起動時に現在月中央表示） | Must |
| FR-05 | AI助言：Chat mode（サイドパネル・リサイズ対応） | Must |
| FR-06 | AI助言：Analyze mode（「AI 助言」ボタン） | Must |
| FR-07 | AI接続設定（LLM直接（クラウド）/ ローカルLLM / Dify切り替え） | Must |
| FR-08 | SQLite永続化（better-sqlite3） | Must |
| FR-08b | データ初期化（設定画面・2段階確認） | Should |
| FR-09 | 完了マーク・進行中状態・モチベーション1〜5 | Should |
| FR-10 | CSVエクスポート5種（ZIP） | Should |
| FR-10b | 研究用行動ログエクスポート（匿名化対応） | **Must** |
| FR-11 | PDFポートフォリオ（A4・WBゴール含む） | Should |
| FR-12 | PDFタイムライン印刷 | Could |
| FR-18 | CSVインポート（デフォルトオフ・card_imported区別） | 機能追加バックログ |

---

## 研究用行動ログ仕様

### 自動記録のトリガーと記録先

| 操作 | 記録テーブル | event_type |
|------|-------------|------------|
| 学習カード追加 | action_log | card_created |
| 学習カード編集 | action_log | card_updated |
| 学習カード削除 | action_log | card_deleted |
| 学習カード完了マーク | action_log | card_completed |
| CSVインポートでカード生成 | action_log | card_imported |
| アウトプットカード追加 | action_log | output_created |
| アウトプットカード編集 | action_log | output_updated |
| アウトプットカード削除 | action_log | output_deleted |
| モチベーションレベル変更 | motivation_log | — |
| キャリアゴール初回設定 | goal_log | goal_created |
| キャリアゴール変更 | goal_log | goal_updated |
| WBゴール初回設定 | goal_log | goal_created |
| WBゴール変更 | goal_log | goal_updated |
| アプリ起動 | session_log | app_launched |
| アプリ終了 | session_log | app_closed |

---

## 開発時の重要ルール

1. **Node.js v24前提**：`fetch`・`crypto.randomUUID()`等のWeb標準APIをグローバルで使用可。`node-fetch`・`uuid`パッケージは不要
2. **Electronセキュリティ**：`contextIsolation: true`、`nodeIntegration: false` を必ず維持する
3. **APIキー**：レンダラープロセスには渡さない。メインプロセスの`ai-bridge.ts`経由でのみAPIを呼ぶ
4. **SQLite操作**：すべてメインプロセス側（`electron/db/`）で行い、IPCで結果を返す
5. **自動保存**：カード操作・モチベーション変更のたびに即時SQLite書き込み
6. **行動ログの自動記録**：カード操作・モチベーション変更・ゴール設定の直後に必ず対応するログテーブルに記録する。ログ記録の失敗はメイン操作をロールバックしない（ベストエフォート）
7. **セッションログ**：メインプロセスの `app.on('ready')` で `app_launched`、`app.on('before-quit')` で `app_closed` を記録する
8. **フェーズ自動判定**：
   - `endDate < today` → `past`
   - `startDate <= today && (endDate === null || endDate >= today)` → `ongoing`
   - `startDate > today` → `future`
9. **ID生成**：`crypto.randomUUID()`（Node.js v24グローバル）を使用。`uuid`パッケージ不要
10. **fetch API**：Node.js v24グローバルの`fetch`を使用。`node-fetch`・`axios`不要
11. **セットアップ手順**：`npm install --ignore-scripts` → `npm run setup` → `npm run dev` の順。`npm install`（引数なし）は使用禁止
12. **preloadビルド出力**：electron-vite v5は `out/preload/index.mjs`（ESM）を出力する。`main.ts`のpreloadパスは `join(__dirname, '../preload/index.mjs')` とすること
13. **マイグレーション自動コピー**：`electron.vite.config.ts` に `copyMigrationsPlugin` を追加し、ビルド時に `electron/db/migrations/` を `out/main/migrations/` へ自動コピーする
14. **ローカルLLM接続**：`config.provider === 'local'` の場合、APIキー不要。エンドポイントURLでOllamaネイティブAPIとOpenAI互換APIを自動判別する
15. **Tailwind CSS**：カスタムカラーはtailwind.config.tsに定義してクラスで使う
16. **同時期カードの縦スタック**：期間が重なる学習カードはTimelineView.tsx側でグループ化し、同一列に縦スタック表示する
17. **コードスタイル**：関数コンポーネント＋Hooks、classコンポーネント不使用

---

## 開発の進め方

このProjectでは以下の順番で実装を進めます：

**Step 1**：プロジェクト雛形（electron-vite + React + TypeScript）
**Step 2**：SQLiteスキーマ・DB初期化・マイグレーション
**Step 3**：IPC通信設計（preload.ts + main.ts）
**Step 4**：Zustandストア
**Step 5**：タイムライン画面の基本UI（現在月中央スクロール含む）
**Step 6**：学習カード・アウトプットカードのCRUD
**Step 7**：モチベーションレベルのUI・DB連携
**Step 8**：AI助言サイドパネル（Chat mode・リサイズ機能含む）
**Step 9**：Analyze mode + AI接続（Dify / Gemini / Claude / GPT / ローカルLLM）
**Step 10**：設定画面（LLM直接（クラウド）/ ローカルLLM / Dify / データ管理）
**Step 11**：CSVエクスポート・研究用行動ログエクスポート・PDFポートフォリオ
**Step 12**：データ初期化機能
**Step 13**：オンボーディング（4ステップ）
**Step 14**：electron-builderでパッケージング

実装する際は、必ずこのプロジェクト定義を参照してください。
仕様と異なる実装をする場合は、理由を説明してから変更を提案してください。

---

*対応SDD：HG-SDD-001 v0.9.7*
*Node.js v24（LTS）前提*
