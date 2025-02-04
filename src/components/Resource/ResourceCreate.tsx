import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Card from "@/CAREUI/display/Card";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";

interface ResourceProps {
  facilityId: number;
}

export default function ResourceCreate(props: ResourceProps) {
  const { goBack } = useAppHistory();
  const { facilityId } = props;
  const { t } = useTranslation();
  const [{ related_patient }] = useQueryParams();
  const authUser = useAuthUser();

  const resourceFormSchema = z.object({
    category: z.string().min(1, { message: t("field_required") }),
    assigned_facility: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
    emergency: z.enum(["true", "false"]),
    title: z.string().min(1, { message: t("field_required") }),
    reason: z.string().min(1, { message: t("field_required") }),
    referring_facility_contact_name: z
      .string()
      .min(1, { message: t("field_required") }),
    referring_facility_contact_number: validators.phoneNumber.required,
    priority: z.number().default(1),
  });

  type ResourceFormValues = z.infer<typeof resourceFormSchema>;

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: () =>
      query(routes.getAnyFacility, {
        pathParams: { id: String(facilityId) },
      }),
    enabled: !!facilityId,
  });

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      category: "",
      assigned_facility: null,
      emergency: "false" as const,
      title: "",
      reason: "",
      referring_facility_contact_name: "",
      referring_facility_contact_number: "",
      priority: 1,
    },
  });

  const { mutate: createResource, isPending } = useMutation({
    mutationFn: mutate(routes.createResource),
    onSuccess: (data: ResourceRequest) => {
      toast.success(t("resource_created_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`);
    },
  });

  const onSubmit = (data: ResourceFormValues) => {
    createResource({
      status: "PENDING",
      category: data.category,
      origin_facility: String(props.facilityId),
      assigned_facility: data.assigned_facility?.id || null,
      approving_facility: null,
      emergency: data.emergency === "true",
      title: data.title,
      reason: data.reason,
      referring_facility_contact_name: data.referring_facility_contact_name,
      referring_facility_contact_number: data.referring_facility_contact_number,
      related_patient: related_patient,
      priority: data.priority,
    });
  };

  const fillMyDetails = () => {
    form.setValue(
      "referring_facility_contact_name",
      `${authUser.first_name} ${authUser.last_name}`.trim(),
    );
    if (authUser.phone_number) {
      form.setValue("referring_facility_contact_number", authUser.phone_number);
    }
  };

  if (isPending) {
    return <Loading />;
  }

  return (
    <Page
      title={t("create_resource_request")}
      crumbsReplacements={{
        [facilityId]: { name: facilityData?.name || "" },
        resource: { style: "pointer-events-none" },
      }}
      backUrl={`/facility/${facilityId}`}
    >
      <div className="container mx-auto max-w-4xl">
        <Card className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {related_patient && (
                <Alert>
                  <div className="flex items-center gap-2">
                    <CareIcon icon="l-user" className="h-5 w-5 text-blue-700" />
                    <AlertDescription className="text-sm text-blue-700">
                      {t("linked_patient")}:{" "}
                      <span className="font-medium">{related_patient}</span>
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("basic_information")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("resource_request_basic_info_description")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="assigned_facility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {t("facility_for_care_support")}
                        </FormLabel>
                        <FormControl>
                          <FacilitySelect
                            multiple={false}
                            name="assigned_facility"
                            selected={field.value}
                            setSelected={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("select_facility_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t("is_this_an_emergency")}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="true" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("yes")}
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="false" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t("no")}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          {t("emergency_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("category")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_category")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESOURCE_CATEGORY_CHOICES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("category_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("request_details")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("resource_request_details_description")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("request_title")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("request_title_placeholder")}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("request_title_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("request_reason")}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t("request_reason_placeholder")}
                          onChange={(value) => field.onChange(value)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("request_reason_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {t("contact_information")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("contact_information_description")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fillMyDetails}
                    className="shrink-0"
                  >
                    <CareIcon icon="l-user" className="mr-2 h-4 w-4" />
                    {t("fill_my_details")}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="referring_facility_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("contact_person")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("contact_person_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referring_facility_contact_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("contact_phone")}</FormLabel>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("contact_phone_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-4 border-t bg-background pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goBack()}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" variant="default" disabled={isPending}>
                  {isPending && (
                    <CareIcon
                      icon="l-spinner"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                  )}
                  {isPending ? t("submitting") : t("submit")}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Page>
  );
}
