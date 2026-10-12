import { describe, expect, it } from 'vitest';

import { getNicknameInitial, getParticipantColorClass } from './participant-styles';

describe('getParticipantColorClass', () => {
  it('同じユーザーIDには常に同じ色を返すこと', () => {
    expect(getParticipantColorClass('user-a')).toBe(getParticipantColorClass('user-a'));
  });

  it('背景色のクラスを返すこと', () => {
    expect(getParticipantColorClass('user-a')).toMatch(/^bg-[a-z]+-700$/);
  });
});

describe('getNicknameInitial', () => {
  it('ニックネームの1文字目を返すこと', () => {
    expect(getNicknameInitial('佐藤')).toBe('佐');
    expect(getNicknameInitial('  alice')).toBe('a');
  });

  it('絵文字などサロゲートペアの文字も1文字として扱うこと', () => {
    expect(getNicknameInitial('🍣好き')).toBe('🍣');
  });

  it('ニックネームが空の場合は?を返すこと', () => {
    expect(getNicknameInitial('')).toBe('?');
    expect(getNicknameInitial(null)).toBe('?');
  });
});
