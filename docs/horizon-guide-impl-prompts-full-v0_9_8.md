# Horizon Guide — 実装プロンプト集（フル実装版 v0.9.8）

各Stepのプロンプトを、**このチャット（claude.ai通常会話）にそのまま貼り付けて**実行してください。
各Stepの末尾に「ファイルを生成してダウンロードできるよう出力してください」という指示が含まれているため、実行するとファイルをダウンロードできます。

> **前提**：claude.aiの通常チャットで実行してください。ファイル生成・ダウンロード機能はProjectチャットでは使えません。
> **前提環境**：Node.js v24（LTS）、npm v10以上
> Node.js v24では `fetch`・`crypto.randomUUID()` がグローバルで使用可能です。
> `node-fetch`・`uuid` パッケージは使用しないでください。
> **対応SDD**：HG-SDD-001 v0.9.8

---

## Step 1 — プロジェクト雛形の生成

```
Node.js v24を前提として、electron-viteでHorizon Guideのプロジェクト雛形を生成してください。

【環境前提】
- Node.js: v24（LTS）
- npm: v10以上
- electron-viteテンプレート：react-ts

【生成するファイル】
package.json（以下の内容で）：
- name: horizon-guide
- engines: { "node": ">=24.0.0" }
- type: "module"（ESM）
- scripts:
  - "dev": "electron-vite dev"
  - "build": "electron-vite build"
  - "build:win": "npm run build && electron-builder --win"
  - "build:mac": "npm run build && electron-builder --mac"
  - "build:all": "npm run build && electron-builder --win --mac"
  - "rebuild": "electron-rebuild"
  - "setup": "node node_modules/electron/install.js && node ./node_modules/@electron/rebuild/lib/cli.js -f -w better-sqlite3,keytar --version 41.0.3"

【インストールパッケージ】
dependencies（本番）:
- better-sqlite3 ^12.8.0
- keytar ^7.9.0
- zustand ^5.0.0
- papaparse ^5.4.1
- jszip ^3.10.1
- lucide-react ^0.511.0
- puppeteer ^22.0.0
- react ^19.2.4
- react-dom ^19.2.4

devDependencies:
- @electron-toolkit/preload ^3.0.1
- @electron-toolkit/tsconfig ^2.0.0
- @electron-toolkit/utils ^3.0.0
- @electron/rebuild ^4.0.3
- @types/better-sqlite3 ^7.6.9
- @types/keytar ^4.4.2
- @types/node ^20.12.7
- @types/papaparse ^5.3.14
- @types/react ^19.0.0
- @types/react-dom ^19.0.0
- @vitejs/plugin-react ^4.7.0
- autoprefixer ^10.4.19
- electron ^41.0.3
- electron-builder ^26.8.1
- electron-vite ^5.0.0
- postcss ^8.4.38
- tailwindcss ^3.4.3
- typescript ^5.4.5
- vite ^7.0.0

【注意点】
- Node.js v24では crypto.randomUUID() がグローバル使用可能なため uuid パッケージは不要
- Node.js v24では fetch がグローバル使用可能なため node-fetch パッケージは不要
- better-sqlite3 と keytar はネイティブモジュールのため npm run setup が必要
- vite は v7 固定（electron-vite v5 は vite v8 未対応）

【追加生成ファイル】
1. tailwind.config.ts（カスタムカラー定義）：
   - past: '#1D9E75'
   - ongoing: '#EF9F27'
   - future: '#534AB7'
   - wb: { green: '#27500A', bg: '#EAF3DE' }
   - career: { brown: '#633806', bg: '#FAEEDA' }

2. postcss.config.js

3. tsconfig.json / tsconfig.node.json / tsconfig.web.json

4. electron-builder.config.js（基本設定）

5. .nvmrc（内容：24）、.node-version（内容：24）

6. electron.vite.config.ts（必須設定）：
   - main.build.lib.entry: { index: resolve('electron/main.ts') }
   - preload.build.lib.entry: { index: resolve('electron/preload.ts') }
   - renderer.root: resolve('src')
   - renderer.build.rollupOptions.input: resolve('src/index.html')
   - copyMigrationsPlugin を追加（ビルド時に electron/db/migrations/ を out/main/migrations/ へ自動コピー）

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。

【配置方法】
ダウンロードしたファイルをすべて horizon-guide/ フォルダの直下に配置してください。
配置後、以下の順番で実行してください：
1. npm install --ignore-scripts
2. npm run setup
3. npm run dev

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 2 — SQLiteスキーマ・DB初期化・マイグレーション

```
electron/db/ ディレクトリ以下のファイルを実装してください。

【schema.sql】
以下のすべてのテーブルを定義してください：

-- キャリアゴール
CREATE TABLE IF NOT EXISTS career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,
  user_name   TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ウェルビーイングゴール
