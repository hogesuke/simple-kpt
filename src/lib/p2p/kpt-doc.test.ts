import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { ITEM_TEXT_MAX_LENGTH, MAX_ITEMS_PER_BOARD } from '@shared/constants';

import {
  addItem,
  deleteItem,
  initializeBoard,
  ItemLimitExceededError,
  moveItem,
  readSnapshot,
  renameParticipant,
  setTimer,
  toggleVote,
  updateItem,
} from './kpt-doc';

const USER_A = 'user-a';
const USER_B = 'user-b';

/** 2つのY.Docを相互に同期する */
function syncDocs(a: Y.Doc, b: Y.Doc): void {
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b));
}

function createDocPair(): [Y.Doc, Y.Doc] {
  const a = new Y.Doc();
  const b = new Y.Doc();
  initializeBoard(a, { name: 'テストボード' });
  syncDocs(a, b);
  return [a, b];
}

describe('initializeBoard', () => {
  it('ボード名を設定すること', () => {
    const doc = new Y.Doc();
    initializeBoard(doc, { name: 'テストボード' });
    expect(readSnapshot(doc, USER_A).name).toBe('テストボード');
  });

  it('初期化済みの場合はボード名を上書きしないこと', () => {
    const doc = new Y.Doc();
    initializeBoard(doc, { name: '最初の名前' });
    initializeBoard(doc, { name: '別の名前' });
    expect(readSnapshot(doc, USER_A).name).toBe('最初の名前');
  });

  it('ボードファイルのアイテムと投票を取り込むこと', () => {
    const doc = new Y.Doc();
    initializeBoard(doc, {
      name: '前回のボード',
      items: [
        {
          column: 'try',
          text: '前回のTry',
          position: 1000,
          authorId: USER_A,
          authorNickname: 'A',
          createdAt: '2026-10-01T10:00:00.000Z',
          updatedAt: null,
          status: 'in_progress',
          assigneeId: USER_B,
          assigneeNickname: 'B',
          dueDate: '2026-10-31',
          voters: [{ userId: USER_B, nickname: 'B' }],
        },
      ],
    });

    const [item] = readSnapshot(doc, USER_B).items;
    expect(item).toMatchObject({
      column: 'try',
      text: '前回のTry',
      authorId: USER_A,
      status: 'in_progress',
      assigneeNickname: 'B',
      dueDate: '2026-10-31',
      voteCount: 1,
      hasVoted: true,
    });
  });
});

describe('addItem', () => {
  it('カラムの末尾にアイテムを追加すること', () => {
    const doc = new Y.Doc();
    addItem(doc, { column: 'keep', text: '1つ目', authorId: USER_A, authorNickname: 'A' });
    addItem(doc, { column: 'keep', text: '2つ目', authorId: USER_A, authorNickname: 'A' });

    const items = readSnapshot(doc, USER_A).items;
    expect(items.map((i) => i.text)).toEqual(['1つ目', '2つ目']);
    expect(items[1].position).toBeGreaterThan(items[0].position);
  });

  it('Tryカラムのアイテムのステータスをpendingにすること', () => {
    const doc = new Y.Doc();
    addItem(doc, { column: 'try', text: 'やること', authorId: USER_A, authorNickname: 'A' });
    expect(readSnapshot(doc, USER_A).items[0].status).toBe('pending');
  });

  it('アイテム数が上限に達している場合はエラーになること', () => {
    const doc = new Y.Doc();
    for (let i = 0; i < MAX_ITEMS_PER_BOARD; i++) {
      addItem(doc, { column: 'keep', text: `${i}`, authorId: USER_A, authorNickname: 'A' });
    }
    expect(() => addItem(doc, { column: 'keep', text: '超過', authorId: USER_A, authorNickname: 'A' })).toThrow(ItemLimitExceededError);
  });

  it('同時に追加したアイテムが両方とも残ること', () => {
    const [a, b] = createDocPair();
    addItem(a, { column: 'keep', text: 'Aの追加', authorId: USER_A, authorNickname: 'A' });
    addItem(b, { column: 'keep', text: 'Bの追加', authorId: USER_B, authorNickname: 'B' });
    syncDocs(a, b);

    expect(
      readSnapshot(a, USER_A)
        .items.map((i) => i.text)
        .sort()
    ).toEqual(['Aの追加', 'Bの追加']);
    expect(readSnapshot(b, USER_B).items).toHaveLength(2);
  });
});

