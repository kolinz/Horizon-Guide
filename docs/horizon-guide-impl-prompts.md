# Horizon Guide — 実装プロンプト集

各Stepのプロンプトを、**このチャット（claude.ai通常会話）にそのまま貼り付けて**実行してください。
各Stepの末尾に「ファイルを生成してダウンロードできるよう出力してください」という指示が含まれているため、実行するとファイルをダウンロードできます。

> **前提**：claude.aiの通常チャットで実行してください。ファイル生成・ダウンロード機能はProjectチャットでは使えません。

> **前提環境**: Node.js v24（LTS）、npm v10以上
> Node.js v24では `fetch`・`crypto.randomUUID()` がグローバルで使用可能です。
> `node-fetch`・`uuid` パッケージは使用しないでください。

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

【インストールパッケージ】
dependencies（本番）:
- better-sqlite3
- keytar
- zustand
- papaparse
- jszip
- lucide-react

devDependencies:
- @types/better-sqlite3
- @types/papaparse
- @types/keytar
- electron（Node.js v24対応の最新版）
- electron-vite
- electron-builder
- @electron-toolkit/preload
- @electron-toolkit/utils
- tailwindcss
- autoprefixer
- postcss
- typescript
- @types/react
- @types/react-dom
- vite
- @vitejs/plugin-react

【注意点】
- Node.js v24では crypto.randomUUID() がグローバル使用可能なため uuid パッケージは不要
- Node.js v24では fetch がグローバル使用可能なため node-fetch パッケージは不要
- better-sqlite3 と keytar はネイティブモジュールのため electron-rebuild が必要

【追加生成ファイル】
1. tailwind.config.ts（カスタムカラー定義）：
   - past: '#1D9E75'
   - ongoing: '#EF9F27'
   - future: '#534AB7'
   - wb: { green: '#27500A', bg: '#EAF3DE' }
   - career: { brown: '#633806', bg: '#FAEEDA' }

2. postcss.config.js

3. tsconfig.json（メイン・レンダラー・ノード用の3つ）

4. electron-builder.config.js（基本設定）

5. .nvmrc（内容：24）

6. .node-version（内容：24）

インストールコマンドも合わせて提示してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先ディレクトリ構成：
- package.json
- tailwind.config.ts
- postcss.config.js
- tsconfig.json
- tsconfig.node.json
- tsconfig.web.json
- electron.vite.config.ts
- electron-builder.config.js
- .nvmrc
- .node-version

【配置方法】
ダウンロードしたファイルをすべて horizon-guide/ フォルダの直下に配置してください。
horizon-guide/
├── package.json          ← ここ
├── tailwind.config.ts    ← ここ
├── postcss.config.js     ← ここ
├── tsconfig.json         ← ここ
├── tsconfig.node.json    ← ここ
├── tsconfig.web.json     ← ここ
├── electron.vite.config.ts ← ここ
├── electron-builder.config.js ← ここ
├── .nvmrc                ← ここ
└── .node-version         ← ここ
配置後、以下の順番で実行してください：
1. npm install --ignore-scripts
2. npm run setup
3. npm run dev

【electron.vite.config.ts の必須設定（electron-vite v5）】
- main.build.lib.entry: { index: resolve('electron/main.ts') }
- preload.build.lib.entry: { index: resolve('electron/preload.ts') }
- renderer.root: resolve('src')
- renderer.build.rollupOptions.input: resolve('src/index.html')
- copyMigrationsPlugin を追加（ビルド時にmigrations/をout/main/migrations/へ自動コピー）

【依存バージョンの注意】
- better-sqlite3: ^12.8.0以上（Electron 41以降のV8 API対応）
- vite: ^7.0.0（electron-vite v5はvite v8未対応）
- @vitejs/plugin-react: ^4.7.0（vite v7対応版）
- @electron-toolkit/tsconfig を追加インストールすること

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 2 — SQLiteスキーマ・DB初期化・マイグレーション

