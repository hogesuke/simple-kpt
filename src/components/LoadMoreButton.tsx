import { ChevronDown, Loader2 } from 'lucide-react';
import { ReactElement } from 'react';

import { Button } from '@/components/shadcn/button';

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function LoadMoreButton({ onClick, isLoading }: LoadMoreButtonProps): ReactElement {
  return (
    <div className="mt-4 flex justify-center">
      <Button variant="ghost" onClick={onClick} disabled={isLoading} className="text-primary">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            読み込み中...
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            さらに表示
          </>
        )}
      </Button>
    </div>
  );
}
