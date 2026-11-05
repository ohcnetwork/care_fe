import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LANGUAGES } from "@/i18n";

interface LanguageSelectControlProps {
  labelId: string;
  locales: (keyof typeof LANGUAGES)[];
  value: string;
  onValueChange: (locale: string) => void;
}

/**
 * The dropdown half of the sign-in page's language picker, split out so the
 * select popup code loads after the sign-in form has rendered.
 */
export default function LanguageSelectControl({
  labelId,
  locales,
  value,
  onValueChange,
}: LanguageSelectControlProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-labelledby={labelId} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale} lang={locale}>
            {LANGUAGES[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
