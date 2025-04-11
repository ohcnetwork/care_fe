import { UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
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

  const lookupMutation = useMutation({
    mutationFn: mutate(valuesetApi.lookup, { silent: true }),
    onSuccess: (response: ValuesetLookupResponse) => {
      if (response.metadata) {
        form.setValue(`${name}.display`, response.metadata.display, {
          shouldValidate: true,
        });

        toast.success(t("code_verified_successfully"));
      }
    },
    onError: () => {
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
                className={!field.value ? "text-gray-500" : undefined}
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
      >
        <UpdateIcon className="size-4" />
      </Button>
    </div>
  );
};
