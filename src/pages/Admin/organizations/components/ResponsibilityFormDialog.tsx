import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { ReactNode, useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useIsMobile } from "@/hooks/use-mobile";

import mutate from "@/Utils/request/mutate";
import {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  /** When provided, the dialog edits this responsibility; otherwise it creates a new one. */
  org?: Organization;
  trigger: ReactNode;
}

export default function ResponsibilityFormDialog({ org, trigger }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isEditMode = !!org;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const formId = useId();

  const formSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t("field_required") }),
    description: z.string().optional(),
  });

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

  const formBody = (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
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
                  placeholder={t("responsibility_form_description_placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

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
    <Button type="submit" form={formId} disabled={isPending}>
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

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{formBody}</div>
          <DrawerFooter>
            {submitButton}
            {cancelButton}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {formBody}
        <DialogFooter>
          {cancelButton}
          {submitButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
