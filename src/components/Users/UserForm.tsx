import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
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
import { PasswordInput } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ValidationHelper,
  validateRule,
} from "@/components/Users/UserFormValidations";

import { GENDER_TYPES, NAME_PREFIXES } from "@/common/constants";
import { GENDERS } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import GovtOrganizationSelector from "@/pages/Organization/components/GovtOrganizationSelector";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { CreateUserModel, UpdateUserModel, UserBase } from "@/types/user/user";
import userApi from "@/types/user/userApi";

interface Props {
  onSubmitSuccess?: (user: UserBase) => void;
  existingUsername?: string;
  organizationId?: string;
}

export default function UserForm({
  onSubmitSuccess,
  existingUsername,
  organizationId,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = !!existingUsername;
  const queryClient = useQueryClient();
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);

  const userFormSchema = z
    .object({
      user_type: isEditMode
        ? z
            .enum(["doctor", "nurse", "staff", "volunteer", "administrator"])
            .optional()
        : z.enum(["doctor", "nurse", "staff", "volunteer", "administrator"]),
      username: isEditMode
        ? z.string().optional()
        : z
            .string()
            .min(4, t("field_required"))
            .max(16, t("username_not_valid"))
            .regex(/^[a-z0-9_-]*$/, t("username_not_valid"))
            .regex(/^[a-z0-9].*[a-z0-9]$/, t("username_not_valid"))
            .refine(
              (val) => !val.match(/(?:[_-]{2,})/),
              t("username_not_valid"),
            ),
      password_setup_method: z.enum(["immediate", "email"]).optional(),
      password: z.string().optional(),
      c_password: z.string().optional(),
      first_name: z.string().min(1, t("field_required")),
      last_name: z.string().min(1, t("field_required")),
      email: z.string().email(t("invalid_email_address")),
      phone_number: validators().phoneNumber.required,
      gender: z.enum(GENDERS, { required_error: t("gender_is_required") }),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      /* TODO: Userbase doesn't currently support these, neither does BE
      but we will probably need these */
      /* qualification: z.string().optional(),
      doctor_experience_commenced_on: z.string().optional(),
      doctor_medical_council_registration: z.string().optional(), */
      geo_organization: z.string().optional(),
    })
    .refine(
      (data) => {
        if (!isEditMode && data.password_setup_method === "immediate") {
          return data.password && data.password === data.c_password;
        }
        return true;
      },
      {
        message: t("password_mismatch"),
        path: ["c_password"],
      },
    )
    .refine(
      (data) => {
        if (
          !isEditMode &&
          data.password_setup_method === "immediate" &&
          data.password
        ) {
          return (
            data.password.length >= 8 &&
            /[a-z]/.test(data.password) &&
            /[A-Z]/.test(data.password) &&
            /[0-9]/.test(data.password)
          );
        }
        return true;
      },
      {
        message: t("new_password_validation"),
        path: ["password"],
      },
    );

  type UserFormValues = z.infer<typeof userFormSchema>;

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      user_type: "nurse",
      username: "",
      password: "",
      c_password: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      prefix: "",
      suffix: "",
      password_setup_method: "immediate",
    },
  });

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", existingUsername],
    queryFn: query(userApi.get, {
      pathParams: { username: existingUsername! },
    }),
    enabled: !!existingUsername,
  });
  useEffect(() => {
    if (userData && isEditMode) {
      const formData: Partial<UserFormValues> = {
        user_type: userData.user_type,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number || "",
        gender: userData.gender || undefined,
        prefix: userData.prefix || "",
        suffix: userData.suffix || "",
      };
      form.reset(formData);
    }
  }, [userData, form, isEditMode]);

  const [isUsernameFieldFocused, setIsUsernameFieldFocused] = useState(false);

  //const userType = form.watch("user_type");
  const usernameInput = form.watch("username") || "";
  const phoneNumber = form.watch("phone_number");

  useEffect(() => {
    if (usernameInput && usernameInput.length > 0 && !isEditMode) {
      form.trigger("username");
    }
  }, [phoneNumber, form, usernameInput, isEditMode]);

  const { isLoading: isUsernameChecking, isError: isUsernameTaken } = useQuery({
    queryKey: ["checkUsername", usernameInput],
    queryFn: query(userApi.checkUsername, {
      pathParams: { username: usernameInput },
      silent: true,
    }),
    enabled: !form.formState.errors.username && !isEditMode,
  });

  const renderUsernameFeedback = (usernameInput: string) => {
    const {
      errors: { username },
    } = form.formState;
    const isInitialRender = usernameInput === "";

    if (username?.message) {
      return null;
    } else if (isUsernameChecking) {
      return (
        <div className="flex items-center gap-1">
          <CareIcon
            icon="l-spinner"
            className="text-sm text-gray-500 animate-spin"
          />
          <span className="text-gray-500 text-sm">
            {t("checking_availability")}
          </span>
        </div>
      );
    } else if (usernameInput) {
      return validateRule(
        !isUsernameTaken,
        t("username_not_available"),
        isInitialRender,
        t("username_available"),
      );
    }
  };

  const { mutate: createUser, isPending: createPending } = useMutation({
    mutationKey: ["create_user"],
    mutationFn: mutate(userApi.create),
    onSuccess: (resp: UserBase) => {
      toast.success(t("user_added_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["facilityUsers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["organizationUsers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganizationUsers"],
      });
      onSubmitSuccess?.(resp);
    },
    onError: (error) => {
      toast.error(error?.message ?? t("user_add_error"));
    },
  });

  const { mutate: updateUser, isPending: updatePending } = useMutation({
    mutationKey: ["update_user"],
    mutationFn: mutate(userApi.update, {
      pathParams: { username: existingUsername! },
    }),
    onSuccess: (resp: UserBase) => {
      toast.success(t("user_updated_successfully"));
      [
        ["facilityUsers"],
        ["organizationUsers"],
        ["facilityOrganizationUsers"],
        ["getUserDetails", resp.username],
        ["currentUser"],
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      onSubmitSuccess?.(resp);
    },
  });

  const onSubmit = async (data: UserFormValues) => {
    if (isEditMode) {
      updateUser({
        ...data,
      } as UpdateUserModel);
    } else {
      createUser({
        ...data,
        password:
          data.password_setup_method === "immediate"
            ? data.password
            : undefined,
        c_password:
          data.password_setup_method === "immediate"
            ? data.c_password
            : undefined,
        profile_picture_url: "",
        geo_organization: data.geo_organization || null,
      } as CreateUserModel);
    }
  };

  const { data: org } = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId },
    }),
    enabled: !!organizationId,
  });

  useEffect(() => {
    const levels: Organization[] = [];
    if (org && org.org_type === "govt") levels.push(org);
    setSelectedLevels(levels);
  }, [org, organizationId]);

  useEffect(() => {
    const levels: Organization[] = [];
    if (isEditMode && userData && "geo_organization" in userData) {
      levels.push(userData.geo_organization as Organization);
      setSelectedLevels(levels);
    }
  }, [org, userData, isEditMode]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!isEditMode && (
          <FormField
            control={form.control}
            name="user_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("user_type")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-cy="user-type-select">
                      <SelectValue placeholder={t("select_user_type")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="doctor">{t("doctor")}</SelectItem>
                    <SelectItem value="nurse">{t("nurse")}</SelectItem>
                    <SelectItem value="staff">{t("staff")}</SelectItem>
                    <SelectItem value="volunteer">{t("volunteer")}</SelectItem>
                    <SelectItem value="administrator">
                      {t("administrator")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="md:flex gap-2 grid grid-cols-2 items-start">
          <FormField
            control={form.control}
            name="prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("prefix")}</FormLabel>
                <Autocomplete
                  options={NAME_PREFIXES.map((prefix) => ({
                    label: prefix,
                    value: prefix,
                  }))}
                  freeInput
                  value={field.value || ""}
                  onChange={field.onChange}
                  noOptionsMessage=""
                  className="md:w-28"
                  placeholder={t("select_or_type")}
                  inputPlaceholder={t("select_or_type")}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel aria-required>{t("first_name")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="first-name-input"
                    placeholder={t("first_name")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel aria-required>{t("last_name")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="last-name-input"
                    placeholder={t("last_name")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("suffix")}</FormLabel>
                <Input
                  data-cy="suffix-input"
                  placeholder={t("suffix")}
                  {...field}
                />

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isEditMode && (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("username")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        data-cy="username-input"
                        placeholder={t("username")}
                        {...field}
                        onFocus={() => setIsUsernameFieldFocused(true)}
                        onBlur={() => setIsUsernameFieldFocused(false)}
                      />
                    </div>
                  </FormControl>
                  {isUsernameFieldFocused ? (
                    <>
                      <div
                        className="text-small mt-2 pl-2 text-secondary-500"
                        aria-live="polite"
                      >
                        {(isUsernameChecking || !isUsernameTaken) && (
                          <ValidationHelper
                            isInputEmpty={!field.value}
                            successMessage={t("username_success_message")}
                            validations={[
                              {
                                description: "username_min_length_validation",
                                fulfilled: (field.value || "").length >= 4,
                              },
                              {
                                description: "username_max_length_validation",
                                fulfilled: (field.value || "").length <= 16,
                              },
                              {
                                description: "username_characters_validation",
                                fulfilled: /^[a-z0-9._-]*$/.test(
                                  field.value || "",
                                ),
                              },
                              {
                                description: "username_start_end_validation",
                                fulfilled: /^[a-z0-9].*[a-z0-9]$/.test(
                                  field.value || "",
                                ),
                              },
                              {
                                description: "username_consecutive_validation",
                                fulfilled: !/(?:[._-]{2,})/.test(
                                  field.value || "",
                                ),
                              },
                            ]}
                          />
                        )}
                      </div>
                      <div className="pl-2">
                        {renderUsernameFeedback(usernameInput || "")}
                      </div>
                    </>
                  ) : (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            {!isEditMode && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        data-cy="email-input"
                        type="email"
                        placeholder={t("email")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="password_setup_method"
              render={({ field }) => (
                <FormItem className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <FormLabel className="text-base font-medium mb-3 block">
                    {t("password_setup_method")}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div
                        className={`flex items-start space-x-3 rounded-md border p-3 ${
                          field.value === "immediate"
                            ? "bg-white border-primary"
                            : "bg-transparent  border-gray-200"
                        }`}
                      >
                        <RadioGroupItem
                          value="immediate"
                          id="immediate"
                          className="mt-1"
                        />
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="immediate"
                            className="text-base font-medium cursor-pointer flex items-center"
                          >
                            <Lock className="size-4" />
                            {t("set_password_now")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("set_password_now_description")}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex items-start space-x-3 rounded-md border p-3 ${
                          field.value === "email"
                            ? "bg-white border-primary"
                            : "bg-transparent  border-gray-200"
                        }`}
                      >
                        <RadioGroupItem
                          value="email"
                          id="email"
                          className="mt-1"
                        />
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="email"
                            className="text-base font-medium cursor-pointer flex items-center"
                          >
                            <Mail className="size-4" />
                            {t("send_email_invitation")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t("send_email_invitation_description")}
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("password_setup_method") === "immediate" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("password")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <PasswordInput
                            data-cy="password-input"
                            placeholder={t("password")}
                            {...field}
                            onFocus={() => setIsPasswordFieldFocused(true)}
                            onBlur={() => setIsPasswordFieldFocused(false)}
                          />
                        </div>
                      </FormControl>
                      {isPasswordFieldFocused ? (
                        <div
                          className="text-small mt-2 pl-2 text-secondary-500"
                          aria-live="polite"
                        >
                          <ValidationHelper
                            isInputEmpty={!field.value}
                            successMessage={t("password_success_message")}
                            validations={[
                              {
                                description: "password_length_validation",
                                fulfilled: (field.value || "").length >= 8,
                              },
                              {
                                description: "password_lowercase_validation",
                                fulfilled: /[a-z]/.test(field.value || ""),
                              },
                              {
                                description: "password_uppercase_validation",
                                fulfilled: /[A-Z]/.test(field.value || ""),
                              },
                              {
                                description: "password_number_validation",
                                fulfilled: /\d/.test(field.value || ""),
                              },
                            ]}
                          />
                        </div>
                      ) : (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="c_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>
                        {t("confirm_password")}
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          data-cy="confirm-password-input"
                          placeholder={t("confirm_password")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("phone_number")}</FormLabel>
                <FormControl>
                  <PhoneInput
                    data-cy="phone-number-input"
                    placeholder={t("enter_phone_number")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("gender")}</FormLabel>
                <Select
                  {...field}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger data-cy="gender-select">
                      <SelectValue placeholder={t("select_gender")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_TYPES.map((gender) => (
                      <SelectItem
                        key={gender.id}
                        value={gender.id}
                        data-cy={`gender-${gender.id}`}
                      >
                        {gender.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* TODO: Userbase doesn't currently support these, neither does BE
        but we will probably need these */}
        {/* {(userType === "doctor" || userType === "nurse") && (
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("qualification")}</FormLabel>
                <FormControl>
                  <Input
                    data-cy="qualification-input"
                    placeholder={t("qualification")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {userType === "doctor" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doctor_experience_commenced_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("years_of_experience")}</FormLabel>
                    <FormControl>
                      <Input
                        data-cy="experience-input"
                        type="number"
                        placeholder={t("years_of_experience")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctor_medical_council_registration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("medical_council_registration")}</FormLabel>
                    <FormControl>
                      <Input
                        data-cy="medical-registration-input"
                        placeholder={t("medical_council_registration")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )} */}
        <FormField
          control={form.control}
          name="geo_organization"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GovtOrganizationSelector
                  {...field}
                  value={form.watch("geo_organization")}
                  selected={selectedLevels}
                  onChange={(value) =>
                    form.setValue("geo_organization", value, {
                      shouldDirty: true,
                    })
                  }
                  required={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          data-cy="submit-user-form"
          variant="primary"
          disabled={
            isLoadingUser ||
            !form.formState.isDirty ||
            updatePending ||
            createPending
          }
        >
          {isEditMode ? t("update_user") : t("create_user")}
        </Button>
      </form>
    </Form>
  );
}
