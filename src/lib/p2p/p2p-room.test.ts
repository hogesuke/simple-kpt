import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { addItem, MAX_DOC_BYTES, moveItem, setTimer } from './kpt-doc';
import { isSameDocState, P2PRoom, readExported, readRoomTime } from './p2p-room';

describe('isSameDocState', () => {
  it('同じ状態を持つY.Docは、更新を受け取った順序が異なっても同じと判定すること', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.getMap('items').set('a', 1);
    b.getMap('items').set('b', 2);
    // 互いの更新を逆の順序で適用する
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b));
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a));

    expect(isSameDocState(Y.snapshot(a), Y.snapshot(b))).toBe(true);
  });

  it('追加や変更があった場合は異なると判定すること', () => {
    const doc = new Y.Doc();
    doc.getMap('items').set('a', 1);
    const before = Y.snapshot(doc);
    doc.getMap('items').set('b', 2);

    expect(isSameDocState(Y.snapshot(doc), before)).toBe(false);
  });

  it('削除があった場合も異なると判定すること', () => {
    const doc = new Y.Doc();
    doc.getMap('items').set('a', new Y.Map());
    doc.getMap('votes').set('v', { itemId: 'a', userId: 'u', nickname: 'U' });
    const before = Y.snapshot(doc);
    doc.getMap('items').delete('a');

    expect(isSameDocState(Y.snapshot(doc), before)).toBe(false);

    const afterItemDelete = Y.snapshot(doc);
    doc.getMap('votes').delete('v');
    expect(isSameDocState(Y.snapshot(doc), afterItemDelete)).toBe(false);
  });

  it('他の参加者の更新をまだ受信していない場合は異なると判定すること', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.getMap('items').set('a', 1);
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
    a.getMap('items').delete('a');

    expect(isSameDocState(Y.snapshot(b), Y.snapshot(a))).toBe(false);
  });
});

describe('readExported', () => {
  it('不正な形式のエクスポート通知は無視すること', () => {
    expect(readExported(null)).toBeNull();
    expect(readExported({ snapshot: 123 })).toBeNull();
    expect(readExported({ snapshot: '!!!不正なBase64' })).toBeNull();
    expect(readExported({ snapshot: btoa('\xff\xff\xff\xff') })).toBeNull();
  });
});

describe('readRoomTime', () => {
  const NOW = 1_700_000_000_000;

  it('自分の時計との差が許容範囲内のルーム時刻を受け付けること', () => {
    expect(readRoomTime({ roomTime: NOW + 5 * 60 * 1000 }, NOW)).toBe(NOW + 5 * 60 * 1000);
  });

  it('相手が未同期の場合はnullを返すこと', () => {
    expect(readRoomTime({ roomTime: null }, NOW)).toBeNull();
  });

  it('数値でない値や有限でない値はnullを返すこと', () => {
    expect(readRoomTime({ roomTime: '1' }, NOW)).toBeNull();
    expect(readRoomTime({ roomTime: Number.POSITIVE_INFINITY }, NOW)).toBeNull();
    expect(readRoomTime({ roomTime: 1e300 }, NOW)).toBeNull();
    expect(readRoomTime(null, NOW)).toBeNull();
  });

  it('自分の時計と1日以上離れた時刻はnullを返すこと', () => {
    expect(readRoomTime({ roomTime: NOW + 2 * 24 * 60 * 60 * 1000 }, NOW)).toBeNull();
  });
});

describe('readExported（エクスポート時刻）', () => {
  it('エクスポート時刻を読み出し、不正な値は0として扱うこと', () => {
    const doc = new Y.Doc();
    doc.getMap('items').set('a', 1);
    const snapshot = btoa(String.fromCharCode(...Y.encodeSnapshot(Y.snapshot(doc))));

    expect(readExported({ snapshot, nickname: 'A', exportedAt: 123 })?.exportedAt).toBe(123);
    expect(readExported({ snapshot, nickname: 'A', exportedAt: 'x' })?.exportedAt).toBe(0);
    expect(readExported({ snapshot, nickname: 'A', isSync: true })?.isSync).toBe(true);
  });
});

describe('P2PRoom（タイマーとカードの非表示）', () => {
  const createRoom = (isClockReference: boolean) =>
    new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });

  it('実行中のタイマーを返し、他の人のカードを隠すこと', () => {
    const room = createRoom(true);
    setTimer(room.doc, { startedAtRoomTime: Date.now(), durationSeconds: 60, hideOthersCards: true, startedBy: 'me' });

    const snapshot = room.getSnapshot();
    expect(snapshot.timer).not.toBeNull();
    expect(snapshot.hidesOthersCards).toBe(true);
    room.destroy();
  });

  it('未来に開始するタイマーは実行中とみなさないこと', () => {
    const room = createRoom(true);
    setTimer(room.doc, { startedAtRoomTime: Date.UTC(2099, 0, 1), durationSeconds: 1, hideOthersCards: true, startedBy: 'x' });

    const snapshot = room.getSnapshot();
    expect(snapshot.timer).toBeNull();
    expect(snapshot.hidesOthersCards).toBe(false);
    room.destroy();
  });

  it('終了したタイマーは実行中とみなさないこと', () => {
    const room = createRoom(true);
    setTimer(room.doc, { startedAtRoomTime: Date.now() - 120_000, durationSeconds: 60, hideOthersCards: true, startedBy: 'me' });

    expect(room.getSnapshot().timer).toBeNull();
    room.destroy();
  });

  it('ルーム時計の同期前は、タイマーを表示せず、他の人のカードは隠すこと', () => {
    const room = createRoom(false);
    setTimer(room.doc, { startedAtRoomTime: Date.now(), durationSeconds: 60, hideOthersCards: true, startedBy: 'other' });

    const snapshot = room.getSnapshot();
    expect(snapshot.timer).toBeNull();
    expect(snapshot.hidesOthersCards).toBe(true);
    room.destroy();
  });
});

