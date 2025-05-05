import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate, useNavigationPrompt } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import DateField from "@/components/ui/date-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { usePatientContext } from "@/hooks/usePatientUser";

import { GENDERS, GENDER_TYPES } from "@/common/constants";
import { validateName, validatePincode } from "@/common/validation";

import { usePubSub } from "@/Utils/pubsubContext";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { dateQueryString } from "@/Utils/utils";
import GovtOrganizationSelector from "@/pages/Organization/components/GovtOrganizationSelector";
import { AppointmentPatientRegister } from "@/pages/Patient/Utils";
import { Patient } from "@/types/emr/newPatient";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  Appointment,
  AppointmentCreateRequest,
  TokenSlot,
} from "@/types/scheduling/schedule";

type PatientRegistrationProps = {
  facilityId: string;
  staffId: string;
};

export function PatientRegistration(props: PatientRegistrationProps) {
  const { staffId } = props;
  const selectedSlot = JSON.parse(
    localStorage.getItem("selectedSlot") ?? "",
  ) as TokenSlot;
  const reason = localStorage.getItem("reason");

  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const { publish } = usePubSub();

  const patientUserContext = usePatientContext();
  const tokenData = patientUserContext?.tokenData;

  const patientSchema = z
    .object({
      name: z
        .string()
        .min(1, t("field_required"))
        .refine(validateName, t("min_char_length_error", { min_length: 3 })),
      gender: z.enum(GENDERS, { required_error: t("gender_is_required") }),
      address: z.string().min(1, t("field_required")),
      age: z.string().optional(),
      date_of_birth: z.date().or(z.string()).optional(),
      pincode: z
        .string()
        .min(1, t("field_required"))
        .refine((pincode) => {
          if (!pincode) return true;
          return validatePincode(pincode);
        }, t("invalid_pincode_msg")),
      geo_organization: z
        .string()
        .min(1, t("organization_required"))
        .optional(),
      ageInputType: z.enum(["age", "date_of_birth"]),
    })
    .superRefine((data, ctx) => {
      const field = data.ageInputType === "age" ? "age" : "date_of_birth";
      if (!data[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("field_required"),
          path: [field],
        });
        return;
      }
      if (
        field === "age" &&
        data.age &&
        !isNaN(Number(data.age)) &&
        Number(data.age) < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("age_less_than_0"),
          path: ["age"],
        });
      }
    });

  const formResolver = zodResolver(patientSchema);

  const form = useForm({
    resolver: formResolver,
    defaultValues: {
      name: "",
      ageInputType: "date_of_birth",
      age: undefined,
      date_of_birth: undefined,
      address: "",
      pincode: "",
      geo_organization: undefined,
    },
  });

  const { mutate: createAppointment, isPending: isCreatingAppointment } =
    useMutation({
      mutationFn: (body: AppointmentCreateRequest) =>
        mutate(PublicAppointmentApi.createAppointment, {
          pathParams: { id: selectedSlot?.id },
          body,
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
          },
        })(body),
      onSuccess: (data: Appointment) => {
        toast.success(t("appointment_created_success"));
        queryClient.invalidateQueries({
          queryKey: [
            ["patients", tokenData.phoneNumber],
            ["appointment", tokenData.phoneNumber],
          ],
        });
        navigate(
          `/facility/${props.facilityId}/appointments/${data.id}/success`,
          {
            replace: true,
          },
        );
      },
    });

  const { mutate: createPatient } = useMutation({
    mutationFn: (body: Partial<AppointmentPatientRegister>) =>
      mutate(routes.otp.createPatient, {
        body: { ...body, phone_number: tokenData.phoneNumber },
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      })(body),
    onSuccess: (data: Patient) => {
      toast.success(t("patient_created_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["patients"],
      });
      publish("patient:upsert", data);
      createAppointment({
        patient: data.id,
        reason_for_visit: reason ?? "",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const formattedData = {
      phone_number: tokenData.phoneNumber,
      name: data.name,
      gender: data.gender,
      address: data.address || "",
      date_of_birth:
        data.ageInputType === "date_of_birth"
          ? dateQueryString(data.date_of_birth)
          : undefined,
      age: data.ageInputType === "age" ? data.age : undefined,
      pincode: data.pincode || undefined,
      geo_organization: data.geo_organization,
      is_active: true,
    };
    createPatient(formattedData);
  });

  // TODO: Use useBlocker hook after switching to tanstack router
  // https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#how-do-i-use-navigation-blocking
  useNavigationPrompt(
    form.formState.isDirty && !isCreatingAppointment,
    t("unsaved_changes"),
  );

  // const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);

  return (
    <>
      <div className="container mx-auto p-4 max-w-4xl flex justify-start">
        <Button
          variant="outline"
          className="border border-secondary-400"
          type="button"
          onClick={() =>
            navigate(
              `/facility/${props.facilityId}/appointments/${staffId}/patient-select`,
            )
          }
        >
          <span className="text-sm underline">{t("back")}</span>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={onSubmit} className="mx-auto space-y-6">
          <div className="container mx-auto p-4 max-w-3xl">
            <h2 className="text-xl font-semibold">
              {t("patient_registration")}
            </h2>

            <div className="mt-4 space-y-6 flex flex-col bg-white border border-gray-200/50 rounded-md p-8 shadow-md">
              <span className="inline-block bg-primary-100 p-4 rounded-md w-full mb-4 text-primary-600 text-sm">
                {t("phone_number_verified")}:{" "}
                <span className="font-bold">{tokenData.phoneNumber}</span>
              </span>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel aria-required>{t("patient_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("type_patient_name")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel aria-required>{t("sex")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-5 flex-wrap"
                      >
                        {GENDER_TYPES.map((g) => (
                          <FormItem key={g.id} className="flex">
                            <FormControl>
                              <RadioGroupItem
                                value={g.id}
                                data-cy={`gender-radio-${g.id.toLowerCase()}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t(`GENDER__${g.id}`)}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="ageInputType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel aria-required>
                        {t("date_of_birth_or_age")}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex items-center divide-x divide-secondary-400 bg-white rounded-md w-fit border border-secondary-400"
                        >
                          <div className="flex items-center gap-2 px-4 py-2">
                            <RadioGroupItem
                              id="dob-option"
                              value="date_of_birth"
                            />
                            <Label htmlFor="dob-option">
                              {t("date_of_birth")}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2">
                            <RadioGroupItem id="age-option" value="age" />
                            <Label htmlFor="age-option">{t("age")}</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("ageInputType") === "date_of_birth" && (
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>
                          {t("date_of_birth")}
                        </FormLabel>
                        <FormControl>
                          <DateField
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(dateQueryString(date))
                            }
                            id="dob"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("ageInputType") === "age" && (
                  <FormField
                    control={form.control}
                    name="age"
                    render={() => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>{t("age")}</FormLabel>
                        <FormControl>
                          <Input
                            {...form.register("age")}
                            placeholder={t("type_patient_age")}
                          />
                        </FormControl>
                        <FormMessage />
                        <span className="text-xs text-gray-500">
                          {t("age_notice")}
                        </span>
                        {form.getValues("age") && (
                          <div className="text-sm font-bold">
                            {Number(form.getValues("age")) <= 0 ? (
                              <span className="text-red-600">
                                {t("invalid_age")}
                              </span>
                            ) : (
                              <span className="text-violet-600">
                                {t("year_of_birth")}:{" "}
                                {new Date().getFullYear() -
                                  Number(form.getValues("age"))}
                              </span>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6 mt-12 flex-row bg-white border border-gray-200/50 rounded-md p-8 shadow-md">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel aria-required>{t("current_address")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel aria-required>{t("pincode")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="geo_organization"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormControl>
                      <GovtOrganizationSelector
                        required
                        authToken={tokenData.token}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-secondary-200 pt-3 pb-8">
            <div className="flex flex-row gap-2 justify-center sm:ml-64 mt-4">
              <Button
                variant="white"
                className="sm:w-1/5"
                type="button"
                onClick={() =>
                  navigate(
                    `/facility/${props.facilityId}/appointments/${staffId}/patient-select`,
                  )
                }
              >
                <span className="bg-linear-to-b from-white/15 to-transparent" />
                {t("cancel")}
              </Button>
              <Button
                variant="primary_gradient"
                className="sm:w-1/5"
                type="submit"
              >
                <span className="bg-linear-to-b from-white/15 to-transparent" />
                {t("register_patient")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
