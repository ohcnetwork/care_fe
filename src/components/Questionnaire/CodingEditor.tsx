import { UpdateIcon } from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  onChange: (code: Code | undefined) => void;
}

export function CodingEditor({ code, onChange }: CodingEditorProps) {
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
      toast.error("Failed to verify code");
    },
  });

  if (!code) {
    return (
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({
              system: Object.values(TERMINOLOGY_SYSTEMS)[0],
              code: "",
              display: "",
            });
          }}
        >
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          Add Coding
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
            onClick={() => {
              onChange(undefined);
            }}
          >
            <CareIcon icon="l-trash-alt" className="mr-2 size-4" />
            Remove Coding
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>System</Label>
          <Select
            value={code.system}
            onValueChange={(value) => {
              onChange({
                ...code,
                system: value,
                code: "",
                display: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select system" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TERMINOLOGY_SYSTEMS).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-start">
          <div>
            <Label>Code</Label>
            <Input
              value={code.code}
              onChange={(e) => {
                onChange({
                  ...code,
                  code: e.target.value,
                  display: "",
                });
              }}
              placeholder="Enter code"
            />
          </div>
          <div>
            <Label>Display</Label>
            <Input
              value={code.display}
              placeholder="Unverified"
              className={!code.display ? "text-gray-500" : undefined}
              readOnly
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
