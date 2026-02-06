import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/shadcn/chart';
import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { Skeleton } from '@/components/shadcn/skeleton';
import { fetchStats, type StatsResponse, type StatsPeriod } from '@/lib/kpt-api';

// 期間に応じた週数
const PERIOD_WEEKS: Record<StatsPeriod, number> = {
  '1m': 5,
  '3m': 13,
  '6m': 26,
  '12m': 52,
};

function generateEmptyWeeklyData(period: StatsPeriod): { week: string; cumulativeCount: number }[] {
  const weeks = PERIOD_WEEKS[period];
  const today = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (weeks - 1 - i) * 7);
    return {
      week: date.toISOString().slice(0, 10),
      cumulativeCount: 0,
    };
  });
}

function generateEmptyTryWeeklyData(period: StatsPeriod): { week: string; cumulativeCount: number; cumulativeCompletedCount: number }[] {
  return generateEmptyWeeklyData(period).map((data) => ({
    ...data,
    cumulativeCompletedCount: 0,
  }));
}

const CHART_COLOR = 'hsl(217, 62%, 54%)';
const CHART_COLOR_LIGHT = 'hsl(217, 62%, 70%)';

// 基底カードコンポーネント
interface StatsCardContainerProps {
  label: string;
  dotColorClass: string;
  totalCount: number;
  subtitle?: string;
  children: React.ReactNode;
}

function StatsCardContainer({ label, dotColorClass, totalCount, subtitle, children }: StatsCardContainerProps) {
  return (
    <div className="relative h-32 rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
      <div className="absolute top-3 left-4 z-10">
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <span className={`h-2 w-2 rounded-full ${dotColorClass}`} />
          {label}
        </div>
        <div className="text-2xl font-semibold text-neutral-700 tabular-nums dark:text-neutral-200">{totalCount}</div>
        {subtitle && <div className="text-muted-foreground text-sm tabular-nums">{subtitle}</div>}
      </div>
      <div className="absolute inset-3 overflow-hidden">{children}</div>
    </div>
  );
}

// Keep/Problem用の1本線グラフカード
interface SimpleStatsCardProps {
  label: string;
  dotColorClass: string;
  totalCount: number;
  weeklyData: { week: string; cumulativeCount: number }[];
  gradientId: string;
  chartConfig: ChartConfig;
  yAxisMax: number;
}

function SimpleStatsCard({ label, dotColorClass, totalCount, weeklyData, gradientId, chartConfig, yAxisMax }: SimpleStatsCardProps) {
  return (
    <StatsCardContainer label={label} dotColorClass={dotColorClass} totalCount={totalCount}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={weeklyData} margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" hide />
          <YAxis hide domain={[0, yAxisMax]} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="cumulativeCount"
            stroke="var(--color-cumulativeCount)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={1000}
          />
        </AreaChart>
      </ChartContainer>
    </StatsCardContainer>
  );
}

// Try用の2本線グラフカード
interface TryStatsCardProps {
  label: string;
  subtitle: string;
  totalCount: number;
  weeklyData: { week: string; cumulativeCount: number; cumulativeCompletedCount: number }[];
  chartConfig: ChartConfig;
  yAxisMax: number;
}

function TryStatsCard({ label, subtitle, totalCount, weeklyData, chartConfig, yAxisMax }: TryStatsCardProps) {
  return (
    <StatsCardContainer label={label} dotColorClass="bg-blue-500" totalCount={totalCount} subtitle={subtitle}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart data={weeklyData} margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="tryCompletedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" hide />
          <YAxis hide domain={[0, yAxisMax]} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="cumulativeCount"
            stroke="var(--color-cumulativeCount)"
            strokeWidth={1.5}
            fill="none"
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="cumulativeCompletedCount"
            stroke="var(--color-cumulativeCompletedCount)"
            strokeWidth={1.5}
            fill="url(#tryCompletedGradient)"
            dot={false}
            activeDot={{ r: 3 }}
            animationDuration={1000}
          />
        </AreaChart>
      </ChartContainer>
    </StatsCardContainer>
  );
}

