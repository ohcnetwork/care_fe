import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  OrgType,
  Organization,
  OrganizationCreate,
  OrganizationEdit,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  organizationType: string;
  parentId?: string;
  org?: Organization;
}

export default function AdminOrganizationFormSheet({
  organizationType,
  parentId,
  org,
}: Props) {
  const { t } = useTranslation();

  const isEditMode = !!org;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const formSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: t("field_required") }),
    description: z.string().optional(),
    org_type: z.nativeEnum(OrgType),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      org_type: organizationType as OrgType,
    },
  });

  useEffect(() => {
    if (isEditMode && org) {
      form.reset({
        name: org.name || "",
        description: org.description || "",
        org_type: org.org_type as OrgType,
      });
    } else if (!isEditMode && open) {
      form.reset({
        name: "",
        description: "",
        org_type: organizationType as OrgType,
      });
    }
  }, [isEditMode, org, open, organizationType]);

  const { mutate: createOrganization, isPending: isCreating } = useMutation({
    mutationFn: (body: OrganizationCreate) =>
      mutate(organizationApi.create, {
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "list", organizationType, parentId],
      });
      toast.success(t("organization_created_successfully"));
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const { mutate: updateOrganization, isPending: isUpdating } = useMutation({
    mutationFn: (body: OrganizationEdit) =>
      mutate(organizationApi.update, {
        pathParams: { id: org?.id },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization", "list", organizationType, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", org?.id],
      });
      toast.success(t("organization_updated_successfully"));
      setOpen(false);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      org_type: values.org_type,
      parent: parentId,
    };

    if (isEditMode) {
      updateOrganization({ ...data, parent_id: parentId });
    } else {
      createOrganization(data);
    }
  };

  const isPending = isCreating || isUpdating;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEditMode ? (
          <Button variant="white" size="sm" className="font-semibold">
            {t("edit")}
          </Button>
        ) : (
          <Button>
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("add_organization")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEditMode
              ? t("edit_department_team")
              : t("create_department_team")}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? t("edit_department_team_description")
              : t("create_department_team_description")}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel aria-required>{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("enter_department_team_name")}
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
                      placeholder={t("enter_department_team_description")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending
                ? isEditMode
                  ? t("updating")
                  : t("creating")
                : isEditMode
                  ? t("update_organization")
                  : t("create_organization")}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