describe('updateItem', () => {
  it('アイテムを更新すること', () => {
    const doc = new Y.Doc();
    addItem(doc, { column: 'keep', text: '更新前', authorId: USER_A, authorNickname: 'A' });
    const item = readSnapshot(doc, USER_A).items[0];

    updateItem(doc, { ...item, text: '更新後' });

    const updated = readSnapshot(doc, USER_A).items[0];
    expect(updated.text).toBe('更新後');
    expect(updated.updatedAt).toBeDefined();
  });

  it('別の項目を同時に更新した場合、両方の変更が残ること', () => {
    const [a, b] = createDocPair();
    addItem(a, { column: 'try', text: '元のテキスト', authorId: USER_A, authorNickname: 'A' });
    syncDocs(a, b);
    const item = readSnapshot(a, USER_A).items[0];

    updateItem(a, { ...item, text: 'Aが編集' });
    updateItem(b, { ...item, status: 'in_progress' });
    syncDocs(a, b);

    const merged = readSnapshot(a, USER_A).items[0];
    expect(merged.text).toBe('Aが編集');
    expect(merged.status).toBe('in_progress');
  });

  it('存在しないアイテムの更新は無視すること', () => {
    const doc = new Y.Doc();
    updateItem(doc, { id: 'unknown', boardId: '', column: 'keep', text: 'x', position: 0, authorId: null });
    expect(readSnapshot(doc, USER_A).items).toHaveLength(0);
  });
});

describe('deleteItem', () => {
  it('アイテムとその投票を削除すること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: '削除対象', authorId: USER_A, authorNickname: 'A' });
    toggleVote(doc, id, USER_A, 'A');

    deleteItem(doc, id);

    expect(readSnapshot(doc, USER_A).items).toHaveLength(0);
    expect(doc.getMap('votes').size).toBe(0);
  });
});

describe('toggleVote', () => {
  it('投票と取り消しを切り替えること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: '投票対象', authorId: USER_A, authorNickname: 'A' });

    toggleVote(doc, id, USER_A, 'A');
    let item = readSnapshot(doc, USER_A).items[0];
    expect(item.voteCount).toBe(1);
    expect(item.hasVoted).toBe(true);
    expect(item.voters).toEqual([{ id: USER_A, nickname: 'A' }]);

    toggleVote(doc, id, USER_A, 'A');
    item = readSnapshot(doc, USER_A).items[0];
    expect(item.voteCount).toBe(0);
    expect(item.hasVoted).toBe(false);
  });

  it('複数人が同時に投票した場合、全員の投票が残ること', () => {
    const [a, b] = createDocPair();
    const id = addItem(a, { column: 'keep', text: '投票対象', authorId: USER_A, authorNickname: 'A' });
    syncDocs(a, b);

    toggleVote(a, id, USER_A, 'A');
    toggleVote(b, id, USER_B, 'B');
    syncDocs(a, b);

    expect(readSnapshot(a, USER_A).items[0].voteCount).toBe(2);
    expect(readSnapshot(b, USER_B).items[0].hasVoted).toBe(true);
  });
});

describe('setTimer', () => {
  it('タイマーの設定と停止ができること', () => {
    const doc = new Y.Doc();
    const timer = { startedAtRoomTime: Date.UTC(2026, 9, 12, 10, 0), durationSeconds: 180, hideOthersCards: true, startedBy: USER_A };

    setTimer(doc, timer);
    expect(readSnapshot(doc, USER_A).timer).toEqual(timer);

    setTimer(doc, null);
    expect(readSnapshot(doc, USER_A).timer).toBeNull();
  });
});

