import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import SlideOver from "@/CAREUI/interactive/SlideOver";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import PatientCategorySelect from "@/components/Patient/PatientCategorySelect";

import useAppHistory from "@/hooks/useAppHistory";

import {
  BREATHLESSNESS_LEVEL,
  FACILITY_TYPES,
  PATIENT_CATEGORIES,
  SHIFTING_VEHICLE_CHOICES,
} from "@/common/constants";

// import { phonePreg } from "@/common/validation";
import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { parsePhoneNumber } from "@/Utils/utils";

interface patientShiftProps {
  facilityId: string;
  patientId: string;
  open: boolean;
  setOpen: (state: boolean) => void;
}

export const ShiftCreate = (props: patientShiftProps) => {
  const { goBack } = useAppHistory();
  const { patientId } = props;
  const [isLoading, setIsLoading] = useState(false);
  // const [phoneNumber, setPhoneNumber] = useState("+91");
  const [patientCategory, setPatientCategory] = useState<any>();
  const { t } = useTranslation();

  const shiftSchema = z.object({
    shifting_approving_facility: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
      })
      .nullable(),
    assigned_facility: z
      .object({
        id: z.string().optional(),
        name: z.string().optional(),
      })
      .nullable(),
    emergency: z.enum(["true", "false"]),
    is_up_shift: z.enum(["true", "false"]),
    reason: z
      .string()
      .min(1, "Reason for shifting is mandatory")
      .refine((value) => value.trim().length > 0, {
        message: "Please enter a reason for shifting",
      }),
    vehicle_preference: z.string().optional(),
    comments: z.string().optional(),
    refering_facility_contact_name: z
      .string()
      .min(1, "Name of contact of the current facility"),
    refering_facility_contact_number: z
      .string()
      .regex(/^[0-9]{10}$/, "Please enter a valid phone number"),
    assigned_facility_type: z.string().optional(),
    preferred_vehicle_choice: z.string().optional(),
    breathlessness_level: z.string().optional(),
    patient_category: z.string().optional(),
    ambulance_driver_name: z.string().optional(),
    ambulance_phone_number: z
      .string()
      .regex(/^[0-9]{10}$/, "Please enter a valid phone number")
      .optional(),
    ambulance_number: z.string().optional(),
  });

  type ShiftFormData = z.infer<typeof shiftSchema>;
  const formResolver = zodResolver(shiftSchema);

  const initForm: ShiftFormData = {
    shifting_approving_facility: null,
    assigned_facility: null,
    emergency: "false",
    is_up_shift: "true",
    reason: "",
    vehicle_preference: "",
    comments: "",
    refering_facility_contact_name: "",
    refering_facility_contact_number: "",
    assigned_facility_type: "",
    preferred_vehicle_choice: "",
    breathlessness_level: "",
    patient_category: "",
    ambulance_driver_name: "",
    ambulance_phone_number: "",
    ambulance_number: "",
  };

  const form = useForm<ShiftFormData>({
    resolver: formResolver,
    defaultValues: initForm,
  });

  const { data: patientData } = useQuery({
    queryKey: ["getPatient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientData) {
      const patient_category =
        patientData.last_consultation?.last_daily_round?.patient_category ??
        patientData.last_consultation?.category;

      const matchedCategory = PATIENT_CATEGORIES.find(
        (c) => c.text === patient_category,
      )?.id;

      setPatientCategory(matchedCategory);
    }
  }, [patientData]);

  const handleSubmit = async (data: ShiftFormData) => {
    setIsLoading(true);

    const payload = {
      ...data,
      status: careConfig.wartimeShifting ? "PENDING" : "APPROVED",
      origin_facility: props.facilityId,
      shifting_approving_facility:
        data.shifting_approving_facility?.id || undefined,
      assigned_facility: data?.assigned_facility?.id || undefined,
      assigned_facility_external: !data?.assigned_facility?.id
        ? data?.assigned_facility?.name || undefined
        : undefined,
      patient: props.patientId,
      emergency: data.emergency === "true",
      is_up_shift: data.is_up_shift === "true",
      reason: data.reason,
      vehicle_preference: data.vehicle_preference,
      comments: data.comments,
      assigned_facility_type: data.assigned_facility_type || undefined,
      preferred_vehicle_choice: data.preferred_vehicle_choice || undefined,
      refering_facility_contact_name: data.refering_facility_contact_name,
      refering_facility_contact_number: parsePhoneNumber(
        data.refering_facility_contact_number,
      ),
      breathlessness_level: data.breathlessness_level,
      patient_category: patientCategory,
      ambulance_driver_name: data.ambulance_driver_name,
      ambulance_phone_number: parsePhoneNumber(
        data.ambulance_phone_number || "",
      ),
      ambulance_number: data.ambulance_number,
    };

    await request(routes.createShift, {
      body: payload,
      onResponse: ({ res, data }) => {
        setIsLoading(false);
        if (res?.ok && data) {
          form.reset();
          Notification.Success({ msg: "Shift request created successfully" });
          goBack(`/shifting/${data.id}`);
        }
      },
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SlideOver
      open={props.open}
      setOpen={props.setOpen}
      title="Create Shift Request"
      slideFrom="right"
      dialogClass="md:w-[780px] rounded-none bg-secondary-100"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mx-auto space-y-6"
        >
          <div className="flex flex-col">
            <div className="lg:grid gap-4 lg:grid-cols-2 m-3">
              <FormField
                control={form.control}
                name="refering_facility_contact_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel required>
                      {t("Name of Contact person at the current facility")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("refering_facility_contact_name")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refering_facility_contact_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("Contact Number of Referring Facility")}
                    </FormLabel>
                    <FormControl>
                      <PhoneNumberFormField
                        value={field.value}
                        onChange={(newValue) => field.onChange(newValue)}
                        required
                        types={["mobile", "landline"]}
                        placeholder={t("Enter Contact Number")}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {careConfig.wartimeShifting && (
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="shifting_approving_facility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {t("Name of shifting approving facility")}
                        </FormLabel>
                        <FormControl>
                          <FacilitySelect
                            {...field}
                            required
                            multiple={false}
                            facilityType={1300}
                            selected={field.value}
                            setSelected={(value) => field.onChange(value)}
                            placeholder={t("Select a facility")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="assigned_facility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("what_facility_assign_the_patient_to")}
                      </FormLabel>
                      <FormControl>
                        <FacilitySelect
                          {...field}
                          required
                          multiple={false}
                          selected={field.value}
                          setSelected={(value) => field.onChange(value)}
                          freeText={true}
                          placeholder={t("Select a facility")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="emergency"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === "true"}
                        onCheckedChange={(value) =>
                          field.onChange(value ? "true" : "false")
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is an emergency</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_up_shift"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === "true"}
                        onCheckedChange={(value) =>
                          field.onChange(value ? "true" : "false")
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is an upshift</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Patient Category")}</FormLabel>
                    <FormControl>
                      <PatientCategorySelect
                        {...field}
                        required
                        value={patientCategory}
                        onChange={(e) => setPatientCategory(e.value)}
                        label={t("Patient Category")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {careConfig.wartimeShifting && (
                <>
                  <FormField
                    control={form.control}
                    name="preferred_vehicle_choice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Preferred Vehicle")}</FormLabel>
                        <FormControl>
                          <SelectFormField
                            {...field}
                            required
                            label={t("Preferred Vehicle")}
                            options={SHIFTING_VEHICLE_CHOICES}
                            optionLabel={(option) => option.text}
                            optionValue={(option) => option.text}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigned_facility_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Preferred Facility Type")}</FormLabel>
                        <FormControl>
                          <SelectFormField
                            {...field}
                            required
                            label={t("Preferred Facility Type")}
                            options={FACILITY_TYPES}
                            optionLabel={(option) => option.text}
                            optionValue={(option) => option.text}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="breathlessness_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Severity of Breathlessness")}</FormLabel>
                        <FormControl>
                          <SelectFormField
                            {...field}
                            required
                            label={t("Severity of Breathlessness")}
                            options={BREATHLESSNESS_LEVEL}
                            optionLabel={(option) => option}
                            optionValue={(option) => option}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="ambulance_driver_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel required>Name of ambulance driver</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Name of ambulance driver"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <PhoneNumberFormField
                {...field("ambulance_phone_number")}
                label="Ambulance Phone Number"
                types={["mobile", "landline"]}
              /> */}
              <FormField
                control={form.control}
                name="ambulance_phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Ambulance Phone Number")}</FormLabel>
                    <FormControl>
                      <PhoneNumberFormField
                        {...field}
                        required
                        types={["mobile", "landline"]}
                        placeholder={t("Enter Contact Number")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ambulance_number"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel required>Ambulance No.</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ambulance No." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Any other comments</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder="Type any extra comments here"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel required>Reason for shift</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder="Type your reason here"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
              <Button variant="outline" onClick={() => goBack()}>
                {t("cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {t("submit")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </SlideOver>
  );
};
