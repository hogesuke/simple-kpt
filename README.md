<p align="right">
  JA | <a href="./README.en.md">EN</a>
</p>

<div align="center">
  <img height="36" src="./public/logo.svg" alt="Simple KPT logo" align="middle">
  &nbsp;&nbsp;&nbsp;
  <a href="https://simple-kpt.com" target="_blank" rel="noopener">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./public/logotype-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="./public/logotype.svg">
      <img height="28" src="./public/logotype.svg" alt="Simple KPT" align="middle">
    </picture>
  </a>
</div>

<br>

<div align="center">
  <h3>チームの振り返りをもっとシンプルに</h3>
  <p>登録不要。URLを共有するだけで、すぐにチームで振り返りを始められます。</p>
</div>

<br>

<div align="center">
  <a href="https://simple-kpt.com/demo" target="_blank" rel="noopener">
    <img src="https://img.shields.io/badge/⚡_Try_Demo-3f75ce?style=for-the-badge&logoColor=white" alt="Try Demo">
  </a>
</div>

<br>

<div align="center">

[![CI](https://github.com/hogesuke/simple-kpt/actions/workflows/ci.yml/badge.svg)](https://github.com/hogesuke/simple-kpt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hogesuke/simple-kpt/blob/main/LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)

</div>

<br>

<div align="center">
  <a href="https://simple-kpt.com/demo" target="_blank" rel="noopener">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./docs/screenshots/board-dark.webp">
      <img src="./docs/screenshots/board-light.webp" alt="Simple KPT">
    </picture>
  </a>
</div>

<br>

## Lighthouseスコア

![Performance](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-performance.json)
![Accessibility](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-accessibility.json)
![Best Practices](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-best-practices.json)
![SEO](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/hogesuke/simple-kpt/main/.github/badges/lighthouse-seo.json)

## 機能

- 🔗 登録不要。URLを共有するだけでチームで参加
- 🔒 サーバー保存なし。ボードの内容は参加者の端末にのみ保存
- 👥 リアルタイムの同時編集
- 🔄 同じURLを開き直して続きから再開
- ⏱️ タイマー（他の人のカードを隠す機能つき）
- 👍 投票
- ✅ Tryの担当者・ステータス・期日の管理
- 📥 エクスポート（Markdown / CSV / 再開用JSON）
- 🌓 ダークモード
- 🌐 多言語対応（日本語 / English）

## 仕組み

ボードの内容はサーバーに保存せず、参加者のブラウザ同士がWebRTCで直接同期します。

```
参加者A ─┐                         ┌─ 参加者B
          │  ① 接続の仲介（暗号化済み）  │
          └──── シグナリングサーバー ────┘
               (Cloudflare Workers)
参加者A ◀──────── ② 直接同期（WebRTC） ────────▶ 参加者B
```

- **同期**：[Yjs](https://github.com/yjs/yjs)（CRDT）で、同時に編集しても内容が矛盾なく統合されます。
- **接続の仲介**：[Trystero](https://github.com/dmotz/trystero)のws-relay方式と同じメッセージ形式で、自前のシグナリングサーバー（Cloudflare Workers + Durable Objects）を経由します。接続情報は招待URLの`#`以降の鍵で暗号化されるため、シグナリングサーバーは内容を読めません。ボードの内容は経由しません。
- **保存**：参加したボードは各参加者のブラウザ（IndexedDB）に保存され、同じ招待URLを開き直すと続きから再開できます。
- **時刻のずれ**：タイマーはルーム作成者の時計を基準とする「ルーム時計」で、参加者の端末の時計のずれを補正します。

## 技術スタック

- TypeScript
- React 19
- Tailwind CSS 4
- Yjs
- Trystero
- Zustand
- React Hook Form
- Zod
- shadcn/ui
- i18next
- Vite
- Vitest
- Playwright
- Storybook

## 実行環境

- Vercel（フロントエンド）
- Cloudflare Workers（シグナリングサーバー）

## 動作確認環境

- Node.js 24+

## ローカル開発

### インストール

```bash
pnpm install --frozen-lockfile
```

### 環境変数の設定

必要に応じて`.env.local`を作成してください（`.env.local.example`を参照）。

```bash
# シグナリングサーバーのURL（未設定の場合、開発時はws://localhost:8787を用いる）
VITE_SIGNALING_URL=ws://localhost:8787
```

### 起動

シグナリングサーバーとアプリを、それぞれ別のターミナルで起動します。

```bash
# シグナリングサーバー（http://localhost:8787）
pnpm signaling:dev

# アプリ（http://localhost:5173）
pnpm dev
```

複数人での同期を確認する場合は、通常ウィンドウとシークレットウィンドウなど、保存データが分かれるブラウザで同じ招待URLを開いてください。

## デプロイ

### シグナリングサーバー（Cloudflare Workers）

```bash
npx wrangler login
pnpm signaling:deploy
```

- 接続を許可するOriginは`signaling/wrangler.jsonc`の`ALLOWED_ORIGINS`で設定します。
- 接続元のIPアドレスなどがログとして保存されないよう、Workers Logsは無効にしています。

### フロントエンド（Vercel）

- 環境変数`VITE_SIGNALING_URL`にシグナリングサーバーのURL（例：`wss://signaling.simple-kpt.com`）を設定します。
- `vercel.json`のContent-Security-Policy（`connect-src`）に、シグナリングサーバーのURLを含めてください。

## テスト

```bash
# ユニットテスト
pnpm test

# E2Eテスト
pnpm e2e

# E2Eテスト (UIモード)
pnpm e2e:ui
```

## Storybook

### ローカル起動

```bash
pnpm storybook
```

### 公開URL

https://hogesuke.github.io/simple-kpt/

## ディレクトリ構成

```
.
├── src/
│   ├── components/   # UIコンポーネント
│   ├── contexts/     # React Context
│   ├── hooks/        # カスタムフック
│   ├── lib/
│   │   └── p2p/      # P2P同期・ルーム時計・保存・再開用ファイル
│   ├── pages/        # ページコンポーネント
│   ├── stores/       # Zustandストア（デモボード）
│   └── types/        # 型定義
│
├── signaling/        # シグナリングサーバー（Cloudflare Workers）
└── shared/           # 共通の定数
```

## ライセンス

MIT License
