# resources/

このディレクトリにパッケージング用リソースを配置してください。

## 必要なファイル

### Windows
- `icon.ico` — マルチサイズ ICO（16/32/48/64/128/256px）

### macOS
- `icon.icns` — ICNS ファイル（16〜1024px）

### 共通（任意）
- `icons/` — Linux AppImage 用 PNG アイコン群（16x16.png 〜 1024x1024.png）
- `dmg-background.png` — macOS DMG 背景画像（540×380px）

## アイコン生成方法

1024×1024px の PNG ソースファイルがあれば以下のツールで変換できます：

### macOS
```bash
# .icns 生成
iconutil -c icns icon.iconset/

# .ico 生成（ImageMagick）
convert icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Windows / クロスプラットフォーム
- https://www.icoconverter.com/ （オンラインツール）
- `electron-icon-builder` パッケージ