```
electron/db/ ディレクトリ以下のファイルを実装してください。

【schema.sql】
システムプロンプトに定義されたSQLiteスキーマをそのまま使用してください。
（career_goals / wellbeing_goals / learning_cards / output_cards / ai_history）

研究用ログテーブルも合わせて作成してください：
（action_log / motivation_log / goal_log / session_log）

【database.ts】
- better-sqlite3でDBを初期化する関数 initDatabase() を実装
- 保存先は app.getPath('userData') + '/horizon-guide.db'
- 外部キー制約を有効化（PRAGMA foreign_keys = ON）
- schema.sql を読み込んでテーブルを作成
- マイグレーション管理のため schema_versions テーブルも作成

【migrate.ts】
- マイグレーション管理クラス DatabaseMigration を実装
- migrations/ フォルダに 001_initial.sql を置く構成
- 未適用のマイグレーションを順番に適用する runMigrations() を実装

【queries/learningCards.ts】
以下の関数を実装してください：
- getAllLearningCards(): LearningCard[]（output_cardsをJOINして返す）
- upsertLearningCard(card: LearningCard): void
- deleteLearningCard(id: string): void
- updateMotivationLevel(id: string, level: number | null): void

locationフィールドの仕様：
- DB値：'home' / 'university' / 'workplace' / 'cafe' / 'library' / 'online' / 'other' / NULL
- NULLは未設定を意味する（任意項目）

modalityフィールドの仕様：
- DB値：'in_person' / 'hybrid' / 'hyflex' / 'online' / NULL
- NULLは未設定を意味する（任意項目）
- locationに関わらず設定可能（自習のオンライン受講等も対象）

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
研究用行動ログの書き込み・取得関数を実装してください：

- insertActionLog(entry: ActionLogEntry): void
  - カード操作（作成・更新・削除・完了）を記録
  - entry: { eventType, targetType, targetId, targetTitle, beforeValue, afterValue }

- insertMotivationLog(entry: MotivationLogEntry): void
  - モチベーション変更を記録
  - entry: { learningCardId, learningCardTitle, previousLevel, newLevel }

- insertGoalLog(entry: GoalLogEntry): void
  - ゴール設定・変更を記録
  - entry: { eventType, goalType, previousValue, newValue }

- insertSessionLog(eventType: 'app_launched' | 'app_closed'): void
  - アプリ起動・終了を記録

- getAllActionLogs(): ActionLogEntry[]
- getAllMotivationLogs(): MotivationLogEntry[]
- getAllGoalLogs(): GoalLogEntry[]
- getAllSessionLogs(): SessionLogEntry[]

各エントリのidはcrypto.randomUUID()、timestampはnew Date().toISOString()で生成してください。

すべての関数はbetter-sqlite3の同期APIを使用してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/db/schema.sql
- electron/db/database.ts
- electron/db/migrate.ts
- electron/db/queries/learningCards.ts
- electron/db/queries/outputCards.ts
- electron/db/queries/goals.ts
- electron/db/queries/aiHistory.ts
- electron/db/queries/researchLog.ts

【配置方法】
horizon-guide/ フォルダ内に electron/db/ ディレクトリを作成して配置してください。
horizon-guide/
└── electron/
    └── db/
        ├── schema.sql           ← ここ
        ├── database.ts          ← ここ
        ├── migrate.ts           ← ここ
        └── queries/
            ├── learningCards.ts ← ここ
            ├── outputCards.ts   ← ここ
            ├── goals.ts         ← ここ
            ├── aiHistory.ts     ← ここ
            └── researchLog.ts   ← ここ

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 3 — IPC通信設計（preload.ts + main.ts）

```
ElectronのIPC通信を実装してください。

【electron/preload.ts】
システムプロンプトのIPC通信設計をそのまま実装してください。
contextBridge.exposeInMainWorld('electronAPI', { ... })

TypeScriptの型安全のため、src/types/electronAPI.d.ts も生成してください：
interface Window {
  electronAPI: {
    getLearningCards: () => Promise<LearningCard[]>
    // ...（全メソッドの型定義）
  }
}

【electron/main.ts】
以下のIPCハンドラーをすべて実装してください：

DBハンドラー（ipcMain.handle）：
- 'db-get-learning-cards'
- 'db-upsert-learning-card'
- 'db-delete-learning-card'
- 'db-update-motivation'
- 'db-upsert-output-card'
- 'db-delete-output-card'
- 'db-get-career-goal'
- 'db-save-career-goal'
- 'db-get-wellbeing-goal'
- 'db-save-wellbeing-goal'

AI設定ハンドラー（keytarでAPIキーを保存）：
- 'save-ai-config'（APIキーはkeytarに保存、エンドポイント等はelectron-storeに保存）
- 'load-ai-config'

データ管理ハンドラー：
- 'export-csv'（papaparse + jszipでZIP生成、ダウンロードダイアログを表示）
- 'export-research-log'（研究用行動ログをZIP生成、匿名化対応）
  - 引数：{ anonymize: boolean }
  - 匿名化ONの場合：target_title / learning_card_title / goal_value を '[anonymized]' に置換してからCSV生成
  - 出力：action_log.csv / motivation_log.csv / goal_log.csv / session_log.csv の4ファイルをZIP
  - ファイル名：horizon-guide-research-YYYYMMDD.zip
- 'reset-database'（DB削除・再作成）

セキュリティ設定：
- contextIsolation: true
- nodeIntegration: false
- webSecurity: true

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/preload.ts
- electron/main.ts
- src/types/electronAPI.d.ts

【配置方法】
horizon-guide/
├── electron/
│   ├── main.ts       ← ここ（上書き）
│   └── preload.ts    ← ここ（上書き）
└── src/
    └── types/
        └── electronAPI.d.ts ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 4 — Zustandストア設計

