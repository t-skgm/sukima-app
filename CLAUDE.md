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

## ツールの利用

### gh コマンド

このリポジトリでは git remote がプロキシ経由（`http://local_proxy@127.0.0.1:...`）で設定されているため、gh コマンドがデフォルトで GitHub ホストを検出できない。

そのため、**必ず `-R owner/repo` フラグでリポジトリを明示的に指定する**こと。

```bash
# ❌ エラーになる
gh pr create --title "..."

# ✅ 正しい使い方
gh pr create -R t-skgm/march-am-site --title "..."
```

## 開発ルール

- **コミット**: 意味のわかるサイズで区切り、日本語でメッセージを書く
- **ブランチ**: mainに直接pushせず、ブランチを作成してPR
- **設計方針**: シンプルで高凝集度をモットーに「やりすぎない程度のレイヤー分離」

## コーディング規約

### 基本ルール

- 日本語コメント可、変数名・関数名は英語
- Biomeのルールに従う（import順序自動整理）
- 型は可能な限り推論に任せ、必要な箇所のみ明示
- `any`は極力避ける（一時的な場合はTODOコメント付与）

### 関数型プログラミングとImmutabilityの原則

このプロジェクトでは、保守性と予測可能性を高めるため、関数型プログラミングのアプローチを採用する。

**基本方針:**
- **純粋関数を志向**: 副作用がなく、同じ入力には常に同じ出力を返す関数を書く
- **Immutableを徹底**: 元のデータを変更せず、常に新しい値を返す
- **for/whileループを避ける**: 可能な限り `map`, `filter`, `reduce`, `flatMap` 等の高階関数を使用
- **JavaScriptのクラスは基本使わない**: オブジェクトと関数の組み合わせで表現

**実装例:**

```typescript
// ❌ 避けるべき: mutableなループ
function buildSet(items: string[]): Set<string> {
  const result = new Set<string>()
  for (const item of items) {
    result.add(item)  // mutation
  }
  return result
}

// ✅ 推奨: 関数型アプローチ
function buildSet(items: string[]): Set<string> {
  return new Set(items)
}

// ❌ 避けるべき: whileループでのmutation
function enumerateDates(start: Date, end: Date): Date[] {
  const result: Date[] = []
  let current = new Date(start)
  while (current <= end) {
    result.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

// ✅ 推奨: Array.fromを使った宣言的実装
function enumerateDates(start: Date, end: Date): Date[] {
  const days = daysBetween(start, end)
  return Array.from({ length: days }, (_, i) => addDays(start, i))
}
```

**注意点:**
- reduceのaccumulatorは制御された範囲でmutateしても良い（パフォーマンス最適化）
- ただし、accumulatorの外部への影響がないことを確認すること

**互換性コードについて:**
- 型の再エクスポート等の互換性コードは残さず、影響箇所を一度に修正する
- レイヤー間の依存関係を明確に保ち、適切な層から直接importする

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
- `src/schema/`: 未移行のZodスキーマ（calendar, ideas等）
- `src/types/`: 共通の型定義

### packages/api
- `src/domain/`: **ドメイン層**（純粋関数によるビジネスロジック）
  - `calendar-date.ts`: 日付計算・変換のユーティリティ（parseDate, formatDate, daysBetween等）
  - `date-range.ts`: 日付範囲の操作（分割、占有セット構築、ギャップ検出、定数管理）
  - `vacant-period.ts`: 空き期間のドメインロジック（生成、検証、連休判定）
  - **特徴**: すべて純粋関数、副作用なし、immutableを志向、for/whileループなし
- `src/usecases/`: **ユースケース層**（ビジネスロジック + スキーマ + 型）
  - `schema.ts`: 共通フィールドスキーマ（titleSchema, memoSchema等）
  - `errors.ts`: カスタムエラークラス
  - `events.ts`, `family.ts`: 各ユースケース
  - `vacant.ts`: ドメイン層をオーケストレーションする薄い層
- `src/router/`: oRPCルーター（APIエンドポイント定義）
- `src/queries/`: SQLファイル（TypeSQL用、将来）
- `migrations/`: D1マイグレーションSQL

**レイヤー間の依存関係:**
```
router → usecases → domain
                 ↘ gateways (DB等)
```
- domain層: 他層に依存しない純粋関数
- usecases層: domainとgatewaysを組み合わせてビジネスロジックを実現
- router層: HTTPリクエストをusecasesに変換

## ユースケース実装方針

ユースケースは**高階関数スタイル**で、入力は**Prisma風のwhere+data形式**で実装する。

### 基本パターン

```typescript
import { z } from 'zod'
import { familyIdSchema, idSchema, titleSchema } from './schema'

// === スキーマと型をユースケースと同じファイルに定義 ===

export const updateEventInputSchema = z.object({
  where: z.object({
    familyId: familyIdSchema,  // 対象を特定（pkey）
    id: idSchema,
  }),
  data: z.object({             // 変更内容（mutation詳細）
    title: titleSchema.optional(),
    // ...
  }),
})
export type UpdateEventInput = z.infer<typeof updateEventInputSchema>

// === ユースケース ===

export const updateEvent =
  (gateways: Gateways) =>
  async (input: UpdateEventInput): Promise<EventOutput> => {
    // input.where で対象を特定、input.data で更新
  }
```

### ルーターでの使用

```typescript
// router/events.ts
import { updateEventInputSchema, eventOutputSchema } from '../usecases/events'

// body部分のみ抽出（whereはcontextから取得）
const updateEventBodySchema = updateEventInputSchema.shape.data.extend({
  id: idSchema,
})

update: base
  .input(updateEventBodySchema)
  .output(eventOutputSchema)
  .handler(({ input, context }) => {
    const { id, ...data } = input
    return updateEvent(gateways)({
      where: { familyId: context.familyId, id },
      data,
    })
  })
```

### 設計意図

- **where + data**: Prisma風の命名で、対象特定（pkey）と変更内容を明確に分離
- **スキーマの配置**: ユースケースと同じファイルに定義し、sharedへの依存を削減
- **共通フィールドスキーマ**: `schema.ts`で文字数制限等を共通化し再利用
- **ルーターの責務**: body部分のスキーマを抽出し、contextからwhereを組み立て

## エラーハンドリング

ユースケース層はフレームワーク非依存のカスタムエラーを使用し、ルーター層でoRPCエラーに変換する。

### カスタムエラー（usecases/errors.ts）

```typescript
export class AppError extends Error {
  constructor(message: string, public readonly code: string) { ... }
}
export class NotFoundError extends AppError { ... }    // 404
export class BadRequestError extends AppError { ... }  // 400
export class InternalError extends AppError { ... }    // 500
```

### ミドルウェアでの変換（router/base.ts）

```typescript
export const base = os.$context<Context>().use(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (error instanceof AppError) {
      throw new ORPCError(error.code, { message: error.message })
    }
    throw error
  }
})
```

### packages/web
- `src/routes/`: TanStack Routerページコンポーネント
- `src/features/`: 機能別モジュール（将来）
- `src/components/`: 共通UIコンポーネント
- `src/lib/`: ユーティリティ

## API設計方針

- oRPCによる型安全なRPC
- 画面単位で必要なデータを一括取得（N+1回避）
- 公開API: `/api/rpc/*`
- 家族スコープAPI: `/api/{familyId}/rpc/*`
- SPAページ: `/f/{familyId}/*`

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
