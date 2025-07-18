import { SquarePen } from "lucide-react";
import { Link } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
    <Card className={cn("border-none rounded-md", className)}>
      <Accordion defaultValue={title.toLowerCase()} type="single" collapsible>
        <AccordionItem value={title.toLowerCase()}>
          <AccordionTrigger className="px-4 py-1 hover:no-underline flex items-center">
            <CardHeader className="w-full flex flex-row items-center justify-between p-0">
              <CardTitle className="text-lg font-semibold pt-1">
                {t(title)}:
              </CardTitle>
              <div className="flex gap-1 items-center">
                {!readOnly && editLink && (
                  <Button variant="link" size="xs">
                    <Link
                      href={editLink}
                      className="flex items-center gap-1 text-sm hover:text-gray-500 text-gray-950"
                    >
                      <SquarePen className="size-4" />
                      <span className="underline"> {t("edit")}</span>
                    </Link>
                  </Button>
                )}
                {actionButton && actionButton}
              </div>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent className="p-0 mt-2">
            <CardContent className="px-2 pb-2">{children}</CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
