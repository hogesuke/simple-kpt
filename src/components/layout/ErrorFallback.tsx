import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function ErrorFallback(): ReactElement {
  const { t } = useTranslation('ui');

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold">{t('問題が発生しました')}</h1>
      <p className="text-muted-foreground mt-2">{t('予期しないエラーにより操作に失敗しました。もう一度お試しください。')}</p>
      <Link to="/" className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-md px-4 py-2 text-sm font-medium">
        {t('ホームに戻る')}
      </Link>
    </div>
  );
}
