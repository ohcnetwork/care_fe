import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  /** When provided, the sheet edits this responsibility; otherwise it creates a new one. */
  org?: Organization;
  trigger: ReactNode;
}

export default function ResponsibilityFormSheet({ org, trigger }: Props) {
  const { t } = useTranslation();
  const isEditMode = !!org;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, { message: t("field_required") }),
        description: z.string().optional(),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: org?.name || "",
        description: org?.description || "",
      });
    }
  }, [form, org, open]);

  const { mutate: createOrganization, isPending: isCreating } = useMutation({
    mutationFn: (body: OrganizationCreate) =>
      mutate(organizationApi.create, { body })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success(t("organization_created_successfully"));
      setOpen(false);
      form.reset();
    },
  });

  const { mutate: updateOrganization, isPending: isUpdating } = useMutation({
    mutationFn: (body: OrganizationUpdate) =>
      mutate(organizationApi.update, {
        pathParams: { id: org?.id },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success(t("organizations_updated_successfully"));
      setOpen(false);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      org_type: OrgType.ROLE,
    };

    if (isEditMode) {
      updateOrganization(data);
    } else {
      createOrganization(data);
    }
  };

  const isPending = isCreating || isUpdating;

  const title = isEditMode
    ? t("edit_role_organization")
    : t("create_role_organization");
  const description = isEditMode
    ? t("responsibility_form_edit_description")
    : t("responsibility_form_create_description");

  const cancelButton = (
    <Button
      type="button"
      variant="outline"
      onClick={() => setOpen(false)}
      disabled={isPending}
    >
      {t("cancel")}
    </Button>
  );

  const submitButton = (
    <Button type="submit" disabled={isPending}>
      <Check className="mr-1.5 size-4" />
      {isPending
        ? isEditMode
          ? t("updating")
          : t("creating")
        : isEditMode
          ? t("update")
          : t("create")}
    </Button>
  );

  const formBody = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <SheetBody>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-required
                      placeholder={t("responsibility_form_name_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t(
                        "responsibility_form_description_placeholder",
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SheetBody>
        <SheetFooter>
          {cancelButton}
          {submitButton}
        </SheetFooter>
      </form>
    </Form>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent size="md" className="overflow-hidden">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {formBody}
      </SheetContent>
    </Sheet>
  );
}
