# TODO項目の実装計画

## 概要

TODO.mdの6項目を実装する。バックエンド3件（祝日・空き期間・候補日程）→ フロントエンド3件（エラーハンドリング）の順で進める。

---

## Phase 1: 祝日データの取得

**ファイル:** `packages/api/src/usecases/holidays.ts` (新規)

日本の祝日を算出するユーティリティを作成。外部パッケージ不要で、Cloudflare Workers互換。

### 実装内容

- 固定祝日（元日、建国記念の日、天皇誕生日、昭和の日、憲法記念日、みどりの日、こどもの日、山の日、文化の日、勤労感謝の日）
- ハッピーマンデー祝日（成人の日=1月第2月曜、海の日=7月第3月曜、敬老の日=9月第3月曜、スポーツの日=10月第2月曜）
- 春分の日・秋分の日（天文計算の近似式）
- 振替休日（祝日が日曜の場合、翌月曜が休み）
- `getHolidays(rangeStart: string, rangeEnd: string): Array<{ title: string; date: string }>` を export

### カレンダーへの統合

**ファイル:** `packages/api/src/usecases/calendar.ts`

- `getHolidays()` を呼び出して `holiday` 型アイテムを items に追加
- DB不要（純粋な計算）なので Promise.all に含めず、同期的に実行

---

## Phase 2: 空き期間の計算

**ファイル:** `packages/api/src/usecases/vacant.ts` (新規)

### 実装内容

- `calculateVacantPeriods(occupiedRanges, holidays, rangeStart, rangeEnd): VacantPeriod[]`
- occupiedRanges = events + blocked_periods の日付範囲をマージ
- 日付範囲をソート→マージ（重複除去）→ギャップを抽出
- 各ギャップについて:
  - `days`: 期間の日数
  - `isLongWeekend`: 土日または祝日を含む3日以上の連休か判定
- 最小日数フィルタ（2日以上の空きのみ返す）

### カレンダーへの統合

**ファイル:** `packages/api/src/usecases/calendar.ts`

- events + blocked_periods の日付範囲と holidays を渡して `calculateVacantPeriods()` を呼び出し
- `vacant` 型アイテムを items に追加
- items を時系列でソート（date/startDate/year+month で比較）

---

## Phase 3: 行き先の候補日程

**ファイル:** `packages/api/src/usecases/destinations.ts`

### 実装内容

- `listDestinations` 内で、active な行き先に対して候補日程を計算
- カレンダーと同じロジックで空き期間を取得（`calculateVacantPeriods` を再利用）
- 各 destination の `requiredDays` 以上の空き期間を suggestions に変換
- `label` は「GW」「夏休み」等の期間名、または `M/D〜M/D` 形式
- 最大3件程度に制限

---

## Phase 4: フロントエンド エラーハンドリング

### 4-1: ランディングページのエラー表示

**ファイル:** `packages/web/src/routes/index.tsx`

- `error` state を追加し、catch 内でセット
- ボタン下にエラーメッセージを表示

### 4-2: familyId 404 ページ

**ファイル:** `packages/web/src/routes/f/$familyId.tsx`

- `beforeLoad` で `settings.get` を呼び、存在しない familyId なら `notFound()` をスロー
- `notFoundComponent` でカスタム404 UIを表示（トップページへの導線付き）

### 4-3: グローバルエラーバウンダリ

**ファイル:** `packages/web/src/routes/__root.tsx`

- `errorComponent` を定義し、予期しないエラー時のフォールバックUIを表示
- 「トップに戻る」「再読み込み」ボタンを配置

---

## 実装順序

1. Phase 1（祝日）→ Phase 2（空き期間）→ Phase 3（候補日程）: バックエンド、依存順
2. Phase 4（エラーハンドリング）: フロントエンド、独立

## 検証方法

1. `pnpm dev:api` + `pnpm dev` で動作確認
2. カレンダーに祝日と空き期間が表示されることを確認
3. 行き先に候補日程が表示されることを確認
4. 存在しない familyId にアクセスして404が表示されることを確認
5. `pnpm typecheck` で型エラーなし
6. `pnpm lint` でlintエラーなし

## 変更ファイル一覧

**新規:**
- `packages/api/src/usecases/holidays.ts`
- `packages/api/src/usecases/vacant.ts`

**修正:**
- `packages/api/src/usecases/calendar.ts`
- `packages/api/src/usecases/destinations.ts`
- `packages/web/src/routes/__root.tsx`
- `packages/web/src/routes/index.tsx`
- `packages/web/src/routes/f/$familyId.tsx`
