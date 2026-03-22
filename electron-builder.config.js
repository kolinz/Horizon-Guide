/**
 * electron-builder.config.js
 * Horizon Guide パッケージング設定
 *
 * 対応プラットフォーム：
 *   Windows 10/11 (x64) — NSIS インストーラー
 *   macOS 12+           — DMG (universal: Intel + Apple Silicon)
 *
 * ビルドコマンド：
 *   npm run build:win   → Windows 用インストーラーのみ
 *   npm run build:mac   → macOS 用 DMG のみ
 *   npm run build:all   → 両プラットフォーム同時
 *
 * ネイティブモジュールのリビルド：
 *   npm run rebuild     → electron-rebuild（開発時に一度実行）
 */

/** @type {import('electron-builder').Configuration} */
export default {
  // ──────────────────────────────────────────
  // 基本設定
  // ──────────────────────────────────────────

  appId: 'com.horizonguide.app',
  productName: 'Horizon Guide',
  copyright: 'Copyright © 2026 Horizon Guide Project',

  // ──────────────────────────────────────────
  // ディレクトリ設定
  // ──────────────────────────────────────────

  directories: {
    /** ビルドリソース（アイコン等の入力元） */
    buildResources: 'resources',
    /** パッケージング出力先 */
    output: 'dist-electron',
  },

  // ──────────────────────────────────────────
  // パッケージングに含めるファイル
  // electron-vite は out/ にビルド済みファイルを出力する
  // ──────────────────────────────────────────

  files: [
    // ビルド済みメインプロセス・プリロード・レンダラー
    'out/**/*',
    // 本番依存パッケージ
    'node_modules/**/*',
    // 不要なドキュメントを除外してサイズ削減
    '!node_modules/**/README*',
    '!node_modules/**/README.*',
    '!node_modules/**/*.md',
    '!node_modules/**/*.txt',
    '!node_modules/**/*.map',
    '!node_modules/**/__tests__/**',
    '!node_modules/**/.github/**',
    '!node_modules/**/test/**',
    '!node_modules/**/tests/**',
    '!node_modules/**/example/**',
    '!node_modules/**/examples/**',
    '!node_modules/**/docs/**',
  ],

  // ──────────────────────────────────────────
  // 追加リソース（asar 外に展開される）
  // アプリ起動後に app.getPath('exe') + '/../resources/' でアクセス可能
  // ──────────────────────────────────────────

  extraResources: [
    {
      from: 'resources/',
      to: 'resources/',
      filter: ['**/*'],
    },
  ],

  // ──────────────────────────────────────────
  // ASAR アーカイブ設定
  // better-sqlite3 / keytar はネイティブモジュールのため asar 外に展開が必要
  // ──────────────────────────────────────────

  asar: true,
  asarUnpack: [
    // ネイティブモジュール（.node ファイル）は ASAR に含められない
    '**/node_modules/better-sqlite3/**',
    '**/node_modules/keytar/**',
    // puppeteer のChromiumバイナリも ASAR 外に必要
    '**/node_modules/puppeteer/**',
    '**/node_modules/puppeteer-core/**',
    // その他の .node ファイル全般
    '**/*.node',
  ],

  // ──────────────────────────────────────────
  // ネイティブモジュールのリビルド設定
  // electron-builder はパッケージング前に自動で npm rebuild を実行する
  // ──────────────────────────────────────────

  npmRebuild: true,

  // electron-rebuild の設定（npm run rebuild から手動実行する場合）
  // package.json の scripts.rebuild と対応
  afterPack: async (context) => {
    // パッケージング後フック（必要であればここにカスタム処理を追加）
    console.log(`[afterPack] platform: ${context.electronPlatformName}`)
  },

  // ──────────────────────────────────────────
  // Windows 設定
  // ──────────────────────────────────────────

  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],          // 64bit のみ（Windows 10/11 対応）
      },
    ],
    icon: 'resources/icon.ico', // 256×256 px 以上推奨（マルチサイズ ICO）
    // アプリ署名（本番配布時に設定）
    // certificateFile: process.env.WIN_CSC_LINK,
    // certificatePassword: process.env.WIN_CSC_KEY_PASSWORD,
  },

  // NSIS インストーラー設定
  nsis: {
    oneClick: false,                          // カスタムインストール画面を表示
    allowToChangeInstallationDirectory: true, // インストール先を変更可能
    allowElevation: true,                     // 管理者権限を要求
    installerFilename: 'HorizonGuide-Setup-${version}.exe',
    installerIcon: 'resources/icon.ico',
    uninstallerIcon: 'resources/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Horizon Guide',
    // インストーラーの言語（日本語優先）
    language: '1041', // 1041 = 日本語
    // include: 'resources/installer.nsh', // カスタム NSH スクリプト（必要な場合のみ有効化）
  },

  // ──────────────────────────────────────────
  // macOS 設定
  // ──────────────────────────────────────────

  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['universal'], // Intel (x64) + Apple Silicon (arm64) 両対応
      },
    ],
    icon: 'resources/icon.icns',  // 1024×1024 px ICNS ファイル
    category: 'public.app-category.education',
    // App Store 配布時に設定
    // hardenedRuntime: true,
    // gatekeeperAssess: false,
    // entitlements: 'resources/entitlements.mac.plist',
    // entitlementsInherit: 'resources/entitlements.mac.plist',
    // identity: process.env.APPLE_IDENTITY,
    // notarize: {
    //   teamId: process.env.APPLE_TEAM_ID,
    // },
    extendInfo: {
      // Dock / Finder での表示名
      CFBundleDisplayName: 'Horizon Guide',
      // SQLite のファイルを関連付けない（プライベートDB）
      CFBundleDocumentTypes: [],
    },
  },

  // DMG 設定
  dmg: {
    title: 'Horizon Guide ${version}',
    // ウィンドウサイズとアイコン配置
    window: {
      width: 540,
      height: 380,
    },
    contents: [
      { x: 150, y: 190, type: 'file' },        // アプリアイコン（左）
      { x: 390, y: 190, type: 'link', path: '/Applications' }, // Applications（右）
    ],
    // background: 'resources/dmg-background.png', // カスタム背景（任意）
  },

  // ──────────────────────────────────────────
  // Linux 設定（将来対応・参考）
  // ──────────────────────────────────────────

  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
    ],
    icon: 'resources/icons/', // 各サイズの PNG が入ったディレクトリ
    category: 'Education',
    description: 'Career-goal driven learning timeline app',
  },

  // ──────────────────────────────────────────
  // 公開設定（自動アップデート用 — v1.1 対応予定）
  // ──────────────────────────────────────────

  // publish: [
  //   {
  //     provider: 'github',
  //     owner: 'your-github-username',
  //     repo: 'horizon-guide',
  //   },
  // ],
}