describe('renameParticipant', () => {
  it('自分が作成したカード・担当しているTry・投票の名前を書き換えること', () => {
    const doc = new Y.Doc();
    const myItemId = addItem(doc, { column: 'try', text: '自分のTry', authorId: USER_A, authorNickname: 'A' });
    const otherItemId = addItem(doc, { column: 'try', text: '他の人のTry', authorId: USER_B, authorNickname: 'B' });
    const otherItem = readSnapshot(doc, USER_A).items.find((i) => i.id === otherItemId)!;
    updateItem(doc, { ...otherItem, assigneeId: USER_A, assigneeNickname: 'A' });
    toggleVote(doc, otherItemId, USER_A, 'A');
    toggleVote(doc, otherItemId, USER_B, 'B');

    renameParticipant(doc, USER_A, '新しいA');

    const items = readSnapshot(doc, USER_A).items;
    const myItem = items.find((i) => i.id === myItemId)!;
    const renamedOther = items.find((i) => i.id === otherItemId)!;
    expect(myItem.authorNickname).toBe('新しいA');
    expect(renamedOther.authorNickname).toBe('B');
    expect(renamedOther.assigneeNickname).toBe('新しいA');
    expect(renamedOther.voters).toEqual(
      expect.arrayContaining([
        { id: USER_A, nickname: '新しいA' },
        { id: USER_B, nickname: 'B' },
      ])
    );
  });

  it('名前の変更ではカードの更新日時を変えないこと', () => {
    const doc = new Y.Doc();
    addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });

    renameParticipant(doc, USER_A, '新しいA');

    expect(readSnapshot(doc, USER_A).items[0].updatedAt).toBeUndefined();
  });

  it('名前の変更と他の参加者によるカードの編集が両方残ること', () => {
    const [a, b] = createDocPair();
    addItem(a, { column: 'keep', text: '元のテキスト', authorId: USER_A, authorNickname: 'A' });
    syncDocs(a, b);
    const item = readSnapshot(b, USER_B).items[0];

    renameParticipant(a, USER_A, '新しいA');
    updateItem(b, { ...item, text: 'Bが編集' });
    syncDocs(a, b);

    expect(readSnapshot(a, USER_A).items[0]).toMatchObject({ authorNickname: '新しいA', text: 'Bが編集' });
  });
});

describe('他の参加者から届く不正なデータ', () => {
  it('不正な形式のアイテム・投票・タイマーが書き込まれても、読み出しで例外を出さずに無視すること', () => {
    const doc = new Y.Doc();
    initializeBoard(doc, { name: 'ボード' });
    const id = addItem(doc, { column: 'keep', text: '正常なカード', authorId: USER_A, authorNickname: 'A' });

    // 細工したクライアントが直接書き込む値を再現する
    doc.getMap('items').set('not-a-map', 'string');
    const broken = new Y.Map<unknown>();
    doc.getMap('items').set('broken', broken);
    broken.set('column', 'unknown');
    doc.getMap('votes').set('null-vote', null);
    doc.getMap('votes').set('object-vote', { itemId: { nested: true }, userId: 1 });
    doc.getMap('meta').set('timer', { startedAtRoomTime: 'x', durationSeconds: 60 });
    doc.getMap('meta').set('name', { evil: true });

    const snapshot = readSnapshot(doc, USER_A);
    expect(snapshot.items.map((i) => i.id)).toEqual([id]);
    expect(snapshot.timer).toBeNull();
    expect(snapshot.name).toBe('');
    expect(() => deleteItem(doc, id)).not.toThrow();
    expect(() => renameParticipant(doc, USER_A, '新しい名前')).not.toThrow();
    expect(() => addItem(doc, { column: 'keep', text: '追加', authorId: USER_A, authorNickname: 'A' })).not.toThrow();
  });

  it('不正な型や長すぎる値を、安全な値に置き換えること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'try', text: 'カード', authorId: USER_A, authorNickname: 'A' });
    const itemMap = doc.getMap('items').get(id) as Y.Map<unknown>;
    itemMap.set('text', 'あ'.repeat(10000));
    itemMap.set('position', Number.NaN);
    itemMap.set('status', 'hacked');
    itemMap.set('dueDate', '<script>');
    itemMap.set('authorNickname', 123);

    const [item] = readSnapshot(doc, USER_A).items;
    expect(item.text.length).toBe(ITEM_TEXT_MAX_LENGTH);
    expect(item.position).toBe(0);
    expect(item.status).toBeNull();
    expect(item.dueDate).toBeNull();
    expect(item.authorNickname).toBeNull();
  });

  it('上限を超えるアイテムが書き込まれても、上限までしか読み出さないこと', () => {
    const doc = new Y.Doc();
    doc.transact(() => {
      for (let i = 0; i < MAX_ITEMS_PER_BOARD + 50; i++) {
        const itemMap = new Y.Map<unknown>();
        doc.getMap('items').set(`item-${i}`, itemMap);
        itemMap.set('column', 'keep');
        itemMap.set('text', `${i}`);
        itemMap.set('position', i);
      }
    });

    expect(readSnapshot(doc, USER_A).items).toHaveLength(MAX_ITEMS_PER_BOARD);
  });

  it('キーと内容が一致しない投票や、存在しないアイテムへの投票は数えないこと', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });
    doc.getMap('votes').set('dup-1', { itemId: id, userId: USER_B, nickname: 'B' });
    doc.getMap('votes').set(`missing:${USER_B}`, { itemId: 'missing', userId: USER_B, nickname: 'B' });

    expect(readSnapshot(doc, USER_A).items[0].voteCount).toBe(0);
  });

  it('不正な投票が大量に先に書き込まれていても、後からの投票を数えること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });
    doc.transact(() => {
      for (let i = 0; i < 30000; i++) {
        doc.getMap('votes').set(`missing:user-${i}`, { itemId: 'missing', userId: `user-${i}`, nickname: 'x' });
      }
    });
    toggleVote(doc, id, USER_B, 'B');

    expect(readSnapshot(doc, USER_A).items[0].voteCount).toBe(1);
    // カードを削除すると、存在しないアイテムへの投票も片付ける
    const other = addItem(doc, { column: 'keep', text: '削除', authorId: USER_A, authorNickname: 'A' });
    deleteItem(doc, other);
    expect(doc.getMap('votes').size).toBe(1);
  });
});

