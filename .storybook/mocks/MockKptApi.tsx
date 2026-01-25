import { OwnedBoard } from '@/lib/kpt-api';

/**
 * Storybook用のモック所有ボードデータ
 */
export const mockOwnedBoards: OwnedBoard[] = [
  {
    id: 'board-1',
    name: 'サンプルボード1',
    hasOtherMembers: true,
    members: [
      { userId: 'user-2', nickname: 'user2' },
      { userId: 'user-3', nickname: 'user3' },
    ],
  },
  {
    id: 'board-2',
    name: 'サンプルボード2',
    hasOtherMembers: false,
    members: [],
  },
];

/**
 * fetchOwnedBoardsのモック関数
 */
export const mockFetchOwnedBoards = async (): Promise<OwnedBoard[]> => {
  // 少し遅延させてローディング状態を確認できるようにする
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockOwnedBoards;
};
