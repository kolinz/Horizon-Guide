# Horizon Guide — システム設計仕様書（SDD）

**文書番号**: HG-SDD-001  
**バージョン**: 0.9.8（Draft）  
**作成日**: 2026-03-22  
**ステータス**: 🟡 Draft — レビュー待ち

---

## 目次

1. [概要・プロジェクト背景](#1-概要プロジェクト背景)
2. [ユーザーと目的](#2-ユーザーと目的)
3. [機能要件（FR）](#3-機能要件fr)
4. [非機能要件（NFR）](#4-非機能要件nfr)
5. [画面構成・UIフロー](#5-画面構成uiフロー)
6. [データ構造設計](#6-データ構造設計)
7. [AI助言システム設計](#7-ai助言システム設計)
8. [技術スタック](#8-技術スタック)
9. [将来の拡張ロードマップ](#9-将来の拡張ロードマップ)
10. [用語集](#10-用語集)

---

## 1. 概要・プロジェクト背景

### 1.1 プロダクト概要

**Horizon Guide** は、学習者が「キャリアゴール」を起点に、過去・未来の学習をタイムライン上で自ら設計・記録し、AI（LLMまたはDify等のAIエージェント）から助言を得ながら学習とアウトプットを継続的に管理するElectronデスクトップアプリケーションである。

### 1.2 コアコンセプト

```
ウェルビーイングゴール（Why）── OECD 2030：個人・社会・地球の3軸
      ↓（支える）
キャリアゴール（What）
      ↓（逆算）
過去の学習 ─────── 進行中 ─────── 現在 ─────── 未来の学習
  └ アウトプット紐づけ                            └ アウトプット紐づけ（予定）
      ↕                                                ↕
        AI助言（Chat mode / Analyze mode）
        ※ 学習者プロフィールに基づき助言を最適化
```

- **学習の主体はユーザー**：AIが計画を自動生成するのではなく、ユーザー自身がタイムラインを構築する
- **AIは支援・助言役**：WBゴール・キャリアゴール・タイムライン全体・学習者プロフィールを参照した上で助言する
- **アウトプット駆動**：各学習には必ずアウトプット（記事・資格・リポジトリ等）を紐づけることを促す
- **Why → What → How の階層**：OECD Education 2030「Learning Compass」のStudent Agency思想を体現する
- **学習者プロフィールによる助言最適化**：属性（学校種別）と学問分野をAIコンテキストに注入し、学習者の属性に合わせた助言を実現する

### 1.3 解決する課題

| 課題 | Horizon Guideのアプローチ |
|------|------|
| 学習の方向迷子 | キャリアゴールを常に表示し、学習の文脈を維持する |
| アウトプット不足 | 学習カードとアウトプットカードを親子構造で強制的に意識させる |
| 計画と現実の乖離 | 過去・現在・未来を同一タイムライン上で可視化する |
| AIへの過度な依存 | ユーザーが意図したときだけAIが動く（手動トリガー） |
| 汎用的すぎるAI助言 | 学習者プロフィール（学校種別・学問分野）をコンテキストに注入し、属性に合った助言を生成する |

### 1.4 研究的背景

本プロダクトは以下の研究ギャップを埋めることを意図する：

- **G1**: アウトプット形式を学習目標として設定する設計（Output-Driven Learning Design）
- **G2**: 過去〜未来の学習履歴を一元管理する連続的なタイムライン
- **G3**: キャリアゴール × 学習計画 × アウトプット設計の統合管理
- **G4**: OECD Education 2030「Learning Compass」のWhy→What→Howゴール階層をUIで実装

関連学術領域：Learning Analytics、Self-Regulated Learning（SRL）支援、Goal-Driven Learning Path Planning、OECD Education 2030

**OECD Education 2030との整合：**

| OECD 2030の概念 | Horizon Guideでの実装 |
|---|---|
| Student Agency | ユーザー自身がタイムラインを構築（AI自動生成なし） |
| AAR サイクル（Anticipation-Action-Reflection） | 未来計画→学習実施→AI Analyze modeで振り返り |
| 変革的コンピテンシー「新しい価値の創造」 | アウトプット（記事・OSS・発表）を必ず紐づける設計 |
| 個人・集合的ウェルビーイング | WBゴールの3軸（個人・社会・地球）で実装 |

---

## 2. ユーザーと目的

### 2.1 ターゲットユーザー

| ユーザー種別 | キャリアゴール例 | 主な利用シーン |
|---|---|---|
| **高校生** | 情報系大学進学 | 進路設計・受験準備の記録 |
| **大学生** | IT企業エンジニア就職 | 学習ポートフォリオの構築 |
| **専門職大学生** | 情報系専門職への就職 | 実践的学習とアウトプットの記録 |
| **社会人（転職活動中）** | DS・PM・ITコンサルへの転職 | スキルギャップの可視化と計画立案 |
| **一般学習者** | 副業・資格取得 | 継続学習の設計と記録 |

> MVP フェーズでは「大学生〜社会人の転職・就職志向者」を主ターゲットとする。実証実験フェーズでは開志専門職大学情報学部の学生を対象とする。

### 2.2 ユーザーストーリー（主要）

```
As a 社会人（営業職 → データサイエンティスト転職希望）,
I want to 過去の学習（Python・統計）と未来の計画（Kaggle・深層学習）を
             タイムラインに並べてアウトプットと紐づけたい,
So that キャリアゴールに対して自分の進捗が見え、
         AIから具体的な助言をもらえる.

As a 大学3年生,
I want to 過去の授業・個人開発をタイムラインに記録し、
             就活までの残り期間で何をアウトプットすべきか相談したい,
So that ポートフォリオとして整理された学習履歴を持てる.

As a 専門職大学生（情報学部）,
I want to 自分が専門職大学生・情報学専攻であることをアプリに伝え、
             それに合わせたAI助言を受けたい,
So that 汎用的すぎない、専門職大学の文脈に合った助言が得られる.
```

---

## 3. 機能要件（FR）

### 3.1 機能一覧

| ID | 機能名 | 優先度 | フェーズ |
|----|--------|--------|---------|
| FR-01 | キャリアゴール設定 | Must | MVP |
| FR-01b | ウェルビーイングゴール設定（OECD 2030対応） | Should | MVP |
| FR-02 | 学習カードの作成・編集・削除 | Must | MVP |
| FR-03 | アウトプットカードの作成・編集・削除（親子紐づけ） | Must | MVP |
| FR-04 | 横軸時系列タイムライン表示 | Must | MVP |
| FR-05 | AI助言：Chat mode | Must | MVP |
| FR-06 | AI助言：Analyze mode（「AI 助言」ボタン） | Must | MVP |
| FR-07 | AI接続設定（LLM / Dify 切り替え） | Must | MVP |
| FR-08 | ローカルデータ保存・読み込み | Must | MVP |
| FR-08b | データ初期化（設定画面・2段階確認） | Should | MVP |
| FR-09 | 学習カードの完了マーク・進行中状態・モチベーション | Should | MVP |
| FR-10 | CSVエクスポート（全データ5種） | Should | MVP |
| FR-10b | 研究用行動ログエクスポート（匿名化対応） | Must | MVP |
| FR-11 | PDFエクスポート（整形ポートフォリオ A4） | Should | MVP |
| FR-12 | PDFエクスポート（タイムライン印刷） | Could | MVP |
| **FR-19** | **学習者プロフィール設定（AI助言最適化）** | **Should** | **MVP** |
| FR-13 | 共有URL生成 | Could | バックログ |
| FR-18 | CSVインポート（雛形・復元対応、デフォルトオフ） | Should | バックログ |
| FR-14 | 職種別テンプレート | Could | バックログ |
| FR-15 | Langflow接続対応 | Could | バックログ |
| FR-16 | 複数ゴールの並行管理 | Won't（現在） | バックログ |
| FR-17 | 教員ダッシュボード | Won't（現在） | バックログ |

### 3.2 機能詳細

#### FR-01: キャリアゴール設定

- **入力場所は2箇所**（どちらで変更しても即時同期）：
  - **設定画面**：初回起動時やじっくり編集したいときに使用
  - **メイン画面のゴールピル**：タイムラインを見ながらクリックして素早く変更
- 入力項目：
  - ゴール内容（自由記述、必須）
  - 目標時期（年月、任意）
  - 氏名（PDFポートフォリオ出力時に使用、任意）
- AI助言へのコンテキストとして常に渡される
- 初回起動時は5ステップのオンボーディング画面を表示：
  1. ウェルカム画面
  2. AI接続設定（Gemini / ローカルLLM を2択カードUIで選択・スキップ可）
     - Gemini選択：APIキー入力 → keytarに保存、provider='llm'
     - ローカルLLM選択：エンドポイントURL＋モデル名入力（デフォルト：gemma3:4b）、provider='local'、APIキー不要
  3. **学習者プロフィール設定**（任意・スキップ可） ← FR-19
  4. キャリアゴール入力（必須）
  5. WBゴール設定（任意・AIによる提案あり）

#### FR-01b: ウェルビーイングゴール設定

OECD Education 2030「Learning Compass」の「個人・集合的ウェルビーイング」概念に基づき、キャリアゴールの上位目的として設定する。

- **表示場所**：メイン画面トップバーにキャリアゴールと並べて常時表示
- **入力フロー**：
  1. ユーザーがキャリアゴールを入力・保存
  2. 設定画面の「ウェルビーイングゴール」セクションで「AIに提案してもらう」ボタンを押す
  3. AIがキャリアゴールを読み取り、以下の3軸で提案を生成：
     - **個人**：自己成長・自己実現・ウェルネス
     - **社会**：コミュニティ・他者への貢献
     - **地球**：持続可能性・環境・次世代への責任
  4. ユーザーが提案を選択するか、自由記述で編集・確定
- **表示形式**：トップバーに短縮テキストで表示（例：「🌱 地域のデジタル格差をなくしたい」）
- **AI助言への活用**：Chat mode / Analyze mode のコンテキストにキャリアゴールと合わせて渡す
- 任意設定（未設定でも他機能は動作する）

#### FR-02: 学習カードの作成・編集・削除

- **カードの入力項目**：
  - タイトル（必須）
  - 期間：開始年月・終了年月（終了未定も可）
  - 種別：授業 / 自習 / 研修 / 資格学習 / その他
  - **取り組み場所**（任意・選択式）：自宅 / 大学・学校 / 職場 / カフェ・コワーキング / 図書館 / オンライン / その他
  - **受講形態**（任意・選択式）：教室対面 / ハイブリッド型 / ハイフレックス型 / フルオンライン
  - フェーズ：過去 / 未来（現在日付を基準に自動判定、手動変更も可）
  - メモ（任意・自由記述）
- カードは横軸タイムライン上に開始日順で配置される
- **同時期に複数の学習カードがある場合は同じ時間軸列に縦スタックで表示する**（横にずらさない）
- 過去カード：緑の左ボーダー
- 進行中カード：オレンジの左ボーダー（開始済み・終了未定）
- 未来カード：紫の左ボーダー

#### FR-03: アウトプットカードの作成・編集・削除（親子紐づけ）

- 各学習カードの真下に縦線でぶら下がる親子構造
- **カードの入力項目**：
  - タイトル（必須）
  - 種別：ブログ記事 / リポジトリ / 資格・検定 / 発表・LT / 個人開発 / その他
  - URL（任意）
  - ステータス：完了 / 予定
- 1つの学習カードに複数のアウトプットカードを紐づけ可能
- 「＋追加」ボタンで学習カードの下に追加できる

#### FR-04: 横軸時系列タイムライン表示

- 横軸：月単位の時系列スケール
- 「現在」を示す縦の区切り線で過去・未来を視覚的に分離
- 各列（学習カード＋紐づくアウトプットカード）を横に並べる
- **同時期の学習カード（期間が重なるもの）は同じ時間軸列に縦スタックで表示する**
  - 縦スタック内では開始日の早い順に上から配置
  - 各カードのアウトプットカードはそれぞれの学習カード直下にぶら下がる
  - 列幅は1カード分のまま変えない（横には広げない）
- 横スクロールで過去〜未来を移動できる
- 起動時に現在月が画面中央に自動スクロール
- タイムライン最右端に「＋学習を追加」ボタンを配置

#### FR-05: AI助言 — Chat mode

- サイドパネルのチャット入力欄からユーザーが質問を送信
- 送信時に以下をコンテキストとして自動付加してDify / LLMへ送る：
  - **学習者プロフィール（設定済みの場合）**
  - キャリアゴール（テキスト・期限）
  - WBゴール（設定済みの場合）
  - 全学習カードのデータ（タイトル・期間・種別・フェーズ）
  - 全アウトプットカードのデータ（タイトル・種別・ステータス）
  - ユーザーの質問テキスト
- レスポンスはサイドパネルにストリーミング表示
#### FR-06: AI助言 — Analyze mode

- トップバーの「**AI 助言**」ボタンで発火
- **サイドバー開閉との連携（案B方式）**：
  - 「AI 助言」ボタン押下 → サイドパネルを開く（既に開いていればそのまま）＋ Analyze mode を実行
  - サイドパネルヘッダー右端の「×」ボタン → パネルを閉じる（Analyze は実行しない）
  - パネルの開閉状態は `App.tsx` の `isSidebarOpen` state で管理
- コンテキスト：Chat mode と同じ全データ ＋ 分析依頼プロンプト（固定）
- 分析依頼プロンプト（内部テンプレート）：
  ```
  上記のウェルビーイングゴール・キャリアゴール・学習タイムラインをもとに、
  総合的な助言をしてください：
  1. WBゴール・キャリアゴールと学習進捗の整合性
  2. アウトプットが不足している学習があれば具体的に指摘
  3. 今後の学習計画で追加・修正を推奨する内容
  4. キャリアゴール達成に向けた優先アクション（3つ以内）
  ```
- レスポンスはサイドパネルにストリーミング表示

#### FR-07: AI接続設定

- 設定画面で以下を切り替え可能：

**① LLM直接接続（Gemini優先）**

| 項目 | 内容 |
|------|------|
| 優先モデル | Gemini（Google API）— 無料枠での個人・実証実験利用を想定 |
| 追加対応 | Claude（Anthropic API）/ GPT（OpenAI API） |
| 設定項目 | APIキー、モデル名（デフォルト：gemini-2.5-flash-lite） |
| 無料枠の目安 | Gemini 2.5 Flash Lite：15 RPM / 1,500,000 TPM（個人利用・実証実験に十分） |

**② ローカルLLM接続（Ollama等）**

| 項目 | 内容 |
|------|------|
| 対応ソフト | Ollama / LM Studio / llama.cpp 等 |
| エンドポイント | ユーザーが入力（デフォルト：`http://localhost:11434`） |
| モデル名 | ユーザーが入力（デフォルト：`gemma3:4b`） |
| APIキー | 不要 |
| プライバシー | AIとの対話が外部に出ていくことはない |
| API形式 | Ollamaネイティブ（`/api/chat`）またはOpenAI互換（`/v1/chat/completions`）を自動判別 |

**③ Dify接続（優先実装）**

| 項目 | 内容 |
|------|------|
| 設定項目 | エンドポイントURL、APIキー |
| 送信形式 | Dify Chat API（`/v1/chat-messages`） |
| コンテキスト渡し方 | `inputs` フィールドにタイムラインデータをJSON文字列として渡す |

- 設定値はOSのキーチェーン（`electron-store` + `keytar`）に暗号化保存

#### FR-08: ローカルデータ保存・読み込み（SQLite）

- データは**SQLite**（`better-sqlite3`）でローカル永続化する
- 保存先：`app.getPath('userData')/horizon-guide.db`
- 自動保存：カード操作・モチベーション変更のたびに即時書き込み（同期API）
- アプリ起動時に自動読み込み・マイグレーション実行
- AI設定（APIキー）のみ別途OSキーチェーン（`keytar`）に保存

**SQLiteを選択する理由：**

| 観点 | electron-store（JSON） | SQLite（better-sqlite3） |
|---|---|---|
| リレーション管理 | 手動 | 外部キー制約で保証 |
| 時系列クエリ | 全件読み込み必要 | `WHERE`/`ORDER BY`で効率的 |
| CSV出力 | JS側で整形 | `SELECT`で直接整形可 |
| モチベーション蓄積 | 配列が肥大化 | 行追加で効率的 |
| 研究データ分析 | 困難 | SQLで直接分析可 |

#### FR-08b: データ初期化（設定画面）

- 設定画面の「データ管理」セクションに配置
- **初期化フロー**：
  1. 「データを初期化する」ボタンをクリック
  2. 確認ダイアログ表示：「すべての学習データ・ゴール・AI履歴が削除されます。この操作は元に戻せません。」
  3. テキストボックスに「初期化」と入力して確定ボタンを押す（誤操作防止）
  4. DBを削除・再作成してアプリを初期状態に戻す
  5. 完了後、オンボーディング画面へ遷移
- **AI設定（APIキー・エンドポイント）は初期化対象外**（接続設定は保持）
- **学習者プロフィールは初期化対象外**（再設定コストを下げるため保持）
- オプション：「バックアップしてから初期化」ボタンも提供（CSVエクスポート後に初期化）

#### FR-09: 学習カードの完了マーク・進行中状態・モチベーション

- **完了マーク**：各学習カードにチェックボックスを設置。完了時はグレーアウト＋タイトルに取り消し線
- **進行中状態**：開始済み・終了未定の場合、自動判定してオレンジボーダー表示
- **モチベーションレベル**：
  - カード右下に顔アイコン＋数値（1〜5）を常時表示
  - クリックでポップオーバーが開き5段階を選択
  - 5段階の対応：😣1（つらい）/ 😞2（しんどい）/ 😐3（ふつう）/ 🙂4（たのしい）/ 😄5（最高）
  - 未設定の場合：😶 と「–」を薄く表示
  - レベル1は赤・レベル2はオレンジで数値を強調表示
  - CSV出力時は数値（1〜5、未設定はNULL）で出力
  - AI助言のコンテキストにモチベーションレベルを含める
- 完了率をタイムライン上部にプログレスバーで表示（完了 / 進行中 / 未着手の3区分）

#### FR-10: CSVエクスポート（全データ5種）

フッターの「CSV 出力」ボタンから実行。以下の5ファイルをZIPにまとめて出力：

**① learning_cards.csv**
```
id, title, start_date, end_date, type, location, modality, phase, is_completed, motivation_level, memo, created_at, updated_at
```

**② output_cards.csv**
```
id, learning_card_id, learning_card_title, title, type, url, status, created_at, updated_at
```

**③ career_goal.csv**
```
id, text, target_date, created_at, updated_at
```

**④ wellbeing_goal.csv**
```
id, text, personal_axis, social_axis, planet_axis, ai_generated, created_at, updated_at
```

**⑤ ai_history.csv**
```
id, mode, user_message, ai_response, provider, model_or_endpoint, timestamp
```

- 文字コード：UTF-8 BOM付き（Excelで文字化けしないよう配慮）
- 日付形式：ISO 8601（例: `2024-04`）
- ファイル名：`horizon-guide-export-YYYYMMDD.zip`

#### FR-10b: 研究用行動ログエクスポート（匿名化対応）

D論実証実験における研究データ収集を目的とした行動ログエクスポート機能。設定画面の「データ管理」セクションに「研究データをエクスポート」ボタンを独立して配置し、通常のCSVエクスポート（FR-10）とは分離して管理する。

**エクスポートするログ種別（4ファイル + ZIP）：**

**① action_log.csv**（カード操作ログ）
```
id, event_type, target_type, target_id, target_title, before_value, after_value, timestamp
```
- `event_type`：`card_created` / `card_updated` / `card_deleted` / `card_completed` / `card_imported` / `output_created` / `output_updated` / `output_deleted`
- `target_type`：`learning_card` / `output_card`
- `before_value` / `after_value`：変更前後の値（JSON文字列、例：フェーズ変更時は `"past"` → `"ongoing"`）

**② motivation_log.csv**（モチベーション変化ログ）
```
id, learning_card_id, learning_card_title, previous_level, new_level, timestamp
```
- `previous_level`：変更前のモチベーションレベル（1〜5、初回設定時はNULL）
- `new_level`：変更後のモチベーションレベル（1〜5）

**③ goal_log.csv**（ゴール設定ログ）
```
id, event_type, goal_type, previous_value, new_value, timestamp
```
- `event_type`：`goal_created` / `goal_updated`
- `goal_type`：`career` / `wellbeing`
- `previous_value` / `new_value`：変更前後のゴールテキスト（JSON文字列）

**④ session_log.csv**（セッションログ）
```
id, event_type, timestamp
```
- `event_type`：`app_launched` / `app_closed`

**匿名化オプション：**
- エクスポートダイアログに「氏名・ゴールテキストを匿名化する」チェックボックスを設置（デフォルト：ON）
- 匿名化ON時の処理：
  - `goal_log.csv` の `previous_value` / `new_value` を `[anonymized]` に置換
  - `action_log.csv` の `target_title` を `[anonymized]` に置換
  - `motivation_log.csv` の `learning_card_title` を `[anonymized]` に置換
  - 氏名（career_goals.user_name）はエクスポート対象外
- 匿名化OFFでも学習者本人のみがエクスポートするため、個人情報保護の主体は利用者側に委ねる

**ファイル名：** `horizon-guide-research-YYYYMMDD.zip`

#### FR-11: PDFエクスポート（整形ポートフォリオ A4）

メニューバーの「エクスポート → PDF（ポートフォリオ）」から実行。

**レイアウト構成（A4縦）：**

```
┌─────────────────────────────────────┐
│  Learning Portfolio                 │  ← ヘッダー
│  [氏名（設定画面で任意入力）]          │
│  出力日: 2026-03-18                 │
│ ───────────────────────────────── │
│  ウェルビーイングゴール               │  ← WBゴールセクション
│  🌱 地方中小企業のDXでデジタル格差をなくしたい
│  個人: データで自分の意思決定の質を上げる
│  社会: 地域の課題解決に貢献する       │
│  地球: AIの民主化で次世代の選択肢を広げる
│ ───────────────────────────────── │
│  キャリアゴール                       │  ← キャリアゴールセクション
│  データサイエンティストに転職する       │
│  目標時期: 2027年3月                 │
│ ───────────────────────────────── │
│  過去の学習（4件）                   │  ← 過去セクション
│  ■ Python基礎                       │
│    期間: 2024.04 – 06 ｜ 自習        │
│    アウトプット:                      │
│    ・Qiita記事「pandas入門」（公開済） │
│    ・GitHub: python-basics（公開）   │
│  ■ 統計学入門 ✓完了                  │
│    …                                │
│ ───────────────────────────────── │
│  今後の学習計画（2件）               │  ← 未来セクション
│  ■ Kaggleコンペ参加                  │
│    期間: 2025.02 – 04 ｜ 自習        │
│    アウトプット:                      │
│    ・コンペ提出スコア記録（予定）      │
│  …                                  │
└─────────────────────────────────────┘
```

- 実装：`puppeteer`（Electron内蔵Chromiumを使用）でHTMLテンプレートをPDF変換
- 用紙サイズ：A4（210×297mm）、余白 20mm
- フォント：日本語対応（Noto Sans JP）
- ファイル名：`horizon-guide-portfolio-YYYYMMDD.pdf`

#### FR-12: PDFエクスポート（タイムライン印刷）

メニューバーの「エクスポート → PDF（タイムライン）」から実行。

- Electron の `webContents.print()` を使用し、タイムライン画面をそのままPDF出力
- 用紙サイズ：A3横（タイムラインが横長のため）またはユーザーが選択
- 印刷用CSSを別途定義（背景色・ボーダー等を印刷向けに調整）

#### FR-19: 学習者プロフィール設定（AI助言最適化）

学習者の属性情報をAIコンテキストに注入することで、学校種別・学問分野に合わせたAI助言を実現する機能。

**入力箇所は2箇所**：
- **オンボーディング画面（Step 3）**：初回起動時にプルダウンで選択（スキップ可）
- **設定画面「学習者プロフィール」タブ**：いつでも変更可能

**入力項目（プルダウン選択）：**

| 項目 | 選択肢 | DBの値 |
|------|--------|--------|
| 属性 | （未設定） / 社会人 / 専門職大学 / 大学（専門職以外） / 専門学校 / 高校 | NULL / `working_adult` / `professional_univ` / `university` / `vocational` / `high_school` |
| 学問分野 | （未設定） / なし / 情報学 / 社会学 | NULL / `none` / `informatics` / `sociology` |

**UIデザイン（設定画面）：**

```
── 学習者プロフィール ────────────────────────────

AI助言をあなたの学習環境に合わせて最適化します。
設定しなくても他の機能はすべて利用できます。

属性
[ 専門職大学              ▼ ]

学問分野（最も近いものを選んでください）
[ 情報学                  ▼ ]
  情報学
  経営学
  社会学
  アニメ・マンガ
  ─────────────────
  （未設定）

                                    [保存する]
```

**オンボーディング（Step 3）の画面：**

```
あなたについて教えてください
AI助言をあなたに合わせて最適化します。

属性
[ 専門職大学              ▼ ]  ← 初期値：専門職大学
  社会人
  専門職大学  ✓
  大学（専門職以外）
  専門学校
  高校

学問分野（最も近いものを選んでください）
[ 情報学                  ▼ ]  ← 初期値：情報学
  情報学  ✓
  経営学
  社会学
  アニメ・マンガ
  その他

※ あとから設定画面の「学習者プロフィール」でいつでも変更できます。

              [スキップ]  [次へ →]
```

> **初期値について**：オンボーディング画面ではプルダウンに初期値をあらかじめ選択した状態で表示する。「スキップ」を押した場合は未設定（NULL）として保存し、「次へ」を押した場合は選択中の値を保存する。初期値は `professional_univ` / `informatics` とする（実証実験対象が開志専門職大学情報学部のため）。

**AIコンテキストへの注入：**
- `buildContext()` の冒頭に学習者プロフィールセクションを追加
- 未設定の場合はセクション自体を省略（コンテキストを汚さない）
- 設定済みの場合は以下の形式で注入：
  ```
  【学習者プロフィール】
  種別: 専門職大学生
  学問分野: 情報学
  ```

**初期化との関係：**
- データ初期化（FR-08b）を実行しても学習者プロフィールは保持される（再入力コストを下げるため）
- 明示的にリセットしたい場合は「（未設定）」を選んで保存する

#### FR-18: CSVインポート（バックログ）

設定画面「データ管理」セクションにインポート機能を追加。実証実験中の研究データ汚染を防ぐため、デフォルトはオフとする。

**有効化フロー：**
1. 設定画面「データ管理」セクションのトグル「CSVインポートを有効にする」をオン（デフォルト：オフ）
2. トグルをオンにすると同セクション内にインポートUIが出現
3. `learning_cards.csv` / `output_cards.csv` をファイル選択してインポート実行

**インポート仕様：**
- 対象ファイル：`learning_cards.csv` / `output_cards.csv`（エクスポートと同形式）
- 用途①：職種別テンプレートCSVを読み込んでスタート
- 用途②：エクスポートCSVをそのまま別端末に復元
- 重複処理：`id` が既存と一致する場合はスキップ（上書きなし）
- フェーズ自動判定：インポート時に現在日付を基準にフェーズを再計算

**研究ログの扱い：**
- インポートで生成されたカードは `action_log` の `event_type` を `card_imported` として記録
- `card_created`（手動作成）と明示的に区別することで、研究分析時に除外可能
- 実証実験時は被験者にトグルをオフのまま使用するよう教示する

---

## 4. 非機能要件（NFR）

### 4.1 パフォーマンス

| 項目 | 要件 |
|------|------|
| アプリ起動時間 | 3秒以内 |
| タイムライン描画 | 100カード以下で60fps維持 |
| AI応答開始（Time to First Token） | 5秒以内（ネットワーク依存） |

### 4.2 セキュリティ

- APIキー・エンドポイントURLはOSキーチェーンに暗号化保存（平文でファイルに書かない）
- ユーザーの学習データはローカルのみ保存、外部送信しない（AI接続時のコンテキスト送信を除く）
- Electronの `contextIsolation: true`、`nodeIntegration: false` を徹底

### 4.3 対応OS・環境

| OS | バージョン |
|----|----------|
| Windows | 10 / 11（64bit） |
| macOS | 12 Monterey 以降 |

### 4.4 アクセシビリティ

- キーボードナビゲーション対応（Tab / Enter / Escape）
- 色覚多様性対応（色のみに依存しない情報伝達）

---

## 5. 画面構成・UIフロー

### 5.1 画面一覧

| 画面ID | 画面名 | 説明 |
|--------|--------|------|
| SCR-01 | メイン画面（タイムライン） | アプリの主画面。AIサイドバーは「AI 助言」ボタンで開く・ヘッダーの「×」で閉じる。左端ドラッグでリサイズ可能（200〜600px、デフォルト280px） |
| SCR-02 | カード追加・編集モーダル | 学習カード / アウトプットカードの入力 |
| SCR-03 | キャリアゴール編集モーダル | メイン画面のゴールピルクリックで開く簡易編集 |
| SCR-04 | 設定画面 | キャリアゴール / WBゴール / 学習者プロフィール / AI接続設定 / エクスポート / データ管理 / 表示・言語 |
| SCR-05 | オンボーディング（5ステップ） | 初回起動時のセットアップウィザード |

### 5.2 メイン画面レイアウト

```
┌─────────────────────────────────────────────────────────┬──────────────────┐
│ Horizon Guide                          [AI 助言] [＋ 学習を追加] [設定] │  AI 助言         │
│ [WB: 地方中小企業のDXでデジタル格差をなくしたい] → [Career: DS転職（2027.03）]
│ ──────────────────────────────────────────────────────── │  Dify 接続中     │
│                                                          │ ──────────────── │
│  2024.04   2024.07   2024.10  │現在│  2025.02   2025.05  │                  │
│                               │    │                     │ [AI の発言]      │
│  ┌──────┐  ┌──────┐  ┌──────┐ │    │ ┌──────┐  ┌──────┐  │                  │
│  │Python│  │統計学│  │SQL   │ │    │ │Kaggle│  │深層学│  │                  │
│  │基礎  │  │入門  │  │基礎  │ │    │ │コンペ│  │習実践│  │ [ユーザーの発言] │
│  └──────┘  └──────┘  └──────┘ │    │ └──────┘  └──────┘  │                  │
│     │          │               │    │    │                 │ ──────────────── │
│  ┌──────┐  ┌──────┐            │    │ ┌──────┐             │ [入力欄]  [送信]  │
│  │記事  │  │検定  │            │    │ │スコア│             │                  │
│  │3本   │  │合格  │            │    │ │提出  │             │                  │
│  └──────┘  └──────┘            │    │ └──────┘             │                  │
│     │                          │    │    │                 │                  │
│  ┌──────┐                      │    │ ┌──────┐             │                  │
│  │+追加 │                      │    │ │+追加 │   [+学習]   │                  │
│  └──────┘                      │    │ └──────┘             │                  │
└─────────────────────────────────────────────────────────┴──────────────────┘
```

### 5.3 オンボーディング（SCR-05）

初回起動時（`career_goals` テーブルが空の場合）に表示する5ステップのウィザード。

```
Step 1  ウェルカム画面
        ─────────────────────────────
        「Horizon Guide へようこそ」
        キャッチコピー
        [はじめる →]

Step 2  AI接続設定
        ─────────────────────────────
        2択カードUI:
        [☁️ Gemini（クラウド）]  [💻 ローカルLLM]
        
        Gemini選択時：APIキー入力
        ローカルLLM選択時：エンドポイントURL + モデル名
        
        [スキップ（後で設定）]  [次へ →]

Step 3  学習者プロフィール         ← FR-19
        ─────────────────────────────
        「あなたについて教えてください」
        「AI助言をあなたに合わせて最適化します。」
        
        属性
        [ 専門職大学              ▼ ]  ← 初期値：専門職大学
        
        学問分野（最も近いものを選んでください）
        [ 情報学                  ▼ ]  ← 初期値：情報学
          情報学 / 経営学 / 社会学 / アニメ・マンガ / その他
        
        ※ あとから設定画面の「学習者プロフィール」でいつでも変更できます。
        
        [スキップ（未設定のまま進む）]  [次へ →（選択値を保存）]

Step 4  キャリアゴール入力（必須）
        ─────────────────────────────
        ゴールテキスト（必須）
        目標時期（任意）
        氏名・PDF用（任意）
        
        [次へ →]

Step 5  WBゴール設定（任意）
        ─────────────────────────────
        「学習のWhy（ウェルビーイングゴール）を設定しましょう」
        OECD Education 2030の説明
        [AIに提案してもらう]
        AI提案エリア（編集可能）
        
        [スキップして始める]  [設定して始める]
```

### 5.4 設定画面（SCR-04）

左サイドバー（7タブ）でセクションを切り替える。

```
┌────────────────┬──────────────────────────────────────┐
│ 1. キャリアゴール│ （選択中のセクションのコンテンツ）    │
│ 2. WBゴール    │                                      │
│ 3. 学習者      │                                      │
│    プロフィール │                                      │
│ 4. AI接続設定  │                                      │
│ 5. エクスポート │                                      │
│ 6. データ管理  │                                      │
│ 7. 表示・言語  │                                      │
└────────────────┴──────────────────────────────────────┘
```

**「3. 学習者プロフィール」セクション：**
```
  ── 学習者プロフィール ────────────────────────────

  AI助言をあなたの学習環境に合わせて最適化します。
  設定しなくても他の機能はすべて利用できます。

  属性
  [ 専門職大学              ▼ ]

  学問分野（最も近いものを選んでください）
  [ 情報学                  ▼ ]

  ※ あとから変更できます。

                                      [保存する]

  ── 学問分野の管理 ──────────────────────────────

  現在の選択肢（ドラッグで並び替え可能）：
  ┌─────────────────────────────────────┐
  │ ⠿  情報学         [削除]            │
  │ ⠿  経営学         [削除]            │
  │ ⠿  社会学         [削除]            │
  │ ⠿  アニメ・マンガ [削除]            │
  │ ⠿  その他         [削除]            │
  └─────────────────────────────────────┘

  新しい学問分野を追加：
  [ 学問分野名を入力       ]  [追加]
```

> **操作仕様：**
> - 「追加」ボタンで `academic_field_master` に INSERT（`sort_order` は現在の最大値 + 1）
> - 「削除」ボタンは `is_active = 0` に UPDATE（論理削除。DBからは消えないため、過去に選択したユーザーのデータは保持される）
> - ドラッグ＆ドロップで `sort_order` を更新
> - 選択肢の変更はプルダウンに即時反映（`getAcademicFieldMaster()` を再取得）

**「1. キャリアゴール」セクション：**
```
  ゴール（自由記述）
  [データサイエンティストに転職したい       ]
  目標時期: [2027年 3月]
  氏名（PDF用・任意）:
  [山田 太郎                              ]
                                [保存する]
```

**「6. データ管理」セクション：**
```
  ── データ管理 ──────────────────────────────────

  バックアップ
  [CSVエクスポート（全データ）]

  研究データ
  実証実験用の行動ログをエクスポートします。
  ☑ 氏名・ゴールテキストを匿名化する（推奨）
  [研究データをエクスポート]

  初期化
  すべての学習データ・ゴール・AI履歴を削除します。
  ※ AI接続設定・学習者プロフィールは保持されます。

  [バックアップしてから初期化]
  [データを初期化する]  ← 赤いボタン
```

**「4. AI接続設定」セクション：**
```
  接続先:
  ○ LLM直接接続  Gemini（優先）/ Claude / GPT
  ● Dify                    [優先推奨]
      エンドポイント: [https://api.dify.ai/v1]
      APIキー:       [app-●●●●●●●●●●●]
  ○ Langflow                [近日対応]

  [接続テスト]              [保存する]
```

---

## 6. データ構造設計

### 6.1 SQLiteスキーマ設計

```sql
-- キャリアゴール
CREATE TABLE career_goals (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  target_date TEXT,             -- "2027-03" 形式
  user_name   TEXT,             -- PDF用氏名（任意）
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ウェルビーイングゴール（OECD 2030対応）
CREATE TABLE wellbeing_goals (
  id             TEXT PRIMARY KEY,
  text           TEXT NOT NULL,
  personal_axis  TEXT,
  social_axis    TEXT,
  planet_axis    TEXT,
  ai_generated   INTEGER NOT NULL DEFAULT 0,  -- 0=手動, 1=AI提案
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- 学習者プロフィール（FR-19）
-- レコードは常に1行のみ（upsert）
CREATE TABLE user_profile (
  id              TEXT PRIMARY KEY,
  learner_type    TEXT,   -- working_adult/professional_univ/university/vocational/high_school, NULL=未設定
  academic_field  TEXT,   -- academic_field_master.id を参照, NULL=未設定
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 学問分野マスタ（FR-19）
-- 選択肢をDBで管理することで、コード変更なしに追加・無効化が可能
CREATE TABLE academic_field_master (
  id          TEXT PRIMARY KEY,          -- 識別子（例: 'informatics'）
  label       TEXT NOT NULL,             -- 表示名（例: '情報学'）
  sort_order  INTEGER NOT NULL,          -- 表示順（昇順）
  is_active   INTEGER NOT NULL DEFAULT 1 -- 1=表示, 0=非表示（論理削除）
);

-- 初期データ（マイグレーションで挿入）
-- INSERT INTO academic_field_master VALUES
--   ('informatics', '情報学',       1, 1),
--   ('business',    '経営学',       2, 1),
--   ('sociology',   '社会学',       3, 1),
--   ('anime_manga', 'アニメ・マンガ', 4, 1),
--   ('other',       'その他',       5, 1);

-- 学習カード（親）
CREATE TABLE learning_cards (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  start_date       TEXT NOT NULL,   -- "2024-04"
  end_date         TEXT,            -- NULL = 終了未定
  type             TEXT NOT NULL,   -- class/self_study/training/certificate/other
  location         TEXT,            -- home/university/workplace/cafe/library/online/other, NULL=未設定
  modality         TEXT,            -- in_person/hybrid/hyflex/online, NULL=未設定
  phase            TEXT NOT NULL,   -- past/ongoing/future（自動判定）
  is_completed     INTEGER NOT NULL DEFAULT 0,
  motivation_level INTEGER,         -- 1〜5, NULL=未設定
  memo             TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- アウトプットカード（子）
CREATE TABLE output_cards (
  id               TEXT PRIMARY KEY,
  learning_card_id TEXT NOT NULL REFERENCES learning_cards(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL,   -- article/repository/certificate/presentation/project/other
  url              TEXT,
  status           TEXT NOT NULL,   -- done/planned
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

-- AI助言履歴
CREATE TABLE ai_history (
  id                  TEXT PRIMARY KEY,
  mode                TEXT NOT NULL,   -- chat/analyze
  user_message        TEXT,
  ai_response         TEXT NOT NULL,
  provider            TEXT NOT NULL,   -- llm/dify/langflow
  model_or_endpoint   TEXT,
  timestamp           TEXT NOT NULL
);

-- 研究用：カード操作ログ
CREATE TABLE action_log (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,   -- card_created/card_updated/card_deleted/card_completed/output_created/output_updated/output_deleted
  target_type   TEXT NOT NULL,   -- learning_card/output_card
  target_id     TEXT NOT NULL,
  target_title  TEXT NOT NULL,
  before_value  TEXT,            -- JSON文字列（変更前）
  after_value   TEXT,            -- JSON文字列（変更後）
  timestamp     TEXT NOT NULL
);

-- 研究用：モチベーション変化ログ
CREATE TABLE motivation_log (
  id                   TEXT PRIMARY KEY,
  learning_card_id     TEXT NOT NULL,
  learning_card_title  TEXT NOT NULL,
  previous_level       INTEGER,         -- NULL=初回設定
  new_level            INTEGER NOT NULL,
  timestamp            TEXT NOT NULL
);

-- 研究用：ゴール設定ログ
CREATE TABLE goal_log (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,   -- goal_created/goal_updated
  goal_type       TEXT NOT NULL,   -- career/wellbeing
  previous_value  TEXT,            -- JSON文字列（変更前、初回はNULL）
  new_value       TEXT NOT NULL,   -- JSON文字列（変更後）
  timestamp       TEXT NOT NULL
);

-- 研究用：セッションログ
CREATE TABLE session_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,   -- app_launched/app_closed
  timestamp   TEXT NOT NULL
);
```

### 6.2 キャリアゴール＋ウェルビーイングゴール

```typescript
interface CareerGoal {
  id: string;
  text: string;                 // 例: "データサイエンティストに転職する"
  targetDate: string | null;    // 例: "2027-03"（年月）
  userName: string | null;      // PDF用氏名（任意）
  createdAt: string;
  updatedAt: string;
}

// OECD Education 2030「Learning Compass」の個人・集合的ウェルビーイングに対応
interface WellbeingGoal {
  id: string;
  text: string;                 // 例: "地域のデジタル格差をなくしたい"
  axes: {
    personal: string | null;    // 個人軸: 自己成長・ウェルネス
    social: string | null;      // 社会軸: コミュニティ・他者への貢献
    planet: string | null;      // 地球軸: 持続可能性・次世代への責任
  };
  aiGenerated: boolean;         // AIが提案したかどうか
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 学習者プロフィール（FR-19）

```typescript
// 属性（学校種別）- ハードコード（変更頻度が低いため）
type LearnerType =
  | 'working_adult'      // 社会人
  | 'professional_univ'  // 専門職大学
  | 'university'         // 大学（専門職以外）
  | 'vocational'         // 専門学校
  | 'high_school';       // 高校

// 学問分野マスタ - DBから取得（academic_field_master テーブル）
// academic_field フィールドは文字列IDで保持（例: 'informatics'）
// 選択肢はアプリ起動時に getAcademicFieldMaster() で取得する
interface AcademicFieldMaster {
  id: string;         // 例: 'informatics'
  label: string;      // 例: '情報学'
  sortOrder: number;
  isActive: boolean;
}

// 初期データ（001_initial.sql のマイグレーションで挿入）
// id             | label          | sort_order | is_active
// ---------------|----------------|------------|----------
// 'informatics'  | '情報学'        | 1          | 1
// 'business'     | '経営学'        | 2          | 1
// 'sociology'    | '社会学'        | 3          | 1
// 'anime_manga'  | 'アニメ・マンガ' | 4          | 1

// 学習者プロフィール
// DBレコードは常に1行のみ（upsert）。未設定フィールドは null。
interface UserProfile {
  id: string;
  learnerType: LearnerType | null;  // null = 未設定
  academicField: string | null;     // academic_field_master.id を参照, null = 未設定
  createdAt: string;
  updatedAt: string;
}

// UI表示用ラベルマップ（LearnerType はハードコード）
const LEARNER_TYPE_LABELS: Record<LearnerType, string> = {
  working_adult:    '社会人',
  professional_univ:'専門職大学',
  university:       '大学（専門職以外）',
  vocational:       '専門学校',
  high_school:      '高校',
};
// AcademicField のラベルは academic_field_master テーブルから動的に取得する
```

**学問分野の拡張方法：**

新しい学問分野を追加する場合は、マイグレーションSQLに `INSERT` 文を追加するだけでよい。コードの変更・再ビルドは不要。

```sql
-- 例：工学を追加する場合（新規マイグレーションファイル 002_add_engineering.sql）
INSERT INTO academic_field_master VALUES ('engineering', '工学', 5, 1);
```

既存の選択肢を非表示にする場合も同様にSQLで対応できる：

```sql
-- 例：アニメ・マンガを一時的に非表示にする場合
UPDATE academic_field_master SET is_active = 0 WHERE id = 'anime_manga';
```

### 6.4 学習カード（親）

```typescript
interface LearningCard {
  id: string;
  title: string;
  startDate: string;            // 例: "2024-04"（年月）
  endDate: string | null;       // null = 終了未定
  type: LearningType;
  location: LearningLocation | null;  // null = 未設定
  modality: LearningModality | null;  // null = 未設定
  phase: 'past' | 'ongoing' | 'future';
  // past: 終了日が現在より前
  // ongoing: 開始済み・終了日未設定または現在より後
  // future: 開始日が現在より後
  isCompleted: boolean;
  motivationLevel: 1 | 2 | 3 | 4 | 5 | null;  // null=未設定
  memo: string;
  outputs: OutputCard[];        // 子カード（アウトプット）
  createdAt: string;
  updatedAt: string;
}

type LearningType =
  | 'class'       // 授業・講義
  | 'self_study'  // 自習
  | 'training'    // 研修・BootCamp
  | 'certificate' // 資格学習
  | 'other';

type LearningLocation =
  | 'home'        // 自宅
  | 'university'  // 大学・学校
  | 'workplace'   // 職場
  | 'cafe'        // カフェ・コワーキング
  | 'library'     // 図書館
  | 'online'      // オンライン
  | 'other';      // その他

type LearningModality =
  | 'in_person'   // 教室対面
  | 'hybrid'      // ハイブリッド型（対面＋オンライン混在）
  | 'hyflex'      // ハイフレックス型（学生が毎回選択）
  | 'online';     // フルオンライン
```

### 6.5 アウトプットカード（子）

```typescript
interface OutputCard {
  id: string;
  learningCardId: string;       // 親カードのID
  title: string;
  type: OutputType;
  url: string | null;
  status: 'done' | 'planned';
  createdAt: string;
  updatedAt: string;
}

type OutputType =
  | 'article'       // ブログ記事・Qiita
  | 'repository'    // GitHubリポジトリ
  | 'certificate'   // 資格・検定
  | 'presentation'  // 発表・LT
  | 'project'       // 個人開発・制作物
  | 'other';
```

### 6.6 AI設定（別ファイル、APIキーはキーチェーン）

```typescript
interface AIConfig {
  provider: 'llm' | 'local' | 'dify' | 'langflow';
  llm?: {
    service: 'gemini' | 'claude' | 'openai';
    model: string;
    // APIキーはキーチェーンに保存（ここには含めない）
  };
  local?: {
    endpoint: string;  // 例: http://localhost:11434
    model: string;     // 例: gemma3:4b（APIキー不要）
  };
  dify?: {
    endpoint: string;
    // APIキーはキーチェーンに保存
  };
}
```

---

## 7. AI助言システム設計

### 7.1 コンテキスト生成

AI呼び出し時に毎回タイムラインデータを文字列化してコンテキストに付加する。学習者プロフィールが設定済みの場合は冒頭に注入する。

```typescript
function buildContext(
  careerGoal: CareerGoal,
  wellbeingGoal: WellbeingGoal | null,
  learningCards: LearningCard[],
  userProfile: UserProfile | null,              // FR-19: 学習者プロフィール
  academicFieldMaster: AcademicFieldMaster[]    // FR-19: 学問分野マスタ（DB取得済み）
): string {

  // 学問分野ラベルをマスタから動的に取得
  const academicFieldLabel = userProfile?.academicField
    ? (academicFieldMaster.find(f => f.id === userProfile.academicField)?.label ?? userProfile.academicField)
    : null;

  // 学習者プロフィールセクション（設定済みの場合のみ生成）
  const profileSection = userProfile?.learnerType
    ? `【学習者プロフィール】
種別: ${LEARNER_TYPE_LABELS[userProfile.learnerType]}
学問分野: ${academicFieldLabel ?? '特になし'}

`
    : '';

  return `${profileSection}【ウェルビーイングゴール（Why）】
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
  `.trim();
}
```

**出力例（専門職大学・情報学が設定済みの場合）：**
```
【学習者プロフィール】
種別: 専門職大学生
学問分野: 情報学

【ウェルビーイングゴール（Why）】
...
```

### 7.2 Chat mode の呼び出し

```typescript
// Dify の場合
async function chatWithDify(userMessage: string, context: string): Promise<ReadableStream> {
  const response = await fetch(`${config.dify.endpoint}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getApiKey('dify')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: { timeline_context: context },
      query: userMessage,
      response_mode: 'streaming',
      user: 'horizon-guide-user',
    }),
  });
  return response.body!;
}
```

### 7.3 Analyze mode のプロンプト（固定テンプレート）

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

## 8. 技術スタック

### 8.1 MVP 構成

| レイヤー | 技術 | 理由 |
|---------|------|------|
| **デスクトップフレームワーク** | Electron 41+ | Windows / Mac クロスプラットフォーム |
| **フロントエンド** | React 18 + TypeScript | コンポーネント再利用・型安全 |
| **ビルドツール** | Vite v7 + electron-vite v5 | 高速ビルド・HMR対応（vite v8はelectron-vite未対応のためv7固定） |
| **スタイリング** | Tailwind CSS | 高速UI開発 |
| **状態管理** | Zustand | 軽量・シンプル |
| **データ永続化** | better-sqlite3 v12.8+（SQLite） | 同期API・リレーション管理・研究データ分析に適合（v12.8以降でElectron 41対応） |
| **DBマイグレーション** | カスタムマイグレーション（migrate.ts） | スキーマバージョン管理 |
| **APIキー保存** | keytar（OSキーチェーン） | セキュアな認証情報管理 |
| **AI接続** | Dify Chat API / Gemini API（優先・無料枠）/ Anthropic API / OpenAI API / ローカルLLM（Ollama等・APIキー不要） | 設定画面で切り替え |
| **PDFポートフォリオ生成** | puppeteer（Electron内蔵Chromium利用） | A4整形PDF出力 |
| **CSVエクスポート** | papaparse | CSV生成・UTF-8 BOM対応 |
| **ZIP生成** | jszip | CSV複数ファイルをまとめてダウンロード |
| **パッケージャ** | electron-builder | Windows（NSIS）/ Mac（dmg）インストーラー生成 |

### 8.2 ディレクトリ構成

```
horizon-guide/
├── electron/
│   ├── main.ts           # Electronメインプロセス
│   ├── preload.ts        # コンテキストブリッジ
│   ├── ai-bridge.ts      # AI API呼び出し（メインプロセス側）
│   └── db/
│       ├── database.ts   # better-sqlite3初期化・接続管理
│       ├── schema.sql    # テーブル定義
│       ├── migrate.ts    # マイグレーション管理
│       └── queries/
│           ├── learningCards.ts
│           ├── outputCards.ts
│           ├── goals.ts
│           ├── userProfile.ts    # getUserProfile / saveUserProfile / getAcademicFieldMaster ← FR-19追加
│           ├── aiHistory.ts
│           └── researchLog.ts    # 行動ログ・モチベーションログ等
├── src/
│   ├── components/
│   │   ├── Timeline/
│   │   │   ├── TimelineView.tsx
│   │   │   ├── LearningCard.tsx
│   │   │   ├── MotivationPicker.tsx
│   │   │   └── OutputCard.tsx
│   │   ├── Sidebar/
│   │   │   ├── AISidebar.tsx         # onClose prop・ヘッダーに × ボタン追加
│   │   │   └── ChatMessage.tsx
│   │   ├── Modals/
│   │   │   ├── LearningCardModal.tsx
│   │   │   ├── OutputCardModal.tsx
│   │   │   ├── GoalModal.tsx
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   └── ResetConfirmModal.tsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.tsx  # 7タブ構成（学習者プロフィールタブ追加）
│   │   ├── TopBar.tsx
│   │   └── Onboarding/
│   │       └── OnboardingFlow.tsx  # 5ステップ構成
│   ├── stores/
│   │   ├── timelineStore.ts
│   │   ├── goalStore.ts       # userProfile状態・アクション追加
│   │   └── aiStore.ts
│   ├── utils/
│   │   ├── contextBuilder.ts  # userProfile引数追加
│   │   └── dateUtils.ts
│   └── types/
│       ├── index.ts           # UserProfile / LearnerType / AcademicField 追加
│       └── electronAPI.d.ts
├── electron.vite.config.ts
├── package.json
├── electron-builder.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### 8.3 セットアップ手順

```powershell
# 1. 依存パッケージのインストール（--ignore-scripts 必須）
npm install --ignore-scripts

# 2. Electronバイナリ取得 + ネイティブモジュールリビルド
npm run setup

# 3. 開発モードで起動
npm run dev
```

`npm install`（引数なし）は使用禁止。`npm run setup` の内容：
`node node_modules/electron/install.js && node ./node_modules/@electron/rebuild/lib/cli.js -f -w better-sqlite3,keytar --version 41.0.3`

### 8.4 IPC通信設計（Electron Main ↔ Renderer）

```typescript
// 注意: electron-vite v5のビルド出力は out/preload/index.mjs（ESM形式）
// main.ts の preload パスは join(__dirname, '../preload/index.mjs') とすること
contextBridge.exposeInMainWorld('electronAPI', {
  // 学習カード CRUD
  getLearningCards: () => ipcRenderer.invoke('db-get-learning-cards'),
  upsertLearningCard: (card: LearningCard) => ipcRenderer.invoke('db-upsert-learning-card', card),
  deleteLearningCard: (id: string) => ipcRenderer.invoke('db-delete-learning-card', id),

  // モチベーション更新
  updateMotivation: (id: string, level: number | null) =>
    ipcRenderer.invoke('db-update-motivation', { id, level }),

  // アウトプットカード CRUD
  upsertOutputCard: (card: OutputCard) => ipcRenderer.invoke('db-upsert-output-card', card),
  deleteOutputCard: (id: string) => ipcRenderer.invoke('db-delete-output-card', id),

  // ゴール
  getCareerGoal: () => ipcRenderer.invoke('db-get-career-goal'),
  saveCareerGoal: (goal: CareerGoal) => ipcRenderer.invoke('db-save-career-goal', goal),
  getWellbeingGoal: () => ipcRenderer.invoke('db-get-wellbeing-goal'),
  saveWellbeingGoal: (goal: WellbeingGoal) => ipcRenderer.invoke('db-save-wellbeing-goal', goal),

  // 学習者プロフィール（FR-19）
  getUserProfile: () => ipcRenderer.invoke('db-get-user-profile'),
  saveUserProfile: (profile: UserProfile) => ipcRenderer.invoke('db-save-user-profile', profile),
  // 学問分野マスタ（FR-19）
  getAcademicFieldMaster: () => ipcRenderer.invoke('db-get-academic-field-master'),
  addAcademicField: (label: string) => ipcRenderer.invoke('db-add-academic-field', { label }),
  deleteAcademicField: (id: string) => ipcRenderer.invoke('db-delete-academic-field', { id }),
  reorderAcademicFields: (ids: string[]) => ipcRenderer.invoke('db-reorder-academic-fields', { ids }),

  // AI設定・呼び出し
  saveAIConfig: (config: AIConfig) => ipcRenderer.invoke('save-ai-config', config),
  loadAIConfig: () => ipcRenderer.invoke('load-ai-config'),
  saveApiKey: (provider: string, apiKey: string) =>
    ipcRenderer.invoke('save-api-key', { provider, apiKey }),
  loadApiKey: (provider: string) => ipcRenderer.invoke('load-api-key', provider),
  chatAI: (message: string, context: string) =>
    ipcRenderer.invoke('chat-ai', { message, context }),
  analyzeAI: (context: string) =>
    ipcRenderer.invoke('analyze-ai', { context }),

  // データ管理
  exportCSV: () => ipcRenderer.invoke('export-csv'),
  exportResearchLog: (anonymize: boolean) =>
    ipcRenderer.invoke('export-research-log', { anonymize }),
  resetDatabase: () => ipcRenderer.invoke('reset-database'),

  // 研究用行動ログ
  logAction: (entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-action', entry),
  logMotivation: (entry: Omit<MotivationLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-motivation', entry),
  logGoal: (entry: Omit<GoalLogEntry, 'id' | 'timestamp'>) =>
    ipcRenderer.invoke('db-log-goal', entry),
});
```

---

## 9. 将来の拡張ロードマップ

```
MVP（v0.1）──────────────────────────────── 〜 1ヶ月
  ✅ キャリアゴール設定
  ✅ 学習カード作成・編集・削除
  ✅ アウトプットカード親子紐づけ
  ✅ 横軸時系列タイムライン
  ✅ AI助言：Chat mode / Analyze mode
  ✅ AI接続設定（LLM直接 / Dify）
  ✅ ローカルSQLite保存
  ✅ CSVエクスポート（5ファイル ZIP）
  ✅ 研究用行動ログエクスポート（匿名化対応 4ファイル ZIP）
  ✅ PDFエクスポート（ポートフォリオ A4 / タイムライン印刷）
  ✅ 学習者プロフィール設定（AI助言最適化・オンボーディング+設定画面・学問分野管理UI）
  ✅ AIサイドパネルの開閉制御（「AI 助言」ボタンで開く＋Analyze、× で閉じる）
  ✅ ai-bridge.ts システムプロンプトに学習者プロフィール対応指示を追加

機能追加バックログ ──────────────────────────────
  ◻ Langflow接続対応
  ◻ CSVインポート（雛形・復元対応、デフォルトオフ）
  ◻ 職種別テンプレートCSV（DS・エンジニア・PM等）
  ◻ 共有URL生成（ローカルHTMLエクスポート）
  ◻ 自動アップデート機能
  ◻ 複数ゴールの並行管理
  ◻ 教員ダッシュボード（学生の進捗一覧）
  ◻ SRL評価スケール連携（研究データ収集）
  ◻ LMS連携（Moodle / Canvas）
```

---

## 10. 用語集

| 用語 | 定義 |
|------|------|
| **card_imported** | CSVインポートで生成されたカードの操作ログ種別。`card_created`（手動作成）と区別し、研究分析時に除外可能 |
| **行動ログ** | 研究用途で収集するカード操作・モチベーション変化・ゴール設定・セッション起動の時系列記録 |
| **匿名化オプション** | 研究データエクスポート時に氏名・ゴールテキスト・カードタイトルを `[anonymized]` に置換する機能。倫理審査対応 |
| **ウェルビーイングゴール（WBゴール）** | キャリアゴールの上位目的。個人・社会・地球の3軸で表現するOECD 2030対応のゴール |
| **キャリアゴール** | ユーザーが将来なりたい職種・ポジション・状態 |
| **学習者プロフィール** | 属性（学校種別）と学問分野の組み合わせ。AIコンテキストの冒頭に注入し、属性に合わせた助言を実現する |
| **属性** | 学習者の在籍機関種別（社会人 / 専門職大学 / 大学 / 専門学校 / 高校）。AI助言の最適化に使用 |
| **学問分野** | 学習者の専攻・関心領域。`academic_field_master` テーブルで管理し、設定画面から追加・削除・並び替えが可能。初期値：情報学 / 経営学 / 社会学 / アニメ・マンガ / その他 |
| **学習カード** | タイムライン上の個々の学習活動（親カード） |
| **アウトプットカード** | 学習カードに紐づく成果物（子カード） |
| **過去フェーズ** | 終了日が現在より前の学習 |
| **進行中フェーズ** | 開始済みで終了日未設定または現在より後の学習（オレンジボーダー） |
| **未来フェーズ** | 開始日が現在より後の予定学習 |
| **Chat mode** | ユーザーがチャットで質問した際に発火するAI助言モード |
| **Analyze mode** | 「AI 助言」ボタンで発火するタイムライン総評モード |
| **AAR サイクル** | OECD 2030の反復サイクル（Anticipation→Action→Reflection）。Horizon Guideでは「未来計画→学習実施→AI振り返り」に対応 |
| **SRL** | Self-Regulated Learning（自己調整学習） |
| **Output-Driven Learning Design** | アウトプットを起点に学習内容・順序を設計する方法論 |
| **Student Agency** | OECD 2030の中核概念。学習者自身がゴールを設定し責任ある行動をとる能力 |

---

## 改訂履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 0.1.0 | 2026-03-18 | 初稿作成（LearnPath AI として） |
| 0.2.0 | 2026-03-18 | Horizon Guide に改名、Electronデスクトップアプリに全面刷新 |
| 0.3.0 | 2026-03-18 | エクスポート機能追加（CSV全4種・PDFポートフォリオ・タイムライン印刷） |
| 0.4.0 | 2026-03-18 | キャリアゴール入力を設定画面＋メイン画面の両方に対応、設定画面レイアウト更新、氏名フィールド追加 |
| 0.5.0 | 2026-03-18 | OECD Education 2030対応：ウェルビーイングゴール（FR-01b）追加、AI提案フロー・3軸データ構造・コンテキスト生成を更新 |
| 0.6.0 | 2026-03-18 | 全体整合：ボタン名「AI 助言」に統一、進行中状態追加、CSVを5種に拡張、PDFにWBゴール追加、OECD 2030整合表・AARサイクル・用語集を全面更新 |
| 0.7.0 | 2026-03-18 | データ永続化をSQLiteに変更（better-sqlite3）、モチベーションレベル（1〜5）追加、データ初期化機能（FR-08b）追加、設定画面にデータ管理セクション追加、IPC通信設計を全面更新 |
| 0.8.0 | 2026-03-18 | 研究用行動ログエクスポート（FR-10b）をMust/MVPとして追加。action_log / motivation_log / goal_log / session_log テーブル追加、匿名化オプション・設定画面UI・IPC設計・ディレクトリ構成を更新 |
| 0.9.0 | 2026-03-18 | 学習カードに取り組み場所フィールド（location）を追加（任意・選択式7種）。同時期カードの縦スタック表示をFR-04に追記。SQLiteスキーマ・TypeScript型・CSVフィールドを更新 |
| 0.9.1 | 2026-03-18 | FR-07のLLM直接接続をGemini優先に変更。無料枠情報・推奨モデルを追記。Tech Stack・設定画面表示を更新 |
| 0.9.2 | 2026-03-18 | 学習カードに受講形態フィールド（modality）を追加（任意・選択式4種）。SQLiteスキーマ・TypeScript型・CSVフィールドを更新。SRQ 4を精緻化 |
| 0.9.3 | 2026-03-18 | CSVインポート機能（FR-18）をv1.1として追加。デフォルトオフ・card_imported区別・設定画面UI仕様を定義 |
| 0.9.4 | 2026-03-22 | 実装確認に基づく修正：Electron 41+・better-sqlite3 v12.8+・Vite v7固定・デフォルトモデルをgemini-2.5-flash-liteに変更・オンボーディング4ステップ化・トップバーに「学習を追加」ボタン追加・preloadビルド出力が.mjsであることを明記 |
| 0.9.5 | 2026-03-22 | セットアップ手順を確定：npm install --ignore-scripts → npm run setup → npm run dev。setupスクリプトをpackage.jsonに追加。electron-rebuildパッケージを除去 |
| 0.9.6 | 2026-03-22 | ローカルLLM接続追加（Ollama等・APIキー不要・デフォルトgemma3:4b）。AIConfig型にlocal追加。AIサイドバーリサイズ機能追加。タイムライン起動時に現在月を中央表示。LLMモデル更新（Gemini: gemini-2.5-flash-lite / Claude: claude-haiku-4-5-20251001 / ChatGPT: gpt-5o-mini） |
| 0.9.7 | 2026-03-22 | オンボーディングStep2をGemini/ローカルLLM選択式に変更。2択カードUI（☁️/💻）でどちらか選択後に設定入力。ローカルLLM選択時はAPIキー不要でエンドポイントURL＋モデル名を入力 |
| 0.9.8 | 2026-03-30 | 学習者プロフィール機能（FR-19）追加。`user_profile`テーブル・`academic_field_master`テーブル（DBマスタ管理）を追加。`UserProfile`型・`LearnerType`型・`AcademicFieldMaster`型を追加。学問分野の初期値をなし/情報学/経営学/社会学/アニメ・マンガ/その他の6件に確定。オンボーディングを5ステップ化（Step 3に学習者プロフィール追加・初期値として専門職大学/情報学を選択済み表示）。設定画面を7タブ化（「学習者プロフィール」タブに選択UI＋学問分野管理UI〈追加・削除・並び替え〉を追加）。`buildContext()`にuserProfile・academicFieldMaster引数追加。IPCに`getUserProfile`/`saveUserProfile`/`getAcademicFieldMaster`/`addAcademicField`/`deleteAcademicField`/`reorderAcademicFields`追加。`queries/userProfile.ts`追加。データ初期化時に学習者プロフィールを保持する仕様を明記。AIサイドパネルの開閉制御を追加（FR-06更新）：「AI 助言」ボタン押下でパネルを開く＋Analyze実行、パネルヘッダーの「×」ボタンで閉じるだけ。`AISidebar`に`onClose` prop追加・ヘッダーに×ボタン追加。`TopBar`に`onOpenSidebar` prop追加。`App.tsx`に`isSidebarOpen` state追加。`ai-bridge.ts`のSYSTEM_PROMPTに学習者プロフィール対応指示を追加 |

---

*本仕様書は Horizon Guide プロジェクトの設計ドキュメントです。*
