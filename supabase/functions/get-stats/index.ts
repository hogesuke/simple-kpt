import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import {
  createAuthenticatedClient,
  createServiceClient,
  generateErrorResponse,
  generateJsonResponse,
  getQueryParam,
  requireMethod,
} from '../_shared/helpers.ts';

// NOTE: ここに手を入れる場合、src/lib/kpt-api.tsのStatsPeriodと同期すること
type Period = '1m' | '3m' | '6m' | '12m';

interface WeeklyKeepData {
  week: string;
  cumulativeCount: number;
}

interface WeeklyProblemData {
  week: string;
  cumulativeCount: number;
}

interface WeeklyTryData {
  week: string;
  cumulativeCount: number;
  cumulativeCompletedCount: number;
}

interface StatsResponse {
  hasData: boolean;
  keepStats: {
    totalCount: number;
    weeklyData: WeeklyKeepData[];
  };
  problemStats: {
    totalCount: number;
    weeklyData: WeeklyProblemData[];
  };
  tryStats: {
    completedCount: number;
    totalCount: number;
    achievementRate: number;
    weeklyData: WeeklyTryData[];
  };
}

/**
 * 期間から開始日を計算する
 */
function getStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case '1m':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '12m':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
}

/**
 * 日付を週の開始日（月曜日）に正規化する
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // 日曜日は0なので、月曜日を週の始まりとするために調整
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 週のラベルを生成する（MM/DD形式）
 */
function formatWeekLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * 期間内の全ての週のリストを生成する
 */
