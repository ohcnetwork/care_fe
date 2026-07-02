import { Keyboard } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SHORTCUTS: Array<{ keysKey: string; descKey: string }> = [
  { keysKey: "body_site_kbd_tab", descKey: "body_site_kbd_tab_desc" },
  { keysKey: "body_site_kbd_arrows", descKey: "body_site_kbd_arrows_desc" },
  { keysKey: "body_site_kbd_enter", descKey: "body_site_kbd_enter_desc" },
  { keysKey: "body_site_kbd_esc", descKey: "body_site_kbd_esc_desc" },
];

export default function KeyboardShortcuts() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          aria-label={t("body_site_kbd_help")}
        >
          <Keyboard className="size-3.5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 text-xs">
        <div className="font-medium text-gray-900 mb-2">
          {t("body_site_kbd_help")}
        </div>
        <dl className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keysKey}
              className="flex items-center justify-between gap-2"
            >
              <dt className="text-gray-500">{t(s.descKey)}</dt>
              <dd>
                <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-700">
                  {t(s.keysKey)}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