```
src/stores/ 以下の3つのZustandストアを実装してください。

【timelineStore.ts】
状態：
- learningCards: LearningCard[]
- isLoading: boolean

アクション：
- loadCards(): Promise<void>（electronAPI.getLearningCards()を呼ぶ）
- addCard(card: Omit<LearningCard, 'id' | 'createdAt' | 'updatedAt' | 'outputs'>): Promise<void>
- updateCard(card: LearningCard): Promise<void>
- deleteCard(id: string): Promise<void>
- updateMotivation(id: string, level: MotivationLevel | null): Promise<void>
- addOutputCard(output: Omit<OutputCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>
- updateOutputCard(output: OutputCard): Promise<void>
- deleteOutputCard(id: string): Promise<void>

【行動ログの自動記録】
上記の各アクションは、DB操作の直後にメインプロセス経由で対応するログを記録してください：
- addCard / updateCard / deleteCard → electronAPI.logAction(...)を呼ぶ
- importCards → electronAPI.logAction(...) を event_type: 'card_imported' で呼ぶ
- updateMotivation → electronAPI.logMotivation(...)を呼ぶ
- addOutputCard / updateOutputCard / deleteOutputCard → electronAPI.logAction(...)を呼ぶ

これらのログ記録APIをpreload.tsとmain.tsにも追加実装してください：
- electronAPI.logAction({ eventType, targetType, targetId, targetTitle, beforeValue, afterValue })
  → ipcRenderer.invoke('db-log-action', ...)
- electronAPI.logMotivation({ learningCardId, learningCardTitle, previousLevel, newLevel })
  → ipcRenderer.invoke('db-log-motivation', ...)

【goalStore.ts】
状態：
- careerGoal: CareerGoal | null
- wellbeingGoal: WellbeingGoal | null
- isLoading: boolean

アクション：
- loadGoals(): Promise<void>
- saveCareerGoal(goal: Omit<CareerGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>
- saveWellbeingGoal(goal: Omit<WellbeingGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>

【ゴールログの自動記録】
saveCareerGoal / saveWellbeingGoal の直後に electronAPI.logGoal(...) を呼んでください：
- eventType: 初回保存は 'goal_created'、上書きは 'goal_updated'
- goalType: 'career' または 'wellbeing'
- previousValue: 保存前のゴールテキスト（JSON.stringify）、初回はnull
- newValue: 保存後のゴールテキスト（JSON.stringify）

preload.ts / main.ts にも以下を追加してください：
- electronAPI.logGoal({ eventType, goalType, previousValue, newValue })
  → ipcRenderer.invoke('db-log-goal', ...)

【aiStore.ts】
状態：
- messages: ChatMessage[]
- isStreaming: boolean
- config: AIConfig | null

型定義：
- ChatMessage: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }

アクション：
- loadConfig(): Promise<void>
- saveConfig(config: AIConfig): Promise<void>
- sendChat(userMessage: string, context: string): Promise<void>
- sendAnalyze(context: string): Promise<void>
- clearMessages(): void

idにはNode.js v24グローバルの `crypto.randomUUID()` を使用してください。（uuidパッケージは不要）

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/stores/timelineStore.ts
- src/stores/goalStore.ts
- src/stores/aiStore.ts

【配置方法】
horizon-guide/
└── src/
    └── stores/
        ├── timelineStore.ts ← ここ（新規作成）
        ├── goalStore.ts     ← ここ（新規作成）
        └── aiStore.ts       ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 5 — タイムライン画面の基本UI

```
src/components/Timeline/ のコンポーネントを実装してください。

【TimelineView.tsx】
- 横スクロール可能なタイムラインコンテナ
- 上部に月ルーラー（現在月を基準に前後12ヶ月を表示）
- 「現在」を示す縦の区切り線（点線）
- 各学習カードを列として横に並べる
- 最右端に「+ 学習を追加」ボタン
- 初期表示時に現在月が画面中央に来るよう自動スクロール（useEffectでscrollLeftを設定）
- timelineStoreのlearningCardsを購読して表示

月ルーラーの仕様：
- 横軸は月単位（各列幅は約160px）
- 現在月に「現在」ラベルと縦線を表示
- 過去は左、未来は右

【LearningCard.tsx】
Props: card: LearningCard, onEdit: () => void

表示内容：
- タイトル
- 期間（start_date ～ end_date または「進行中」）
- 種別タグ
- **取り組み場所タグ（設定済みの場合のみ表示）**
- モチベーションアイコン＋数値（右下）
- アウトプット未設定の場合は赤い警告バッジ
- 子アウトプットカードを縦線でぶら下げて表示
- 「+ 追加」ボタン

**同時期カードの縦スタック表示：**
- TimelineView.tsx側で開始日が重なるカードをグループ化し、同一列に縦スタックで並べる
- スタック内の順序：startDateの早い順（同じ場合はcreatedAtの早い順）
- 各カードのアウトプットカードはそれぞれの学習カード直下にぶら下がる

フェーズ別スタイル（Tailwind）：
- past: border-l-[2.5px] border-l-past
- ongoing: border-l-[2.5px] border-l-ongoing
- future: border-l-[2.5px] border-l-future

【MotivationPicker.tsx】
- 現在の顔アイコン＋数値を表示（クリックでポップオーバー展開）
- 5段階の顔アイコンを横並びで表示
- 選択時にtimelineStore.updateMotivation()を呼ぶ
- 顔と数値の対応：😣1 / 😞2 / 😐3 / 🙂4 / 😄5
- 未設定：😶 と「–」を薄く表示
- レベル1は数値を赤（text-red-600）、レベル2はオレンジ（text-orange-600）

【OutputCard.tsx】
Props: output: OutputCard, onEdit: () => void