function generateWeeksList(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = [];
  const current = getWeekStart(startDate);
  const end = getWeekStart(endDate);

  while (current <= end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

Deno.serve(async (req) => {
  const methodError = requireMethod(req, 'GET');
  if (methodError) return methodError;

  const result = await createAuthenticatedClient(req);
  if (result instanceof Response) return result;

  const { user } = result;
  const client = createServiceClient();

  // 期間パラメータを取得
  const periodParam = getQueryParam(req, 'period') ?? '3m';
  const period = ['1m', '3m', '6m', '12m'].includes(periodParam) ? (periodParam as Period) : '3m';

  const startDate = getStartDate(period);
  const endDate = new Date();

  // ユーザーが所属するボードのIDを取得
  const { data: memberData, error: memberError } = await client.from('board_members').select('board_id').eq('user_id', user.id);

  if (memberError) {
    return generateErrorResponse('統計情報の取得に失敗しました', 500);
  }

  const boardIds = (memberData ?? []).map((m: { board_id: string }) => m.board_id);

  // ボードがない場合は空のレスポンスを返す
  if (boardIds.length === 0) {
    return generateJsonResponse({
      hasData: false,
      keepStats: { totalCount: 0, weeklyData: [] },
      problemStats: { totalCount: 0, weeklyData: [] },
      tryStats: { completedCount: 0, totalCount: 0, achievementRate: 0, weeklyData: [] },
    } satisfies StatsResponse);
  }

  // Keepアイテムを取得（期間開始前のものも累計計算に必要）
  const { data: keepItems, error: keepError } = await client
    .from('items')
    .select('id, created_at')
    .in('board_id', boardIds)
    .eq('column_name', 'keep')
    .order('created_at', { ascending: true });

  if (keepError) {
    return generateErrorResponse('統計情報の取得に失敗しました', 500);
  }

  // Problemアイテムを取得（期間開始前のものも累計計算に必要）
  const { data: problemItems, error: problemError } = await client
    .from('items')
    .select('id, created_at')
    .in('board_id', boardIds)
    .eq('column_name', 'problem')
    .order('created_at', { ascending: true });

  if (problemError) {
    return generateErrorResponse('統計情報の取得に失敗しました', 500);
  }

  // Tryアイテムを取得
  const { data: tryItems, error: tryError } = await client
    .from('items')
    .select('id, status, created_at, updated_at')
    .in('board_id', boardIds)
    .eq('column_name', 'try');

  if (tryError) {
    return generateErrorResponse('統計情報の取得に失敗しました', 500);
  }

  // データがない場合
  if ((keepItems?.length ?? 0) === 0 && (problemItems?.length ?? 0) === 0 && (tryItems?.length ?? 0) === 0) {
    return generateJsonResponse({
      hasData: false,
      keepStats: { totalCount: 0, weeklyData: [] },
      problemStats: { totalCount: 0, weeklyData: [] },
      tryStats: { completedCount: 0, totalCount: 0, achievementRate: 0, weeklyData: [] },
    } satisfies StatsResponse);
  }

  // 週のリストを生成
  const weeks = generateWeeksList(startDate, endDate);

  // Keep統計を計算
  const keepWeeklyMap = new Map<string, number>();
  weeks.forEach((week) => {
    keepWeeklyMap.set(formatWeekLabel(week), 0);
  });

  // 期間開始前のKeep数をカウント（累計の初期値）
  let keepBeforePeriod = 0;
  (keepItems ?? []).forEach((item: { id: string; created_at: string }) => {
    const itemDate = new Date(item.created_at);
    if (itemDate < startDate) {
      keepBeforePeriod++;
    } else {
      const weekStart = getWeekStart(itemDate);
      const weekLabel = formatWeekLabel(weekStart);
      if (keepWeeklyMap.has(weekLabel)) {
        keepWeeklyMap.set(weekLabel, (keepWeeklyMap.get(weekLabel) ?? 0) + 1);
      }
    }
  });

  // 累計を計算
  const keepWeeklyData: WeeklyKeepData[] = [];
  let keepCumulativeCount = keepBeforePeriod;
  weeks.forEach((week) => {
    const weekLabel = formatWeekLabel(week);
    const count = keepWeeklyMap.get(weekLabel) ?? 0;
    keepCumulativeCount += count;
    keepWeeklyData.push({
      week: weekLabel,
      cumulativeCount: keepCumulativeCount,
    });
  });

  // Problem統計を計算
  const problemWeeklyMap = new Map<string, number>();
  weeks.forEach((week) => {
    problemWeeklyMap.set(formatWeekLabel(week), 0);
  });

  // 期間開始前のProblem数をカウント（累計の初期値）
  let problemBeforePeriod = 0;
  (problemItems ?? []).forEach((item: { id: string; created_at: string }) => {
    const itemDate = new Date(item.created_at);
    if (itemDate < startDate) {
      problemBeforePeriod++;
    } else {
      const weekStart = getWeekStart(itemDate);
      const weekLabel = formatWeekLabel(weekStart);
      if (problemWeeklyMap.has(weekLabel)) {
        problemWeeklyMap.set(weekLabel, (problemWeeklyMap.get(weekLabel) ?? 0) + 1);
      }
    }
  });

  // 累計を計算
  const problemWeeklyData: WeeklyProblemData[] = [];
  let problemCumulativeCount = problemBeforePeriod;
  weeks.forEach((week) => {
    const weekLabel = formatWeekLabel(week);
    const count = problemWeeklyMap.get(weekLabel) ?? 0;
    problemCumulativeCount += count;
    problemWeeklyData.push({
      week: weekLabel,
      cumulativeCount: problemCumulativeCount,
    });
  });

  // Try統計を計算
  const tryTotalWeeklyMap = new Map<string, number>();
  const tryCompletedWeeklyMap = new Map<string, number>();
  weeks.forEach((week) => {
    const label = formatWeekLabel(week);
    tryTotalWeeklyMap.set(label, 0);
    tryCompletedWeeklyMap.set(label, 0);
  });

  // 期間開始前のTry数をカウント（累計の初期値）
  let tryBeforePeriodTotal = 0;
  let tryBeforePeriodCompleted = 0;
  let tryTotalCount = 0;
  let tryCompletedCount = 0;

  (tryItems ?? []).forEach((item: { id: string; status: string | null; created_at: string; updated_at: string }) => {
    tryTotalCount++;
    const createdDate = new Date(item.created_at);

    // 作成日ベースで累計をカウント
    if (createdDate < startDate) {
      tryBeforePeriodTotal++;
    } else {
      const weekStart = getWeekStart(createdDate);
      const weekLabel = formatWeekLabel(weekStart);
      if (tryTotalWeeklyMap.has(weekLabel)) {
        tryTotalWeeklyMap.set(weekLabel, (tryTotalWeeklyMap.get(weekLabel) ?? 0) + 1);
      }
    }

    // 完了日ベースで完了累計をカウント
    if (item.status === 'done') {
      tryCompletedCount++;
      const completedDate = new Date(item.updated_at);
      if (completedDate < startDate) {
        tryBeforePeriodCompleted++;
      } else {
        const weekStart = getWeekStart(completedDate);
        const weekLabel = formatWeekLabel(weekStart);
        if (tryCompletedWeeklyMap.has(weekLabel)) {
          tryCompletedWeeklyMap.set(weekLabel, (tryCompletedWeeklyMap.get(weekLabel) ?? 0) + 1);
        }
      }
    }
  });

  // 累計を計算
  const tryWeeklyData: WeeklyTryData[] = [];
  let tryCumulativeTotal = tryBeforePeriodTotal;
  let tryCumulativeCompleted = tryBeforePeriodCompleted;
  weeks.forEach((week) => {
    const weekLabel = formatWeekLabel(week);
    const totalCount = tryTotalWeeklyMap.get(weekLabel) ?? 0;
    const completedCount = tryCompletedWeeklyMap.get(weekLabel) ?? 0;
    tryCumulativeTotal += totalCount;
    tryCumulativeCompleted += completedCount;
    tryWeeklyData.push({
      week: weekLabel,
      cumulativeCount: tryCumulativeTotal,
      cumulativeCompletedCount: tryCumulativeCompleted,
    });
  });

  const achievementRate = tryTotalCount > 0 ? Math.round((tryCompletedCount / tryTotalCount) * 100) : 0;

  return generateJsonResponse({
    hasData: true,
    keepStats: {
      totalCount: keepCumulativeCount,
      weeklyData: keepWeeklyData,
    },
    problemStats: {
      totalCount: problemCumulativeCount,
      weeklyData: problemWeeklyData,
    },
    tryStats: {
      completedCount: tryCompletedCount,
      totalCount: tryTotalCount,
      achievementRate,
      weeklyData: tryWeeklyData,
    },
  } satisfies StatsResponse);
});
