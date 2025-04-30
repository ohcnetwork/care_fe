import { CheckIcon, UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import mutate from "@/Utils/request/mutate";
import { ValuesetLookupResponse } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

type CodingFieldProps = {
  system: string;
  name: string;
  form: any;
  className?: string;
};

export const CodingField = ({
  system,
  name,
  form,
  className,
}: CodingFieldProps) => {
  const { t } = useTranslation();
  const [isVerified, setIsVerified] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: mutate(valuesetApi.lookup, { silent: true }),
    onSuccess: (response: ValuesetLookupResponse) => {
      if (response.metadata) {
        form.setValue(`${name}.display`, response.metadata.display, {
          shouldValidate: true,
        });
        setIsVerified(true);

        toast.success(t("code_verified_successfully"));
      }
    },
    onError: () => {
      setIsVerified(false);

      toast.error(t("failed_to_verify_code"));
    },
  });

  const handleVerify = () => {
    const code = form.getValues(`${name}.code`);

    if (!system || !code) {
      toast.error(t("select_system_first"));
      return;
    }

    lookupMutation.mutate({ system, code });
  };

  const handleCodeChange = () => {
    setIsVerified(false);
    form.setValue(`${name}.display`, "", { shouldValidate: true });
  };

  return (
    <div className={cn("flex gap-4 items-start", className)}>
      <FormField
        control={form.control}
        name={`${name}.code`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                {...field}
                placeholder={t("code")}
                onChange={(e) => {
                  field.onChange(e);
                  handleCodeChange();
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${name}.display`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Input
                {...field}
                placeholder={t("unverified")}
                className={cn(!field.value ? "text-gray-500" : undefined)}
                readOnly
              />
            </FormControl>
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleVerify}
        disabled={lookupMutation.isPending}
        className={cn(
          "focus:ring-0 focus:ring-transparent",
          isVerified
            ? "bg-transparent border-none shadow-none hover:bg-transparent hover:border-none hover:shadow-none"
            : "hover:border-gray-400 hover:bg-gray-100",
        )}
      >
        {isVerified ? (
          <CheckIcon className="size-4 text-green-500 transition-colors duration-300" />
        ) : (
          <UpdateIcon
            className={cn(
              "size-4 transition-colors duration-300",
              lookupMutation.isPending && "animate-spin",
            )}
          />
        )}
      </Button>
    </div>
  );
};