表示内容：
- タイトル
- 種別（バッジ）
- ステータス（完了：緑バッジ / 予定：紫バッジ）
- URLがある場合はリンクアイコン

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Timeline/TimelineView.tsx
- src/components/Timeline/LearningCard.tsx
- src/components/Timeline/MotivationPicker.tsx
- src/components/Timeline/OutputCard.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── Timeline/
            ├── TimelineView.tsx    ← ここ（新規作成）
            ├── LearningCard.tsx    ← ここ（新規作成）
            ├── MotivationPicker.tsx ← ここ（新規作成）
            └── OutputCard.tsx      ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 6 — 学習カード・アウトプットカードのモーダル

```
src/components/Modals/ のモーダルコンポーネントを実装してください。

【LearningCardModal.tsx】
Props:
- isOpen: boolean
- onClose: () => void
- card?: LearningCard（編集時）

フォーム項目：
- タイトル（テキスト入力、必須）
- 開始年月（YYYY-MM形式のinput type="month"）
- 終了年月（同上、任意・「終了未定」チェックボックスで非表示化）
- 種別（セレクト：授業/自習/研修/資格学習/その他）
- 取り組み場所（セレクト、任意）：
  - 未設定（デフォルト）
  - 自宅
  - 大学・学校
  - 職場
  - カフェ・コワーキング
  - 図書館
  - オンライン
  - その他
- 受講形態（セレクト、任意）：
  - 未設定（デフォルト）
  - 教室対面
  - ハイブリッド型
  - ハイフレックス型
  - フルオンライン
- メモ（テキストエリア、任意）

バリデーション：
- タイトル必須
- 開始年月必須
- 終了年月 >= 開始年月

送信時：
- 新規：timelineStore.addCard()
- 編集：timelineStore.updateCard()

【OutputCardModal.tsx】
Props:
- isOpen: boolean
- onClose: () => void
- learningCardId: string
- output?: OutputCard（編集時）

フォーム項目：
- タイトル（テキスト入力、必須）
- 種別（セレクト：ブログ記事/リポジトリ/資格・検定/発表・LT/個人開発/その他）
- URL（テキスト入力、任意）
- ステータス（ラジオ：完了/予定）

送信時：
- 新規：timelineStore.addOutputCard()
- 編集：timelineStore.updateOutputCard()

【DeleteConfirmModal.tsx】
汎用の削除確認モーダル。
Props: isOpen, title, message, onConfirm, onCancel

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Modals/LearningCardModal.tsx
- src/components/Modals/OutputCardModal.tsx
- src/components/Modals/DeleteConfirmModal.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── Modals/
            ├── LearningCardModal.tsx  ← ここ（新規作成）
            ├── OutputCardModal.tsx    ← ここ（新規作成）
            └── DeleteConfirmModal.tsx ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 7 — トップバーとゴールピル

```
src/components/TopBar.tsx を実装してください。

【レイアウト】
2行構成：
- 1行目：アプリ名「Horizon Guide」、右端に「AI 助言」ボタン（青）と「設定」ボタン
- 2行目：WBゴールピル → 矢印（→）→ キャリアゴールピル（横幅いっぱいに伸縮）

【WBゴールピル】
- 背景：wb-bg（#EAF3DE）、文字色：wb-green（#27500A）
- 先頭に🌱絵文字
- テキストは省略表示（overflow: hidden, text-overflow: ellipsis）
- 未設定の場合：「+ WBゴールを設定」と薄く表示
- クリック：GoalModal（WBゴール編集）を開く

【キャリアゴールピル】
- 背景：career-bg（#FAEEDA）、文字色：career-brown（#633806）
- テキストは「{ゴール概要}（{目標時期}）」形式
- 未設定の場合：「+ キャリアゴールを設定」と薄く表示
- クリック：GoalModal（キャリアゴール編集）を開く

【「AI 助言」ボタン】
- クリック時：aiStore.sendAnalyze(buildContext(...))を呼ぶ
- ストリーミング中はローディングスピナー表示・無効化

goalStoreのcareerGoal / wellbeingGoalを購読して表示を更新してください。

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/TopBar.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── TopBar.tsx ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 8 — AI助言サイドパネル

```
src/components/Sidebar/AISidebar.tsx を実装してください。

【レイアウト】
- 幅：デフォルト280px、左端ドラッグでリサイズ可能（最小200px〜最大600px）
- リサイズハンドル：左端に1px幅（ホバーで青くなる）、mousedownでリサイズ開始
- 上部ヘッダー：「AI 助言」タイトル ＋ 接続状態バッジ（Dify接続中 / LLM接続中）
- 中央：メッセージ一覧（スクロール可能）
- 下部：テキスト入力 ＋ 送信ボタン

【メッセージ表示】
- AIメッセージ：左寄せ、背景グレー
- ユーザーメッセージ：右寄せ、背景ブルー
- ストリーミング中はローディングドット（...）をアニメーション表示

【送信処理】
1. ユーザーメッセージをmessagesに追加
2. buildContext(careerGoal, wellbeingGoal, learningCards)でコンテキストを生成
3. aiStore.sendChat(userMessage, context)を呼ぶ
4. レスポンスをストリーミング表示

【ChatMessage.tsx】
Props: message: ChatMessage
- role='user'と'assistant'で見た目を切り替え
- タイムスタンプは右下に小さく表示

【src/utils/contextBuilder.ts】
システムプロンプトのbuildContext()関数をそのまま実装してください。
引数：careerGoal, wellbeingGoal, learningCards
戻り値：string（AIに渡すコンテキストテキスト）

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Sidebar/AISidebar.tsx
- src/components/Sidebar/ChatMessage.tsx
- src/utils/contextBuilder.ts

【配置方法】
horizon-guide/
└── src/
    ├── components/
    │   └── Sidebar/
    │       ├── AISidebar.tsx    ← ここ（新規作成）
    │       └── ChatMessage.tsx  ← ここ（新規作成）
    └── utils/
        └── contextBuilder.ts   ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 9 — AI接続（electron/ai-bridge.ts）

```
electron/ai-bridge.ts を実装してください。

