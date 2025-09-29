import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import { CreateDiscountMonetaryComponentSheet } from "@/pages/Facility/settings/billing/discount/discount-components/CreateDiscountMonetaryComponentSheet";
import { EditDiscountMonetarySheet } from "@/pages/Facility/settings/billing/discount/discount-components/EditDiscountMonetarySheet";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";
import facilityApi from "@/types/facility/facilityApi";

export interface AnnotatedMonetaryComponent extends MonetaryComponentRead {
  isInstance: boolean;
  facilityIndex?: number;
}

export function DiscountComponentSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [componentToDelete, setComponentToDelete] = useState<number>();

  const { facility, facilityId } = useCurrentFacility();

  const { mutate: deleteComponent, isPending } = useMutation({
    mutationFn: mutate(facilityApi.setMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_component_deleted"));
    },
  });

  if (!facility) {
    return <Loading />;
  }

  const confirmDeleteComponent = () => {
    if (componentToDelete == null) return;

    const updatedComponents = facility.discount_monetary_components.filter(
      (_, index) => index !== componentToDelete,
    );

    deleteComponent({
      discount_monetary_components: updatedComponents,
      discount_codes: facility.discount_codes,
    });

    setComponentToDelete(undefined);
  };

  // Combine instance and facility components
  const allComponents: AnnotatedMonetaryComponent[] = [
    ...(facility.instance_discount_monetary_components || []).map(
      (component: MonetaryComponentRead) => ({
        ...component,
        isInstance: true as const,
      }),
    ),
    ...(facility.discount_monetary_components || []).map(
      (component: MonetaryComponentRead, index: number) => ({
        ...component,
        isInstance: false as const,
        facilityIndex: index,
      }),
    ),
  ];

  const filteredComponents = allComponents.filter(
    (component) =>
      component.title.toLowerCase().includes(search.toLowerCase()) ||
      component.code?.code.toLowerCase().includes(search.toLowerCase()) ||
      component.code?.display.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Page
        title={t("discount_monetary_components")}
        options={
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-[300px]"
            />
            <CreateDiscountMonetaryComponentSheet />
          </div>
        }
      >
        <div className="rounded-md border overflow-hidden mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20" />
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("discount_code")}</TableHead>
                <TableHead>{t("value")}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredComponents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    {search
                      ? t("no_matching_discount_components")
                      : t("no_discount_components")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComponents.map((component) => (
                  <TableRow key={`${component.title}-${component.isInstance}`}>
                    <TableCell className="text-center">
                      <Badge
                        variant={component.isInstance ? "secondary" : "blue"}
                      >
                        {component.isInstance ? t("instance") : t("facility")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {component.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      {component.code && (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                            {component.code.code}
                          </code>
                          <span className="text-sm">
                            • {component.code.display}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <MonetaryDisplay {...component} />
                    </TableCell>
                    <TableCell>
                      {!component.isInstance && (
                        <div className="flex justify-end space-x-1">
                          <EditDiscountMonetarySheet
                            component={component}
                            disabled={isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setComponentToDelete(component.facilityIndex)
                            }
                            disabled={isPending}
                          >
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Page>

      <ConfirmActionDialog
        open={componentToDelete !== undefined}
        onOpenChange={(open) => {
          if (!open) setComponentToDelete(undefined);
        }}
        title={t("confirm_delete")}
        description={t("billing_delete_discount_component_confirmation")}
        onConfirm={confirmDeleteComponent}
        confirmText={t("confirm")}
        variant="destructive"
      />
    </>
  );
}