CREATE TABLE IF NOT EXISTS wellbeing_goals (
  id             TEXT PRIMARY KEY,
  text           TEXT NOT NULL,
  personal_axis  TEXT,
  social_axis    TEXT,
  planet_axis    TEXT,
  ai_generated   INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- 学習カード（親）
CREATE TABLE IF NOT EXISTS learning_cards (
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

-- アウトプットカード（子）
CREATE TABLE IF NOT EXISTS output_cards (
  id               TEXT PRIMARY KEY,
  learning_card_id TEXT NOT NULL REFERENCES learning_cards(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,
  url              TEXT,
  status           TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- AI助言履歴
CREATE TABLE IF NOT EXISTS ai_history (
  id                TEXT PRIMARY KEY,
  mode              TEXT NOT NULL,
  user_message      TEXT,
  ai_response       TEXT NOT NULL,
  provider          TEXT NOT NULL,
  model_or_endpoint TEXT,
  timestamp         TEXT NOT NULL
);

-- 研究用：カード操作ログ
CREATE TABLE IF NOT EXISTS action_log (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  target_type   TEXT NOT NULL,
  target_id     TEXT NOT NULL,
  target_title  TEXT NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  timestamp     TEXT NOT NULL
);

-- 研究用：モチベーション変化ログ
CREATE TABLE IF NOT EXISTS motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

-- 研究用：ゴール設定ログ
CREATE TABLE IF NOT EXISTS goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  goal_type       TEXT NOT NULL,
  previous_value  TEXT,
  new_value       TEXT NOT NULL,
  timestamp       TEXT NOT NULL
);

-- 研究用：セッションログ
CREATE TABLE IF NOT EXISTS session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  timestamp   TEXT NOT NULL
);

-- 学習者プロフィール（FR-19）
CREATE TABLE IF NOT EXISTS user_profile (
  id              TEXT PRIMARY KEY,
  learner_type    TEXT,
  academic_field  TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 学問分野マスタ（FR-19）
CREATE TABLE IF NOT EXISTS academic_field_master (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL,
  is_active   INTEGER NOT NULL DEFAULT 1
);

【database.ts】
- better-sqlite3でDBを初期化する関数 initDatabase() を実装
- 保存先は app.getPath('userData') + '/horizon-guide.db'
- 外部キー制約を有効化（PRAGMA foreign_keys = ON）
- schema.sql を読み込んでテーブルを作成

【migrate.ts】
- マイグレーション管理クラスを実装
- migrations/ フォルダに 001_initial.sql を置く構成
- 未適用のマイグレーションを順番に適用する runMigrations() を実装

【migrations/001_initial.sql】
schema.sql と同じテーブル定義（CREATE TABLE IF NOT EXISTS）に加えて、
学問分野の初期データを挿入してください：

INSERT OR IGNORE INTO academic_field_master (id, label, sort_order, is_active) VALUES
  ('none',        'なし',          1, 1),
  ('informatics', '情報学',        2, 1),
  ('business',    '経営学',        3, 1),
  ('sociology',   '社会学',        4, 1),
  ('anime_manga', 'アニメ・マンガ', 5, 1),
  ('other',       'その他',        6, 1);

【queries/learningCards.ts】
- getAllLearningCards(): LearningCard[]（output_cardsをJOINして返す）
- upsertLearningCard(card: LearningCard): void
- deleteLearningCard(id: string): void
- updateMotivationLevel(id: string, level: number | null): void

フェーズの自動判定ロジック：
- endDate < today → 'past'
- startDate <= today && (endDate === null || endDate >= today) → 'ongoing'
- startDate > today → 'future'

【queries/outputCards.ts】
- upsertOutputCard(card: OutputCard): void
- deleteOutputCard(id: string): void

【queries/goals.ts】
- getCareerGoal(): CareerGoal | null
- saveCareerGoal(goal: CareerGoal): void
- getWellbeingGoal(): WellbeingGoal | null
- saveWellbeingGoal(goal: WellbeingGoal): void

【queries/aiHistory.ts】
- insertAIHistory(entry: AIHistoryEntry): void
- getAllAIHistory(): AIHistoryEntry[]

【queries/researchLog.ts】
- insertActionLog / insertMotivationLog / insertGoalLog / insertSessionLog
- getAllActionLogs / getAllMotivationLogs / getAllGoalLogs / getAllSessionLogs

【queries/userProfile.ts】（FR-19・新規作成）

型定義：
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

実装する関数：
- getUserProfile(): UserProfileRow | null
  → id='profile' 固定で1件取得。存在しなければ null を返す

- saveUserProfile(learnerType: string | null, academicField: string | null): void
  → id='profile' 固定でupsert（INSERT OR REPLACE）

- getAcademicFieldMaster(): AcademicFieldRow[]
  → is_active=1 のみ sort_order 昇順で取得

- addAcademicField(label: string): AcademicFieldRow
  → id: crypto.randomUUID()、sort_order: 現在の最大値+1

- deleteAcademicField(id: string): void
  → 論理削除（is_active=0 にUPDATE）

- reorderAcademicFields(ids: string[]): void
  → better-sqlite3のtransactionで sort_order を一括更新

すべての関数は better-sqlite3 の同期APIを使用してください。
各エントリのidは crypto.randomUUID()、timestamp は new Date().toISOString() で生成してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/db/schema.sql
- electron/db/database.ts
- electron/db/migrate.ts
- electron/db/migrations/001_initial.sql
- electron/db/queries/learningCards.ts
- electron/db/queries/outputCards.ts
- electron/db/queries/goals.ts
- electron/db/queries/aiHistory.ts
- electron/db/queries/researchLog.ts
- electron/db/queries/userProfile.ts

【配置方法】
horizon-guide/
└── electron/
    └── db/
        ├── schema.sql
        ├── database.ts
        ├── migrate.ts
        ├── migrations/
        │   └── 001_initial.sql
        └── queries/
            ├── learningCards.ts
            ├── outputCards.ts
            ├── goals.ts
            ├── aiHistory.ts
            ├── researchLog.ts
            └── userProfile.ts   ← FR-19・新規

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 3 — IPC通信設計（preload.ts + main.ts）

```
ElectronのIPC通信を実装してください。

【electron/preload.ts】
contextBridge.exposeInMainWorld('electronAPI', { ... }) を実装してください。

以下のすべてのメソッドを含めてください：

// 学習カード CRUD
getLearningCards: () => ipcRenderer.invoke('db-get-learning-cards'),
upsertLearningCard: (card) => ipcRenderer.invoke('db-upsert-learning-card', card),
deleteLearningCard: (id) => ipcRenderer.invoke('db-delete-learning-card', id),
updateMotivation: (id, level) => ipcRenderer.invoke('db-update-motivation', { id, level }),

// アウトプットカード CRUD
upsertOutputCard: (card) => ipcRenderer.invoke('db-upsert-output-card', card),
deleteOutputCard: (id) => ipcRenderer.invoke('db-delete-output-card', id),

// ゴール
getCareerGoal: () => ipcRenderer.invoke('db-get-career-goal'),
saveCareerGoal: (goal) => ipcRenderer.invoke('db-save-career-goal', goal),
getWellbeingGoal: () => ipcRenderer.invoke('db-get-wellbeing-goal'),
saveWellbeingGoal: (goal) => ipcRenderer.invoke('db-save-wellbeing-goal', goal),

// AI設定
saveAIConfig: (config) => ipcRenderer.invoke('save-ai-config', config),
loadAIConfig: () => ipcRenderer.invoke('load-ai-config'),
saveApiKey: (provider, key) => ipcRenderer.invoke('save-api-key', { provider, apiKey: key }),
loadApiKey: (provider) => ipcRenderer.invoke('load-api-key', provider),
chatAI: (message, context) => ipcRenderer.invoke('chat-ai', { message, context }),
analyzeAI: (context) => ipcRenderer.invoke('analyze-ai', { context }),

// データ管理
exportCSV: () => ipcRenderer.invoke('export-csv'),
exportPDFPortfolio: () => ipcRenderer.invoke('export-pdf-portfolio'),
exportPDFTimeline: () => ipcRenderer.invoke('export-pdf-timeline'),
exportResearchLog: (anonymize) => ipcRenderer.invoke('export-research-log', { anonymize }),
resetDatabase: () => ipcRenderer.invoke('reset-database'),

// 研究用ログ記録
logAction: (entry) => ipcRenderer.invoke('db-log-action', entry),
logMotivation: (entry) => ipcRenderer.invoke('db-log-motivation', entry),
logGoal: (entry) => ipcRenderer.invoke('db-log-goal', entry),

// 学習者プロフィール（FR-19）
getUserProfile: () => ipcRenderer.invoke('db-get-user-profile'),
saveUserProfile: (learnerType, academicField) =>
  ipcRenderer.invoke('db-save-user-profile', { learnerType, academicField }),
getAcademicFieldMaster: () => ipcRenderer.invoke('db-get-academic-field-master'),
addAcademicField: (label) => ipcRenderer.invoke('db-add-academic-field', { label }),
deleteAcademicField: (id) => ipcRenderer.invoke('db-delete-academic-field', { id }),
reorderAcademicFields: (ids) => ipcRenderer.invoke('db-reorder-academic-fields', { ids }),

【electron/main.ts】
以下のIPCハンドラーをすべて実装してください：

- DB CRUD ハンドラー（学習カード・アウトプット・ゴール）
- AI設定ハンドラー（APIキーはkeytarに保存、設定はuserData/config.jsonに保存）
  ※ electron-store は使用しない。JSON.stringify/parseでconfig.jsonに読み書きする
- データ管理ハンドラー（export-csv / export-research-log / reset-database）
- 研究用ログ記録ハンドラー（db-log-action / db-log-motivation / db-log-goal）
- 学習者プロフィール ハンドラー（FR-19）：
  - 'db-get-user-profile'：getUserProfile()を呼びcamelCaseに変換して返す
  - 'db-save-user-profile'：saveUserProfile()を呼ぶ
  - 'db-get-academic-field-master'：getAcademicFieldMaster()を呼びcamelCaseに変換して返す
  - 'db-add-academic-field'：addAcademicField()を呼ぶ
  - 'db-delete-academic-field'：deleteAcademicField()を呼ぶ
  - 'db-reorder-academic-fields'：reorderAcademicFields()を呼ぶ

セッションログの記録：
- app.on('ready') 内で insertSessionLog('app_launched') を呼ぶ
- app.on('before-quit') 内で insertSessionLog('app_closed') を呼ぶ

セキュリティ設定：
- contextIsolation: true
- nodeIntegration: false
- webSecurity: true

preloadパスの注意：
- electron-vite v5のビルド出力は out/preload/index.mjs（ESM形式）
- main.ts の preload パスは join(__dirname, '../preload/index.mjs') とすること

【src/types/electronAPI.d.ts】
Window インターフェースにすべてのメソッドの型定義を追加してください。
FR-19の型も含めてください：

interface AcademicFieldMaster {
  id: string; label: string; sortOrder: number; isActive: boolean
}
interface UserProfileData {
  id: string; learnerType: string | null; academicField: string | null
  createdAt: string; updatedAt: string
}

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/preload.ts
- electron/main.ts
- src/types/electronAPI.d.ts

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 4 — Zustandストア設計

```
src/stores/ 以下の3つのZustandストアを実装してください。

【timelineStore.ts】
状態：learningCards: LearningCard[], isLoading: boolean

アクション：
- loadCards(): Promise<void>
- addCard / updateCard / deleteCard / updateMotivation
- addOutputCard / updateOutputCard / deleteOutputCard

各アクションの直後に行動ログを記録してください：
- addCard / updateCard / deleteCard → electronAPI.logAction(...)
- updateMotivation → electronAPI.logMotivation(...)
- addOutputCard / updateOutputCard / deleteOutputCard → electronAPI.logAction(...)

【goalStore.ts】
状態：
- careerGoal: CareerGoal | null
- wellbeingGoal: WellbeingGoal | null
- isLoading: boolean
- userProfile: UserProfile | null        ← FR-19
- academicFieldMaster: AcademicFieldMaster[]  ← FR-19

アクション：
- loadGoals(): Promise<void>
- saveCareerGoal(goal): Promise<void>
  → 保存後に electronAPI.logGoal(...) でゴールログを記録
- saveWellbeingGoal(goal): Promise<void>
  → 保存後に electronAPI.logGoal(...) でゴールログを記録

- loadUserProfile(): Promise<void>  ← FR-19
  → electronAPI.getUserProfile() と getAcademicFieldMaster() を並行取得して保存

- saveUserProfile(learnerType, academicField): Promise<void>  ← FR-19
  → electronAPI.saveUserProfile() を呼んだ後 loadUserProfile() で再取得

- addAcademicField(label): Promise<void>  ← FR-19
- deleteAcademicField(id): Promise<void>  ← FR-19
- reorderAcademicFields(ids): Promise<void>  ← FR-19

【aiStore.ts】
状態：messages: ChatMessage[], isStreaming: boolean, config: AIConfig | null

型定義：
ChatMessage: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }

アクション：
- loadConfig(): Promise<void>
- saveConfig(config: AIConfig): Promise<void>
- sendChat(userMessage: string, context: string): Promise<void>
- sendAnalyze(context: string): Promise<void>
- clearMessages(): void

idには crypto.randomUUID()（Node.js v24グローバル）を使用してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/stores/timelineStore.ts
- src/stores/goalStore.ts
- src/stores/aiStore.ts

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 5 — タイムライン画面の基本UI

```
src/components/Timeline/ のコンポーネントを実装してください。

【TimelineView.tsx】
- 横スクロール可能なタイムラインコンテナ
- 上部に月ルーラー（現在月を基準に前後12ヶ月を表示、各列幅約160px）
- 「現在」を示す縦の区切り線（点線）
- 各学習カードを列として横に並べる
- 最右端に「+ 学習を追加」ボタン
- 初期表示時に現在月が画面中央に来るよう自動スクロール（useEffectでscrollLeftを設定）
- timelineStoreのlearningCardsを購読して表示
- 同時期カード（期間が重なる）は同一列に縦スタックで表示

【LearningCard.tsx】
Props: card: LearningCard, onEdit: () => void, onAddOutput: () => void, onEditOutput: (output: OutputCard) => void

表示内容：
- タイトル、期間、種別タグ
- 取り組み場所タグ（設定済みの場合のみ）
- モチベーションアイコン＋数値（右下、MotivationPickerを使用）
- アウトプット未設定の場合は赤い警告バッジ
- 子アウトプットカードを縦線でぶら下げて表示
- 「+ アウトプット追加」ボタン

フェーズ別スタイル（Tailwind）：
- past: border-l-[2.5px] border-l-past
- ongoing: border-l-[2.5px] border-l-ongoing
- future: border-l-[2.5px] border-l-future

【MotivationPicker.tsx】
- 現在の顔アイコン＋数値を表示（クリックでポップオーバー展開）
- 顔と数値の対応：😣1 / 😞2 / 😐3 / 🙂4 / 😄5
- 未設定：😶 と「–」を薄く表示
- レベル1は数値を赤（text-red-600）、レベル2はオレンジ（text-orange-600）
- 選択時に timelineStore.updateMotivation() を呼ぶ

【OutputCard.tsx】
Props: output: OutputCard, onEdit: () => void
- タイトル、種別バッジ、ステータス（完了：緑 / 予定：紫）
- URLがある場合はリンクアイコン

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Timeline/TimelineView.tsx
- src/components/Timeline/LearningCard.tsx
- src/components/Timeline/MotivationPicker.tsx
- src/components/Timeline/OutputCard.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 6 — 学習カード・アウトプットカードのモーダル

```
src/components/Modals/ のモーダルコンポーネントを実装してください。

【LearningCardModal.tsx】
Props: isOpen: boolean, onClose: () => void, card?: LearningCard

フォーム項目：
- タイトル（必須）
- 開始年月（input type="month"、必須）
- 終了年月（任意・「終了未定」チェックボックスで非表示化）
- 種別（授業/自習/研修/資格学習/その他）
- 取り組み場所（任意）：未設定/自宅/大学・学校/職場/カフェ・コワーキング/図書館/オンライン/その他
- 受講形態（任意）：未設定/教室対面/ハイブリッド型/ハイフレックス型/フルオンライン
- メモ（任意）

送信時：新規→timelineStore.addCard() / 編集→timelineStore.updateCard()

【OutputCardModal.tsx】
Props: isOpen: boolean, onClose: () => void, learningCardId: string, output?: OutputCard

フォーム項目：
- タイトル（必須）
- 種別（ブログ記事/リポジトリ/資格・検定/発表・LT/個人開発/その他）
- URL（任意）
- ステータス（ラジオ：完了/予定）

【DeleteConfirmModal.tsx】
汎用の削除確認モーダル。
Props: isOpen, title, message, onConfirm, onCancel

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Modals/LearningCardModal.tsx
- src/components/Modals/OutputCardModal.tsx
- src/components/Modals/DeleteConfirmModal.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 7 — トップバーとゴールピル

```
src/components/TopBar.tsx を実装してください。

【Props】
interface TopBarProps {
  onOpenSettings: () => void
  onAddCard: () => void
  onOpenSidebar: () => void   ← AIサイドパネルを開く（FR-06 案B方式）
}

【レイアウト】
2行構成：
- 1行目：アプリ名「Horizon Guide」、右端に「AI 助言」ボタン・「学習を追加」ボタン・「設定」ボタン
- 2行目：WBゴールピル → 矢印（→）→ キャリアゴールピル

【WBゴールピル】
- 背景：wb-bg（#EAF3DE）、文字色：wb-green（#27500A）、先頭に🌱絵文字
- 未設定の場合：「+ WBゴールを設定」と薄く表示
- クリック：GoalModal（WBゴール編集）を開く

【キャリアゴールピル】
- 背景：career-bg（#FAEEDA）、文字色：career-brown（#633806）
- テキスト：「{ゴール概要}（{目標時期}）」形式
- 未設定の場合：「+ キャリアゴールを設定」と薄く表示
- クリック：GoalModal（キャリアゴール編集）を開く

【「AI 助言」ボタンの動作（FR-06 案B方式）】
- クリック時：onOpenSidebar() でパネルを開いてから sendAnalyze() を実行
- ストリーミング中はローディングスピナー表示・無効化

goalStore の careerGoal / wellbeingGoal を購読して表示を更新してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/TopBar.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 8 — AI助言サイドパネル・contextBuilder

```
src/components/Sidebar/ と src/utils/contextBuilder.ts を実装してください。

【AISidebar.tsx】

Props:
interface AISidebarProps {
  onClose: () => void   ← パネルを閉じる（FR-06 案B方式）
}

レイアウト：
- 幅：デフォルト280px、左端ドラッグでリサイズ可能（最小200px〜最大600px）
- リサイズハンドル：左端1px幅（ホバーで青くなる）
- ヘッダー：「🤖 AI 助言」タイトル ＋ 接続状態バッジ ＋ 履歴クリアボタン ＋ × ボタン
- × ボタン（lucide-react の X アイコン）：
  - ヘッダー右端に配置
  - クリック時に onClose() を呼ぶ
  - スタイル：text-gray-300 hover:text-gray-600 hover:bg-gray-100、サイズ13px
- メッセージ一覧（スクロール可能）
- テキスト入力 ＋ 送信ボタン（Cmd+Enter で送信）

送信処理：
1. buildContext(careerGoal, wellbeingGoal, learningCards, userProfile, academicFieldMaster) でコンテキスト生成
2. aiStore.sendChat(userMessage, context) を呼ぶ

コンテキスト生成では goalStore の userProfile と academicFieldMaster も渡してください。

【ChatMessage.tsx】
Props: message: ChatMessage, isStreaming?: boolean
- role='user'（右寄せ）と'assistant'（左寄せ）で見た目を切り替え
- タイムスタンプは右下に小さく表示

【src/utils/contextBuilder.ts】
以下のシグネチャで実装してください：

function buildContext(
  careerGoal: CareerGoal | null,
  wellbeingGoal: WellbeingGoal | null,
  learningCards: LearningCard[],
  userProfile?: UserProfile | null,        ← FR-19
  academicFieldMaster?: AcademicFieldMaster[]  ← FR-19
): string

コンテキスト生成ロジック：
1. userProfile?.learnerType が設定済みの場合のみ、コンテキスト冒頭に追加：
   【学習者プロフィール】
   属性: {LEARNER_TYPE_LABELSのラベル}
   学問分野: {academicFieldMasterで一致するlabel、なければ「特になし」}

2. 続けてWBゴール・キャリアゴール・学習タイムラインを出力

3. userProfile が未設定の場合はプロフィールセクションを省略

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Sidebar/AISidebar.tsx
- src/components/Sidebar/ChatMessage.tsx
- src/utils/contextBuilder.ts

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 9 — AI接続（electron/ai-bridge.ts）

```
electron/ai-bridge.ts を実装してください。

【Node.js v24前提】
- グローバルの fetch を使用（node-fetch・axios は不要）
- AbortSignal.timeout(30000) でタイムアウト実装

【SYSTEM_PROMPT】
以下の内容で定義してください（学習者プロフィール対応指示を含む）：

const SYSTEM_PROMPT =
  'あなたは学習設計の専門家AIです。' +
  '以下のコンテキストをもとに、学習者のキャリアゴール達成と' +
  'ウェルビーイング向上を支援してください。' +
  '回答は日本語で、具体的かつ簡潔にお願いします。' +
  'コンテキストに【学習者プロフィール】が含まれている場合は、' +
  'その属性・学問分野に合わせて助言のトーン・用語・具体例を調整してください。' +
  '例：専門職大学生・情報学 → 実践的な演習・資格・就職を意識した表現／' +
  '社会人 → 業務との両立・スキルアップ・転職を意識した表現／' +
  '高校生 → 進路選択・受験準備を意識した平易な表現。'

【Dify接続（優先実装）】
- エンドポイント：{config.dify.endpoint}/v1/chat-messages
- APIキーはkeytarから取得
- リクエスト：{ inputs: { timeline_context: context }, query: userMessage, response_mode: 'streaming', user: 'horizon-guide-user' }
- SSEストリーミングでパース

【LLM直接接続（Gemini優先）】
- デフォルトモデル：gemini-2.5-flash-lite
- エンドポイント：https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={apiKey}
- system_instruction に SYSTEM_PROMPT を渡す
- Claude / GPT も同様の構造でフォールバック実装

【ローカルLLM接続（Ollama等）】
- config.provider === 'local' の場合
- APIキー不要
- API形式の自動判別：
  - /api/chat を含む or /v1/ を含まない → Ollama ネイティブAPI
  - それ以外 → OpenAI互換API（LM Studio等）
- デフォルト：endpoint=http://localhost:11434, model=gemma3:4b

【IPCハンドラー】
- ipcMain.handle('chat-ai', async (event, { message, context }) => {...})
- ipcMain.handle('analyze-ai', async (event, { context }) => {...})
  - Analyze mode は ANALYZE_PROMPT テンプレートに context を埋め込んで callAI に渡す
  - ai_history に記録

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/ai-bridge.ts

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 10 — 設定画面（7タブ構成）

```
src/components/Settings/SettingsPage.tsx を実装してください。

【全体レイアウト】
- 左サイドバー（148px）：タブメニュー
- 右コンテンツエリア：選択中のセクションを表示

【タブ構成（7タブ）】
1. キャリアゴール
2. WBゴール
3. 学習者プロフィール  ← FR-19
4. AI接続設定
5. エクスポート
6. データ管理
7. 表示・言語

【1. キャリアゴールセクション】
- ゴール（テキストエリア、必須）
- 目標時期（input type="month"、任意）
- 氏名（テキスト、PDF用・任意）
- 保存ボタン

【2. WBゴールセクション】
- OECD 2030バッジ付き
- 3軸入力エリア（個人・社会・地球）
- 「AIにWBゴールを生成してもらう」ボタン
- 生成結果エリア（編集可能・「このゴールを採用する」ボタン）

【3. 学習者プロフィールセクション（FR-19）】
上部：プロフィール設定
- 説明文：「AI助言をあなたの学習環境に合わせて最適化します。設定しなくても他の機能はすべて利用できます。」
- 属性プルダウン：（未設定）/ 社会人 / 専門職大学 / 大学（専門職以外）/ 専門学校 / 高校
- 学問分野プルダウン：
  - ラベル：「学問分野（最も近いものを選んでください）」
  - 選択肢：（未設定）＋ academicFieldMaster のラベル一覧（sort_order昇順）
- 注記：「※ いつでもここで変更できます。」（プルダウン直下）
- 「保存する」ボタン

下部：学問分野の管理
- 見出し：「学問分野の管理」
- 現在の選択肢リスト（HTML5 Drag and Drop APIで並び替え）：
  - 各行：ドラッグハンドル（⠿）＋ ラベル名 ＋ 「削除」ボタン（論理削除・即時）
  - 並び替え完了時：reorderAcademicFields() を呼ぶ
- 追加フォーム：テキスト入力（「例：工学、心理学 など」）＋ 「追加」ボタン
  - 追加後、入力欄をクリアする

【4. AI接続設定セクション】
ラジオボタンで接続先を選択：
- LLM直接接続（Gemini / Claude / ChatGPT + APIキー）[Gemini優先]
  - Gemini: gemini-2.5-flash-lite / Claude: claude-haiku-4-5-20251001 / ChatGPT: gpt-5o-mini
- ローカルLLM接続（エンドポイントURL + モデル名）[APIキー不要]
  - デフォルト: http://localhost:11434 / gemma3:4b
- Dify（エンドポイント + APIキー）[優先推奨バッジ]
- Langflow（近日対応・無効）

「接続テスト」ボタン + 「保存する」ボタン

【5. エクスポートセクション】
- CSVエクスポート（全データ）ボタン
- PDFポートフォリオ（A4）ボタン
- PDFタイムライン印刷ボタン

【6. データ管理セクション】
- バックアップ：「CSVエクスポート（全データ）」ボタン
- 研究データエリア：
  - 説明文・匿名化チェックボックス（デフォルトON）・「研究データをエクスポート」ボタン
- 初期化エリア（赤い枠線）：
  - 「バックアップしてから初期化」ボタン
  - 「データを初期化する」ボタン（赤）→ ResetConfirmModal を開く

【7. 表示・言語セクション】
- 言語選択（日本語のみ・将来対応）
- テーマ（ライト/ダーク/システム連動）

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Settings/SettingsPage.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 11 — CSVエクスポート・PDFポートフォリオ

```
エクスポート機能を electron/main.ts のハンドラーとして実装してください。

【CSVエクスポート（export-csvハンドラー）】
1. 5つのCSVファイルをpapaparseで生成（UTF-8 BOM付き）：
   - learning_cards.csv（id, title, start_date, end_date, type, location, modality, phase, is_completed, motivation_level, memo, created_at, updated_at）
   - output_cards.csv（id, learning_card_id, title, type, url, status, created_at, updated_at）
   - career_goal.csv / wellbeing_goal.csv / ai_history.csv
2. jszipでZIPに圧縮
3. dialog.showSaveDialog()でファイル保存ダイアログ
4. ファイル名：horizon-guide-export-YYYYMMDD.zip

【研究用行動ログエクスポート（export-research-logハンドラー）】
引数：{ anonymize: boolean }
1. 4種ログを全件取得
2. anonymize=true の場合：target_title / learning_card_title / goal_value を '[anonymized]' に置換
3. 4つのCSVをZIPに圧縮
4. ファイル名：horizon-guide-research-YYYYMMDD.zip

【PDFポートフォリオ（export-pdf-portfolioハンドラー）】
puppeteerでHTMLテンプレートをPDF変換：
- ヘッダー（氏名・出力日）
- WBゴールセクション（🌱・3軸）
- キャリアゴールセクション
- 過去・進行中・未来の学習セクション（各カード・アウトプット一覧）
- format: 'A4', margin: 20mm, フォント: Noto Sans JP

【PDFタイムライン印刷（export-pdf-timelineハンドラー）】
webContents.print()：landscape: true, pageSize: 'A3'

【ファイル出力】
electron/main.ts（エクスポート関連ハンドラーを追記した完全版）を出力してください。

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 12 — データ初期化機能

```
データ初期化機能を実装してください。

【electron/main.ts の reset-database ハンドラー】
1. 現在のDBファイルを削除（fs.unlinkSync）
2. initDatabase() を再実行（テーブル再作成・初期データ挿入）
3. 完了をレンダラーに通知

【src/components/Modals/ResetConfirmModal.tsx】
2段階確認：
1. 警告メッセージ（「この操作は元に戻せません」）と「続ける」「キャンセル」
2. テキストボックスに「初期化」と入力しないと確定ボタンが有効にならない
3. 確定後：electronAPI.resetDatabase() を呼ぶ
4. 完了後：window.location.reload()

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Modals/ResetConfirmModal.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 13 — オンボーディング（5ステップ）

```
初回起動時のオンボーディング画面を実装してください。

【src/components/Onboarding/OnboardingFlow.tsx】

判定ロジック（AppRoot コンポーネント）：
- アプリ起動時に loadGoals() と loadUserProfile() を並行実行
- careerGoal === null の場合はオンボーディング画面を表示

ステップ構成（5ステップ）：

Step 1 — ウェルカム画面
- アプリ名「Horizon Guide」とキャッチコピー
- 機能紹介カード（ゴール起点・タイムライン・アウトプット・AI助言）
- 「はじめる」ボタン

Step 2 — AI接続設定
- 2択カードUI：☁️ Gemini（クラウド）/ 💻 ローカルLLM
- Gemini選択時：Google AI StudioへのリンクとAPIキー入力（keytarに保存）
  → provider='llm', model='gemini-2.5-flash-lite' で保存、ボタンは青
- ローカルLLM選択時：エンドポイントURL（デフォルト: http://localhost:11434）＋モデル名（デフォルト: gemma3:4b）
  → provider='local' で保存、APIキー不要、ボタンは緑
  → 「ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。」
- 「スキップ（後で設定）」ボタンで任意化

Step 3 — 学習者プロフィール設定（FR-19・新規）
- タイトル：「あなたについて教えてください」
- サブタイトル：「AI助言をあなたに合わせて最適化します。」
- 属性プルダウン：初期値 'professional_univ'（専門職大学）
  選択肢：社会人 / 専門職大学 / 大学（専門職以外）/ 専門学校 / 高校
- 学問分野プルダウン：初期値 'informatics'（情報学）
  ラベル：「学問分野（最も近いものを選んでください）」
  選択肢：goalStore.academicFieldMaster から取得（このStep表示前に loadUserProfile() を実行済み）
- 注記：「※ あとから設定画面の「学習者プロフィール」でいつでも変更できます。」
- ボタン：
  - 「スキップ（未設定のまま進む）」→ 保存せずに次へ
  - 「次へ →」→ saveUserProfile() を呼んでから次へ

Step 4 — キャリアゴール入力
- ゴールテキスト（必須）・目標時期（任意）・氏名（PDF用・任意）
- 「次へ：WBゴールを設定」ボタン

Step 5 — WBゴール設定（任意）
- OECD Education 2030の説明
- 3軸入力エリア（個人・社会・地球）
- 「AIにWBゴールを提案してもらう」ボタン
- WBゴールテキスト入力欄（編集可能）
- 「スキップして始める」ボタン
- 「設定して始める」ボタン

完了後：saveCareerGoal()、saveWellbeingGoal()（設定した場合）を呼び、ホーム画面へ遷移

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Onboarding/OnboardingFlow.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 14 — App.tsx（メイン画面統合）

```
src/App.tsx を実装してください。

【HomeScreen コンポーネント】
状態：
- showSettings: boolean（初期値: false）
- isSidebarOpen: boolean（初期値: true）  ← FR-06 案B方式
- learningCardModal: { open: boolean; card?: LearningCard }
- outputCardModal: { open: boolean; learningCardId: string; output?: OutputCard }

初回ロード（useEffect）：
- loadCards()
- loadConfig()

レイアウト：
┌──────────────────────────────────────────────┐
│ TopBar（onOpenSidebar で isSidebarOpen=true） │
├──────────────────┬───────────────────────────┤
│ TimelineView     │ {isSidebarOpen &&          │
│                  │   <AISidebar onClose=.../>}│
└──────────────────┴───────────────────────────┘

TopBar への props：
- onOpenSettings={() => setShowSettings(true)}
- onAddCard={handleAddCard}
- onOpenSidebar={() => setIsSidebarOpen(true)}   ← FR-06

AISidebar への props：
- onClose={() => setIsSidebarOpen(false)}         ← FR-06

settings が true のときは SettingsPage を全画面表示。

【App コンポーネント（エントリポイント）】
AppRoot でラップして HomeScreen を返す：

function App(): React.ReactElement {
  return (
    <AppRoot>
      <HomeScreen />
    </AppRoot>
  )
}

export default App

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/App.tsx

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 15 — electron-builderでパッケージング

```
electron-builder.config.js を設定して、Windows・Macの両方でビルドできるようにしてください。

【設定内容】
- appId: com.horizonguide.app
- productName: Horizon Guide
- directories.output: dist-electron

【Windows設定】
- target: nsis
- icon: resources/icon.ico
- 64bit対応
- インストーラー名：HorizonGuide-Setup-{version}.exe

【Mac設定】
- target: dmg
- icon: resources/icon.icns
- universal: true（Intel + Apple Silicon両対応）

【共通設定】
- asar: true
- extraResources: resources/
- nativeのrebuildターゲット：better-sqlite3, keytar

【ファイル出力】
electron-builder.config.js を実際に生成し、ダウンロードできるよう出力してください。

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 16 — 結合テストと動作確認

```
⚠️ セットアップ手順（必ずこの順番で実行）：

# 1. 依存パッケージのインストール（--ignore-scripts 必須）
npm install --ignore-scripts

# 2. Electronバイナリ取得 + ネイティブモジュールリビルド
npm run setup

# 3. 開発モードで起動
npm run dev

※ npm install（引数なし）は使わないでください。

実装が完了したら、以下の動作確認チェックリストを実行してください。

【オンボーディング確認】
□ アプリ起動 → オンボーディング画面（Step 1）が表示される
□ Step 2：Gemini / ローカルLLM の2択カードUIが表示される
□ Step 3：「あなたについて教えてください」画面が表示される
□ Step 3：属性プルダウンに「専門職大学」が初期選択されている
□ Step 3：学問分野プルダウンに「情報学」が初期選択されている
□ Step 3：学問分野に「なし / 情報学 / 経営学 / 社会学 / アニメ・マンガ / その他」の6件が表示される
□ Step 3：「次へ →」で選択値が保存されて Step 4へ進む
□ Step 3：「スキップ」で未設定のまま Step 4へ進む
□ Step 4：キャリアゴール入力 → Step 5へ進む
□ Step 5：WBゴール設定（スキップ可）→ ホーム画面に遷移する

【基本フロー確認】
□ キャリアゴールがトップバーのゴールピルに反映される
□ 学習カード追加 → タイムラインに列が追加される
□ 現在月がタイムライン中央に自動スクロールする
□ モチベーション変更 → カード右下の顔アイコンが更新される
□ アウトプットカード追加 → 親カードの下にぶら下がる

【AIサイドパネル確認（FR-06 案B方式）】
□ 初期表示でサイドパネルが開いている
□ サイドパネルヘッダー右端に「×」ボタンが表示されている
□ 「×」ボタン押下 → パネルが閉じる（Analyzeは実行されない）
□ パネルを閉じるとタイムラインが全幅に広がる
□ 「AI 助言」ボタン押下（パネルが閉じているとき）→ パネルが開いてAnalyzeが実行される
□ 「AI 助言」ボタン押下（パネルが開いているとき）→ Analyzeのみ実行される
□ チャット送信 → ストリーミングで返答が表示される

【学習者プロフィール確認（FR-19）】
□ 設定画面に「学習者プロフィール」タブが表示される（3番目）
□ 属性・学問分野のプルダウンに保存済みの値が表示される
□ 変更して「保存する」→ 変更が反映される
□ 「学問分野の管理」で新しい学問分野を追加できる
□ ドラッグ＆ドロップで並び替えが反映される
□ 「削除」ボタン → 選択肢が非表示になる
□ データ初期化後も学習者プロフィールが保持される
□ 学習者プロフィール設定済みの状態でAI助言を実行 → ai_historyのコンテキストに「【学習者プロフィール】」が含まれる

【データ永続化確認】
□ アプリを閉じて再起動 → データが保持されている
□ SQLiteファイルが userData/horizon-guide.db に生成されている

【エクスポート確認】
□ CSV出力 → 5ファイルを含むZIPが生成される
□ 研究データエクスポート（匿名化ON）→ 4ファイルを含むZIPが生成される
□ PDFポートフォリオ → A4でWBゴール・キャリアゴール・学習一覧が出力される

【設定画面確認】
□ AI接続設定 → 保存・接続テストが動作する
□ データ初期化 → 「初期化」入力後にDBがリセットされる
□ 初期化後 → オンボーディング画面に戻る

【行動ログ確認】
□ 学習カード追加 → action_log に card_created が記録される
□ モチベーション変更 → motivation_log に変更前後のレベルが記録される
□ キャリアゴール保存 → goal_log に goal_created / goal_updated が記録される
□ アプリ起動 → session_log に app_launched が記録される

問題があった場合は、エラーメッセージと再現手順を教えてください。
```

---

## 追加プロンプト集（随時使用）

### バグ修正

```
以下のバグを修正してください。

【発生箇所】
{ファイル名 / コンポーネント名}

【エラーメッセージ】
{エラー内容をそのまま貼り付け}

【再現手順】
1. {手順1}
2. {手順2}

【期待する動作】
{本来どう動くべきか}
```

### コンポーネントのリファクタリング

```
{コンポーネント名} をリファクタリングしてください。

現在の問題点：
- {問題1}
- {問題2}

改善してほしい点：
- パフォーマンス（不要な再レンダリングの削減）
- 可読性（適切なコメント・変数名）
- 型安全性（any型の排除）
```

### CSVインポート機能（機能追加バックログ）

```
CSVインポート機能を実装してください。

【設定画面のトグル（SettingsPage.tsx）】
- 「データ管理」セクションに「CSVインポートを有効にする」トグルを追加
- デフォルト：オフ
- トグルON時のみインポートUIを表示
- 注記：「実証実験中はオフのまま使用してください」

【インポートUI（トグルON時のみ）】
- learning_cards.csv / output_cards.csv のファイル選択 + インポートボタン
- インポート完了後：「X件をインポートしました（Y件スキップ）」トースト

【electron/main.tsのimport-csvハンドラー】
引数：{ type: 'learning_cards' | 'output_cards', filePath: string }
1. papaparseでCSV読み込み
2. id が既存と一致する場合はスキップ（上書きなし）
3. 新規レコードをDBにINSERT
4. action_log に event_type: 'card_imported' として記録（card_created と区別）
5. 結果（成功件数・スキップ件数）を返す
```

---

*Horizon Guide 実装プロンプト集 フル実装版*
*対応SDD：HG-SDD-001 v0.9.8*
*Node.js v24（LTS）前提*