【Node.js v24前提】
- グローバルの `fetch` を使用してください（node-fetch・axiosは不要）
- `AbortController` もグローバルで使用可能です（タイムアウト制御に使用）

【Dify接続（優先実装）】
- エンドポイント：{config.dify.endpoint}/v1/chat-messages
- APIキーはkeytarから取得
- グローバルfetchでリクエスト送信
- リクエストボディ：
  {
    inputs: { timeline_context: context },
    query: userMessage,
    response_mode: "streaming",
    user: "horizon-guide-user"
  }
- ストリーミングレスポンスをSSE（Server-Sent Events）でパース
- 各チャンクをレンダラープロセスにipcMain.emit()で送信
- AbortControllerで30秒タイムアウトを実装

【LLM直接接続（Gemini優先）】
- Google Gemini APIをグローバルfetchで直接呼び出し
- エンドポイント：https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent
- デフォルトモデル：gemini-2.5-flash-lite（無料枠あり：15 RPM / 1,500,000 TPM）
- リクエストボディ：
  {
    "system_instruction": { "parts": [{ "text": "あなたは学習設計の専門家AIです。..." }] },
    "contents": [{ "role": "user", "parts": [{ "text": "{context}\n\n{userMessage}" }] }],
    "generationConfig": { "temperature": 0.7, "maxOutputTokens": 1024 }
  }
- SSEストリーミングレスポンス対応（alt=sse パラメータを使用）
- Claude / GPT も同様の構造でフォールバック実装可（設定画面でモデル選択）

【ローカルLLM接続（Ollama等）】
- config.provider === 'local' の場合に呼び出す
- エンドポイントURL：config.local.endpoint（ユーザーが設定、デフォルト：http://localhost:11434）
- モデル名：config.local.model（ユーザーが設定、デフォルト：gemma3:4b）
- APIキー：不要（keytarへのアクセスなし）
- API形式の自動判別：
  - URLに /api/chat を含む、または /v1/ を含まない → Ollama ネイティブAPI
    - エンドポイント: {endpoint}/api/chat
    - リクエストボディ: { model, messages: [{role, content}], stream: false }
    - レスポンス: data.message.content
  - それ以外 → OpenAI互換API（LM Studio等）
    - エンドポイント: {endpoint}/v1/chat/completions
    - リクエストボディ: { model, messages, temperature: 0.7, max_tokens: 1024 }
    - レスポンス: data.choices[0].message.content
- provider: 'local'、modelOrEndpoint: '{endpoint}/{model}' として ai_history に記録

【共通仕様】
- APIキーはkeytar.getPassword('horizon-guide', provider)で取得（localは不要）
- タイムアウト：AbortSignal.timeout(30000)を使用（Node.js v17.3以降・v24で安定）
- エラー時は適切なエラーメッセージをレンダラーに返す
- ai_historyテーブルにすべての会話を記録

IPCハンドラーとして以下を実装：
- ipcMain.handle('chat-ai', async (event, { message, context }) => {...})
- ipcMain.handle('analyze-ai', async (event, { context }) => {...})

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron/ai-bridge.ts

【配置方法】
horizon-guide/
└── electron/
    └── ai-bridge.ts ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 10 — 設定画面

