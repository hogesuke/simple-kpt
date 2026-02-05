import { ChevronDown, Loader2 } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function LoadMoreButton({ onClick, isLoading }: LoadMoreButtonProps): ReactElement {
  const { t } = useTranslation('ui');
  return (
    <div className="mt-4 flex justify-center">
      <Button variant="ghost" onClick={onClick} disabled={isLoading} className="text-primary">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('読み込み中...')}
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            {t('さらに表示')}
          </>
        )}
      </Button>
    </div>
  );
}
