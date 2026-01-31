# TODO

## バックエンド未実装（フロントに影響）

- [x] **祝日データの取得** — カレンダーAPIで `holiday` 型アイテムを返す。外部APIまたは静的データから日本の祝日を取得する
  - `packages/api/src/usecases/holidays.ts` で日本の祝日（固定日・ハッピーマンデー・春分秋分・振替休日・国民の休日）を算出
  - `packages/api/src/usecases/calendar.ts` でカレンダーアイテムとして返す

- [x] **空き期間の計算** — カレンダーAPIで `vacant` 型アイテムを返す。予定・ブロック期間・祝日から空き期間を算出する
  - `packages/api/src/usecases/vacant.ts` で空き期間を計算（3日以上の連続空き日、連休判定付き）
  - `packages/api/src/usecases/calendar.ts` でカレンダーアイテムとして返す

- [x] **行き先の候補日程（suggestions）** — 空き期間と行き先の `requiredDays` を突き合わせて候補日程を返す
  - `packages/api/src/usecases/destinations.ts` の `listDestinations` で空き期間を計算し、各行き先に最大3件の候補日程を付与

## フロントエンド未実装

- [x] **エラーページ（404）** — 存在しないページへのアクセス時に404ページを表示
  - `packages/web/src/routes/__root.tsx` に `notFoundComponent` を追加

- [x] **ランディングページのエラー表示** — カレンダー作成失敗時にユーザーへフィードバックを表示する
  - `packages/web/src/routes/index.tsx` にエラーメッセージ表示を追加

- [x] **グローバルエラーバウンダリ** — ルートレベルの Error Boundary を設置し、予期しないエラー時にフォールバックUIを表示する
  - `packages/web/src/routes/__root.tsx` に `errorComponent` を追加（再試行ボタン + トップへ戻るリンク付き）
