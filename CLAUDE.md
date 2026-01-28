# sukima - 家族カレンダーアプリ

家族内で共有できる、年間行事を考慮した旅行・イベント計画アプリ。

## プロジェクト構成

pnpmモノレポ構成：

```
packages/
├── shared/   # Zodスキーマ・共有型（API型定義）
├── api/      # Cloudflare Workers + Hono + oRPC
└── web/      # React 19 + Vite + TanStack Router/Query + Tailwind
```

## 技術スタック

- **フロントエンド**: React 19, Vite, TanStack Router/Query, Tailwind CSS, shadcn/ui
- **バックエンド**: Hono, oRPC, Cloudflare Workers, D1 (SQLite)
- **共通**: TypeScript (strict), Zod, Biome (linter/formatter)

## 開発コマンド

```bash
pnpm dev          # フロントエンド開発サーバー
pnpm dev:api      # API開発サーバー（wrangler）
pnpm build        # 全パッケージビルド
pnpm lint         # Biome lint
pnpm lint:fix     # Biome lint + fix
pnpm typecheck    # TypeScript型チェック
```

## コーディング規約

- 日本語コメント可、変数名・関数名は英語
- Biomeのルールに従う（import順序自動整理）
- 型は可能な限り推論に任せ、必要な箇所のみ明示
- `any`は極力避ける（一時的な場合はTODOコメント付与）

## ドメイン用語（ユビキタス言語）

詳細は`docs/DESIGN.md`を参照。主要な用語：

| 用語 | 英語 | 説明 |
|------|------|------|
| 家族 | Family | アプリの利用単位。共有リンクに対応 |
| 予定 | Event | 日付確定済みのスケジュール |
| アイデア | Idea | 日付未確定の予定候補（月のみ指定） |
| ブロック期間 | Blocked Period | 予定を入れたくない期間 |
| 行き先 | Destination | いつか行きたい場所のストック |
| 空き期間 | Vacant Period | 予定がなく旅行可能な期間 |

## ディレクトリ構造の意図

### packages/shared
- `src/schema/`: Zodスキーマ（API入出力の型定義）
- `src/types/`: 共通の型定義

### packages/api
- `src/router/`: oRPCルーター（APIエンドポイント定義）
- `src/services/`: ビジネスロジック
- `src/queries/`: SQLファイル（TypeSQL用、将来）
- `migrations/`: D1マイグレーションSQL

### packages/web
- `src/routes/`: TanStack Routerページコンポーネント
- `src/features/`: 機能別モジュール（将来）
- `src/components/`: 共通UIコンポーネント
- `src/lib/`: ユーティリティ

## API設計方針

- oRPCによる型安全なRPC
- 画面単位で必要なデータを一括取得（N+1回避）
- 公開API: `/rpc/*`
- 家族スコープAPI: `/c/{familyId}/rpc/*`

## データベース

Cloudflare D1 (SQLite互換)。主要テーブル：
- `families`: 家族（共有単位）
- `events`: 確定済み予定
- `ideas_trips`: 旅行アイデア
- `ideas_monthly_events`: 月単位アイデア
- `blocked_periods`: ブロック期間
- `destinations`: 行き先ストック

## 認証・認可

- 認証なし（共有リンク方式）
- familyIdは16文字以上のランダム文字列（推測困難）
