import { ReactElement, useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/shadcn/chart';
import { Skeleton } from '@/components/shadcn/skeleton';
import { fetchStats, type StatsResponse, type StatsPeriod } from '@/lib/kpt-api';

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '3m', label: '3m' },
  { value: '6m', label: '6m' },
  { value: '12m', label: '1y' },
];

const CHART_COLOR = 'hsl(217, 62%, 54%)';
const CHART_COLOR_LIGHT = 'hsl(217, 62%, 70%)';

const keepChartConfig = {
  cumulativeCount: {
    label: '累計Keep',
    color: CHART_COLOR,
  },
} satisfies ChartConfig;

const problemChartConfig = {
  cumulativeCount: {
    label: '累計Problem',
    color: CHART_COLOR,
  },
} satisfies ChartConfig;

const tryChartConfig = {
  cumulativeCount: {
    label: '累計Try',
    color: CHART_COLOR_LIGHT,
  },
  cumulativeCompletedCount: {
    label: '完了Try',
    color: CHART_COLOR,
  },
} satisfies ChartConfig;

// 最後のポイントだけドットを表示するカスタムコンポーネント
function LastPointDot(props: { cx?: number; cy?: number; index?: number; dataLength: number; color?: string }) {
  const { cx, cy, index, dataLength, color = 'hsl(0, 0%, 55%)' } = props;
  if (index !== dataLength - 1 || cx === undefined || cy === undefined) return null;
  return <circle cx={cx} cy={cy} r={4} fill={color} />;
}

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
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="cumulativeCount"
            stroke="var(--color-cumulativeCount)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={(props) => <LastPointDot {...props} dataLength={weeklyData.length} color={CHART_COLOR} />}
            activeDot={{ r: 4 }}
            animationDuration={1000}
          />
        </AreaChart>
      </ChartContainer>
    </StatsCardContainer>
  );
}

export function StatsSummary(): ReactElement | null {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>('3m');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
    void loadStats(period, isInitialLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- periodの変更時のみ実行
  }, [period]);

  const handlePeriodChange = (value: StatsPeriod) => {
    setPeriod(value);
  };

  // 初回ローディング中の表示
  if (isInitialLoad) {
    return (
      <div className="mb-10">
        <div className="mb-2 flex items-center justify-end">
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // データがない場合は表示しない
  if (!stats || !stats.hasData) {
    return null;
  }

  // 全グラフのY軸スケールを統一するために最大値を計算
  const keepMax = Math.max(...stats.keepStats.weeklyData.map((d) => d.cumulativeCount), 0);
  const problemMax = Math.max(...stats.problemStats.weeklyData.map((d) => d.cumulativeCount), 0);
  const tryMax = Math.max(...stats.tryStats.weeklyData.map((d) => Math.max(d.cumulativeCount, d.cumulativeCompletedCount)), 0);
  const yAxisMax = Math.max(keepMax, problemMax, tryMax, 1); // 最低1とする

  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center justify-end">
        <div className="inline-flex rounded-lg bg-slate-50 p-0.5 dark:bg-slate-900">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
                period === option.value
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SimpleStatsCard
          label="累計Keep"
          dotColorClass="bg-lime-500"
          totalCount={stats.keepStats.totalCount}
          weeklyData={stats.keepStats.weeklyData}
          gradientId="keepGradient"
          chartConfig={keepChartConfig}
          yAxisMax={yAxisMax}
        />
        <SimpleStatsCard
          label="累計Problem"
          dotColorClass="bg-red-400"
          totalCount={stats.problemStats.totalCount}
          weeklyData={stats.problemStats.weeklyData}
          gradientId="problemGradient"
          chartConfig={problemChartConfig}
          yAxisMax={yAxisMax}
        />
        <StatsCardContainer
          label="累計Try"
          dotColorClass="bg-blue-500"
          totalCount={stats.tryStats.totalCount}
          subtitle={`完了 ${stats.tryStats.completedCount} (${stats.tryStats.achievementRate}%)`}
        >
          <ChartContainer config={tryChartConfig} className="h-full w-full">
            <AreaChart data={stats.tryStats.weeklyData} margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="tryCompletedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" hide />
              <YAxis hide domain={[0, yAxisMax]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cumulativeCount"
                stroke="var(--color-cumulativeCount)"
                strokeWidth={1.5}
                fill="none"
                dot={(props) => <LastPointDot {...props} dataLength={stats.tryStats.weeklyData.length} color={CHART_COLOR_LIGHT} />}
                activeDot={{ r: 4 }}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="cumulativeCompletedCount"
                stroke="var(--color-cumulativeCompletedCount)"
                strokeWidth={1.5}
                fill="url(#tryCompletedGradient)"
                dot={(props) => <LastPointDot {...props} dataLength={stats.tryStats.weeklyData.length} color={CHART_COLOR} />}
                activeDot={{ r: 3 }}
                animationDuration={1000}
              />
            </AreaChart>
          </ChartContainer>
        </StatsCardContainer>
      </div>
    </div>
  );
}
