# パフォーマンス診断結果

診断日: 2026-01-31

アプリケーション全体を分析した結果、以下の改善点が見つかりました。

---

## 高優先度（すぐに効果が出るもの）

### 1. useCallback不足

#### ItemDetailPanel.tsx:82-113

- `handleStatusChange`, `handleAssigneeChange`, `handleDueDateChange`, `handleSaveEdit`がmemoizedされていない
- 毎レンダーで再生成され、子コンポーネントの不要な再レンダーを引き起こす

#### DemoBoard.tsx:169-211

- `handleAddCard`, `handleDeleteItem`等がmemoizedされていない

#### BoardColumn.tsx:47-74

- `checkScrollability`関数がmemoizedされていない
- ResizeObserverとスクロールリスナーが頻繁に再作成される

### 2. useMemo不足

#### KPTCard.tsx:86-111

- `parseTextWithHashtags()`が毎回レンダー時に実行される
- 正規表現操作は計算コストが高い
- 修正例:

```typescript
const parts = useMemo(() => parseTextWithHashtags(text), [text]);
```

### 3. React.memo不足

#### SortableKPTCard

- 親からのコールバックを受け取るが、React.memoでラップされていない
- 1つのカードが変更されると全カードが再レンダーされる

#### FilterBar.tsx:16-32

- フィルターが変更されていなくても再レンダーされる

---

## 中優先度

### 4. 計算のmemoization不足

#### StatsSummary.tsx:248-251

```typescript
const keepMax = Math.max(...keepWeeklyData.map((d) => d.cumulativeCount), 0);
const problemMax = Math.max(...problemWeeklyData.map((d) => d.cumulativeCount), 0);
const tryMax = Math.max(...tryWeeklyData.map((d) => Math.max(d.cumulativeCount, d.cumulativeCompletedCount)), 0);
const yAxisMax = Math.max(keepMax, problemMax, tryMax, 1);
```

- 配列を複数回spreadして毎レンダーで計算
- useMemoでラップすべき

#### StatsSummary.tsx:23-41

- `generateEmptyWeeklyData`と`generateEmptyTryWeeklyData`が毎回新しい配列を生成
- periodを依存配列としてuseMemoでラップすべき

### 5. Zustandストアセレクタの問題

#### KPTBoard.tsx:32-52

- 11個以上の個別セレクタを使用

```typescript
const board = useBoardStore((state) => state.currentBoard);
const items = useBoardStore((state) => state.items);
const selectedItem = useBoardStore((state) => state.selectedItem);
// ... 続く
```

- 各セレクタの変更で再レンダーが発生
- 複合セレクタを作成すべき:

```typescript
export const selectBoardData = (state: BoardState) => ({
  board: state.currentBoard,
  items: state.items,
  isLoading: state.isLoading,
});
```

#### KPTBoardColumns.tsx:25-28

- 同様に個別セレクタを使用

### 6. リスト仮想化の欠如

#### TryItemsTable.tsx:96-148

- ページネーション後に100+アイテムになる可能性があるが仮想化なし
- `react-window`や`react-virtual`の導入を検討

#### BoardColumn.tsx:88-104

- 忙しいKPTセッションでは50+アイテムになる可能性
- 仮想化またはページネーションを検討

### 7. Context Providerの問題

#### BoardProvider.tsx:61-102

- useMemoが14+の値に依存
- いずれかの状態変更で全コンシューマーが再レンダー
- Contextを分割すべき: `ItemsContext`, `FilterContext`, `TimerContext`

---

## 低優先度

### 8. インラインオブジェクト/配列

#### Home.tsx:213

- Userアイコンがインラインで生成

```typescript
<FilterChip icon={<User className="h-3 w-3" />} .../>
```

### 9. 大きなコンポーネントファイル

#### ItemDetailPanel.tsx (402行)

複数の関心事が混在:

- 編集モード切り替え
- テキスト編集とバリデーション
- ステータス選択
- 担当者選択
- 期日ピッカー
- 投票トグル

分割候補:

- `ItemEditSection` (215-293行)
- `ItemTryDetailsSection` (297-374行)
- `ItemMetaSection` (377-396行)

#### StatsSummary.tsx (304行)

- 3つのサブコンポーネントが同一ファイルに定義
- 別ファイルに抽出すべき: `StatsCardContainer.tsx`, `SimpleStatsCard.tsx`, `TryStatsCard.tsx`

### 10. デバウンスの欠如

#### Home.tsx:81-94

- フィルター変更時に即座に`loadTryItems`が実行される
- リクエストの重複排除やデバウンスがない

---

## 対応優先順位

### Phase 1: クイックウィン

1. [x] KPTCard.tsx - parseTextWithHashtagsをuseMemoでラップ
2. [x] ItemDetailPanel.tsx - ハンドラーをuseCallbackでラップ
3. [x] SortableKPTCard - React.memoでラップ
4. [x] FilterBar.tsx - React.memoでラップ

### Phase 2: 中程度のインパクト

1. [x] StatsSummary.tsx - 計算処理をuseMemoでラップ
2. [ ] useBoardStore - 複合セレクタを作成
3. [ ] BoardColumn.tsx - checkScrollabilityをuseCallbackでラップ
4. [ ] DemoBoard.tsx - ハンドラーをuseCallbackでラップ

### Phase 3: 大規模改善

1. [ ] TryItemsTable/BoardColumn - リスト仮想化の導入
2. [ ] BoardProvider - Context分割
3. [ ] ItemDetailPanel/StatsSummary - コンポーネント分割

---

## 参考: パフォーマンスパターンまとめ

| パターン               | 場所                                              | 重要度 | 件数 |
| ---------------------- | ------------------------------------------------- | ------ | ---- |
| useCallback不足        | ItemDetailPanel, DemoBoard, KPTBoard, BoardColumn | 高     | 8+   |
| useMemo不足            | StatsSummary, KPTCard, item-selectors             | 高     | 5+   |
| React.memo不足         | SortableKPTCard, FilterBar, Stats components      | 高     | 4+   |
| ストアセレクタ問題     | KPTBoard, KPTBoardColumns                         | 中     | 2    |
| リスト仮想化なし       | TryItemsTable, BoardColumn                        | 中     | 2    |
| 複雑なContext          | BoardProvider                                     | 中     | 1    |
| インラインオブジェクト | Home, Timer, KPTCard                              | 低     | 3+   |
| 高コスト計算           | StatsSummary, item-selectors                      | 中     | 3    |
| 大きなファイル         | ItemDetailPanel, StatsSummary                     | 中     | 2    |
