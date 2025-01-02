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
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_SEVERITY,
  SYMPTOM_VERIFICATION_STATUS,
  type Symptom,
} from "@/types/questionnaire/symptom";

interface SymptomQuestionProps {
  question: any;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

export function SymptomQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: SymptomQuestionProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>(() => {
    return (questionnaireResponse.values?.[0]?.value as Symptom[]) || [];
  });

  const symptomSearch = useQuery(routes.valueset.expand, {
    pathParams: { system: "system-condition-code" },
    body: { count: 10 },
    prefetch: false,
  });

  const handleAddSymptom = () => {
    const newSymptoms = [
      ...symptoms,
      { code: { code: "", display: "", system: "" } } as Symptom,
    ];
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
        },
      ],
    });
  };

  const handleRemoveSymptom = (index: number) => {
    const newSymptoms = symptoms.filter((_, i) => i !== index);
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
        },
      ],
    });
  };

  const updateSymptom = (index: number, updates: Partial<Symptom>) => {
    const newSymptoms = symptoms.map((symptom, i) =>
      i === index ? { ...symptom, ...updates } : symptom,
    );
    setSymptoms(newSymptoms);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "symptom",
          value: newSymptoms,
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Symptom</TableHead>
                <TableHead className="w-[150px]">Clinical Status</TableHead>
                <TableHead className="w-[150px]">Verification</TableHead>
                <TableHead className="w-[150px]">Severity</TableHead>
                <TableHead className="w-[150px]">Onset Date</TableHead>
                <TableHead className="w-[200px]">Note</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {symptoms.map((symptom, index) => (
                <TableRow key={index}>
                  <TableCell className="min-w-[200px]">
                    <Popover>
                      <PopoverTrigger asChild disabled={disabled}>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between truncate"
                        >
                          {symptom.code.display || "Search symptoms..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command filter={() => 1}>
                          <CommandInput
                            placeholder="Search symptoms..."
                            className="my-1"
                            onValueChange={(search) =>
                              symptomSearch.refetch({ body: { search } })
                            }
                          />
                          <CommandList>
                            <CommandEmpty>
                              {symptomSearch.loading
                                ? "Loading..."
                                : "No symptoms found"}
                            </CommandEmpty>
                            <CommandGroup>
                              {symptomSearch.data?.results.map(
                                (option) =>
                                  option.code && (
                                    <CommandItem
                                      key={option.code}
                                      value={option.code}
                                      onSelect={() => {
                                        updateSymptom(index, {
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
                      value={symptom.clinical_status}
                      onValueChange={(value) =>
                        updateSymptom(index, {
                          clinical_status: value as Symptom["clinical_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Clinical Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMPTOM_CLINICAL_STATUS.map((status) => (
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
                      value={symptom.verification_status}
                      onValueChange={(value) =>
                        updateSymptom(index, {
                          verification_status:
                            value as Symptom["verification_status"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Verification" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMPTOM_VERIFICATION_STATUS.map((status) => (
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
                      value={symptom.severity}
                      onValueChange={(value) =>
                        updateSymptom(index, {
                          severity: value as Symptom["severity"],
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {SYMPTOM_SEVERITY.map((severity) => (
                          <SelectItem key={severity} value={severity}>
                            {severity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <input
                      type="date"
                      className="w-full rounded-md border p-2"
                      value={symptom.onset?.onset_datetime || ""}
                      onChange={(e) =>
                        updateSymptom(index, {
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
                      value={symptom.note || ""}
                      onChange={(e) =>
                        updateSymptom(index, { note: e.target.value })
                      }
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell className="min-w-[50px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveSymptom(index)}
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
          onClick={handleAddSymptom}
          disabled={disabled}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Symptom
        </Button>
      </div>
    </div>
  );
}
