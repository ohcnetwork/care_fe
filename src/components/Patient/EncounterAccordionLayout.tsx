import { ChevronsDownUp, ChevronsUpDown, SquarePen } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className={cn("border-none rounded-md", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-1 hover:no-underline">
          <CardHeader className="w-full flex flex-row items-center justify-between p-0 pl-2">
            <CardTitle className="text-base mt-1">{t(title)}:</CardTitle>
            <div
              className={cn(
                "flex rounded-md border border-gray-500 lg:border-0 lg:divide-x-0 mt-1",
                (editLink || actionButton) && "divide-x divide-gray-500",
              )}
            >
              {!readOnly && editLink && (
                <div className="flex">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="hover:bg-transparent text-gray-500 hover:text-gray-500"
                  >
                    <Link href={editLink}>
                      <SquarePen className="size-4" />
                    </Link>
                  </Button>
                </div>
              )}
              <div className="flex">{actionButton && actionButton}</div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-transparent text-gray-500 hover:text-gray-500"
                >
                  {isExpanded ? (
                    <ChevronsDownUp className="size-4 text-gray-500" />
                  ) : (
                    <ChevronsUpDown className="size-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-2">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
