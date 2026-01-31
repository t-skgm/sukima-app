# TODO

## バックエンド未実装（フロントに影響）

- [ ] **祝日データの取得** — カレンダーAPIで `holiday` 型アイテムを返す。外部APIまたは静的データから日本の祝日を取得する
  - 関連: `packages/api/src/usecases/calendar.ts` (TODO コメントあり)
  - フロントの表示ロジックは実装済み (`packages/web/src/routes/f/$familyId/index.tsx` CalendarItemCard の `holiday` ケース)

- [ ] **空き期間の計算** — カレンダーAPIで `vacant` 型アイテムを返す。予定・ブロック期間・祝日から空き期間を算出する
  - 関連: `packages/api/src/usecases/calendar.ts` (TODO コメントあり)
  - フロントの表示ロジックは実装済み (同上 `vacant` ケース)

- [ ] **行き先の候補日程（suggestions）** — 空き期間と行き先の `requiredDays` を突き合わせて候補日程を返す。空き期間の実装が前提
  - 関連: `packages/api/src/usecases/destinations.ts` (TODO コメントあり、現在は空配列)
  - フロントの表示ロジックは実装済み (`packages/web/src/routes/f/$familyId/destinations.tsx` DestinationCard 内の suggestions 表示)

## フロントエンド未実装

- [ ] **エラーページ（404）** — 存在しない `familyId` にアクセスした際のエラーページ
  - 関連: `packages/web/src/routes/f/$familyId/` 配下の各ページ

- [ ] **ランディングページのエラー表示** — カレンダー作成失敗時にユーザーへフィードバックを表示する（現在は `console.error` のみ）
  - 関連: `packages/web/src/routes/index.tsx`

- [ ] **グローバルエラーバウンダリ** — ルートレベルの Error Boundary を設置し、予期しないエラー時にフォールバックUIを表示する
  - 関連: `packages/web/src/routes/__root.tsx`