describe('moveItem', () => {
  it('カラムと位置を変更し、Tryに移動した場合はステータスを未対応にすること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });

    moveItem(doc, id, { column: 'try', position: 500 });

    const [item] = readSnapshot(doc, USER_A).items;
    expect(item.column).toBe('try');
    // 位置には前後のカードとの間隔の±5%以内の揺らぎが加わる
    expect(item.position).toBeGreaterThan(450);
    expect(item.position).toBeLessThan(550);
    expect(item.status).toBe('pending');
  });

  it('ドラッグ中に他の参加者が行った編集を上書きしないこと', () => {
    const [a, b] = createDocPair();
    const id = addItem(a, { column: 'try', text: '元のテキスト', authorId: USER_A, authorNickname: 'A' });
    syncDocs(a, b);
    const item = readSnapshot(a, USER_A).items[0];

    // Bがカードを掴んでいる間に、Aがテキストとステータスを変更する
    updateItem(a, { ...item, text: 'Aが編集', status: 'done' });
    syncDocs(a, b);
    moveItem(b, id, { column: 'try', position: 3000 });
    syncDocs(a, b);

    expect(readSnapshot(a, USER_A).items[0]).toMatchObject({ text: 'Aが編集', status: 'done' });
  });

  it('同じ位置に移動したカードどうしの位置が重ならず、前後のカードの間に収まること', () => {
    const doc = new Y.Doc();
    const first = addItem(doc, { column: 'keep', text: '1', authorId: USER_A, authorNickname: 'A' });
    const second = addItem(doc, { column: 'keep', text: '2', authorId: USER_A, authorNickname: 'A' });
    const firstPosition = readSnapshot(doc, USER_A).items.find((i) => i.id === first)!.position;
    const secondPosition = readSnapshot(doc, USER_A).items.find((i) => i.id === second)!.position;
    const middle = (firstPosition + secondPosition) / 2;

    const movedA = addItem(doc, { column: 'problem', text: 'A', authorId: USER_A, authorNickname: 'A' });
    const movedB = addItem(doc, { column: 'problem', text: 'B', authorId: USER_A, authorNickname: 'A' });
    moveItem(doc, movedA, { column: 'keep', position: middle });
    moveItem(doc, movedB, { column: 'keep', position: middle });

    const positions = readSnapshot(doc, USER_A)
      .items.filter((i) => i.column === 'keep')
      .map((i) => i.position);
    expect(new Set(positions).size).toBe(4);
    expect(
      readSnapshot(doc, USER_A)
        .items.filter((i) => i.column === 'keep')
        .map((i) => i.text)
    ).toEqual(expect.arrayContaining(['1', '2', 'A', 'B']));
    const keepTexts = readSnapshot(doc, USER_A)
      .items.filter((i) => i.column === 'keep')
      .map((i) => i.text);
    expect(keepTexts[0]).toBe('1');
    expect(keepTexts[3]).toBe('2');
  });

  it('同時に追加したカードの位置が重ならないこと', () => {
    const [a, b] = createDocPair();
    addItem(a, { column: 'keep', text: 'A', authorId: USER_A, authorNickname: 'A' });
    addItem(b, { column: 'keep', text: 'B', authorId: USER_B, authorNickname: 'B' });
    syncDocs(a, b);

    const positions = readSnapshot(a, USER_A).items.map((i) => i.position);
    expect(positions[0]).not.toBe(positions[1]);
  });
});

