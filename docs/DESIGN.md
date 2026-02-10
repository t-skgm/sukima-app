# 家族カレンダーアプリ "sukima" 設計ドキュメント

## 概要

家族内で共有できる、年間行事を考慮した旅行・イベント計画アプリ

## ユーザー

- 自分と配偶者の2人
- 将来的な拡張は未定

---

## ユビキタス言語（用語集）

このプロジェクトで使用する用語の定義。設計・実装・会話で統一して使用する。

### コアドメイン

| 用語 | 英語 | 定義 |
|------|------|------|
| **家族** | Family | アプリの利用単位。1つの共有リンクに対応し、複数人で同じカレンダーを閲覧・編集できる |
| **カレンダー** | Calendar | 家族の年間予定を俯瞰する画面・機能。確定予定、アイデア、ブロック期間、外部予定、空き期間を統合表示する |

### 予定関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **予定** | Event | 日付が確定したスケジュール。開始日・終了日を持つ |
| **予定種別** | Event Type | 予定の分類。旅行(trip)、記念日(anniversary)、学校行事(school)、個人予定(personal)、その他(other)の5種類 |
| **旅行** | Trip | 予定種別の1つ。お出かけ・旅行など |
| **記念日** | Anniversary | 予定種別の1つ。誕生日、結婚記念日など毎年繰り返すもの。年ごとにレコードを作成 |
| **学校行事** | School Event | 予定種別の1つ。運動会、発表会、入学式など |
| **個人予定** | Personal | 予定種別の1つ。個人の用事（飲み会、通院など）。空き判定ではブロック扱い |

### アイデア関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **アイデア** | Idea | 日付が未確定の予定候補。月だけ決まっている状態 |
| **旅行アイデア** | Trip Idea | 「この月に旅行したい」という計画。日付が決まると予定（旅行）に昇格する |
| **月単位アイデア** | Monthly Idea | 「この月に〇〇がある」という予定候補。学校行事など日程が後から決まるもの |
| **確定する** | Confirm | アイデアに日付を設定し、予定に昇格させる操作 |

### ブロック・空き関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **ブロック期間** | Blocked Period | 予定を入れたくない期間。繁忙期、帰省予定など |
| **空き期間** | Vacant Period | 予定・ブロックがなく、旅行などを入れられる期間。週末・祝日・連休が対象 |
| **連休** | Long Weekend | 3日以上連続する空き期間。カレンダー上で強調表示される |

### 行き先関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **行き先** | Destination | いつか行きたい場所のストック。必要日数を持つ |
| **行き先ストック** | Destination Stock | 行き先のリスト全体を指す機能名 |
| **必要日数** | Required Days | その行き先に行くのに必要な日数。1=日帰り、2=1泊2日、3=2泊3日... |
| **完了** | Done | 行き先に実際に行った状態。履歴として残る |
| **日程提案** | Suggestion | 行き先の必要日数と空き期間をマッチングして提示する機能・データ |

### 共有関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **共有リンク** | Share URL | 家族のカレンダーにアクセスするためのURL。推測困難なIDを含む |
| **共有ID** | Family ID | 共有リンクに含まれるユニークな識別子。16文字以上のランダム文字列 |

### 画面・UI関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **カレンダー画面** | Calendar View | メイン画面。年間俯瞰で全データを表示 |
| **行き先画面** | Destinations View | 行き先ストックと日程提案を表示する画面 |
| **設定画面** | Settings View | 家族名変更、共有リンク確認を行う画面 |
| **週単位表示** | Weekly View | 直近3ヶ月の表示形式。1週間ごとに行を分けて表示 |
| **月単位表示** | Monthly View | 3ヶ月以降の表示形式。1ヶ月を1行で圧縮表示 |

### 操作関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **作成** | Create | 新規データを追加する操作 |
| **更新** | Update | 既存データを変更する操作 |
| **削除** | Delete | データを削除する操作 |
| **昇格** | Confirm/Promote | アイデアを予定に変換する操作（「確定する」と同義）|

### API・技術関連

| 用語 | 英語 | 定義 |
|------|------|------|
| **カレンダーアイテム** | Calendar Item | カレンダー画面に表示される要素のUnion型。予定、アイデア、ブロック、外部予定、空き期間を含む |
| **プロシージャ** | Procedure | oRPCのAPI単位。REST APIのエンドポイントに相当 |
| **ルーター** | Router | プロシージャをグループ化した構造 |

---

## 機能要件

### 1. カレンダー表示

