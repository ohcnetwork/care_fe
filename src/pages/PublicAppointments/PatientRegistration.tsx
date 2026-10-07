import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import RadioInput from "@/components/ui/RadioInput";
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
import { Textarea } from "@/components/ui/textarea";

import GovtOrganizationPicker from "@/components/Organization/GovtOrganizationPicker";

import { usePatientContext } from "@/hooks/usePatientUser";

import { GENDERS, GENDER_TYPES } from "@/common/constants";
import { validateName } from "@/common/validation";

import { usePubSub } from "@/Utils/pubsubContext";
import mutate from "@/Utils/request/mutate";
import { dateQueryString } from "@/Utils/utils";
import validators from "@/Utils/validators";
import { PublicPatientRead } from "@/types/emr/patient/patient";
import publicPatientApi from "@/types/emr/patient/publicPatientApi";
import { Organization } from "@/types/organization/organization";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { PublicAppointment } from "@/types/scheduling/schedule";

const MIN_GEO_ORG_LEVELS =
  careConfig.patientRegistration.minGeoOrganizationLevelsRequired;

/**
 * Mirrors the staff registration rule: with a configured depth the selection
 * must reach it, otherwise it must bottom out at a leaf organization.
 */
function isGeoOrganizationComplete(organization: Organization): boolean {
  if (MIN_GEO_ORG_LEVELS != null) {
    return organization.level_cache + 1 >= MIN_GEO_ORG_LEVELS;
  }
  return !organization.has_children;
}

type PatientRegistrationProps = {
  /**
   * Both are absent when a patient adds a family member from the profile
   * picker rather than mid-booking. In that case no appointment is created and
   * we return to the picker once the profile exists.
   */
  facilityId?: string;
  staffId?: string;
};