```
src/components/Settings/SettingsPage.tsx を実装してください。

【全体レイアウト】
- 左サイドバー（148px）：メニュー項目
- 右コンテンツエリア：選択中のセクションを表示

【サイドバーメニュー】
1. キャリアゴール
2. ウェルビーイングゴール（独立タブ）
3. AI接続設定
4. エクスポート
5. データ管理
6. 表示・言語

【1. キャリアゴールセクション】
キャリアゴール入力フォームのみ：
- ゴール（テキストエリア、必須）
- 目標時期（input type="month"、任意）
- 氏名（テキスト、PDF用・任意）
- 保存ボタン

【2. ウェルビーイングゴールセクション（独立タブ）】
OECD 2030バッジ付きの独立タブとして実装：

3軸入力エリア（3カラムグリッド）：
- 個人軸テキストエリア（プレースホルダー：「自己成長・自己実現・ウェルネスに関する価値観」）
- 社会軸テキストエリア（プレースホルダー：「コミュニティ・他者への貢献に関する価値観」）
- 地球軸テキストエリア（プレースホルダー：「持続可能性・環境・次世代への責任に関する価値観」）

「AIにWBゴールを生成してもらう」ボタン：
- 3軸テキストをコンテキストとしてAIに渡す
- AIがWBゴール全体テキストを一文で生成して返す
- 生成結果エリアに表示（編集可能なinput[type=text]）

生成結果エリア：
- 🌱アイコン付きで生成テキストを表示
- 編集可能なテキスト入力欄
- 「再生成する」ボタン（別パターンを生成）
- 「このゴールを採用する」ボタン → goalStore.saveWellbeingGoal()を呼ぶ

【3. AI接続設定セクション】
ラジオボタンで接続先を選択：
- LLM直接接続（クラウド）（Gemini / Claude / ChatGPT ＋ APIキー入力）[Gemini優先]
  - Gemini: gemini-2.5-flash-lite（無料枠あり）
  - Claude: claude-haiku-4-5-20251001
  - ChatGPT: gpt-5o-mini
- ローカルLLM接続（エンドポイントURL ＋ モデル名）[APIキー不要]
  - デフォルトエンドポイント: http://localhost:11434
  - デフォルトモデル: gemma3:4b
  - 「ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。」
  - Ollama / LM Studio のエンドポイント例を表示
- Dify（エンドポイント ＋ APIキー入力）[優先推奨バッジ]
- Langflow（近日対応バッジ、無効）

「接続テスト」ボタン：テストメッセージを送信して疎通確認

【4. エクスポートセクション】
- 「CSVエクスポート（全データ）」ボタン
- 「PDFポートフォリオ（A4）」ボタン
- 「PDFタイムライン印刷」ボタン

【5. データ管理セクション】
- バックアップ：「CSVエクスポート（全データ）」ボタン

- 研究データエリア（通常の枠線）：
  - 見出し：「研究データ」
  - 説明文：「実証実験用の行動ログをエクスポートします。通常のCSVエクスポートとは別ファイルです。」
  - チェックボックス：「氏名・ゴールテキストを匿名化する（推奨）」（デフォルトON）
  - 「研究データをエクスポート」ボタン（青）
  - クリック時：electronAPI.exportResearchLog(anonymize) を呼ぶ
  - 完了後：「research-YYYYMMDD.zip を保存しました」トースト通知

- 初期化エリア（赤い枠線）：
  - 説明文：「すべての学習データ・ゴール・AI履歴が削除されます。AI接続設定は保持されます。」
  - 「バックアップしてから初期化」ボタン
  - 「データを初期化する」ボタン（赤）
  - クリック時：確認ダイアログ → 「初期化」テキスト入力 → 確定

【6. 表示・言語セクション】
- 言語選択（日本語のみ、将来対応）
- テーマ（ライト/ダーク/システム連動）

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Settings/SettingsPage.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── Settings/
            └── SettingsPage.tsx ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 11 — CSVエクスポートとPDFポートフォリオ

```
エクスポート機能を実装してください。

【CSVエクスポート（electron/main.tsのexport-csvハンドラー）】
1. 5つのCSVファイルをpapaparseで生成（UTF-8 BOM付き）
2. jszipでZIPに圧縮
3. dialog.showSaveDialog()でファイル保存ダイアログを表示
4. ファイル名デフォルト：horizon-guide-export-YYYYMMDD.zip

各CSVのフィールドはシステムプロンプトの仕様を参照してください。

【研究用行動ログエクスポート（electron/main.tsのexport-research-logハンドラー）】
引数：{ anonymize: boolean }

1. researchLog.tsの各get関数でログを全件取得：
   - getAllActionLogs()
   - getAllMotivationLogs()
   - getAllGoalLogs()
   - getAllSessionLogs()

2. anonymize === true の場合、以下のフィールドを '[anonymized]' に置換：
   - action_log: target_title, before_value, after_value
   - motivation_log: learning_card_title
   - goal_log: previous_value, new_value

3. papaparseで4つのCSVを生成（UTF-8 BOM付き）：
   - action_log.csv：id, event_type, target_type, target_id, target_title, before_value, after_value, timestamp
   - motivation_log.csv：id, learning_card_id, learning_card_title, previous_level, new_level, timestamp
   - goal_log.csv：id, event_type, goal_type, previous_value, new_value, timestamp
   - session_log.csv：id, event_type, timestamp

4. jszipでZIPに圧縮
5. dialog.showSaveDialog()でファイル保存ダイアログを表示
6. ファイル名デフォルト：horizon-guide-research-YYYYMMDD.zip

【PDFポートフォリオ（A4縦）】
puppeteerを使ってHTMLテンプレートをPDF変換してください。

HTMLテンプレートに含める内容（上から順に）：
1. ヘッダー：「Learning Portfolio」、氏名（設定済みの場合）、出力日
2. WBゴールセクション：🌱アイコン付き、個人・社会・地球の3軸
3. キャリアゴールセクション：ゴールテキスト、目標時期
4. 過去の学習セクション：各カードをリスト表示
   - タイトル、期間、種別、モチベーション（顔アイコン＋数値）
   - アウトプット一覧（種別・ステータス・URL）
5. 進行中の学習セクション（同上）
6. 今後の学習計画セクション（同上）

PDF設定：
- format: 'A4'
- margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
- フォント：Noto Sans JP（Google Fonts）