#### 表示範囲・形式
- 今日から2年先まで表示（それ以降は非表示でフォーカスを保つ）
- 直近3ヶ月: 週単位表示
- 3ヶ月以降: 月単位表示

#### 予定の種類
| 種類 | 説明 | 例 |
|------|------|-----|
| 通常の予定 | 日付指定 | 旅行、イベント |
| 誕生日・記念日 | 毎年繰り返し | 結婚記念日、家族の誕生日 |
| 月単位の予定 | 日付未定、月のみ指定 | 6月に運動会 |

#### 外部連携
- 日本の祝日を自動表示（holiday-jp JSONから静的に取得）

### 2. 行き先ストック

旅行先のアイデアを貯めておく機能

- 場所名
- 自由メモ
- 必要日数（日帰り / 1泊2日 / 2泊3日 など）
- カテゴリ分けなし、シンプルなリスト形式

### 3. 日程提案

- 空いている期間を自動検出
- 行き先ストックの「必要日数」と照合して「この行き先、ここで行けそう」と提案

### 4. 共有・ユーザー管理

- 共有リンク方式
  - `https://app.example.com/calendar/{unique_id}`
  - unique_id: 推測困難なランダム文字列（16文字以上）
- リンクを知っている人は閲覧・編集どちらも可能
- ログイン不要
- 通知機能なし

---

## 技術構成

### インフラ（Cloudflare 無料枠）

| サービス | 用途 | 無料枠 | 本アプリでの想定使用量 |
|----------|------|--------|----------------------|
| Cloudflare Pages | フロントエンドホスティング | 無制限 | 問題なし |
| Cloudflare Workers | API サーバー | 10万リクエスト/日 | 〜100リクエスト/日（余裕）|
| Cloudflare D1 | データベース（SQLite互換） | 読取500万行/日、書込10万行/日、5GB | 〜1000行/日（余裕）|

### 技術スタック

#### フロントエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **React 19** | UIライブラリ | 安定性、エコシステム |
| **Vite** | ビルドツール | 高速、設定シンプル |
| **TanStack Router** | ルーティング | 型安全、ファイルベース |
| **TanStack Query** | データフェッチ | キャッシュ、楽観的更新 |
| **Tailwind CSS** | スタイリング | ユーティリティファースト |
| **shadcn/ui** | UIコンポーネント | カスタマイズ性、軽量 |
| **dayjs** | 日付操作 | 軽量、immutable、直感的なAPI |

#### バックエンド

| 技術 | 用途 | 選定理由 |
|------|------|----------|
| **Hono** | Webフレームワーク | 軽量、Cloudflare最適化 |
| **oRPC** | RPC | 型安全、Zod統合 |
| **Zod** | バリデーション | 型推論、oRPC統合 |
| **TypeSQL** | SQL型生成 | SQLファイルから型安全API生成、D1対応 |
| **D1 Client** | DB操作 | Cloudflare標準、直接SQL |

#### 開発ツール

| 技術 | 用途 |
|------|------|
| **TypeScript** | 型安全 |
| **Biome** | Linter/Formatter（ESLint+Prettier代替、高速）|
| **Wrangler** | Cloudflare CLI |
| **pnpm** | パッケージマネージャ |

### TypeSQL について

TypeSQLはSQLファイルから型安全なTypeScript APIを自動生成するツール。

```sql
-- queries/get-events-by-family.sql
SELECT id, event_type, title, start_date, end_date, memo
FROM events
WHERE family_id = :familyId
  AND start_date >= :startDate
  AND end_date <= :endDate
```

↓ 自動生成

```typescript
// queries/get-events-by-family.ts
export interface GetEventsByFamilyParams {
  familyId: string;
  startDate: string;
  endDate: string;
}

export interface GetEventsByFamilyResult {
  id: number;
  event_type: string;
  title: string;
  start_date: string;
  end_date: string;
  memo: string;
}

export function getEventsByFamily(
  db: D1Database,
  params: GetEventsByFamilyParams
): Promise<GetEventsByFamilyResult[]>
```

**メリット**
- SQLを直接書ける（学習コスト低）
- 型安全（パラメータ・結果とも）
- D1に対応
- ORMのオーバーヘッドなし

### プロジェクト構成

