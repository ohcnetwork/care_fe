import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FacilityOrganization,
  FacilityOrganizationCreate,
  FacilityOrganizationEdit,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface Props {
  facilityId: string;
  parentId?: string;
  org?: FacilityOrganization;
}

const ORG_TYPES = [
  { value: "dept", label: "department" },
  { value: "team", label: "team" },
] as const;

type OrgType = (typeof ORG_TYPES)[number]["value"];

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("field_required") }),
  description: z.string().optional(),
  org_type: z.enum(["dept", "team"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function FacilityOrganizationFormSheet({
  facilityId,
  parentId,
  org,
}: Props) {
  const isEditMode = !!org;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      org_type: "dept" as OrgType,
    },
  });

  useEffect(() => {
    if (isEditMode && org) {
      form.reset({
        name: org.name || "",
        description: org.description || "",
        org_type: org.org_type as OrgType,
      });
    }
  }, [isEditMode, org, open]);

  const { mutate: createOrganization, isPending: isCreating } = useMutation({
    mutationFn: (body: FacilityOrganizationCreate) =>
      mutate(facilityOrganizationApi.create, {
        pathParams: { facilityId },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization", "list", facilityId, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getCurrentUser"],
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
    mutationFn: (body: FacilityOrganizationEdit) =>
      mutate(facilityOrganizationApi.update, {
        pathParams: { facilityId, organizationId: org?.id },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization", "list", facilityId, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getCurrentUser"],
      });
      toast.success(t("organization_updated_successfully"));
      setOpen(false);
    },
  });

  const onSubmit = (values: FormValues) => {
    const data = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      org_type: values.org_type,
      parent: parentId,
    };

    if (isEditMode) {
      updateOrganization({ ...data, facility: facilityId });
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
            {t("add_department_team")}
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
                  <FormLabel>{t("name")}</FormLabel>
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
              name="org_type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>{t(`type`)}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("select_organization_type")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ORG_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <Button type="submit" className="w-full" disabled={isPending}>
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
