import { X } from "lucide-react";
import { navigate } from "raviger";
import { ReactNode, SubmitEventHandler } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import BackButton from "@/components/Common/BackButton";
import Page from "@/components/Common/Page";
import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { getInventoryBasePath } from "@/pages/Facility/services/inventory/externalSupply/utils/inventoryUtils";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import {
  DELIVERY_ORDER_STATUS_COLORS,
  DeliveryOrderStatus,
} from "@/types/inventory/deliveryOrder/deliveryOrder";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { DeliveryOrderRoutingField } from "./DeliveryOrderRoutingField";

interface DeliveryOrderFields {
  name: string;
  note?: string;
  supplier?: string;
  destination: string;
  tags: string[];
}

interface DeliveryOrderFormContentProps {
  facilityId: string;
  locationId: string;
  internal: boolean;
  supplyOrderId?: string;
  title: string;
  status: DeliveryOrderStatus;
  isEditMode: boolean;
  isPending: boolean;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  children: ReactNode;
}

export function DeliveryOrderFormContent({
  facilityId,
  locationId,
  internal,
  supplyOrderId,
  title,
  status,
  isEditMode,
  isPending,
  onSubmit,
  children,
}: DeliveryOrderFormContentProps) {
  const { t } = useTranslation();
  const form = useFormContext<DeliveryOrderFields>();
  const tagIds = form.watch("tags");
  const selectedTags = useTagConfigs({ ids: tagIds, facilityId })
    .map(({ data }) => data)
    .filter(Boolean) as TagConfig[];

  const returnPath = getInventoryBasePath(
    facilityId,
    locationId,
    internal,
    false,
    !internal,
  );
  return (
    <Page
      title={title}
      hideTitleOnPage
      shortCutContext="facility:inventory:delivery"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {title}
            <Badge variant={DELIVERY_ORDER_STATUS_COLORS[status]}>
              {t(status)}
            </Badge>
          </h1>
          <BackButton variant="outline" size="icon">
            <X className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </BackButton>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <input type="submit" hidden />
          <Card className="p-0 bg-gray-50">
            <CardContent className="space-y-4 p-4 rounded-md">
              <div className="grid sm:grid-cols-2 gap-4 items-start">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input
                          className="h-9"
                          placeholder={t("enter_order_name")}
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DeliveryOrderRoutingField
                  facilityId={facilityId}
                  locationId={locationId}
                  internal={internal}
                  supplyOrderId={supplyOrderId}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("note")}
                      <span className="text-gray-500 text-sm italic">
                        {" "}
                        ({t("optional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tags_proper")}</FormLabel>
                      <FormControl>
                        <TagSelectorPopover
                          selected={selectedTags}
                          onChange={(tags) =>
                            field.onChange(tags.map((tag) => tag.id))
                          }
                          resource={TagResource.DELIVERY_ORDER}
                          facilityId={facilityId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {children}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(returnPath)}
            >
              {t("cancel")}
              <ShortcutBadge actionId="cancel-action" />
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditMode
                  ? t("saving")
                  : t("creating")
                : isEditMode
                  ? t("save")
                  : t("create")}
              <ShortcutBadge actionId="enter-action" />
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