```
family-calendar/
├── packages/
│   ├── web/                 # フロントエンド（Vite + React）
│   │   ├── src/
│   │   │   ├── components/  # UIコンポーネント
│   │   │   ├── features/    # 機能別モジュール
│   │   │   ├── routes/      # ページ（TanStack Router）
│   │   │   ├── lib/         # ユーティリティ
│   │   │   └── client.ts    # oRPCクライアント
│   │   └── package.json
│   │
│   ├── api/                 # バックエンド（Cloudflare Workers）
│   │   ├── src/
│   │   │   ├── router/      # oRPCルーター
│   │   │   ├── queries/     # SQLファイル + TypeSQL生成コード
│   │   │   ├── services/    # ビジネスロジック
│   │   │   └── index.ts     # Honoエントリポイント
│   │   ├── migrations/      # D1マイグレーション
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── shared/              # 共有コード
│       ├── schema/          # Zodスキーマ（API型定義）
│       ├── types/           # 共通型
│       └── package.json
│
├── package.json
├── pnpm-workspace.yaml
└── typesql.json             # TypeSQL設定
```

### デプロイ構成

```
┌─────────────────┐     ┌─────────────────┐
│  Cloudflare     │     │  Cloudflare     │
│  Pages          │────▶│  Workers        │
│  (フロントエンド)│     │  (API)          │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Cloudflare D1  │
                        │  (データベース)  │
                        └─────────────────┘
```

### 日本の祝日

