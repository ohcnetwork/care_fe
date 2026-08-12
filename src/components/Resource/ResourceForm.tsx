import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { valuesOf } from "@/Utils/utils";
import BecknFlow from "@/components/Resource/beckn/BecknFlow";
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
    } else {
      setFlowIntent({
        textSearch: COORDINATION_DESK_SEARCH,
        healthServiceType: healthServiceTypeForCategory(data.category),
        title: data.title,
      });
    }
  };

  if (isUpdatePending) {
    return <Loading />;
  }

  if (flowIntent && !id) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <PageTitle title={t("create_resource_request")} />
        <Separator />
        {patientData ? (
          <Alert>
            <div className="flex items-center gap-2">
              <CareIcon icon="l-user" className="size-5 text-blue-700" />
              <AlertDescription className="text-sm text-blue-700">
                {t("linked_patient")}:{" "}
                <strong className="font-medium">{patientData.name}</strong>
              </AlertDescription>
            </div>
          </Alert>
        ) : null}
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
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <PageTitle
        title={id ? t("update_resource_request") : t("create_resource_request")}
      />
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {patientData && (
            <Alert>
              <div className="flex items-center gap-2">
                <Link
                  href={`/facility/${facilityId}/patient/${related_patient}/resource_requests`}
                  className="flex items-center gap-2"
                >
                  <CareIcon icon="l-user" className="size-5 text-blue-700" />
                  <AlertDescription className="text-sm text-blue-700 whitespace-nowrap">
                    <span>
                      {t("linked_patient")}:{" "}
                      <strong className="font-medium">
                        {patientData.name}
                      </strong>
                    </span>
                  </AlertDescription>
                </Link>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
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

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("category")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger ref={field.ref}>
                        <SelectValue placeholder={t("category_description")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {valuesOf(ResourceRequestCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`resource_request_category__${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
            <BackButton variant="outline">{t("cancel")}</BackButton>
            <Button
              type="submit"
              variant="primary"
              disabled={id ? isUpdatePending || !form.formState.isDirty : false}
            >
              {isUpdatePending && (
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {isUpdatePending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
