import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { valuesOf } from "@/Utils/utils";
import BecknFlow from "@/components/Resource/beckn/BecknFlow";
import { cn } from "@/lib/utils";
import {
  becknPatientFrom,
  healthServiceTypeForCategory,
} from "@/types/beckn/becknModels";
import patientApi from "@/types/emr/patient/patientApi";
import {
  getResourceRequestCategoryEnum,
  RESOURCE_REQUEST_STATUS_OPTIONS,
  ResourceRequestCategory,
  ResourceRequestRead,
  ResourceRequestStatus,
} from "@/types/resourceRequest/resourceRequest";
import resourceRequestApi from "@/types/resourceRequest/resourceRequestApi";

interface ResourceProps {
  facilityId: string;
  id?: string;
}

// Consultation discover searches the network for Care Coordination Desks; the
// user then picks which desk/facility to assign the referral to.
const COORDINATION_DESK_SEARCH = "Care Coordination Desk";

const CATEGORY_ICONS: Record<string, IconName> = {
  [ResourceRequestCategory.PATIENT_CARE]: "l-heart-medical",
  [ResourceRequestCategory.COMFORT_DEVICES]: "l-bed",
  [ResourceRequestCategory.MEDICINES]: "l-capsule",
  [ResourceRequestCategory.FINANCIAL]: "l-money-bill",
  [ResourceRequestCategory.OTHER]: "l-microscope",
};

/**
 * Minimal resource-request form for the Care Coordination Network flow.
 *
 * Exposes only the linked patient (read-only, taken from the
 * `related_patient` query param), status, category and title. All other fields the backend accepts as optional are
 * sent with safe defaults so the create/update flow continues unchanged.
 */