【PDFタイムライン印刷】
webContents.print()を使用：
- landscape: true
- pageSize: 'A3'
- 印刷前にbefore-printイベントで印刷用CSSを適用
  （背景色あり、サイドパネルを非表示）

【ファイル出力】
上記の実装をelectron/main.tsの該当ハンドラーとして生成し、ダウンロードできるよう出力してください。
出力先：
- electron/main.ts（export-csv / export-research-log / PDF関連ハンドラーを追記した完全版）

【配置方法】
horizon-guide/
└── electron/
    └── main.ts ← ここ（Step 3で作成したファイルを上書き）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 12 — データ初期化機能

```
データ初期化機能を実装してください。

【electron/main.tsのreset-databaseハンドラー】
1. 現在のDBファイルを削除（fs.unlinkSync）
2. initDatabase()を再実行（テーブル再作成）
3. 完了をレンダラーに通知

【確認ダイアログ（src/components/Modals/ResetConfirmModal.tsx）】
2段階確認：
1. 1段階目：警告メッセージ（「この操作は元に戻せません」）と「続ける」「キャンセル」
2. 2段階目：テキスト入力ボックスに「初期化」と入力しないと確定ボタンが有効にならない
3. 確定後：electronAPI.resetDatabase()を呼ぶ
4. 完了後：ページリロード（window.location.reload()）

テキスト入力のバリデーション：
- inputValue === '初期化' の場合のみ確定ボタンを有効化
- 入力欄のプレースホルダー：「「初期化」と入力してください」

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Modals/ResetConfirmModal.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── Modals/
            └── ResetConfirmModal.tsx ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 13 — オンボーディング

```
初回起動時のオンボーディング画面を実装してください。

【src/components/Onboarding/OnboardingFlow.tsx】
判定ロジック：
- アプリ起動時にgetCareerGoal()を呼ぶ
- nullの場合はオンボーディング画面を表示
- 設定済みの場合はホーム画面を表示

ステップ構成（4ステップ）：
1. ウェルカム画面
   - アプリ名「Horizon Guide」とキャッチコピー
   - 「はじめる」ボタン

2. AI接続設定（Gemini / ローカルLLM 選択）
   - 2択カードUI（☁️ Gemini（クラウド）/ 💻 ローカルLLM）で接続方式を選択
   
   【Gemini選択時】
   - Google AI Studioへのリンク表示（aistudio.google.com）
   - APIキー入力（password型、keytarに保存）
   - 保存時：provider='llm', model='gemini-2.5-flash-lite' でAIConfig更新
   - 決定ボタンは青色
   
   【ローカルLLM選択時】
   - エンドポイントURL入力（デフォルト：http://localhost:11434）
   - モデル名入力（デフォルト：gemma3:4b）
   - 保存時：provider='local', local.endpoint, local.model でAIConfig更新
   - APIキー不要（keytarへの保存なし）
   - 説明文：「ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。」
   - 決定ボタンは緑色
   - Ollama / LM Studio のデフォルトポート例を表示
   
   【共通】
   - 「スキップ（後で設定）」ボタンで任意化

3. キャリアゴール入力
   - 「あなたのキャリアゴールを教えてください」
   - ゴールテキスト入力（必須）
   - 目標時期入力（任意）
   - 氏名入力（任意、PDF用）
   - 「次へ」ボタン

4. WBゴール設定（任意）
   - 「学習のWhy（ウェルビーイングゴール）を設定しましょう」
   - OECD Education 2030の説明（1〜2行）
   - 「AIに提案してもらう」ボタン
   - AIの提案を表示・編集できるエリア
   - 「スキップして始める」ボタン
   - 「設定して始める」ボタン

完了後：goalStore.saveCareerGoal()、saveWellbeingGoal()を呼び、ホーム画面へ遷移

【ファイル出力】
上記のすべてのファイルを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- src/components/Onboarding/OnboardingFlow.tsx

【配置方法】
horizon-guide/
└── src/
    └── components/
        └── Onboarding/
            └── OnboardingFlow.tsx ← ここ（新規作成）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 14 — electron-builderでパッケージング

```
electron-builder.config.jsを設定して、Windows・Macの両方でビルドできるようにしてください。

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
- files: dist, electron/dist, node_modules
- extraResources: resources/（アプリリソース用）
- asar: true
- nativeのrebuildターゲット（better-sqlite3, keytar）を設定

【package.jsonのscripts追記】
- "build:win": "electron-builder --win"
- "build:mac": "electron-builder --mac"
- "build:all": "electron-builder --win --mac"

また、better-sqlite3とkeytarはnativeモジュールなので、
electron-rebuilderの設定も追加してください。

【ファイル出力】
electron-builder.config.jsを実際に生成し、ダウンロードできるよう出力してください。
出力先：
- electron-builder.config.js（完全版）

【配置方法】
horizon-guide/
└── electron-builder.config.js ← ここ（Step 1で作成したファイルを上書き）

回答の最後に、ダウンロードしたファイルをどのディレクトリに配置すればよいか、ディレクトリツリーで説明してください。
```

---

## Step 15 — 結合テストと動作確認

