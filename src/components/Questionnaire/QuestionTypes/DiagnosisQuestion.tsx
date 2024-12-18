import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_VERIFICATION_STATUS,
  type Diagnosis,
} from "@/types/questionnaire/diagnosis";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";

interface DiagnosisQuestionProps {
  question: any;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

export function DiagnosisQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: DiagnosisQuestionProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(() => {
    return (questionnaireResponse.values?.[0]?.value as Diagnosis[]) || [];
  });

  const diagnosisSearch = useQuery(routes.valueset.expand, {
    pathParams: { system: "system-condition-code" },
    body: { count: 10 },
    prefetch: false,
  });

  const handleAddDiagnosis = () => {
    const newDiagnoses = [
      ...diagnoses,
      { code: { code: "", display: "", system: "" } } as Diagnosis,
    ];
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
    });
  };

  const handleRemoveDiagnosis = (index: number) => {
    const newDiagnoses = diagnoses.filter((_, i) => i !== index);
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
    });
  };

  const updateDiagnosis = (index: number, updates: Partial<Diagnosis>) => {
    const newDiagnoses = diagnoses.map((diagnosis, i) =>
      i === index ? { ...diagnosis, ...updates } : diagnosis,
    );
    setDiagnoses(newDiagnoses);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "diagnosis",
          value: newDiagnoses,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <div className="rounded-lg border p-4">
        <div className="overflow-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Diagnosis</TableHead>
                <TableHead className="w-[150px]">Clinical Status</TableHead>
                <TableHead className="w-[150px]">Verification</TableHead>
                <TableHead className="w-[150px]">Onset Date</TableHead>
                <TableHead className="w-[200px]">Note</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {diagnoses.map((diagnosis, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[200px]">
                    <Popover>
                      <PopoverTrigger asChild disabled={disabled}>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between truncate"
                        >
                          {diagnosis.code.display || "Search diagnoses..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command filter={() => 1}>
                          <CommandInput
                            placeholder="Search diagnoses..."
                            className="my-1"
                            onValueChange={(search) =>
                              diagnosisSearch.refetch({ body: { search } })
                            }
                          />
                          <CommandList>
                            <CommandEmpty>
                              {diagnosisSearch.loading
                                ? "Loading..."
                                : "No diagnoses found"}
                            </CommandEmpty>
                            <CommandGroup>
                              {diagnosisSearch.data?.results.map(
                                (option) =>
                                  option.code && (
                                    <CommandItem
                                      key={option.code}
                                      value={option.code}
                                      onSelect={() => {
                                        updateDiagnosis(index, {
                                          code: {
                                            code: option.code,
                                            display: option.display || "",
                                            system: option.system || "",
                                          },
                                        });
                                      }}
                                    >
                                      <span>{option.display}</span>
                                    </CommandItem>
                                  ),
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={diagnosis.clinical_status}
                      onValueChange={(value) =>
                        updateDiagnosis(index, {
                          clinical_status:
                            value as Diagnosis["clinical_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Clinical Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAGNOSIS_CLINICAL_STATUS.map((status) => (
                          <SelectItem
                            className="capitalize"
                            key={status}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={diagnosis.verification_status}
                      onValueChange={(value) =>
                        updateDiagnosis(index, {
                          verification_status:
                            value as Diagnosis["verification_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAGNOSIS_VERIFICATION_STATUS.map((status) => (
                          <SelectItem
                            className="capitalize"
                            key={status}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <input
                      type="date"
                      className="w-full rounded-md border p-2"
                      value={diagnosis.onset?.onset_datetime || ""}
                      onChange={(e) =>
                        updateDiagnosis(index, {
                          onset: {
                            onset_datetime: e.target.value,
                          },
                        })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[200px]">
                    <input
                      type="text"
                      className="w-full rounded-md border p-2"
                      placeholder="Note"
                      value={diagnosis.note || ""}
                      onChange={(e) =>
                        updateDiagnosis(index, { note: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[50px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveDiagnosis(index)}
                      disabled={disabled}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleAddDiagnosis}
          disabled={disabled}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Diagnosis
        </Button>
      </div>
    </div>
  );
}