export default function ResourceForm({ facilityId, id }: ResourceProps) {
  const { t } = useTranslation();
  const [{ related_patient }] = useQueryParams();

  const resourceFormSchema = z.object({
    status: z.enum(ResourceRequestStatus),
    category: z.enum(ResourceRequestCategory),
    title: z.string().min(1, { message: t("field_required") }),
  });

  type ResourceFormValues = z.infer<typeof resourceFormSchema>;

  const { data: patientData } = useQuery({
    queryKey: ["patient", related_patient],
    queryFn: query(patientApi.get, {
      pathParams: { id: String(related_patient) },
    }),
    enabled: !!related_patient,
  });

  const { data: resourceData } = useQuery({
    queryKey: ["resource_request", id],
    queryFn: query(resourceRequestApi.get, {
      pathParams: { resourceRequestId: String(id) },
    }),
    enabled: !!id,
  });

  const form = useForm({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      status: ResourceRequestStatus.PENDING,
      title: "",
    },
  });

  useEffect(() => {
    if (resourceData) {
      form.reset({
        status: resourceData.status,
        category: getResourceRequestCategoryEnum(resourceData.category),
        title: resourceData.title,
      });
    }
  }, [resourceData, form]);

  // Consultation referrals are created by the backend during the Beckn flow (not
  // by a direct POST) to avoid duplicating the ResourceRequest: `init` mints the
  // referral and creates the request, and the origin facility then fires
  // `confirm` to finalise it. Submitting a NEW request starts that flow;
  // `flowIntent` holds the discover parameters.
  const [flowIntent, setFlowIntent] = useState<{
    textSearch?: string;
    healthServiceType?: string;
    title?: string;
  } | null>(null);

  const { mutate: updateResource, isPending: isUpdatePending } = useMutation({
    mutationFn: mutate(resourceRequestApi.update, {
      pathParams: { resourceRequestId: String(id) },
    }),
    onSuccess: (data: ResourceRequestRead) => {
      toast.success(t("resource_updated_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`, {
        replace: true,
      });
    },
  });

  // Clinical Care and Social Support (`patient_care`) is fulfilled by the
  // facility itself, so it posts the request directly — no network referral.
  const { mutate: createResource, isPending: isCreatePending } = useMutation({
    mutationFn: mutate(resourceRequestApi.create),
    onSuccess: (data: ResourceRequestRead) => {
      toast.success(t("resource_created_successfully"));
      navigate(
        related_patient
          ? `/facility/${facilityId}/patient/${related_patient}/resource_requests`
          : `/facility/${facilityId}/resource/${data.id}`,
        { replace: true },
      );
    },
  });

  const isPending = isUpdatePending || isCreatePending;

  // New network-referral requests continue into the coordination-desk flow
  // after submit, so the button says Continue; direct creates and updates
  // finish in one step.
  const watchedCategory = form.watch("category");
  const submitLabel =
    !id &&
    watchedCategory &&
    watchedCategory !== ResourceRequestCategory.PATIENT_CARE
      ? t("continue")
      : t("submit");

  const onSubmit = (data: ResourceFormValues) => {
    const resourcePayload = {
      status: data.status,
      category: data.category,
      title: data.title,
      origin_facility: String(facilityId),
      assigned_facility: null,
      assigned_to: null,
      approving_facility: null,
      emergency: false,
      reason: "",
      referring_facility_contact_name: "",
      referring_facility_contact_number: "",
      related_patient: related_patient ?? null,
      priority: 1,
    };

    if (id) {
      updateResource({ ...resourcePayload });
    } else if (data.category === ResourceRequestCategory.PATIENT_CARE) {
      createResource(resourcePayload);
    } else {
      setFlowIntent({
        textSearch: COORDINATION_DESK_SEARCH,
        healthServiceType: healthServiceTypeForCategory(data.category),
        title: data.title,
      });
    }
  };

  if (isPending) {
    return <Loading />;
  }

  if (flowIntent && !id) {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <PageTitle title={t("create_resource_request")} />
        <Separator />
        {patientData?.name ? <PatientBanner name={patientData.name} /> : null}
        <BecknFlow
          serviceType="consultation"
          facilityId={String(facilityId)}
          patient={becknPatientFrom(patientData)}
          discover={flowIntent}
          title={flowIntent.title}
          autoStart
          onConfirmed={() => {
            toast.success(t("resource_created_successfully"));
            navigate(
              `/facility/${facilityId}/patient/${related_patient}/resource_requests`,
            );
          }}
        />
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setFlowIntent(null)}>
            {t("ccn_back_to_form")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <PageTitle
        title={id ? t("update_resource_request") : t("create_resource_request")}
      />
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {patientData?.name ? (
            <PatientBanner
              name={patientData.name}
              href={`/facility/${facilityId}/patient/${related_patient}/resource_requests`}
            />
          ) : null}

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("category")}</FormLabel>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {valuesOf(ResourceRequestCategory).map((category) => {
                    const selected = field.value === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => field.onChange(category)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                          selected
                            ? "border-primary-600 bg-primary-50"
                            : "border-gray-200 hover:bg-gray-50",
                        )}
                      >
                        <CareIcon
                          icon={CATEGORY_ICONS[category] ?? "l-medkit"}
                          className={cn(
                            "size-5 shrink-0",
                            selected ? "text-primary-700" : "text-gray-400",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            selected ? "text-primary-900" : "text-gray-900",
                          )}
                        >
                          {t(`resource_request_category__${category}`)}
                        </span>
                        {selected ? (
                          <CareIcon
                            icon="l-check"
                            className="ml-auto size-4 shrink-0 text-primary-700"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {!id && field.value ? (
                  <FormDescription className="flex items-center gap-1.5">
                    <CareIcon
                      icon={
                        field.value === ResourceRequestCategory.PATIENT_CARE
                          ? "l-building"
                          : "l-globe"
                      }
                      className="size-3.5 shrink-0"
                    />
                    {field.value === ResourceRequestCategory.PATIENT_CARE
                      ? t("resource_category_direct_hint")
                      : t("resource_category_network_hint")}
                  </FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("request_title")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("request_title_placeholder")}
                    onChange={(value) => field.onChange(value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="sm:max-w-xs">
                <FormLabel aria-required>{t("status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger ref={field.ref}>
                      <SelectValue placeholder={t("select_status")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RESOURCE_REQUEST_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.text} value={option.text}>
                        {t(`resource_request_status__${option.text}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
            <BackButton variant="outline">{t("cancel")}</BackButton>
            <Button
              type="submit"
              variant="primary"
              disabled={id ? isPending || !form.formState.isDirty : isPending}
            >
              {isPending && (
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {isPending ? t("submitting") : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

/**
 * Linked-patient context strip, styled like the appointment wizard's patient
 * chip. With `href` it links to the patient's resource requests.
 */
function PatientBanner({ name, href }: { name: string; href?: string }) {
  const { t } = useTranslation();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?";

  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-800">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-gray-500">
          {t("linked_patient")}
        </span>
        <span className="block truncate text-sm font-medium">{name}</span>
      </span>
      {href ? (
        <CareIcon
          icon="l-angle-right-b"
          className="ml-auto size-4 shrink-0 text-gray-400"
        />
      ) : null}
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-lg border bg-gray-50 p-3";
  return href ? (
    <Link href={href} className={cn(className, "hover:bg-gray-100")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
