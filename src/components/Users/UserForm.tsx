import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Mail } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/input-password";
import { PhoneInput } from "@/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SheetBody, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";

import { UserCommunicationFields } from "@/components/Users/UserCommunicationFields";
import {
  UserFormGroups,
  UserFormItem,
  UserFormSection,
} from "@/components/Users/UserFormSection";
import {
  ValidationHelper,
  validateRule,
} from "@/components/Users/UserFormValidations";
import { UserPasswordMethodCard } from "@/components/Users/UserPasswordMethodCard";
import { UserQualificationFields } from "@/components/Users/UserQualificationFields";
import { RoleOrgAccessEditor } from "@/components/Users/UserRoleOrganizationAccess";

import useBreakpoints from "@/hooks/useBreakpoints";

import { GENDERS, GENDER_TYPES, NAME_PREFIXES } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import Loading from "@/components/Common/Loading";
import GovtOrganizationPicker from "@/components/Organization/GovtOrganizationPicker";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import {
  CEFR_LEVELS,
  USER_LANGUAGE_SYSTEM,
  UserCreate,
  UserReadMinimal,
  UserUpdate,
} from "@/types/user/user";
import userApi from "@/types/user/userApi";

export type UserProfileEditSection =
  "personal" | "contact" | "communication" | "qualification";

interface Props {
  onSubmitSuccess?: (
    user: UserReadMinimal,
    meta?: { roleOrgIds: string[] },
  ) => void;
  existingUsername?: string;
  organizationId?: string;
  isServiceAccount?: boolean;
  initialSection?: UserProfileEditSection;
}

