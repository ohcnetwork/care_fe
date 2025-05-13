import { UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { t } from "i18next";
import { useForm } from "react-hook-form";
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
  ValuesetLookupResponse,
} from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

interface CodingEditorProps {
  code?: Code;
  questionIndex: number;
  form: ReturnType<typeof useForm<any>>;
  onChange: (code: Code | undefined) => void;
}

export function CodingEditor({
  code,
  onChange,
  form,
  questionIndex,
}: CodingEditorProps) {
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
      console.error(error);
      form.setError(`questions.${questionIndex}.code.display`, {
        type: "manual",
        message: t("code_verification_required"),
      });
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
              system: TERMINOLOGY_SYSTEMS["LOINC"],
              code: "",
              display: "",
            });
          }}
        >
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("add_coding")}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center w-full justify-between">
          <Label className="text-base font-medium">Coding Details</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onChange(undefined);
              form.clearErrors([`questions.${questionIndex}.code`]);
            }}
          >
            <CareIcon icon="l-trash-alt" className="mr-2 size-4" />
            {t("remove_coding")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.code.system`}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_system")} />
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
              name={`questions.${questionIndex}.code.code`}
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
                          `questions.${questionIndex}.code.display`,
                        ]);
                      }}
                      placeholder={t("enter_code")}
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
              name={`questions.${questionIndex}.code.display`}
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
              onClick={() => {
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
