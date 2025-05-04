import { Link } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EncounterAccordionLayoutProps {
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  title: string;
  editLink?: string;
  actionButton?: ReactNode;
}

export function EncounterAccordionLayout({
  children,
  className,
  readOnly = false,
  actionButton,
  title,
  editLink,
}: EncounterAccordionLayoutProps) {
  const { t } = useTranslation();

  return (
    <Card className={cn("border-none rounded-sm", className)}>
      <Accordion defaultValue={title.toLowerCase()} type="single" collapsible>
        <AccordionItem value={title.toLowerCase()}>
          <AccordionTrigger className="p-4 py-2 hover:no-underline flex items-center">
            <CardHeader className="w-full flex flex-row justify-between p-0 m-0 translate-y-0.5">
              <CardTitle className="text-base font-semibold">
                {t(title)}
              </CardTitle>
              {!readOnly && editLink ? (
                <Button variant="outline" size="xs">
                  <Link
                    href={editLink}
                    className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
                  >
                    <CareIcon icon="l-pen" className="size-4" />
                    {t("edit")}
                  </Link>
                </Button>
              ) : (
                actionButton && actionButton
              )}
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <CardContent className="px-2 pb-2">{children}</CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
