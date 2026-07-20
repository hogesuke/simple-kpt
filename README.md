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
  <p>準備も操作も最小限。振り返りに集中できるKPTツール</p>
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

- 🔄 KPTフレームワーク
- ⏱️ タイマー
- ✅ Tryの進捗管理
- 📥 エクスポート
- 🤖 AIサマリー
- 📈 推移のグラフ表示
- 🌓 ダークモード
- 🌐 多言語対応（日本語 / English）

## 技術スタック

- TypeScript
- React 19
- Tailwind CSS 4
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

- Supabase
- Vercel

## 動作確認環境

- Node.js 24+

## ローカル開発

### インストール

```bash
pnpm install --frozen-lockfile

brew install supabase/tap/supabase
```

### 環境変数の設定

`.env.local`を作成し、`supabase start`で表示される値を設定してください。

```bash
VITE_SUPABASE_URL=<Supabase URL> # e.g., http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<Supabase Anon Key> # e.g., sb_publishable_xxxxxxxx...
```

### 起動

```bash
supabase start

pnpm dev
```

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
│   ├── lib/          # ユーティリティ・API
│   ├── pages/        # ページコンポーネント
│   ├── stores/       # Zustandストア
│   └── types/        # 型定義
│
└── supabase/
    ├── functions/    # Edge Functions
    ├── migrations/   # マイグレーション
    └── seed.sql      # シードデータ
```

## ライセンス

MIT License