- **データソース**: [holiday-jp](https://github.com/holiday-jp/holiday_jp) のJSONファイル
- **取得方法**: ビルド時に静的JSONとしてバンドル
- **更新頻度**: 年1回程度（手動デプロイ時に更新）

### CORS設定

- フロントエンド（Pages）とAPI（Workers）は同一ドメインのサブパスにする
  - 例: `https://family-calendar.pages.dev/` (フロント) + `https://family-calendar.pages.dev/api/` (API)
  - Pages Functions または Workers Routes で実現
- または、異なるサブドメインの場合はHonoのCORSミドルウェアを使用

### セキュリティ考慮

| 項目 | 対策 |
|------|------|
| 認証 | なし（共有リンクのみ）|
| 認可 | familyIdの照合（推測困難な16文字以上のID）|
| CSRF | oRPCはPOSTのみ、SameSite Cookie不要（認証なし）|
| XSS | React自動エスケープ、CSP設定 |
| SQLi | D1のbind()によるプリペアドステートメント |
| Rate Limit | Cloudflare標準機能（必要に応じて）|

---

## データベース設計

### ER図（概念）

```
families 1--* events
families 1--* ideas_trips
families 1--* ideas_monthly_events
families 1--* blocked_periods
families 1--* destinations
```

### テーブル定義

#### families（家族）

共有単位の管理。1レコード = 1家族

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PRIMARY KEY | 共有リンク用のユニークID（16文字以上のランダム文字列） |
| name | TEXT | NOT NULL | 家族の名前（表示用） |
| created_at | TEXT | NOT NULL | 作成日時（ISO8601） |
| updated_at | TEXT | NOT NULL | 更新日時（ISO8601） |

---

### 確定済み予定

#### events（確定済みの予定）

日付が決まった予定すべて。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | INTEGER | PRIMARY KEY | 自動採番 |
| family_id | TEXT | NOT NULL, FK | → families.id |
| event_type | TEXT | NOT NULL | 種別: `trip` / `anniversary` / `school` / `other` |
| title | TEXT | NOT NULL | 予定のタイトル |
| start_date | TEXT | NOT NULL | 開始日（YYYY-MM-DD） |
| end_date | TEXT | NOT NULL | 終了日（YYYY-MM-DD） |
| memo | TEXT | NOT NULL DEFAULT '' | メモ |
| created_at | TEXT | NOT NULL | 作成日時 |
| updated_at | TEXT | NOT NULL | 更新日時 |

**event_type**
- `trip`: 旅行・お出かけ
- `anniversary`: 記念日（誕生日、結婚記念日など。毎年分レコード作成）
- `school`: 学校行事
- `personal`: 個人予定（飲み会、通院など。空き判定でブロック扱い）
- `other`: その他

---

### アイデア（未確定）

#### ideas_trips（旅行アイデア）

この月に行きたい旅行。日付未定。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | INTEGER | PRIMARY KEY | 自動採番 |
| family_id | TEXT | NOT NULL, FK | → families.id |
| title | TEXT | NOT NULL | タイトル |
| year | INTEGER | NOT NULL | 年（2025など） |
| month | INTEGER | NOT NULL | 月（1-12） |
| memo | TEXT | NOT NULL DEFAULT '' | メモ |
| created_at | TEXT | NOT NULL | 作成日時 |
| updated_at | TEXT | NOT NULL | 更新日時 |

#### ideas_monthly_events（月単位の予定アイデア）

日付未定、月だけ決まっている予定。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | INTEGER | PRIMARY KEY | 自動採番 |
| family_id | TEXT | NOT NULL, FK | → families.id |
| title | TEXT | NOT NULL | タイトル（例：運動会） |
| year | INTEGER | NOT NULL | 年（2025など） |
| month | INTEGER | NOT NULL | 月（1-12） |
| memo | TEXT | NOT NULL DEFAULT '' | メモ |
| created_at | TEXT | NOT NULL | 作成日時 |
| updated_at | TEXT | NOT NULL | 更新日時 |

---

### ブロック期間

#### blocked_periods（ブロック期間）

予定を入れたくない期間。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | INTEGER | PRIMARY KEY | 自動採番 |
| family_id | TEXT | NOT NULL, FK | → families.id |
| title | TEXT | NOT NULL | タイトル（例：繁忙期） |
| start_date | TEXT | NOT NULL | 開始日（YYYY-MM-DD） |
| end_date | TEXT | NOT NULL | 終了日（YYYY-MM-DD） |
| memo | TEXT | NOT NULL DEFAULT '' | メモ |
| created_at | TEXT | NOT NULL | 作成日時 |
| updated_at | TEXT | NOT NULL | 更新日時 |

---

### 行き先ストック

#### destinations（行き先ストック）

いつか行きたい場所。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | INTEGER | PRIMARY KEY | 自動採番 |
| family_id | TEXT | NOT NULL, FK | → families.id |
| name | TEXT | NOT NULL | 場所名 |
| memo | TEXT | NOT NULL DEFAULT '' | 自由メモ |
| required_days | INTEGER | NOT NULL | 必要日数（1=日帰り, 2=1泊2日...） |
| is_done | INTEGER | NOT NULL DEFAULT 0 | 完了フラグ（0/1） |
| created_at | TEXT | NOT NULL | 作成日時 |
| updated_at | TEXT | NOT NULL | 更新日時 |

---

### インデックス

```sql
-- events
CREATE INDEX idx_events_family ON events(family_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_type ON events(family_id, event_type);

-- ideas_trips
CREATE INDEX idx_ideas_trips_family ON ideas_trips(family_id);
CREATE INDEX idx_ideas_trips_month ON ideas_trips(year, month);

-- ideas_monthly_events
CREATE INDEX idx_ideas_monthly_events_family ON ideas_monthly_events(family_id);
CREATE INDEX idx_ideas_monthly_events_month ON ideas_monthly_events(year, month);

-- blocked_periods
CREATE INDEX idx_blocked_periods_family ON blocked_periods(family_id);
CREATE INDEX idx_blocked_periods_dates ON blocked_periods(start_date, end_date);

-- destinations
CREATE INDEX idx_destinations_family ON destinations(family_id);
```

---

## 画面設計

### 画面構成

| 画面 | 内容 |
|------|------|
| ランディングページ | 新規カレンダー作成 / サービス説明 |
| カレンダー | メイン画面。年間俯瞰 + アイデア統合 |
| 行き先 | 行き先ストック + 日程提案 |
| 設定 | 家族名変更、共有リンク確認 |

### ナビゲーション

SPメイン。下部タブで切り替え。

```
[ カレンダー ] [ 行き先 ] [ 設定 ]
```

---

### ランディングページ

```
┌─────────────────────────────────────┐
│                                     │
│        🗓️ Family Calendar          │
│                                     │
│   家族で年間の予定を計画しよう      │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   新しいカレンダーを作る    │   │
│   └─────────────────────────────┘   │
│                                     │
│   共有リンクをお持ちの方は          │
│   そのリンクからアクセスしてください │
│                                     │
└─────────────────────────────────────┘
```

**フロー**
1. 「新しいカレンダーを作る」タップ
2. 家族名を入力（任意）
3. family作成 → カレンダー画面へ遷移
4. 共有リンクを設定画面で確認・コピー可能

---

### カレンダー画面（メイン）

年間俯瞰表示。距離によって粒度が変わる。

**表示粒度**

| 期間 | 粒度 |
|------|------|
| 今月〜3ヶ月先 | 週単位 |
| 4ヶ月〜1年先 | 月単位 |
| 1年〜2年先 | 月単位（圧縮） |

**レイアウト**

```
┌─────────────────────────────────────┐
│ 🗓️ 山田家                     [設定] │
├─────────────────────────────────────┤
│                                     │
│ ── 2025年1月 ────────────────────── │
│                                     │
│ 1/1-5    ━━正月帰省━━  🎌祝        │
│ 1/6-12   ✨空き週末                 │
│ 1/13-19  ━━出張━━     ■ブロック    │
│ 1/20-26  ✨3連休チャンス！          │
│ 1/27-2/2 💡スキー行きたい           │
│                                     │
│ ── 2025年2月 ────────────────────── │
│                                     │
│ 2/3-9    ✨空き                     │
│ 2/10-16  ★バレンタイン             │
│ 2/17-23                             │
│ 2/24-3/2 ━━温泉旅行━━              │
│                                     │
│ ── 2025年3月 ────────────────────── │
│ ...                                 │
│                                     │
│ ┄┄┄┄ ここから月単位 ┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│                                     │
│ ── 2025年5月 ────────────────────── │
│ ━GW旅行━━━  💡BBQ  ✨後半空き      │
│                                     │
│ ── 2025年6月 ────────────────────── │
│ 💡運動会(日程未定)  ✨空きあり      │
│                                     │
│ ...                                 │
│                                     │
│ ┄┄┄┄ ここから圧縮表示 ┄┄┄┄┄┄┄┄┄┄┄ │
│                                     │
│ ── 2026年 ────────────────────────  │
│ 1-3月  ★誕生日(2月)                │
│ 4-6月  ✨空き多め                   │
│ 7-9月                               │
│ 10-12月                             │
│                                     │
└─────────────────────────────────────┘
        ↓ スクロールで全期間表示
```

**表示アイコン凡例**

| アイコン | 意味 |
|---------|------|
| ━━━━ | 確定予定（バー表示） |
| ★ | 記念日 |
| 🎌 | 祝日 |
| 💡 | アイデア（日程未確定） |
| ✨ | 空き期間（チャンス！） |
| ■ | ブロック期間 |

**操作**

| タップ対象 | 動作 |
|-----------|------|
| 空き期間（✨） | 予定追加モーダル |
| アイデア（💡） | アイデア詳細表示 → 日程確定も可能 |
| 確定予定 | 予定詳細表示 → 編集・削除 |
| ブロック期間 | 詳細表示 → 編集・削除 |
| 月ヘッダー | アイデア追加モーダル（この月に〇〇したい） |

**空き期間の判定ロジック**

- 週末（土日）で予定・ブロックがない → ✨表示
- 祝日で予定・ブロックがない → ✨表示
- 3日以上の連休で予定・ブロックがない → ✨✨表示（強調）
- 平日のみの空きは強調しない

---

### 予定追加モーダル

空き期間タップ時に表示。

```
┌─────────────────────────────────────┐
│ 予定を追加                     [×]  │
├─────────────────────────────────────┤
│                                     │
│ 期間: 1/20(月) - 1/26(日)           │
│                                     │
│ 種類を選択:                         │
│ ┌─────────┐ ┌─────────┐            │
│ │ 🚗 旅行  │ │ ★ 記念日│            │
│ └─────────┘ └─────────┘            │
│ ┌─────────┐ ┌─────────┐            │
│ │ 🏫 学校 │ │ 📝 その他│            │
│ └─────────┘ └─────────┘            │
│ ┌─────────┐                        │
│ │ ■ ブロック│                       │
│ └─────────┘                        │
│                                     │
│ ── または ──                        │
│                                     │
│ 💡 行き先ストックから選ぶ           │
│   → 沖縄 (2泊3日)                  │
│   → 京都 (1泊2日)                  │
│   → 富士急 (日帰り)                │
│                                     │
└─────────────────────────────────────┘
```

---

### アイデア詳細モーダル

アイデアタップ時に表示。

```
┌─────────────────────────────────────┐
│ 💡 アイデア                    [×]  │
├─────────────────────────────────────┤
│                                     │
│ スキー旅行                          │
│                                     │
│ 時期: 2025年1月                     │
│ メモ: 長野か新潟で探す              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        日程を確定する            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [編集]                     [削除]   │
│                                     │
└─────────────────────────────────────┘
```

「日程を確定する」→ 日付選択 → eventに昇格

---

### 日程提案画面

→ 行き先ストック画面に統合

---

### 行き先ストック画面（日程提案統合）

```
┌─────────────────────────────────────┐
│ 📍 行き先                    [+ 追加] │
├─────────────────────────────────────┤
│                                     │
│ ── 行きたい ──                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 沖縄                      2泊3日 │ │
│ │ 海でのんびり                    │ │
│ │                                 │ │
│ │ 📅 おすすめ日程:                │ │
│ │   1/24-26 (3連休)   [予定にする] │ │
│ │   2/21-23 (3連休)   [予定にする] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 京都                      1泊2日 │ │
│ │ 紅葉シーズンに                  │ │
│ │                                 │ │
│ │ 📅 おすすめ日程:                │ │
│ │   1/11-12          [予定にする] │ │
│ │   1/18-19          [予定にする] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ── 行った ──                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✓ 箱根                    1泊2日 │ │
│ │ 2024年11月に行った              │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**日程提案ロジック**
- 行き先の「必要日数」と空き期間をマッチング
- 週末・祝日・連休で予定がない期間を候補として表示

---

### 設定画面

```
┌─────────────────────────────────────┐
│ ⚙️ 設定                             │
├─────────────────────────────────────┤
│                                     │
│ ── 家族 ──                          │
│                                     │
│ 名前: 山田家                   [編集] │
│                                     │
│ ── 共有 ──                          │
│                                     │
│ 共有リンク:                         │
│ https://xxx.pages.dev/f/abc123...   │
│                            [コピー]  │
│                                     │
└─────────────────────────────────────┘
```

---

## API設計

oRPCを使用したRPCスタイルのAPI。フロントエンド画面の要求に合わせて、最小リクエストで必要なデータを取得できるよう設計。

### 技術スタック

- **oRPC**: 型安全なRPCフレームワーク
- **Zod**: バリデーション
- **Cloudflare Workers + D1**: サーバー・DB

### ルーター構成

```typescript
const router = {
  // 家族
  family: {
    create,     // 新規作成
    update,     // 名前変更
  },

  // カレンダー画面
  calendar: {
    get,        // 全データ一括取得
  },

  // 行き先画面
  destinations: {
    list,       // 提案付き一覧
    create,
    update,
    delete,
  },

  // 設定画面
  settings: {
    get,        // 家族情報を取得
  },

  // カレンダー操作
  events: {
    create,
    update,
    delete,
  },

  ideas: {
    trips: {
      create,
      update,
      delete,
      confirm,  // → event昇格
    },
    monthly: {
      create,
      update,
      delete,
      confirm,  // → event昇格
    },
  },

  blockedPeriods: {
    create,
    update,
    delete,
  },
}
```

### 画面ごとのリクエスト

| 画面 | 初期表示 | 操作時 |
|------|---------|--------|
| カレンダー | `calendar.get` (1回) | 各CUD操作 |
| 行き先 | `destinations.list` (1回) | 各CUD操作 |
| 設定 | `settings.get` (1回) | 各操作 |

---

### 共通スキーマ定義（Zod）

```typescript
import { z } from 'zod'

// === 基本型 ===

/** 日付文字列 (YYYY-MM-DD) */
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式')

/** 日時文字列 (ISO8601) */
const datetimeSchema = z.string().datetime()

/** 正の整数ID */
const idSchema = z.number().int().positive()

/** 家族ID（共有リンク用、16文字以上の英数字） */
const familyIdSchema = z.string().min(16).regex(/^[a-zA-Z0-9]+$/)

// === ドメイン固有 ===

/** 予定種別 */
const eventTypeSchema = z.enum(['trip', 'anniversary', 'school', 'personal', 'other'])

/** 年（現在年-1 〜 現在年+3） */
const yearSchema = z.number().int().min(2024).max(2030)

/** 月（1-12） */
const monthSchema = z.number().int().min(1).max(12)

/** 必要日数（1-14日） */
const requiredDaysSchema = z.number().int().min(1).max(14)

/** タイトル（1-100文字） */
const titleSchema = z.string().min(1).max(100)

/** 家族名（0-50文字、空文字許可） */
const familyNameSchema = z.string().max(50)

/** メモ（0-1000文字） */
const memoSchema = z.string().max(1000).default('')

/** URL */
const urlSchema = z.string().url().max(2000)

/** カレンダー名（1-100文字） */
const calendarNameSchema = z.string().min(1).max(100)
```

### バリデーションルール一覧

| フィールド | 型 | 制約 | 備考 |
|-----------|-----|------|------|
| `familyId` | string | 16文字以上、英数字のみ | 共有リンク用ID |
| `id` | number | 正の整数 | 各エンティティのID |
| `title` | string | 1-100文字 | 予定・アイデア・ブロック等のタイトル |
| `name` | string | 1-100文字 | 行き先名 |
| `familyName` | string | 0-50文字 | 家族名（空文字許可） |
| `memo` | string | 0-1000文字 | 任意メモ |
| `date` | string | YYYY-MM-DD形式 | 日付 |
| `year` | number | 2024-2030 | アイデアの年 |
| `month` | number | 1-12 | アイデアの月 |
| `requiredDays` | number | 1-14 | 行き先の必要日数 |
| `eventType` | enum | trip/anniversary/school/personal/other | 予定種別 |

### 日付の整合性ルール

- `endDate >= startDate` であること
- 予定・ブロックの期間は最大365日
- 日付は今日から2年後まで（表示範囲に準拠）

---

### プロシージャ詳細

#### family.create

新規家族を作成。

**Input**
```typescript
z.object({
  name: familyNameSchema,  // 0-50文字、空文字可
})
```

**Output**
```typescript
z.object({
  id: familyIdSchema,
  name: z.string(),
  shareUrl: urlSchema,
})
```

---

#### family.update

家族名を変更。

**Input**
```typescript
z.object({
  name: familyNameSchema,  // 0-50文字
})
```

**Output**
```typescript
z.object({
  id: familyIdSchema,
  name: z.string(),
})
```

---

#### calendar.get

カレンダー画面用の全データを一括取得。Union型で返す。

**Input**
```typescript
z.object({})  // familyIdはURLパスから取得
```

**Output**
```typescript
const calendarItemSchema = z.discriminatedUnion('type', [
  // 確定予定
  z.object({
    type: z.literal('event'),
    id: idSchema,
    eventType: eventTypeSchema,
    title: titleSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    memo: z.string(),
  }),
  // 旅行アイデア
  z.object({
    type: z.literal('idea_trip'),
    id: idSchema,
    title: titleSchema,
    year: yearSchema,
    month: monthSchema,
    memo: z.string(),
  }),
  // 月単位アイデア
  z.object({
    type: z.literal('idea_monthly'),
    id: idSchema,
    title: titleSchema,
    year: yearSchema,
    month: monthSchema,
    memo: z.string(),
  }),
  // ブロック期間
  z.object({
    type: z.literal('blocked'),
    id: idSchema,
    title: titleSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    memo: z.string(),
  }),
  // 祝日（静的JSONから）
  z.object({
    type: z.literal('holiday'),
    title: z.string(),
    date: dateSchema,
  }),
  // 空き期間
  z.object({
    type: z.literal('vacant'),
    startDate: dateSchema,
    endDate: dateSchema,
    days: z.number().int().min(1),
    isLongWeekend: z.boolean(),  // 3日以上の連休
  }),
])

z.object({
  items: z.array(calendarItemSchema),
  rangeStart: dateSchema,
  rangeEnd: dateSchema,
})
```

---

#### destinations.list

行き先画面用。提案日程付きで返す。

**Input**
```typescript
z.object({})  // familyIdはURLパスから取得
```

**Output**
```typescript
const suggestionSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  label: z.string().max(50),  // '3連休', '週末' など
})