describe('P2PRoom（ボードの容量の上限）', () => {
  it('ボードの容量が上限に近づくと、上限に達したと判定すること', () => {
    const room = new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference: true,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });
    expect(room.getSnapshot().isBoardFull).toBe(false);

    room.doc.getMap('junk').set('large', 'x'.repeat(MAX_DOC_BYTES));
    expect(room.isBoardFull()).toBe(true);
    room.destroy();
  });
});

describe('P2PRoom（他の参加者からの更新のサイズ）', () => {
  const createRoom = () =>
    new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference: true,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });
  type DocMessageHandler = (update: Uint8Array) => void;
  const receiveDoc = (room: P2PRoom, update: Uint8Array) => {
    // 受信処理を直接呼び出す（ネットワークには接続しない）
    (room as unknown as { handleRemoteDoc: DocMessageHandler }).handleRemoteDoc(update);
  };

  it('すでに持っている内容を含む全状態は、重複分を数えずに受け付けること', () => {
    const room = createRoom();
    const source = new Y.Doc();
    source.getMap('meta').set('name', 'x'.repeat(1.1 * 1024 * 1024));
    receiveDoc(room, Y.encodeStateAsUpdate(source));
    // 再接続時と同じく、同じ全状態がもう一度届く
    source.getMap('meta').set('note', '追加');
    receiveDoc(room, Y.encodeStateAsUpdate(source));

    expect(room.doc.getMap('meta').get('note')).toBe('追加');
    expect(room.getSnapshot().isBoardFull).toBe(false);
    room.destroy();
  });

  it('依存する更新が欠けた大きな更新は保留せずに破棄し、上限に達したと判定すること', () => {
    const room = createRoom();
    const source = new Y.Doc();
    source.getMap('junk').set('first', 'a');
    const before = Y.encodeStateVector(source);
    source.getMap('junk').set('large', 'x'.repeat(512 * 1024));
    // 最初の更新を送らず、後半の更新だけを送る
    receiveDoc(room, Y.encodeStateAsUpdate(source, before));

    expect((room.doc.store as unknown as { pendingStructs: unknown }).pendingStructs).toBeNull();
    expect(room.isBoardFull()).toBe(true);
    room.destroy();
  });
});

describe('P2PRoom（ボード全体のサイズの見積もり）', () => {
  it('削除で項目を細かく分割されても、見積もりが実際のサイズを下回らないこと', () => {
    const room = new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference: true,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });
    const receive = (update: Uint8Array) => (room as unknown as { handleRemoteDoc: (update: Uint8Array) => void }).handleRemoteDoc(update);
    const source = new Y.Doc();
    source.on('update', (update: Uint8Array) => receive(update));

    const text = source.getText('junk');
    text.insert(0, 'x'.repeat(20000));
    // 1文字おきに削除して、項目を1文字ずつに分割する
    source.transact(() => {
      for (let i = 19998; i >= 0; i -= 2) text.delete(i, 1);
    });

    const actualBytes = Y.encodeStateAsUpdate(room.doc).byteLength;
    expect((room as unknown as { estimatedDocBytes: number }).estimatedDocBytes).toBeGreaterThanOrEqual(actualBytes);
    room.destroy();
  });
});

