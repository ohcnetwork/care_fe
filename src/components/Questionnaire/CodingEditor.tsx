import { UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import mutate from "@/Utils/request/mutate";
import { Code } from "@/types/questionnaire/code";
import {
  TERMINOLOGY_SYSTEMS,
  TerminologySystem,
  ValuesetLookupResponse,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

interface CodingEditorProps {
  questionIndex: number;
  code?: Code;
  type: "code" | "unit";
  defaultSystem?: TerminologySystem;
  label: string;
  form: ReturnType<typeof useForm<any>>;
  disableSystemSelect?: boolean;
  onChange: (code: Code | undefined) => void;
}

export function CodingEditor({
  code,
  onChange,
  defaultSystem,
  label,
  type,
  form,
  questionIndex,
  disableSystemSelect,
}: CodingEditorProps) {
  const { t } = useTranslation();
  const { mutate: verifyCode, isPending } = useMutation({
    mutationFn: mutate(valuesetApi.lookup),
    onSuccess: (response: ValuesetLookupResponse) => {
      if (response.metadata && code) {
        onChange({
          ...code,
          display: response.metadata.display,
        });
        toast.success("Code verified successfully");
      }
    },
    onError: (error) => {
      form.setError(`questions.${questionIndex}.${type}.display`, {
        type: "manual",
        message: t("code_verification_required"),
      });
      console.error(error);
      toast.error("Failed to verify code");
    },
  });

  if (!code) {
    return (
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onChange({
              system: TERMINOLOGY_SYSTEMS[defaultSystem ?? "LOINC"],
              code: "",
            });
          }}
        >
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          {t(`add_${label}`)}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center w-full justify-between">
          <Label className="text-base font-medium">
            {t(`${label}_details`)}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onChange(undefined);
              form.clearErrors([`questions.${questionIndex}.${type}`]);
            }}
          >
            <CareIcon icon="l-trash-alt" className="mr-2 h-4 w-4" />
            {t(`remove_${label}`)}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.${type}.system`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("system")}</FormLabel>
                <FormControl>
                  <Select
                    {...field}
                    value={code.system}
                    onValueChange={(value) => {
                      onChange({
                        system: value,
                        code: "",
                        display: "",
                      });
                    }}
                    disabled={disableSystemSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TERMINOLOGY_SYSTEMS).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {key}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap sm:grid sm:grid-cols-[1fr_1fr_auto] gap-4 sm:items-start">
          <div>
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.${type}.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("code")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={code.code}
                      onChange={(e) => {
                        onChange({
                          ...code,
                          code: e.target.value,
                          display: "",
                        });
                        form.clearErrors([
                          `questions.${questionIndex}.${type}.display`,
                        ]);
                      }}
                      placeholder="Enter code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormField
              control={form.control}
              name={`questions.${questionIndex}.${type}.display`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("display")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={code.display}
                      placeholder="Unverified"
                      className={!code.display ? "text-gray-500" : undefined}
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="pt-6">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!code.system || !code.code) {
                  toast.error("Please select a system and enter a code first");
                  return;
                }

                verifyCode({
                  system: code.system,
                  code: code.code,
                });
              }}
            >
              <UpdateIcon className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