export default function UserForm({
  onSubmitSuccess,
  existingUsername,
  organizationId,
  isServiceAccount = false,
  initialSection,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = !!existingUsername;
  const formRef = useRef<HTMLFormElement>(null);
  const genderLabelId = useId();
  const [initializedUsername, setInitializedUsername] = useState<string>();
  const queryClient = useQueryClient();
  const [selectedGeoOrg, setSelectedGeoOrg] = useState<Organization | null>(
    null,
  );
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  // Below `sm` the name row shows First and Last Name before Prefix and Suffix.
  // The DOM follows the same order so Tab moves through the fields as they appear.
  const isNameRowInline = useBreakpoints({ default: false, sm: true });
  const mobile = !isNameRowInline && !isEditMode && !isServiceAccount;
  const roleOrgSchema = z.object({
    organization: z.string().min(1, t("select_role_organization")),
    role: z.string().min(1, t("please_select_role")),
  });

  const userFormSchema = z
    .object({
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
      first_name: z.string().trim().min(1, t("field_required")),
      last_name: z.string().trim().min(1, t("field_required")),
      email: isEditMode
        ? z.string().optional()
        : z.email(t("invalid_email_address")),
      phone_number: validators().phoneNumber.required,
      gender: z.enum(GENDERS, { error: t("gender_is_required") }),
      prefix: z.string().optional(),
      suffix: z.string().optional(),
      geo_organization: z.string().optional(),
      communication: z.array(
        z.object({
          language: z.object({
            code: z.string().regex(/^[a-z]{3}$/, t("profile_select_language")),
            system: z.literal(USER_LANGUAGE_SYSTEM),
          }),
          preferred: z.boolean(),
          proficiency: z.enum(CEFR_LEVELS).nullable().optional(),
        }),
      ),
      qualification: z.array(
        z.object({
          degree: z
            .object({
              code: z.string(),
              system: z.string(),
            })
            .refine(
              (degree) => !!degree.code && !!degree.system,
              t("profile_select_degree"),
            ),
          registration_number: z.string(),
          issuer: z.string(),
          meta: z.record(z.string(), z.unknown()),
        }),
      ),
      // role_orgs only used in create mode
      role_orgs: isEditMode
        ? z.array(roleOrgSchema).optional()
        : z.array(roleOrgSchema).default([]),
    })
    .refine(
      (data) => {
        if (
          !isEditMode &&
          data.password_setup_method === "immediate" &&
          !isServiceAccount
        ) {
          return !!data.password;
        }
        return true;
      },
      {
        message: t("password_required"),
        path: ["password"],
      },
    )
    .refine(
      (data) => {
        if (
          !isEditMode &&
          data.password_setup_method === "immediate" &&
          data.password
        ) {
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
    )
    .refine(
      (data) => {
        if (isEditMode || !data.role_orgs?.length) return true;
        return (
          new Set(data.role_orgs.map((entry) => entry.organization)).size ===
          data.role_orgs.length
        );
      },
      {
        message: t("each_role_organization_must_be_unique"),
        path: ["role_orgs"],
      },
    );

  type UserFormValues = z.infer<typeof userFormSchema>;

  const form = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
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
      role_orgs: [],
      communication: [],
      qualification: [],
    },
  });

  const {
    data: userData,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
    isFetchedAfterMount: isUserFetchedAfterMount,
    isError: isUserError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user", existingUsername],
    queryFn: query(userApi.get, {
      pathParams: { username: existingUsername! },
    }),
    enabled: !!existingUsername,
    refetchOnMount: "always",
  });
  const { data: availableDegrees } = useQuery({
    queryKey: ["userDegrees"],
    queryFn: query(userApi.degrees),
    staleTime: 5 * 60 * 1000,
    enabled: !isServiceAccount,
  });
  useEffect(() => {
    if (
      userData &&
      isEditMode &&
      isUserFetchedAfterMount &&
      !isFetchingUser &&
      !isUserError &&
      initializedUsername !== existingUsername
    ) {
      const formData: Partial<UserFormValues> = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number || "",
        gender: userData.gender || undefined,
        prefix: userData.prefix || "",
        suffix: userData.suffix || "",
        geo_organization: userData.geo_organization?.id,
        communication: userData.communication || [],
        qualification: (userData.qualification || []).map((entry) => ({
          ...entry,
          meta: entry.meta || {},
        })),
      };
      form.reset(formData);
      setInitializedUsername(existingUsername);
      setSelectedGeoOrg(userData.geo_organization || null);
    }
  }, [
    userData,
    form,
    isEditMode,
    existingUsername,
    initializedUsername,
    isUserFetchedAfterMount,
    isFetchingUser,
    isUserError,
  ]);

  useEffect(() => {
    if (!initialSection || initializedUsername !== existingUsername) return;
    const frame = requestAnimationFrame(() => {
      const section = formRef.current?.querySelector<HTMLElement>(
        `[data-profile-section="${initialSection}"]`,
      );
      section?.scrollIntoView({ block: "start" });
      section?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialSection, initializedUsername, existingUsername]);

  const [isUsernameFieldFocused, setIsUsernameFieldFocused] = useState(false);

  const usernameInput = form.watch("username") || "";
  const phoneNumber = form.watch("phone_number");

  useEffect(() => {
    if (usernameInput && usernameInput.length > 0 && !isEditMode) {
      form.trigger("username");
    }
  }, [phoneNumber, form, usernameInput, isEditMode]);

  const { isLoading: isUsernameChecking, isError: isUsernameTaken } = useQuery({
    queryKey: ["checkUsername", usernameInput],
    queryFn: query.debounced(userApi.checkUsername, {
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
        <p className="flex items-start gap-1.5 text-sm text-soft-foreground">
          <Spinner aria-hidden="true" className="mt-0.5" />
          {t("checking_availability")}
        </p>
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

  const { mutateAsync: createUser, isPending: createPending } = useMutation({
    mutationKey: ["create_user"],
    mutationFn: mutate(userApi.create),
  });

  const { mutateAsync: updateUser, isPending: updatePending } = useMutation({
    mutationKey: ["update_user"],
    mutationFn: mutate(userApi.update, {
      pathParams: { username: existingUsername! },
    }),
  });

  const invalidateUserQueries = (username: string) => {
    [
      ["facilityUsers"],
      ["organizationUsers"],
      ["facilityOrganizationUsers"],
      ["getUserDetails", username],
      ["user", username],
      ["currentUser"],
      ["organization"],
    ].forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const handleRequestErrors = (error: unknown) => {
    const errorData = (error as { cause?: { errors?: { msg?: string[] } } })
      ?.cause;
    const messages = errorData?.errors?.msg;

    if (messages?.length) {
      messages.forEach((message) => toast.error(message));
      return;
    }

    toast.error(t("something_went_wrong"));
  };

  const onSubmit = async (data: UserFormValues) => {
    if (!isEditMode || form.formState.dirtyFields.communication) {
      const languages = new Set<string>();
      let hasDuplicates = false;
      data.communication.forEach((entry, index) => {
        if (languages.has(entry.language.code)) {
          form.setError(
            `communication.${index}.language.code`,
            { type: "validate", message: t("profile_duplicate_language") },
            { shouldFocus: !hasDuplicates },
          );
          hasDuplicates = true;
        }
        languages.add(entry.language.code);
      });
      if (hasDuplicates) return;
    }

    if (
      (!isEditMode || form.formState.dirtyFields.qualification) &&
      data.qualification.length
    ) {
      if (!availableDegrees) {
        toast.error(t("profile_degrees_load_error"));
        return;
      }
      const unavailable = data.qualification.flatMap(({ degree }, index) =>
        availableDegrees.some(
          (available) =>
            available.code === degree.code &&
            available.system === degree.system,
        )
          ? []
          : [index],
      );
      unavailable.forEach((index, position) => {
        form.setError(
          `qualification.${index}.degree`,
          { type: "validate", message: t("profile_degree_unavailable") },
          { shouldFocus: position === 0 },
        );
      });
      if (unavailable.length) return;
    }

    if (isEditMode) {
      const updatePayload: UserUpdate = {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        prefix: data.prefix || "",
        suffix: data.suffix || "",
        gender: data.gender,
        geo_organization: data.geo_organization || undefined,
        ...(form.formState.dirtyFields.communication && {
          communication: data.communication,
        }),
        ...(form.formState.dirtyFields.qualification && {
          qualification: data.qualification,
        }),
      };

      try {
        const updatedUser = await updateUser(updatePayload);
        invalidateUserQueries(updatedUser.username);
        toast.success(t("user_updated_successfully"));
        onSubmitSuccess?.(updatedUser);
      } catch (error) {
        handleRequestErrors(error);
      }
    } else {
      const roleOrganizations = (data.role_orgs || []).map((membership) => ({
        organization: membership.organization,
        role: membership.role,
      }));

      const createPayload: UserCreate = {
        username: data.username!,
        password:
          data.password_setup_method === "immediate" && !isServiceAccount
            ? data.password!
            : undefined,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email!,
        phone_number: data.phone_number,
        prefix: data.prefix || "",
        suffix: data.suffix || "",
        gender: data.gender,
        geo_organization: data.geo_organization || undefined,
        is_service_account: isServiceAccount,
        role_orgs: roleOrganizations,
        ...(!isServiceAccount && {
          communication: data.communication,
          qualification: data.qualification,
        }),
      };

      try {
        const createdUser = await createUser(createPayload);
        invalidateUserQueries(createdUser.username);
        toast.success(
          isServiceAccount
            ? t("service_account_added_successfully")
            : t("user_added_successfully"),
        );
        onSubmitSuccess?.(createdUser, {
          roleOrgIds: roleOrganizations.map(
            (membership) => membership.organization,
          ),
        });
      } catch (error) {
        handleRequestErrors(error);
      }
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
    if (!isEditMode) {
      setSelectedGeoOrg(org && org.org_type === "govt" ? org : null);
    }
  }, [org, organizationId, isEditMode]);

  useEffect(() => {
    if (isEditMode || org?.org_type !== "role") {
      return;
    }

    if ((form.getValues("role_orgs") ?? []).length > 0) {
      return;
    }

    form.setValue(
      "role_orgs",
      [
        {
          organization: org.id,
          role: "",
        },
      ],
      { shouldDirty: false },
    );
  }, [form, isEditMode, org]);

  const isSubmitting = updatePending || createPending;

  if (isEditMode && isUserError && initializedUsername !== existingUsername) {
    return (
      <SheetBody>
        <div role="alert" className="space-y-3">
          <p>{t("something_went_wrong")}</p>
          <Button type="button" variant="outline" onClick={() => refetchUser()}>
            {t("retry")}
          </Button>
        </div>
      </SheetBody>
    );
  }

  if (
    isEditMode &&
    (isLoadingUser || initializedUsername !== existingUsername)
  ) {
    return (
      <SheetBody>
        <Loading />
      </SheetBody>
    );
  }

  const showProfileFields = !(isServiceAccount || userData?.is_service_account);
  const Group = mobile ? FieldGroup : "div";
  const Divider = mobile ? FieldSeparator : Separator;
  const GenderSet = mobile ? FieldSet : "div";

  const prefixField = (
    <FormField
      control={form.control}
      name="prefix"
      render={({ field }) => (
        <UserFormItem>
          <FormLabel>{t("prefix")}</FormLabel>
          <Autocomplete
            {...field}
            options={NAME_PREFIXES.map((prefix) => ({
              label: prefix,
              value: prefix,
            }))}
            freeInput
            value={field.value || ""}
            onChange={field.onChange}
            noOptionsMessage=""
            className="min-w-0"
            placeholder={t("select_or_type")}
            inputPlaceholder={t("select_or_type")}
          />
          <FormMessage />
        </UserFormItem>
      )}
    />
  );

  const passwordFields = (
    <Group
      className={mobile ? undefined : "grid items-start gap-3 sm:grid-cols-2"}
    >
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <UserFormItem>
            <FormLabel aria-required>{t("password")}</FormLabel>
            <FormControl>
              <div className="relative">
                <PasswordInput
                  placeholder={t("password")}
                  {...field}
                  onFocus={() => setIsPasswordFieldFocused(true)}
                  onBlur={() => setIsPasswordFieldFocused(false)}
                />
              </div>
            </FormControl>

            <div
              className={cn(!isPasswordFieldFocused && "hidden")}
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

            <div
              className={cn(
                isPasswordFieldFocused && "hidden",
                mobile && "empty:hidden",
              )}
            >
              <FormMessage />
            </div>
          </UserFormItem>
        )}
      />

      <FormField
        control={form.control}
        name="c_password"
        render={({ field }) => (
          <UserFormItem>
            <FormLabel aria-required>{t("confirm_password")}</FormLabel>
            <FormControl>
              <PasswordInput placeholder={t("confirm_password")} {...field} />
            </FormControl>
            <FormMessage />
          </UserFormItem>
        )}
      />
    </Group>
  );

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* relative keeps sr-only labels inside the scroll area; otherwise they
            extend the sheet's own overflow and the sheet can scroll under the footer */}
        <SheetBody className="relative pb-8">
          <UserFormGroups mobile={mobile}>
            <UserFormSection
              data-profile-section="personal"
              tabIndex={-1}
              title={t("user_form_personal_details_title")}
              className="scroll-mt-6 outline-none"
            >
              <div
                className={
                  mobile
                    ? "contents"
                    : "grid grid-cols-2 items-start gap-3 sm:grid-cols-[--spacing(34)_1fr_1fr_--spacing(30)]"
                }
              >
                {isNameRowInline && prefixField}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <UserFormItem className="col-span-2 sm:col-span-1">
                      <FormLabel aria-required>{t("first_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("first_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </UserFormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <UserFormItem className="col-span-2 sm:col-span-1">
                      <FormLabel aria-required>{t("last_name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("last_name")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </UserFormItem>
                  )}
                />
                <div className={mobile ? "grid grid-cols-2 gap-4" : "contents"}>
                  {!isNameRowInline && prefixField}
                  <FormField
                    control={form.control}
                    name="suffix"
                    render={({ field }) => (
                      <UserFormItem>
                        <FormLabel>{t("suffix")}</FormLabel>
                        <Input placeholder={t("suffix")} {...field} />
                        <FormMessage />
                      </UserFormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <UserFormItem>
                    <GenderSet className={mobile ? undefined : "contents"}>
                      {mobile ? (
                        <FieldLegend id={genderLabelId} variant="label">
                          {t("gender")}{" "}
                          <span aria-hidden="true" className="text-red-500">
                            *
                          </span>
                        </FieldLegend>
                      ) : (
                        <FormLabel id={genderLabelId} aria-required>
                          {t("gender")}
                        </FormLabel>
                      )}
                      <FormControl>
                        <RadioGroup
                          aria-labelledby={genderLabelId}
                          aria-required
                          name={field.name}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          onBlur={field.onBlur}
                          inputRef={field.ref}
                          className="grid-cols-2 sm:grid-cols-[repeat(4,max-content)]"
                        >
                          {GENDER_TYPES.map(({ id, text }) => (
                            <FieldLabel
                              key={id}
                              htmlFor={`${genderLabelId}-${id}`}
                              className="cursor-pointer sm:has-[>[data-slot=field]]:w-fit"
                            >
                              <Field orientation="horizontal">
                                <RadioGroupItem
                                  id={`${genderLabelId}-${id}`}
                                  value={id}
                                />
                                <FieldTitle>{text}</FieldTitle>
                              </Field>
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </GenderSet>
                    <FormMessage />
                  </UserFormItem>
                )}
              />
            </UserFormSection>

            {!isEditMode && (
              <>
                <Divider />
                <UserFormSection title={t("user_form_sign_in_title")}>
                  <div
                    className={
                      mobile
                        ? "contents"
                        : "grid items-start gap-3 sm:grid-cols-2"
                    }
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <UserFormItem>
                          <FormLabel aria-required>{t("username")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder={t("username")}
                                {...field}
                                onFocus={() => setIsUsernameFieldFocused(true)}
                                onBlur={() => setIsUsernameFieldFocused(false)}
                              />
                            </div>
                          </FormControl>

                          <div
                            className={cn(
                              "flex flex-col gap-1",
                              !isUsernameFieldFocused && "hidden",
                            )}
                          >
                            <div aria-live="polite">
                              {(isUsernameChecking || !isUsernameTaken) && (
                                <ValidationHelper
                                  isInputEmpty={!field.value}
                                  successMessage={t("username_success_message")}
                                  validations={[
                                    {
                                      description:
                                        "username_min_length_validation",
                                      fulfilled:
                                        (field.value || "").length >= 4,
                                    },
                                    {
                                      description:
                                        "username_max_length_validation",
                                      fulfilled:
                                        (field.value || "").length <= 16,
                                    },
                                    {
                                      description:
                                        "username_characters_validation",
                                      fulfilled: /^[a-z0-9._-]*$/.test(
                                        field.value || "",
                                      ),
                                    },
                                    {
                                      description:
                                        "username_start_end_validation",
                                      fulfilled: /^[a-z0-9].*[a-z0-9]$/.test(
                                        field.value || "",
                                      ),
                                    },
                                    {
                                      description:
                                        "username_consecutive_validation",
                                      fulfilled: !/(?:[._-]{2,})/.test(
                                        field.value || "",
                                      ),
                                    },
                                  ]}
                                />
                              )}
                            </div>
                            <div className="empty:hidden">
                              {renderUsernameFeedback(usernameInput || "")}
                            </div>
                          </div>
                          <div
                            className={cn(
                              isUsernameFieldFocused && "hidden",
                              mobile && "empty:hidden",
                            )}
                          >
                            <FormMessage />
                          </div>
                        </UserFormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <UserFormItem>
                          <FormLabel aria-required>{t("email")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("email")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </UserFormItem>
                      )}
                    />
                  </div>

                  {!isServiceAccount && (
                    <FormField
                      control={form.control}
                      name="password_setup_method"
                      render={({ field }) => (
                        <UserFormItem>
                          <FieldSet
                            className={
                              mobile
                                ? undefined
                                : "has-[>[data-slot=radio-group]]:gap-0"
                            }
                          >
                            <FieldLegend variant="label">
                              {t("password_setup_method")}
                            </FieldLegend>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <UserPasswordMethodCard
                                  value="immediate"
                                  selected={field.value === "immediate"}
                                  icon={<Lock className="size-4" />}
                                  title={t("set_password_now")}
                                  description={t(
                                    "set_password_now_description",
                                  )}
                                >
                                  {field.value === "immediate" &&
                                    passwordFields}
                                </UserPasswordMethodCard>
                                <UserPasswordMethodCard
                                  value="email"
                                  selected={field.value === "email"}
                                  icon={<Mail className="size-4" />}
                                  title={t("send_email_invitation")}
                                  description={t(
                                    "send_email_invitation_description",
                                  )}
                                />
                              </RadioGroup>
                            </FormControl>
                          </FieldSet>
                          <FormMessage />
                        </UserFormItem>
                      )}
                    />
                  )}
                </UserFormSection>
              </>
            )}

            <Divider />
            <UserFormSection
              data-profile-section="contact"
              tabIndex={-1}
              title={t("user_form_contact_location_title")}
              className="scroll-mt-6 outline-none"
            >
              <div
                className={
                  mobile ? "contents" : "grid items-start gap-3 sm:grid-cols-2"
                }
              >
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <UserFormItem>
                      <FormLabel aria-required>{t("phone_number")}</FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder={t("enter_phone_number")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </UserFormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="geo_organization"
                  render={({ field, fieldState }) => (
                    <UserFormItem>
                      {/* The picker renders a labelled level per row; fit them to the form spacing. */}
                      <Group
                        className={
                          mobile
                            ? "[&>div]:mt-0 [&_label]:mb-1"
                            : "flex flex-col gap-3 [&>div]:mt-0 [&_label]:mb-1.5"
                        }
                      >
                        <FormControl>
                          <GovtOrganizationPicker
                            ref={field.ref}
                            aria-invalid={!!fieldState.error}
                            required={false}
                            value={selectedGeoOrg}
                            onChange={(organization) => {
                              setSelectedGeoOrg(organization);
                              form.setValue(
                                "geo_organization",
                                organization?.id ?? "",
                                { shouldDirty: true },
                              );
                            }}
                          />
                        </FormControl>
                      </Group>
                      <FormMessage />
                    </UserFormItem>
                  )}
                />
              </div>
            </UserFormSection>

            {/* Role org assignments — only shown in create mode */}
            {!isEditMode && (
              <>
                <Divider />
                <UserFormSection title={t("user_form_role_title")}>
                  <FormField
                    control={form.control}
                    name="role_orgs"
                    render={({ field }) => (
                      <UserFormItem>
                        <FormControl>
                          <RoleOrgAccessEditor
                            value={field.value || []}
                            onChange={(value) =>
                              form.setValue("role_orgs", value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            disabled={isLoadingUser || isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </UserFormItem>
                    )}
                  />
                </UserFormSection>
              </>
            )}

            {showProfileFields && (
              <>
                <Divider />
                <UserFormSection title={t("user_form_professional_title")}>
                  <div className={mobile ? "contents" : "flex flex-col gap-8"}>
                    <div
                      data-profile-section="communication"
                      tabIndex={-1}
                      role={mobile ? undefined : "group"}
                      aria-label={
                        mobile ? undefined : t("profile_communication")
                      }
                      className="scroll-mt-6 outline-none"
                    >
                      <UserCommunicationFields />
                    </div>
                    {mobile && <FieldSeparator />}
                    <div
                      data-profile-section="qualification"
                      tabIndex={-1}
                      role={mobile ? undefined : "group"}
                      aria-label={
                        mobile ? undefined : t("profile_qualifications")
                      }
                      className="scroll-mt-6 outline-none"
                    >
                      <UserQualificationFields />
                    </div>
                  </div>
                </UserFormSection>
              </>
            )}
          </UserFormGroups>
        </SheetBody>

        {/* Submit comes first in the DOM so Tab reaches it before Cancel; the
            reversed flex direction keeps Cancel visually to its left. */}
        <SheetFooter className="flex-col sm:flex-row-reverse sm:justify-start">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoadingUser || !form.formState.isDirty || isSubmitting}
          >
            {isSubmitting
              ? isEditMode
                ? t("updating")
                : t("creating")
              : isEditMode
                ? t("update_user")
                : isServiceAccount
                  ? t("create_service_account")
                  : t("create_user")}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              {t("cancel")}
            </Button>
          </SheetClose>
        </SheetFooter>
      </form>
    </Form>
  );
}
