import { ChevronsUpDown } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { DetailFormValues } from "./QuestionnaireDetailPage";

interface BasicInformationCardProps {
  form: UseFormReturn<DetailFormValues>;
  /** When false, the fields render disabled (read-only questionnaire). */
  canWrite: boolean;
  /** Extra fields rendered inside the card body (e.g. Organizations). */
  children?: React.ReactNode;
}

export function BasicInformationCard({
  form,
  canWrite,
  children,
}: BasicInformationCardProps) {
  const { t } = useTranslation();

  return (
    <Collapsible defaultOpen asChild>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 py-4">
          <div className="space-y-2">
            <CardTitle>{t("basic_information")}</CardTitle>
            {/* Collapsed-state summary of what the card contains. */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{t("title")}</Badge>
              <Badge variant="secondary">{t("slug")}</Badge>
              <Badge variant="secondary">{t("description")}</Badge>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("basic_information")}
            >
              <ChevronsUpDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t border-gray-100 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("title")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canWrite} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("slug")}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!canWrite} />
                  </FormControl>
                  <FormDescription className="italic">
                    {t("slug_format_message")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[80px]"
                      disabled={!canWrite}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