const destinationSchema = z.object({
  id: idSchema,
  name: titleSchema,
  memo: z.string(),
  requiredDays: requiredDaysSchema,
  isDone: z.boolean(),
  suggestions: z.array(suggestionSchema),  // isDone=true なら空配列
})

z.object({
  active: z.array(destinationSchema),  // 行きたい（isDone=false）
  done: z.array(destinationSchema),    // 行った（isDone=true）
})
```

---

#### destinations.create

**Input**
```typescript
z.object({
  name: titleSchema,           // 1-100文字
  memo: memoSchema.optional(), // 0-1000文字、省略時は空文字
  requiredDays: requiredDaysSchema,  // 1-14
})
```

**Output**
```typescript
destinationSchema  // suggestions含む
```

---

#### destinations.update

**Input**
```typescript
z.object({
  id: idSchema,
  name: titleSchema.optional(),
  memo: memoSchema.optional(),
  requiredDays: requiredDaysSchema.optional(),
  isDone: z.boolean().optional(),
})
```

**Output**
```typescript
destinationSchema
```

---

#### destinations.delete

**Input**
```typescript
z.object({
  id: idSchema,
})
```

**Output**
```typescript
z.object({
  success: z.literal(true),
})
```

---

#### settings.get

設定画面用。家族情報を返す。

**Input**
```typescript
z.object({})  // familyIdはURLパスから取得
```

**Output**
```typescript
z.object({
  family: z.object({
    id: familyIdSchema,
    name: z.string(),
    shareUrl: urlSchema,
  }),
})
```

---

#### events.create

**Input**
```typescript
z.object({
  eventType: eventTypeSchema,
  title: titleSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  memo: memoSchema.optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: '終了日は開始日以降にしてください' }
)
```

**Output**
```typescript
z.object({
  id: idSchema,
  eventType: eventTypeSchema,
  title: titleSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  memo: z.string(),
})
```

---

#### events.update

**Input**
```typescript
z.object({
  id: idSchema,
  eventType: eventTypeSchema.optional(),
  title: titleSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  memo: memoSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate
    }
    return true
  },
  { message: '終了日は開始日以降にしてください' }
)
```

**Output**
```typescript
// events.create の Output と同じ
```

---

#### events.delete

**Input**
```typescript
z.object({
  id: idSchema,
})
```

**Output**
```typescript
z.object({
  success: z.literal(true),
})
```

---

#### ideas.trips.create

**Input**
```typescript
z.object({
  title: titleSchema,
  year: yearSchema,
  month: monthSchema,
  memo: memoSchema.optional(),
})
```

**Output**
```typescript
z.object({
  id: idSchema,
  title: titleSchema,
  year: yearSchema,
  month: monthSchema,
  memo: z.string(),
})
```

---

#### ideas.trips.update

**Input**
```typescript
z.object({
  id: idSchema,
  title: titleSchema.optional(),
  year: yearSchema.optional(),
  month: monthSchema.optional(),
  memo: memoSchema.optional(),
})
```

**Output**
```typescript
// ideas.trips.create の Output と同じ
```

---

#### ideas.trips.delete

**Input**
```typescript
z.object({
  id: idSchema,
})
```

**Output**
```typescript
z.object({
  success: z.literal(true),
})
```

---

#### ideas.trips.confirm

アイデアを確定してeventに昇格。

**Input**
```typescript
z.object({
  id: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: '終了日は開始日以降にしてください' }
)
```

**Output**
```typescript
z.object({
  event: z.object({
    id: idSchema,
    eventType: z.literal('trip'),
    title: titleSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    memo: z.string(),
  }),
})
```

---

#### ideas.monthly.create / update / delete / confirm

`ideas.trips` と同様の構造。`confirm` 時の `eventType` は `'other'`。

---

#### blockedPeriods.create

**Input**
```typescript
z.object({
  title: titleSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  memo: memoSchema.optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: '終了日は開始日以降にしてください' }
)
```

**Output**
```typescript
z.object({
  id: idSchema,
  title: titleSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  memo: z.string(),
})
```

---

#### blockedPeriods.update

**Input**
```typescript
z.object({
  id: idSchema,
  title: titleSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  memo: memoSchema.optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate
    }
    return true
  },
  { message: '終了日は開始日以降にしてください' }
)
```

**Output**
```typescript
// blockedPeriods.create の Output と同じ
```

---

#### blockedPeriods.delete

**Input**
```typescript
z.object({
  id: idSchema,
})
```

**Output**
```typescript
z.object({
  success: z.literal(true),
})
```

---

## 今後の設計タスク

- [x] データベース設計（テーブル定義）
- [x] 画面設計
- [x] API設計
- [x] 技術スタック選定
- [ ] 実装

---

## 実装時の注意事項

### 空き期間の計算ロジック

1. 表示期間内のすべての日付を列挙
2. 以下を「埋まっている」として除外:
   - events（全種別）
   - blocked_periods
   - 祝日（holiday-jp JSONから）
   - personal タイプの予定は特にブロック扱い
3. 残った日付のうち、週末（土日）または祝日を含む連続期間を抽出
4. 3日以上連続する場合は `isLongWeekend: true`

### 日程提案の計算ロジック

1. 空き期間を計算
2. 各行き先（isDone=false）について:
   - 空き期間の日数 >= 必要日数 の期間を抽出
   - 最大5件の提案を返す
   - labelは「週末」「3連休」「祝日含む」などを自動生成

### 記念日の毎年レコード作成

- 記念日（anniversary）は年ごとにレコードを作成
- 新規作成時に、表示範囲（2年分）のレコードを一括作成
- 例: 2025/02/14の結婚記念日 → 2025, 2026, 2027年分を作成

### 祝日データの取り込み

- holiday-jp JSONをビルド時にバンドル
- カレンダー表示時に表示範囲の祝日を `type: 'holiday'` として返す
- 祝日は空き判定の「埋まっている」日に含めない（祝日は旅行チャンス）
