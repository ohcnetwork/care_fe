import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import mutate from "@/Utils/request/mutate";
import { CreateDiscountCodeSheet } from "@/pages/Facility/settings/billing/discount/discount-codes/CreateDiscountCodeSheet";
import { EditDiscountCodeSheet } from "@/pages/Facility/settings/billing/discount/discount-codes/EditDiscountCodeSheet";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import facilityApi from "@/types/facility/facilityApi";

export interface AnnotatedDiscountCode extends Code {
  isInstance: boolean;
  facilityIndex?: number;
}

export function DiscountCodeSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [codeToDelete, setCodeToDelete] = useState<number>();

  const { facility, facilityId } = useCurrentFacility();

  const { mutate: deleteCode, isPending } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      toast.success(t("discount_code_deleted"));
    },
  });

  if (!facility) {
    return <Loading />;
  }

  const confirmDeleteCode = () => {
    if (codeToDelete == null) return;

    const updatedCodes = facility.discount_codes.filter(
      (_, index) => index !== codeToDelete,
    );

    deleteCode({
      discount_codes: updatedCodes,
      discount_monetary_components: facility.discount_monetary_components,
    });

    setCodeToDelete(undefined);
  };

  // Combine instance and facility codes
  const allCodes: AnnotatedDiscountCode[] = [
    ...(facility.instance_discount_codes || []).map((code: Code) => ({
      ...code,
      isInstance: true as const,
    })),
    ...(facility.discount_codes || []).map((code: Code, index: number) => ({
      ...code,
      isInstance: false as const,
      facilityIndex: index,
    })),
  ];

  const filteredCodes = allCodes.filter(
    (code) =>
      code.display.toLowerCase().includes(search.toLowerCase()) ||
      code.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Page
        title={t("discount_codes")}
        options={
          <div className="flex flex-col lg:flex-row items-center gap-2 ">
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-[300px]"
            />
            <CreateDiscountCodeSheet />
          </div>
        }
      >
        <div className="rounded-md border overflow-hidden mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20" />
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("code")}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    {search
                      ? t("no_matching_discount_codes")
                      : t("no_discount_codes")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow key={`${code.code}-${code.isInstance}`}>
                    <TableCell className="text-center">
                      <Badge variant={code.isInstance ? "secondary" : "blue"}>
                        {code.isInstance ? t("instance") : t("facility")}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.display}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                        {code.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {!code.isInstance && (
                        <div className="flex justify-end space-x-1">
                          <EditDiscountCodeSheet
                            code={code}
                            disabled={isPending}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCodeToDelete(code.facilityIndex)}
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

      <AlertDialog
        open={codeToDelete !== undefined}
        onOpenChange={(open) => !open && setCodeToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("billing_delete_discount_code_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCode}
              className={buttonVariants({ variant: "destructive" })}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