export function StatsSummary(): ReactElement | null {
  const { t } = useTranslation('board');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>('3m');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const hasLoadedRef = useRef(false);

  const periodOptions = useMemo(
    () => [
      { value: '1m' as StatsPeriod, label: '1m', ariaLabel: t('過去1ヶ月') },
      { value: '3m' as StatsPeriod, label: '3m', ariaLabel: t('過去3ヶ月') },
      { value: '6m' as StatsPeriod, label: '6m', ariaLabel: t('過去6ヶ月') },
      { value: '12m' as StatsPeriod, label: '1y', ariaLabel: t('過去1年') },
    ],
    [t]
  );

  const keepChartConfig = useMemo(
    () =>
      ({
        cumulativeCount: {
          label: t('累計Keep'),
          color: CHART_COLOR,
        },
      }) satisfies ChartConfig,
    [t]
  );

  const problemChartConfig = useMemo(
    () =>
      ({
        cumulativeCount: {
          label: t('累計Problem'),
          color: CHART_COLOR,
        },
      }) satisfies ChartConfig,
    [t]
  );

  const tryChartConfig = useMemo(
    () =>
      ({
        cumulativeCount: {
          label: t('累計Try'),
          color: CHART_COLOR_LIGHT,
        },
        cumulativeCompletedCount: {
          label: t('完了Try'),
          color: CHART_COLOR,
        },
      }) satisfies ChartConfig,
    [t]
  );

  const loadStats = useCallback(async (selectedPeriod: StatsPeriod, isInitial: boolean) => {
    try {
      const data = await fetchStats(selectedPeriod);
      setStats(data);
    } catch {
      // エラー時は非表示にする
      setStats(null);
    } finally {
      if (isInitial) {
        setIsInitialLoad(false);
      }
    }
  }, []);

  useEffect(() => {
    const isInitial = !hasLoadedRef.current;
    hasLoadedRef.current = true;
    void loadStats(period, isInitial);
  }, [period, loadStats]);

  const handlePeriodChange = (value: StatsPeriod) => {
    setPeriod(value);
  };

  // データがない場合はダミーデータを使用する（hooksはearly returnの前に呼ぶ必要がある）
  const keepWeeklyData = useMemo(
    () =>
      stats?.keepStats.weeklyData && stats.keepStats.weeklyData.length > 0 ? stats.keepStats.weeklyData : generateEmptyWeeklyData(period),
    [stats?.keepStats.weeklyData, period]
  );
  const problemWeeklyData = useMemo(
    () =>
      stats?.problemStats.weeklyData && stats.problemStats.weeklyData.length > 0
        ? stats.problemStats.weeklyData
        : generateEmptyWeeklyData(period),
    [stats?.problemStats.weeklyData, period]
  );
  const tryWeeklyData = useMemo(
    () =>
      stats?.tryStats.weeklyData && stats.tryStats.weeklyData.length > 0 ? stats.tryStats.weeklyData : generateEmptyTryWeeklyData(period),
    [stats?.tryStats.weeklyData, period]
  );

  // 全グラフのY軸スケールを統一するために最大値を計算
  const yAxisMax = useMemo(() => {
    const keepMax = Math.max(...keepWeeklyData.map((d) => d.cumulativeCount), 0);
    const problemMax = Math.max(...problemWeeklyData.map((d) => d.cumulativeCount), 0);
    const tryMax = Math.max(...tryWeeklyData.map((d) => Math.max(d.cumulativeCount, d.cumulativeCompletedCount)), 0);
    return Math.max(keepMax, problemMax, tryMax, 1); // 最低1とする
  }, [keepWeeklyData, problemWeeklyData, tryWeeklyData]);

  // 初回ローディング中の表示
  if (isInitialLoad) {
    return (
      <div className="mb-10">
        <div className="mb-2 flex items-center justify-end">
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // statsがnullの場合（エラー時）は表示しない
  if (!stats) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center justify-end">
        <RadioGroup
          value={period}
          onValueChange={(value) => handlePeriodChange(value as StatsPeriod)}
          className="inline-flex rounded-lg bg-slate-50 p-0.5 dark:bg-slate-900"
          aria-label={t('グラフ表示の期間範囲')}
        >
          {periodOptions.map((option) => (
            <Label
              key={option.value}
              htmlFor={`period-${option.value}`}
              className={`has-focus-visible:ring-ring cursor-pointer rounded-md px-2.5 py-1 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-offset-1 ${
                period === option.value
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-100 dark:text-blue-600'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <RadioGroupItem value={option.value} id={`period-${option.value}`} className="sr-only" aria-label={option.ariaLabel} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SimpleStatsCard
          label={t('累計Keep')}
          dotColorClass="bg-lime-500"
          totalCount={stats.keepStats.totalCount}
          weeklyData={keepWeeklyData}
          gradientId="keepGradient"
          chartConfig={keepChartConfig}
          yAxisMax={yAxisMax}
        />
        <SimpleStatsCard
          label={t('累計Problem')}
          dotColorClass="bg-red-400"
          totalCount={stats.problemStats.totalCount}
          weeklyData={problemWeeklyData}
          gradientId="problemGradient"
          chartConfig={problemChartConfig}
          yAxisMax={yAxisMax}
        />
        <TryStatsCard
          label={t('累計Try')}
          subtitle={`${t('完了Try')} ${stats.tryStats.completedCount} (${stats.tryStats.achievementRate}%)`}
          totalCount={stats.tryStats.totalCount}
          weeklyData={tryWeeklyData}
          chartConfig={tryChartConfig}
          yAxisMax={yAxisMax}
        />
      </div>
    </div>
  );
}
