import { Pause, Play, Timer as TimerIcon, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
  // 通知音のオン/オフ状態
  // - state: サウンドアイコンの表示切り替えのため（refでは再レンダリングされないためstateを利用）
  // - ref: stateの利用により、タイマーのインターバルがリセットされないようにするため
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const isSoundEnabledRef = useRef(true);
  // タイマー終了通知済みフラグ（stopTimerが非同期のため、インターバルが再発火して2重通知されるのを防ぐ）
  const hasNotifiedRef = useRef(false);
  // 前回のtimerState（タイマー停止検出用）
  const prevTimerStateRef = useRef(timerState);

  // refをstateと同期させる
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // 通知音を鳴らす
  const playNotificationSound = useCallback(() => {
    if (!isSoundEnabledRef.current) return;

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // 2回目の音（少し高い音）
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 200);
    } catch {
      // Web Audio APIがサポートされていない場合は音は鳴らさない
    }
  }, []);

  // 残り時間の計算
  useEffect(() => {
    if (!timerState?.startedAt || !timerState.durationSeconds) {
      setRemainingSeconds(null);
      hasNotifiedRef.current = false;
      return;
    }

    const calculateRemaining = () => {
      const startTime = new Date(timerState.startedAt!).getTime();
      const endTime = startTime + timerState.durationSeconds! * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      setRemainingSeconds(remaining);

      // タイマー終了時に自動停止
      if (remaining <= 0 && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;
        void stopTimer();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [timerState, stopTimer]);

  // タイマー停止時の通知（Realtime経由で全メンバーに通知）
  useEffect(() => {
    // timerStateが有効な状態からnullに変わった時に通知
    if (prevTimerStateRef.current && !timerState) {
      playNotificationSound();
      toast.success('タイマーが終了しました');
    }
    prevTimerStateRef.current = timerState;
  }, [timerState, playNotificationSound]);

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
      <div className="border-primary flex h-9 items-center gap-2 rounded-full border pr-1 pl-1">
        <button
          type="button"
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className="hover:bg-muted-foreground/10 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
          aria-label={isSoundEnabled ? '通知音をオフにする' : '通知音をオンにする'}
        >
          {isSoundEnabled ? <Volume2 className="text-primary h-4 w-4" /> : <VolumeX className="text-muted-foreground h-4 w-4" />}
        </button>
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
            <div className="flex gap-1" role="group" aria-label="プリセット時間">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => setMinutes(String(preset.seconds / 60))}
                  disabled={isProcessing}
                  aria-pressed={minutes === String(preset.seconds / 60)}
                  aria-label={`${preset.seconds / 60}分を選択`}
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
                aria-label="タイマー時間（分）"
              />
              <span className="text-sm" aria-hidden="true">
                分
              </span>
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