export default function PublicPatientRegistration(
  props: PatientRegistrationProps,
) {
  const { staffId, facilityId } = props;
  const { t } = useTranslation();
  const [{ slotId, reason }] = useQueryParams();

  const isBookingFlow = !!facilityId && !!staffId;
  const backTo = isBookingFlow
    ? `/facility/${facilityId}/appointments/${staffId}/book-appointment`
    : "/patient/select-profile";

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
      gender: z.enum(GENDERS, { error: t("gender_is_required") }),
      address: z.string().min(1, t("field_required")),
      age: z.string().optional(),
      date_of_birth: z.date().or(z.string()).optional(),
      pincode: validators().pincode,
      geo_organization: z.string().min(1, t("organization_required")),
      ageInputType: z.enum(["age", "date_of_birth"]),
    })
    .superRefine((data, ctx) => {
      const field = data.ageInputType === "age" ? "age" : "date_of_birth";
      if (!data[field]) {
        ctx.addIssue({
          code: "custom",
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
          code: "custom",
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
      address: "",
    },
  });

  const { mutate: createAppointment, isPending: isCreatingAppointment } =
    useMutation({
      mutationFn: mutate(PublicAppointmentApi.createAppointment, {
        pathParams: { id: slotId },
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      }),
      onSuccess: (data: PublicAppointment) => {
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

  // useWatch rather than form.watch(): watch() returns a function the React
  // Compiler cannot memoize, so it bails out of optimising this component.
  const ageInputType = useWatch({
    control: form.control,
    name: "ageInputType",
  });
  const enteredAge = useWatch({ control: form.control, name: "age" });

  const [geoOrganization, setGeoOrganization] = useState<Organization | null>(
    null,
  );
  const [hasSaved, setHasSaved] = useState(false);

  const { mutate: createPatient, isPending: isCreatingPatient } = useMutation({
    mutationFn: mutate(publicPatientApi.create, {
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
    }),
    onSuccess: (data: PublicPatientRead) => {
      setHasSaved(true);
      toast.success(t("patient_created_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["patients"],
      });
      publish("patient:upsert", data);
      if (!isBookingFlow) {
        patientUserContext?.setSelectedPatient(data);
        navigate("/patient/select-profile", { replace: true });
        return;
      }
      createAppointment({
        patient: data.id,
        note: reason.trim() ?? "",
      });
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const formattedData = {
      name: data.name,
      gender: data.gender,
      address: data.address || "",
      date_of_birth:
        data.ageInputType === "date_of_birth"
          ? dateQueryString(data.date_of_birth)
          : undefined,
      age: data.ageInputType === "age" ? Number(data.age) : undefined,
      pincode: data.pincode,
      geo_organization: data.geo_organization,
    };
    createPatient(formattedData);
  });

  // TODO: Use useBlocker hook after switching to tanstack router
  // https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#how-do-i-use-navigation-blocking
  //
  // `hasSaved` and `isCreatingPatient` both matter: outside the booking flow no
  // appointment is ever created, so guarding on `isCreatingAppointment` alone
  // left the form dirty and prompted "unsaved changes" on a successful save.
  useNavigationPrompt(
    form.formState.isDirty &&
      !isCreatingPatient &&
      !isCreatingAppointment &&
      !hasSaved,
    t("unsaved_changes"),
  );

  // const [showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);

  return (
    // Same 480px column as the rest of the patient app; this page used to rely
    // on the old sidebar shell for its background and lost it with the switch
    // to per-page chrome.
    <div className="flex min-h-dvh justify-center bg-gray-100">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="flex w-full flex-col bg-gray-50 sm:min-h-0"
        >
          <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2.5 border-b border-gray-200 bg-white px-4 py-3 sm:rounded-t-3xl">
            <button
              type="button"
              onClick={() => navigate(backTo)}
              aria-label={t("back")}
              className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="size-5" strokeWidth={1.9} />
            </button>
            <img
              src={careConfig.mainLogo?.dark}
              alt={t("care")}
              className="h-6 w-auto shrink-0"
            />
            <h1 className="ml-auto min-w-0 truncate text-base font-bold tracking-tight text-gray-900">
              {t("patient_registration")}
            </h1>
          </header>

          <div className="flex min-w-0  flex-col lg:flex-row gap-3 p-4 lg:mx-auto">
            <div className="flex flex-col lg:min-w-md gap-5 rounded-2xl border border-gray-200 bg-white p-4">
              <span className="rounded-xl bg-primary-50 px-3.5 py-3 text-xs text-primary-800">
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
                      <Input {...field} placeholder={t("type_name")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel aria-required>{t("sex")}</FormLabel>
                    <FormControl>
                      <RadioInput
                        {...field}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-2"
                        options={GENDER_TYPES.map((g) => ({
                          value: g.id,
                          label: t(`GENDER__${g.id}`),
                        }))}
                      />
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
                        <RadioInput
                          {...field}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-2"
                          options={[
                            {
                              value: "date_of_birth",
                              label: t("date_of_birth"),
                            },
                            { value: "age", label: t("age") },
                          ]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {ageInputType === "date_of_birth" && (
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {ageInputType === "age" && (
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>{t("age")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            {...field}
                            placeholder={t("type_patient_age")}
                          />
                        </FormControl>
                        <FormMessage />
                        <span className="text-xs text-gray-500">
                          {t("age_notice")}
                        </span>
                        {enteredAge && (
                          <div className="text-sm font-bold">
                            {Number(enteredAge) <= 0 ? (
                              <span className="text-red-600">
                                {t("invalid_age")}
                              </span>
                            ) : (
                              <span className="text-violet-600">
                                {t("year_of_birth")}:{" "}
                                {new Date().getFullYear() - Number(enteredAge)}
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

            <div className="flex flex-col lg:min-w-md gap-5 rounded-2xl border border-gray-200 bg-white p-4">
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
                      <Input
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          field.onChange(value);
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        type="number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="geo_organization"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormControl>
                      <GovtOrganizationPicker
                        ref={field.ref}
                        aria-invalid={!!fieldState.error}
                        required={MIN_GEO_ORG_LEVELS == null}
                        requiredDepth={MIN_GEO_ORG_LEVELS}
                        authToken={tokenData.token}
                        value={geoOrganization}
                        onChange={(organization) => {
                          setGeoOrganization(organization);
                          field.onChange(
                            organization &&
                              isGeoOrganizationComplete(organization)
                              ? organization.id
                              : "",
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col lg:flex-row gap-3 p-4 lg:mx-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(backTo)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isCreatingPatient}>
              {t("register_patient")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
