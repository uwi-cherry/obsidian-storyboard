# Obsidian Painter Plugin

ObsidianでAI支援のペイント機能を提供するプラグインです。
レイヤー対応の本格的なペイントツールと、ComfyUIによるAI画像生成機能を搭載しています。

## 主な機能

### 🎨 ペイント機能
- レイヤー対応の高機能ペイントツール
- ブラシ、消しゴム、選択ツール等の豊富なツール
- 色混合、ブレンドモード対応
- PSDファイルの読み込み・保存
- 画像の自動アップロード・転送機能

### 🤖 AI機能
- **ComfyUI** を使用した画像生成
- チャットベースでのAI操作
- **キャンバス→AI画像転送**: 現在のレイヤーを自動でAI生成に送信
- **選択範囲→マスク転送**: 選択範囲を自動でマスクとして送信
- Text-to-Image, Image-to-Image, Inpainting対応

## インストール方法

### 🚀 一般ユーザー向け（推奨）

**masterブランチ（リリース版）**をクローンしてください：

```bash
cd "[あなたのVaultフォルダ]/.obsidian/plugins/"
git clone https://github.com/uwi-cherry/obsidian-painter.git obsidian-painter
```

Obsidianを再起動して、設定 → コミュニティプラグイン → 「**Obsidian Painter**」を有効化

**それだけです！** ビルド済みファイルが含まれているので、追加の作業は必要ありません。

### ⚙️ AI機能の設定

AI機能を使用するには、ComfyUIデスクトップ版の設定が必要です：

1. [ComfyUI Desktop](https://github.com/comfyanonymous/ComfyUI)をダウンロード・インストール
2. ComfyUIを起動
3. 設定 → サーバー設定を開く
4. ネットワーク欄で以下を設定：
   - **ポート**: 8188（お好みの値）
   - **CORSヘッダーを有効にする**: `*` を入力
5. ComfyUIを再起動
6. Obsidianの設定で「**Obsidian Painter**」セクションを開く
7. AI Provider で「**ComfyUI**」を選択
8. 「**ComfyUI API URL**」に `http://localhost:8188` を入力（ポートは手順4で設定した値）
9. 「接続テスト」ボタンで接続を確認

---

## 開発者向け情報

開発に参加したい場合は、`develop`ブランチをご利用ください：

```bash
git clone -b develop https://github.com/uwi-cherry/obsidian-painter.git
cd obsidian-painter
npm install
npm run dev
```

## 使い方

### ペイント機能の使用

1. リボンの「**新規PSDファイルを作成**」ボタンをクリック
2. ペイントビューが開きます
3. 左側のツールパレットでブラシや色を選択
4. キャンバス上で描画開始
5. 右側でレイヤー管理とAIチャットが可能

### AI画像生成の使用

1. **Text-to-Image**: 右サイドバーのAI画像生成タブでプロンプトを入力
2. **Image-to-Image**: キャンバスで描画後、i2i画像転送を有効にしてAI生成
3. **Inpainting**: 選択ツールで範囲を選択後、マスク転送を有効にしてAI生成

### 自動転送機能

- **i2i画像転送**: キャンバスの変更を自動でAI生成の参照画像として送信
- **マスク転送**: 選択範囲を自動でマスクとして送信
- **手動参照**: サムネイル右下の「+」ボタンで手動参照も可能

## サポート

- Text-to-Image（テキストから画像生成）
- Image-to-Image（画像から画像生成）
- Inpainting（マスクを使った部分編集）
- ComfyUIのWebSocket接続によるリアルタイム進捗表示
