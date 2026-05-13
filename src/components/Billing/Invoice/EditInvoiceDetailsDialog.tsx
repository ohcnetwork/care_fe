import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t as i18nT } from "i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { DateTimePicker } from "@/components/Common/DateTimePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { InvoiceCreate, InvoiceRead } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import mutate from "@/Utils/request/mutate";

const formSchema = z.object({
  payment_terms: z.string().optional(),
  note: z.string().optional(),
  issue_date: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: i18nT("issue_date_cannot_be_in_future"),
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface EditInvoiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  invoice: InvoiceRead;
}

export function EditInvoiceDetailsDialog({
  open,
  onOpenChange,
  facilityId,
  invoice,
}: EditInvoiceDetailsDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_terms: invoice.payment_terms ?? "",
      note: invoice.note ?? "",
      issue_date: invoice.issue_date ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        payment_terms: invoice.payment_terms ?? "",
        note: invoice.note ?? "",
        issue_date: invoice.issue_date ?? "",
      });
    }
  }, [open, invoice, form]);

  const { mutate: updateInvoice, isPending } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId: invoice.id },
    }),
    onSuccess: () => {
      toast.success(t("invoice_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoice.id] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: InvoiceCreate = {
      status: invoice.status,
      account: invoice.account.id,
      charge_items: invoice.charge_items.map((item) => item.id),
      payment_terms: values.payment_terms || "",
      note: values.note || "",
      issue_date: values.issue_date || undefined,
    };
    updateInvoice(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("edit_invoice_details")}</DialogTitle>
          <DialogDescription>
            {t("edit_invoice_details_description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("issue_date")}</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      id="invoice-issue-date"
                      value={field.value}
                      onDateChange={(val) => field.onChange(val ?? "")}
                      disabled={isPending}
                      blockDate={(date) => date > new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment_terms")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isPending}
                      placeholder={t("payment_terms_placeholder")}
                      rows={3}
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
                      disabled={isPending}
                      placeholder={t("invoice_note_placeholder")}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? t("saving") : t("save_changes")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
