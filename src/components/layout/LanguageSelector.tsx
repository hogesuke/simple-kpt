import { Globe } from 'lucide-react';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { supportedLanguages, SupportedLanguage } from '@/i18n';

const languageLabels: Record<SupportedLanguage, string> = {
  ja: '日本語',
  en: 'English',
};

export function LanguageSelector(): ReactElement {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    void i18n.changeLanguage(lang);
  };

  const currentLanguage = (supportedLanguages.includes(i18n.language as SupportedLanguage) ? i18n.language : 'ja') as SupportedLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={i18n.t('ui:言語を選択')} className="h-9 gap-1 px-2">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase">{currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={currentLanguage} onValueChange={handleLanguageChange}>
          {supportedLanguages.map((lang) => (
            <DropdownMenuRadioItem key={lang} value={lang}>
              {languageLabels[lang]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
