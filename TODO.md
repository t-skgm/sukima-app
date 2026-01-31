# TODO

## 完了済み

- [x] **祝日データの取得** — カレンダーAPIで `holiday` 型アイテムを返す
- [x] **空き期間の計算** — カレンダーAPIで `vacant` 型アイテムを返す
- [x] **行き先の候補日程（suggestions）** — 空き期間と `requiredDays` を突き合わせて候補日程を返す
- [x] **エラーページ（404）** — `notFoundComponent` を追加
- [x] **ランディングページのエラー表示** — カレンダー作成失敗時のフィードバック
- [x] **グローバルエラーバウンダリ** — ルートレベルの Error Boundary
- [x] **フロントエンドCRUD UI** — 全エンティティの作成・編集・削除
- [x] **アイデア確定フロー** — `ideas.trips.confirm` / `ideas.monthly.confirm`

## バックエンド

### カレンダー表示

- [ ] **空き期間ロジックの改善** — 現在は3日以上の連続空き日をすべて返しているが、DESIGN.mdの仕様では週末（土日）または祝日を含む期間のみを空き期間として表示し、平日のみの空きは強調しない
  - `packages/api/src/usecases/vacant.ts` の `calculateVacantPeriods` を修正
  - 週末・祝日を含まない平日だけの空き期間を除外する

### 記念日

- [ ] **記念日の毎年レコード自動作成** — `eventType: 'anniversary'` の予定作成時に、表示範囲（2年分）のレコードを一括作成する
  - 例: 2025/02/14の結婚記念日 → 2025, 2026, 2027年分を作成
  - `packages/api/src/usecases/events.ts` の `createEvent` に特殊処理を追加

### 日程提案

- [ ] **提案の最大件数を5件に変更** — DESIGN.mdでは最大5件だが現在は3件
  - `packages/api/src/usecases/destinations.ts` の `MAX_SUGGESTIONS` を `5` に変更

- [ ] **提案ラベルの改善** — 現在は「連休」か「X月」のみ。「週末」「3連休」「祝日含む」などの自動生成ラベルを実装する
  - `packages/api/src/usecases/destinations.ts` の `buildSuggestions` を修正

## フロントエンド

### カレンダー画面

- [ ] **カレンダー表示の粒度切り替え** — 現在はフラットなカードリスト。DESIGN.mdでは距離に応じて表示粒度を変える
  - 直近3ヶ月: 週単位表示（1週間ごとに行を分けて表示）
  - 4ヶ月〜1年先: 月単位表示（1ヶ月を1行で圧縮表示）
  - 1年〜2年先: 月単位の圧縮表示
  - `packages/web/src/routes/f/$familyId/index.tsx` を大幅リファクタ

- [ ] **月ヘッダーのタップでアイデア追加** — 月ヘッダーをタップするとアイデア追加モーダル（「この月に〇〇したい」）を表示する
  - カレンダー表示の粒度切り替え実装後に対応

- [ ] **カレンダーアイテムのアイコン・記号表示** — 現在はカラーバッジ。DESIGN.mdのアイコン凡例に近づける
  - ★ 記念日 / 🎌 祝日 / 💡 アイデア / ✨ 空き期間 / ■ ブロック期間
  - 予定種別（trip/anniversary/school/personal/other）ごとの視覚的区別

### 予定追加

- [ ] **空き期間タップ時に行き先ストックから選択** — 予定追加モーダルで「行き先ストックから選ぶ」オプションを表示する
  - 行き先の名前・必要日数を表示し、選択すると旅行予定として作成
  - `packages/web/src/routes/f/$familyId/index.tsx` または予定追加モーダルを修正

## 設計検討

- [ ] **祝日データソースの検討** — 現在はアルゴリズムで算出しているが、DESIGN.mdでは [holiday-jp](https://github.com/holiday-jp/holiday_jp) のJSONから静的取得を想定。現状のアルゴリズム方式で正確に動作しているため優先度低
- [ ] **TypeSQL導入の検討** — 現在はraw SQLを直接記述。TypeSQL導入で型安全なクエリ生成が可能になるが、現時点では規模が小さく優先度低
