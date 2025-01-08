import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { GENDER_TYPES } from "@/common/constants";
import { validateUsername } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { UserBase } from "@/types/user/user";
import UserApi from "@/types/user/userApi";
import userApi from "@/types/user/userApi";

const userFormSchema = z
  .object({
    user_type: z.enum(["doctor", "nurse", "staff", "volunteer"]),
    username: z
      .string()
      .min(4, "Username must be at least 4 characters")
      .max(16, "Username must be less than 16 characters")
      .regex(
        /^[a-z0-9._-]*$/,
        "Username can only contain lowercase letters, numbers, and . _ -",
      )
      .regex(
        /^[a-z0-9].*[a-z0-9]$/,
        "Username must start and end with a letter or number",
      )
      .refine(
        (val) => !val.match(/(?:[._-]{2,})/),
        "Username can't contain consecutive special characters",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    c_password: z.string(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone_number: z
      .string()
      .regex(
        /^\+91[0-9]{10}$/,
        "Phone number must start with +91 followed by 10 digits",
      ),
    alt_phone_number: z
      .string()
      .regex(
        /^\+91[0-9]{10}$/,
        "Phone number must start with +91 followed by 10 digits",
      )
      .optional(),
    phone_number_is_whatsapp: z.boolean().default(true),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["male", "female", "other"]),
    qualification: z.string().optional(),
    doctor_experience_commenced_on: z.string().optional(),
    doctor_medical_council_registration: z.string().optional(),
    geo_organization: z.string().min(1, "Organization is required"),
  })
  .refine((data) => data.password === data.c_password, {
    message: "Passwords don't match",
    path: ["c_password"],
  });

type UserFormValues = z.infer<typeof userFormSchema>;

interface Props {
  onSubmitSuccess?: (user: UserBase) => void;
}

export const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
  isInitialState: boolean = false,
) => {
  return (
    <div>
      {isInitialState ? (
        <CareIcon icon="l-circle" className="text-xl text-gray-500" />
      ) : condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-primary-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(
          isInitialState
            ? "text-black"
            : condition
              ? "text-primary-500"
              : "text-red-500",
        )}
      >
        {content}
      </span>
    </div>
  );
};

export default function CreateUserForm({ onSubmitSuccess }: Props) {
  const { t } = useTranslation();

  const userExistsEnums = {
    idle: 0,
    checking: 1,
    exists: 2,
    available: 3,
  };

  const [usernameExists, setUsernameExists] = useState<number>(
    userExistsEnums.idle,
  );
  const [usernameInput, setUsernameInput] = useState("");

  const { data, error, isLoading } = useQuery({
    queryKey: ["checkUsername", usernameInput],
    queryFn: query(userApi.checkUsername, {
      pathParams: { username: usernameInput },
      silent: true,
    }),
    enabled: validateUsername(usernameInput),
  });

  useEffect(() => {
    if (!validateUsername(usernameInput)) {
      setUsernameExists(userExistsEnums.idle);
      return;
    }

    if (isLoading) {
      setUsernameExists(userExistsEnums.checking);
    } else if (error) {
      if (error instanceof Error && "status" in error) {
        const status = (error as any).status;

        if (status === 409) {
          setUsernameExists(userExistsEnums.exists);
        } else if (status === 404) {
          toast.error(
            "Some error occurred while checking username availability. Please try again later.",
          );
          setUsernameExists(userExistsEnums.idle);
        }
      } else {
        toast.error(
          "Some error occurred while checking username availability. Please try again later.",
        );
        setUsernameExists(userExistsEnums.idle);
      }
    } else {
      setUsernameExists(userExistsEnums.available);
    }
  }, [data, error, isLoading, usernameInput]);

  const renderFeedback = () => {
    switch (usernameExists) {
      case userExistsEnums.checking:
        return (
          <div className="flex items-center gap-1">
            <CareIcon icon="l-spinner" className="text-xl animate-spin" />
            <span className="text-md text-gray-500">Checking username...</span>
          </div>
        );
      case userExistsEnums.available:
        return (
          <div className="flex items-center gap-1">
            <CareIcon
              icon="l-check-circle"
              className="text-xl text-primary-500"
            />
            <span className="text-md text-primary-500">
              {t("username_available")}
            </span>
          </div>
        );
      case userExistsEnums.exists:
        return (
          <div className="flex items-center gap-1">
            <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
            <span className="text-md text-red-500">
              {t("username_not_available")}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsernameInput(value);
    setUsernameExists(userExistsEnums.idle);
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      user_type: "staff",
      phone_number: "+91",
      alt_phone_number: "+91",
      phone_number_is_whatsapp: true,
      gender: "male",
    },
  });

  const userType = form.watch("user_type");
  const phoneNumber = form.watch("phone_number");
  const isWhatsApp = form.watch("phone_number_is_whatsapp");

  useEffect(() => {
    if (isWhatsApp) {
      form.setValue("alt_phone_number", phoneNumber);
    }
  }, [phoneNumber, isWhatsApp, form]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      const {
        res,
        data: user,
        error,
      } = await request(UserApi.create, {
        body: {
          ...data,
          // Omit c_password as it's not needed in the API
          c_password: undefined,
        } as unknown as UserBase,
      });

      if (res?.ok) {
        Notification.Success({
          msg: t("user_added_successfully"),
        });
        onSubmitSuccess?.(user!);
      } else {
        Notification.Error({
          msg: error?.message ?? t("user_add_error"),
        });
      }
    } catch (error) {
      Notification.Error({
        msg: t("user_add_error"),
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="user_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("user_type")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="doctor">{t("doctor")}</SelectItem>
                  <SelectItem value="nurse">{t("nurse")}</SelectItem>
                  <SelectItem value="staff">{t("staff")}</SelectItem>
                  <SelectItem value="volunteer">{t("volunteer")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("first_name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("first_name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("last_name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("last_name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("username")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder={t("username")}
                    {...field}
                    value={usernameInput}
                    onChange={handleInputChange}
                  />
                </div>
              </FormControl>
              {renderFeedback()}
              {validateRule(
                usernameInput.length >= 4,
                "Username must be at least 4 characters",
                usernameInput.length === 0,
              )}
              {validateRule(
                usernameInput.length < 16,
                "Username must be less than 16 characters",
                usernameInput.length === 0,
              )}
              {validateRule(
                /^[a-z0-9._-]*$/.test(usernameInput),
                "Username can only contain lowercase letters, numbers, and . _ -",
                usernameInput.length === 0,
              )}
              {validateRule(
                /^[a-z0-9].*[a-z0-9]$/.test(usernameInput),
                "Username must start and end with a letter or number",
                usernameInput.length === 0,
              )}
              {validateRule(
                !usernameInput.match(/(?:[._-]{2,})/),
                "Username cannot contain consecutive special characters",
                usernameInput.length === 0,
              )}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("password")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="c_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirm_password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("confirm_password")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t("email")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone_number")}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+91XXXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alt_phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("alternate_phone_number")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+91XXXXXXXXXX"
                    type="tel"
                    {...field}
                    disabled={isWhatsApp}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone_number_is_whatsapp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t("whataapp_number_same_as_phone_number")}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("date_of_birth")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>{t("gender")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_TYPES.map((gender) => (
                      <SelectItem key={gender.id} value={gender.id}>
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

        {(userType === "doctor" || userType === "nurse") && (
          <FormField
            control={form.control}
            name="qualification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("qualification")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("qualification")} {...field} />
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
        )}
        <FormField
          control={form.control}
          name="geo_organization"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <OrganizationSelector
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Create User
        </Button>
      </form>
    </Form>
  );
}
