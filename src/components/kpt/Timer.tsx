import { Pause, Play, Timer as TimerIcon, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import { useBoardContext } from '@/contexts/BoardContext';
import { getTimerPresets } from '@/lib/kpt-helpers';

interface TimerProps {
  disabled?: boolean;
}

export function Timer({ disabled }: TimerProps) {
  const { t } = useTranslation('board');
  const { timerState, startTimer, stopTimer } = useBoardContext();
  const TIMER_PRESETS = getTimerPresets();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- タイマー状態のクリアに伴う残り時間のリセットのため必要
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
      toast.success(t('タイマーが終了しました'));
    }
    prevTimerStateRef.current = timerState;
  }, [timerState, playNotificationSound, t]);

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

  // タイマー起動中: 白地の丸型ピルに、通知音アイコン・残り時間・停止アイコンを並べる
  if (isRunning) {
    return (
      <div className="border-primary/25 bg-card shadow-chip flex h-9 w-fit items-center gap-3 rounded-lg border px-4">
        <button
          type="button"
          onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          className="text-primary hover:text-primary-dark flex items-center transition-colors"
          aria-label={isSoundEnabled ? t('通知音をオフにする') : t('通知音をオンにする')}
        >
          {isSoundEnabled ? <Volume2 className="size-[18px]" /> : <VolumeX className="text-icon size-[18px]" />}
        </button>
        <span className="text-xl font-black tabular-nums">{formatTime(remainingSeconds)}</span>
        <button
          type="button"
          onClick={handleStop}
          disabled={disabled || isProcessing}
          className="text-primary hover:text-primary-dark flex items-center transition-colors disabled:opacity-50"
          aria-label={t('タイマーを停止')}
        >
          <Pause className="size-4 fill-current" />
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
          className="border-input bg-card shadow-chip hover:bg-accent flex h-9 items-center gap-[7px] rounded-lg border px-4 text-[13.5px] font-bold transition-colors disabled:opacity-50"
        >
          <TimerIcon className="h-4 w-4" />
          {t('タイマー')}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <TimerIcon className="text-primary h-5 w-5" />
            {t('タイマー設定')}
          </DialogTitle>
          <DialogDescription className="sr-only">{t('タイマーの時間を設定して開始します')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col pt-2">
          <span className="mb-2.5 text-[13.5px] font-bold">{t('時間')}</span>

          {/* プリセットボタン */}
          <RadioGroup
            value={minutes}
            onValueChange={setMinutes}
            disabled={isProcessing}
            className="bg-secondary border-border-subtle mb-4 flex gap-0.5 rounded-[11px] border p-[3px]"
            aria-label={t('プリセット時間')}
          >
            {TIMER_PRESETS.map((preset) => (
              <Label
                key={preset.seconds}
                htmlFor={`preset-${preset.seconds}`}
                className={`has-[:focus-visible]:ring-ring flex-1 cursor-pointer rounded-lg py-[9px] text-center text-[13.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-1 ${
                  isProcessing ? 'opacity-50' : ''
                } ${
                  minutes === String(preset.seconds / 60)
                    ? 'bg-card text-primary-dark font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground font-semibold'
                }`}
              >
                <RadioGroupItem
                  value={String(preset.seconds / 60)}
                  id={`preset-${preset.seconds}`}
                  className="sr-only"
                  aria-label={preset.label}
                />
                {preset.label}
              </Label>
            ))}
          </RadioGroup>

          {/* 自由入力 */}
          <div className="mb-5 flex items-center gap-3">
            <Input
              type="number"
              min="1"
              max="60"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="h-auto rounded-[11px] px-4 py-3 text-center text-[15px] font-bold"
              disabled={isProcessing}
              aria-label={t('タイマー時間（分）')}
            />
            <span className="text-muted-foreground text-sm" aria-hidden="true">
              {t('分')}
            </span>
          </div>

          <div className="mb-6 flex items-center gap-2.5">
            <Checkbox
              id="hide-others-cards"
              checked={hideOthersCards}
              onCheckedChange={(checked) => setHideOthersCards(checked === true)}
              disabled={isProcessing}
              aria-label={t('タイマー中は他の人のカードを隠す')}
              className="size-5 rounded-md"
            />
            <label htmlFor="hide-others-cards" className="cursor-pointer text-[13.5px]">
              {t('タイマー中は他の人のカードを隠す')}
            </label>
          </div>

          <Button
            onClick={handleStart}
            disabled={isProcessing || !minutes || Number(minutes) < 1}
            className="h-auto w-full py-3.5 text-[15px]"
          >
            <Play className="h-[17px] w-[17px] fill-current" />
            {t('開始')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
