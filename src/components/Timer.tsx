import { Pause, Play, Timer as TimerIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { useBoardContext } from '@/contexts/BoardContext';
import { TIMER_PRESETS } from '@/types/kpt';

interface TimerProps {
  disabled?: boolean;
}

export function Timer({ disabled }: TimerProps) {
  const { timerState, startTimer, stopTimer } = useBoardContext();
  const [isOpen, setIsOpen] = useState(false);
  const [minutes, setMinutes] = useState<string>('3');
  const [hideOthersCards, setHideOthersCards] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // 残り時間の計算
  useEffect(() => {
    if (!timerState?.startedAt || !timerState.durationSeconds) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const startTime = new Date(timerState.startedAt!).getTime();
      const endTime = startTime + timerState.durationSeconds! * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      setRemainingSeconds(remaining);

      // タイマー終了時に自動停止
      if (remaining <= 0) {
        void stopTimer();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [timerState, stopTimer]);

  const handleStart = useCallback(async () => {
    const mins = Number(minutes);
    if (isNaN(mins) || mins < 1) return;

    const durationSeconds = Math.min(mins * 60, 3600);

    setIsStarting(true);
    try {
      await startTimer(durationSeconds, hideOthersCards);
      setIsOpen(false);
    } finally {
      setIsStarting(false);
    }
  }, [minutes, hideOthersCards, startTimer]);

  const handleStop = useCallback(async () => {
    setIsStopping(true);
    try {
      await stopTimer();
    } finally {
      setIsStopping(false);
    }
  }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRunning = remainingSeconds !== null && remainingSeconds > 0;
  const isProcessing = isStarting || isStopping;

  // タイマー起動中
  if (isRunning) {
    return (
      <div className="border-primary flex h-9 items-center gap-2 rounded-full border pr-1 pl-3">
        <TimerIcon className="text-primary h-4 w-4" />
        <span className="font-mono text-lg font-semibold tabular-nums">{formatTime(remainingSeconds)}</span>
        <button
          type="button"
          onClick={handleStop}
          disabled={disabled || isProcessing}
          className="bg-background hover:bg-muted-foreground/10 flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:opacity-50"
          aria-label="タイマーを停止"
        >
          <Pause className="text-muted-foreground h-4 w-4" />
        </button>
      </div>
    );
  }

  // タイマー停止中
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="border-input hover:bg-muted flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors disabled:opacity-50"
        >
          <TimerIcon className="h-4 w-4" />
          タイマー
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-80">
        <DialogHeader>
          <DialogTitle>タイマー設定</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">時間</span>

            {/* プリセットボタン */}
            <div className="flex gap-1">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setMinutes(String(preset.seconds / 60))}
                  disabled={isProcessing}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                    minutes === String(preset.seconds / 60) ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* 自由入力 */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="text-center"
                disabled={isProcessing}
              />
              <span className="text-sm">分</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="hide-others-cards"
              checked={hideOthersCards}
              onCheckedChange={(checked) => setHideOthersCards(checked === true)}
              disabled={isProcessing}
            />
            <label htmlFor="hide-others-cards" className="cursor-pointer text-sm">
              タイマー中は他の人のカードを隠す
            </label>
          </div>

          <Button onClick={handleStart} disabled={isProcessing || !minutes || Number(minutes) < 1} className="w-full">
            <Play className="mr-1 h-4 w-4" />
            開始
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