describe('P2PRoom（ボードに書き込む参加者の数）', () => {
  const createRoom = () =>
    new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference: true,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });
  /** 多数の参加者（clientID）からそれぞれ別のキーに書き込んだ更新を作る */
  const createManyClientsUpdate = (count: number) => {
    const updates: Uint8Array[] = [];
    for (let i = 0; i < count; i++) {
      const doc = new Y.Doc();
      doc.clientID = i + 1;
      doc.getMap('x').set(`k${i}`, i);
      updates.push(Y.encodeStateAsUpdate(doc));
    }
    return Y.mergeUpdates(updates);
  };

  it('参加者が多すぎるボードになる更新は適用せず、上限に達したと判定すること', () => {
    const room = createRoom();
    (room as unknown as { handleRemoteDoc: (update: Uint8Array) => void }).handleRemoteDoc(createManyClientsUpdate(6000));

    expect(room.doc.getMap('x').size).toBe(0);
    expect(room.isBoardFull()).toBe(true);
    room.destroy();
  });

  it('参加者が多すぎる保存データは復元しないこと', () => {
    const room = createRoom();

    expect(room.restore(createManyClientsUpdate(6000))).toBe(false);
    expect(room.doc.getMap('x').size).toBe(0);
    room.destroy();
  });

  it('参加者の数が上限に近づくと、自分の変更を止めること', () => {
    const room = createRoom();
    (room as unknown as { handleRemoteDoc: (update: Uint8Array) => void }).handleRemoteDoc(createManyClientsUpdate(4600));

    expect(room.doc.getMap('x').size).toBe(4600);
    expect(room.isBoardFull()).toBe(true);
    room.destroy();
  });

  it('上限以内の参加者の更新は適用すること', () => {
    const room = createRoom();
    (room as unknown as { handleRemoteDoc: (update: Uint8Array) => void }).handleRemoteDoc(createManyClientsUpdate(100));

    expect(room.doc.getMap('x').size).toBe(100);
    expect(room.isBoardFull()).toBe(false);
    room.destroy();
  });
});

describe('P2PRoom（同じ位置への挿入）', () => {
  const createRoom = () =>
    new P2PRoom({
      roomId: 'room',
      secret: 'secret',
      userId: 'me',
      nickname: '自分',
      isClockReference: true,
      signalingRoomKey: 'key',
      signalingRoomUrl: 'ws://localhost/rooms/key',
    });
  const receive = (room: P2PRoom, update: Uint8Array) =>
    (room as unknown as { handleRemoteDoc: (update: Uint8Array) => void }).handleRemoteDoc(update);

  it('同じ位置に多数の項目を挿入する更新は、適用せずに上限に達したと判定すること', () => {
    const room = createRoom();
    const base = new Y.Doc();
    base.getText('junk').insert(0, 'a');
    const baseUpdate = Y.encodeStateAsUpdate(base);
    receive(room, baseUpdate);

    // 多数の参加者が、同じ文字の直後に並行して1文字ずつ挿入した更新を作る（すべて同じ左隣を持つ）
    const sameOriginUpdates: Uint8Array[] = [];
    for (let i = 0; i < 40; i++) {
      const doc = new Y.Doc();
      doc.clientID = 100 + i;
      Y.applyUpdate(doc, baseUpdate);
      const before = Y.encodeStateVector(doc);
      doc.getText('junk').insert(1, 'x');
      sameOriginUpdates.push(Y.encodeStateAsUpdate(doc, before));
    }
    receive(room, Y.mergeUpdates(sameOriginUpdates));

    expect(room.doc.getText('junk').length).toBe(1);
    expect(room.isBoardFull()).toBe(true);
    room.destroy();
  });

  it('依存する更新が欠けて保留になった項目を、後から全状態が届いたときに2重に数えないこと', () => {
    const room = createRoom();
    const source = new Y.Doc();
    const itemId = addItem(source, { column: 'keep', text: 'カード', authorId: 'a', authorNickname: 'A' });
    receive(room, Y.encodeStateAsUpdate(source));
    // roomが取りこぼす変更
    setTimer(source, null);
    const base = Y.encodeStateAsUpdate(source);

    // 20人が同じカードを同時に移動する（roomには取りこぼした変更に依存するため保留になる）
    const docs = Array.from({ length: 20 }, (_, i) => {
      const doc = new Y.Doc();
      Y.applyUpdate(doc, base);
      const before = Y.encodeStateVector(doc);
      setTimer(doc, null);
      moveItem(doc, itemId, { column: 'try', position: i });
      receive(room, Y.encodeStateAsUpdate(doc, before));
      return doc;
    });
    // 取りこぼした変更を含む全状態が届く
    const merged = new Y.Doc();
    Y.applyUpdate(merged, base);
    for (const doc of docs) Y.applyUpdate(merged, Y.encodeStateAsUpdate(doc));
    receive(room, Y.encodeStateAsUpdate(merged));

    expect(room.isBoardFull()).toBe(false);
    expect((room.doc.store as unknown as { pendingStructs: unknown }).pendingStructs).toBeNull();
    room.destroy();
  });

  it('通常の操作による更新や、参加時に届く全状態は受け付けること', () => {
    const room = createRoom();
    const source = new Y.Doc();
    for (let i = 0; i < 200; i++) {
      addItem(source, { column: 'keep', text: `カード${i}`, authorId: 'a', authorNickname: 'A' });
    }
    receive(room, Y.encodeStateAsUpdate(source));
    // 同じ全状態がもう一度届いても数え直さない
    receive(room, Y.encodeStateAsUpdate(source));
    // 同じ項目を何度も編集する
    const [itemId] = [...source.getMap('items').keys()];
    for (let i = 0; i < 100; i++) {
      const before = Y.encodeStateVector(source);
      (source.getMap('items').get(itemId) as Y.Map<unknown>).set('text', `編集${i}`);
      receive(room, Y.encodeStateAsUpdate(source, before));
    }

    expect(room.doc.getMap('items').size).toBe(200);
    expect(room.isBoardFull()).toBe(false);
    room.destroy();
  });
});
