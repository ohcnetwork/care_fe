import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { InvoiceCreate } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

interface EditInvoiceSheetProps {
  facilityId: string;
  invoiceId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function EditInvoiceSheet({
  facilityId,
  invoiceId,
  onSuccess,
  trigger,
}: EditInvoiceSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    enabled: open,
  });

  const formSchema = z.object({
    payment_terms: z.string().optional(),
    note: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_terms: import.meta.env.REACT_DEFAULT_PAYMENT_TERMS || "",
      note: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        payment_terms:
          invoice.payment_terms ||
          import.meta.env.REACT_DEFAULT_PAYMENT_TERMS ||
          "",
        note: invoice.note || "",
      });
    }
  }, [invoice, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  const { mutate: updateInvoice, isPending } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!invoice) return;

    // Get the charge item IDs from the current invoice
    const chargeItemIds = invoice.charge_items.map((item) => item.id);

    const data: InvoiceCreate = {
      status: invoice.status,
      payment_terms: values.payment_terms?.trim(),
      note: values.note?.trim(),
      account: invoice.account.id,
      charge_items: chargeItemIds,
      issue_date: invoice.issue_date,
    };
    updateInvoice(data);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-gray-400 gap-1">
            <CareIcon
              icon="l-edit"
              className="size-5 stroke-gray-400 stroke-0 font-normal"
            />
            <span className="text-gray-950 font-medium">{t("edit")}</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-md sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("edit_invoice")}</SheetTitle>
          <SheetDescription>{t("edit_invoice_details")}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">{t("loading")}</p>
          </div>
        ) : !invoice ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">{t("invoice_not_found")}</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_terms")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("payment_terms_placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("note")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("invoice_note_placeholder")}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("saving_with_dots") : t("save")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