```
⚠️ セットアップ手順（必ずこの順番で実行）：

# 1. 依存パッケージのインストール（--ignore-scripts 必須）
npm install --ignore-scripts

# 2. Electronバイナリ取得 + ネイティブモジュールリビルド
npm run setup

# 3. 開発モードで起動
npm run dev

※ npm install（引数なし）は使わないでください。
※ npm run setup は Electronバイナリ取得と @electron/rebuild を一括実行します。

実装が完了したら、以下の動作確認チェックリストを実行してください。

【基本フロー確認】
□ アプリ起動 → オンボーディング画面が表示される
□ キャリアゴール入力 → goalStoreに保存 → トップバーに反映される
□ WBゴール設定 → AIが3軸で提案 → 採用ボタンで確定
□ 学習カード追加 → タイムラインに列が追加される
□ モチベーション変更 → カード右下の顔アイコンが更新される
□ アウトプットカード追加 → 親カードの下にぶら下がる
□ AI助言ボタン → サイドパネルにAnalyze modeの結果が表示される
□ チャット送信 → ストリーミングで返答が表示される

【データ永続化確認】
□ アプリを閉じて再起動 → データが保持されている
□ SQLiteファイルが userData/horizon-guide.db に生成されている

【エクスポート確認】
□ CSV出力 → ZIPファイルが5つのCSVを含む
□ 研究データエクスポート（匿名化ON）→ action_log / motivation_log / goal_log / session_log の4ファイルを含むZIPが生成される
□ 研究データエクスポート（匿名化ON）→ target_title / learning_card_title / goal_value が '[anonymized]' になっている
□ 研究データエクスポート（匿名化OFF）→ 実際のテキストが出力される
□ PDFポートフォリオ → A4でWBゴール・キャリアゴール・学習一覧が出力される

【設定画面確認】
□ Dify接続設定 → APIキーがkeytarに保存される
□ 接続テスト → 疎通確認メッセージが返る
□ データ初期化 → 「初期化」入力後にDBがリセットされる
□ 初期化後 → オンボーディング画面に戻る

【行動ログ自動記録確認】
□ 学習カード追加 → action_logにcard_createdが記録される
□ モチベーション変更 → motivation_logに変更前後のレベルが記録される
□ キャリアゴール保存 → goal_logにgoal_created / goal_updatedが記録される
□ アプリ起動 → session_logにapp_launchedが記録される
□ アプリ終了 → session_logにapp_closedが記録される

【エッジケース確認】
□ カード0件の状態でAI助言ボタンを押す → エラーにならない
□ WBゴール未設定でAnalyze modeを実行 → 適切なコンテキストで動作する
□ Dify未設定でAI助言を実行 → エラーメッセージが表示される

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

---

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

---

### 新機能追加（機能追加バックログ）

```
機能追加バックログの機能として {機能名} を追加実装してください。

仕様：
- {要件1}
- {要件2}

既存のコードへの影響：
- {影響を受けるファイル}

SDDの更新も必要であれば、変更点を提示してください。
```

---

### CSVインポート機能（機能追加バックログ）

```
CSVインポート機能を実装してください。

【設定画面のトグル（src/components/Settings/SettingsPage.tsx）】
- 「データ管理」セクションに「CSVインポートを有効にする」トグルを追加
- デフォルト：オフ
- トグル状態はelectron-storeに保存（'import-enabled': boolean）
- トグルON時のみインポートUIを表示
- トグルの下に注記：「実証実験中はオフのまま使用してください」

【インポートUI（トグルON時のみ表示）】
- learning_cards.csv：ファイル選択ボタン＋インポートボタン
- output_cards.csv：ファイル選択ボタン＋インポートボタン
- インポート完了後：「X件をインポートしました（Y件スキップ）」トースト通知

【electron/main.tsのimport-csvハンドラー】
引数：{ type: 'learning_cards' | 'output_cards', filePath: string }

1. papaparseでCSVを読み込み
2. 各行をバリデーション（必須フィールドチェック）
3. id が既存と一致する場合はスキップ（上書きなし）
4. 新規レコードをDBにINSERT
5. フェーズを現在日付で再計算して保存
6. action_logに event_type: 'card_imported' として記録
   （card_createdと区別することで研究分析時に除外可能）
7. インポート結果（成功件数・スキップ件数）を返す

【研究ログの記録】
- electronAPI.logAction({ eventType: 'card_imported', targetType, targetId, targetTitle, beforeValue: null, afterValue: JSON.stringify(card) })
- card_created と event_type が異なるため、研究データ分析時にフィルタリング可能

【バリデーション】
- learning_cards：title・start_date・type は必須
- output_cards：title・learning_card_id・type・status は必須
- 不正な行はスキップしてログ出力
```

### Difyエージェント設計

```
Horizon GuideのAI助言に使うDifyワークフローを設計してください。

用途：{Chat mode / Analyze mode}

入力変数：
- timeline_context: string（buildContext()の出力）
- query: string（ユーザーの質問 or 固定プロンプト）

期待するDifyのワークフロー構成：
- LLMノードの設定
- システムプロンプトのテンプレート
- 出力形式

使用するLLMモデル：{モデル名}
```

---

*Horizon Guide 実装プロンプト集 v2.1*
*対応SDD：HG-SDD-001 v0.9.6*
*Node.js v24（LTS）前提*