describe('他の参加者から届く不正なデータ（2回目のレビューの指摘）', () => {
  it('日時に変換できない極端なタイマーの開始時刻は無視すること', () => {
    const doc = new Y.Doc();
    setTimer(doc, { startedAtRoomTime: 1e16, durationSeconds: 60, hideOthersCards: false, startedBy: USER_A });
    expect(readSnapshot(doc, USER_A).timer).toBeNull();
  });

  it('実在しない期日は無視すること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'try', text: 'Try', authorId: USER_A, authorNickname: 'A' });
    const itemMap = doc.getMap('items').get(id) as Y.Map<unknown>;

    itemMap.set('dueDate', '2026-13-45');
    expect(readSnapshot(doc, USER_A).items[0].dueDate).toBeNull();
    itemMap.set('dueDate', '2026-02-30');
    expect(readSnapshot(doc, USER_A).items[0].dueDate).toBeNull();
    itemMap.set('dueDate', '2026-02-28');
    expect(readSnapshot(doc, USER_A).items[0].dueDate).toBe('2026-02-28');
  });

  it('表示されない不正なエントリが大量にあっても、カードを追加できること', () => {
    const doc = new Y.Doc();
    doc.transact(() => {
      for (let i = 0; i < MAX_ITEMS_PER_BOARD; i++) {
        doc.getMap('items').set(`invalid-${i}`, 'not-a-map');
      }
    });

    expect(() => addItem(doc, { column: 'keep', text: '追加', authorId: USER_A, authorNickname: 'A' })).not.toThrow();
  });

  it('カードを削除すると不正なエントリも片付けること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: '削除', authorId: USER_A, authorNickname: 'A' });
    doc.getMap('items').set('invalid', 'not-a-map');

    deleteItem(doc, id);

    expect(doc.getMap('items').size).toBe(0);
  });

  it('大量の投票が書き込まれても、読み出しが短時間で終わること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });
    doc.transact(() => {
      for (let i = 0; i < 50000; i++) {
        doc.getMap('votes').set(`${id}:user-${i}`, { itemId: id, userId: `user-${i}`, nickname: 'x' });
      }
    });

    const startedAt = performance.now();
    readSnapshot(doc, USER_A);
    expect(performance.now() - startedAt).toBeLessThan(1000);
  });
});

describe('initializeBoard（位置の振り直し）', () => {
  it('再開用ファイルの位置を、並び順を保ったままカラムごとに振り直すこと', () => {
    const doc = new Y.Doc();
    const base = {
      authorId: null,
      authorNickname: null,
      createdAt: null,
      updatedAt: null,
      status: null,
      assigneeId: null,
      assigneeNickname: null,
      dueDate: null,
      voters: [],
    };
    initializeBoard(doc, {
      name: 'ボード',
      items: [
        { ...base, column: 'keep', text: '2番目', position: 0 },
        { ...base, column: 'keep', text: '1番目', position: -5 },
        { ...base, column: 'keep', text: '3番目', position: 0 },
        { ...base, column: 'problem', text: 'Problem', position: 99999 },
      ],
    });

    const keep = readSnapshot(doc, USER_A).items.filter((i) => i.column === 'keep');
    expect(keep.map((i) => i.text)).toEqual(['1番目', '2番目', '3番目']);
    expect(keep.map((i) => i.position)).toEqual([1000, 2000, 3000]);
    expect(readSnapshot(doc, USER_A).items.find((i) => i.column === 'problem')?.position).toBe(1000);
  });
});

describe('toggleVote（不正な値）', () => {
  it('投票のキーに不正な値が入っている場合は、投票で上書きすること', () => {
    const doc = new Y.Doc();
    const id = addItem(doc, { column: 'keep', text: 'カード', authorId: USER_A, authorNickname: 'A' });
    doc.getMap('votes').set(`${id}:${USER_B}`, {});

    toggleVote(doc, id, USER_B, 'B');
    expect(readSnapshot(doc, USER_A).items[0].voteCount).toBe(1);
  });
});
