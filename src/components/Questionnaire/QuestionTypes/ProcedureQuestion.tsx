import { useQuery } from "@tanstack/react-query";
import { startOfDay } from "date-fns";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  EllipsisVertical as DotsVerticalIcon,
  CircleMinus as MinusCircledIcon,
  Pencil as Pencil2Icon,
  X,
} from "lucide-react";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

import { formatProcedureOccurrence } from "@/components/Patient/procedures/utils";
import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import {
  PROCEDURE_OUTCOME,
  PROCEDURE_STATUS,
  PROCEDURE_STATUS_WITH_REASON,
  Procedure,
  ProcedureOccurrence,
  ProcedureOutcome,
  ProcedureRequest,
} from "@/types/emr/procedure/procedure";
import procedureApi from "@/types/emr/procedure/procedureApi";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface ProcedureQuestionProps {
  patientId: string;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  initializeQuestionnaireResponseCB?: (values: ResponseValue[]) => void;
  disabled?: boolean;
  question: Question;
}

// No default date: most procedures are recorded long after they happened.
const PROCEDURE_INITIAL_VALUE: Omit<ProcedureRequest, "encounter"> = {
  code: { code: "", display: "", system: "" },
  status: "completed",
  category: [],
  body_site: [],
  reason: [],
  occurrence: {},
};

const NO_OUTCOME = "none";

const noop = () => {};

function hasDetails(procedure: ProcedureRequest) {
  return Boolean(
    procedure.note ||
    procedure.status_reason ||
    procedure.occurrence.occurrence_string ||
    procedure.body_site.length ||
    procedure.reason.length ||
    procedure.category.length,
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm font-medium text-gray-700 mb-1">{children}</div>
  );
}

function StatusSelect({
  status,
  onValueChange,
  isExistingRecord,
  disabled,
}: {
  status: string;
  onValueChange: (value: string) => void;
  isExistingRecord?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-8 md:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROCEDURE_STATUS.map(
          (value) =>
            (isExistingRecord || value !== "entered_in_error") && (
              <SelectItem key={value} value={value}>
                {t(value)}
              </SelectItem>
            ),
        )}
      </SelectContent>
    </Select>
  );
}

function OutcomeSelect({
  outcome,
  onValueChange,
  disabled,
}: {
  outcome?: ProcedureOutcome | null;
  onValueChange: (value: ProcedureOutcome | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={outcome ?? NO_OUTCOME}
      onValueChange={(value) =>
        onValueChange(value === NO_OUTCOME ? null : (value as ProcedureOutcome))
      }
      disabled={disabled}
    >
      <SelectTrigger className="h-8 md:h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_OUTCOME}>{t("not_specified")}</SelectItem>
        {PROCEDURE_OUTCOME.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`procedure_outcome__${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OccurrenceInput({
  occurrence,
  onChange,
  disabled,
}: {
  occurrence: ProcedureOccurrence;
  onChange: (occurrence: ProcedureOccurrence) => void;
  disabled?: boolean;
}) {
  // An approximate description or a period replaces the date; edit it
  // from the details instead.
  if (occurrence.occurrence_string || occurrence.occurrence_period) {
    const label = formatProcedureOccurrence(occurrence);
    return (
      <div className="text-sm text-gray-700 truncate px-1" title={label}>
        {label}
      </div>
    );
  }
  return (
    <CombinedDatePicker
      value={
        occurrence.occurrence_datetime
          ? new Date(occurrence.occurrence_datetime)
          : undefined
      }
      onChange={(date) =>
        onChange(
          date ? { occurrence_datetime: startOfDay(date).toISOString() } : {},
        )
      }
      disabled={disabled}
      allowClear
      blockDate={(date) => date > new Date()}
      buttonClassName="h-8 md:h-9 w-full justify-start font-normal"
    />
  );
}

function CodeListInput({
  system,
  codes,
  onChange,
  placeholder,
  disabled,
}: {
  system: string;
  codes: Code[];
  onChange: (codes: Code[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {codes.map((code) => (
            <Badge key={code.code} variant="secondary" className="gap-1">
              {code.display}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`${t("remove")} ${code.display}`}
                  onClick={() =>
                    onChange(codes.filter((c) => c.code !== code.code))
                  }
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      <ValueSetSelect
        system={system}
        placeholder={placeholder}
        onSelect={(code) => {
          if (!codes.some((c) => c.code === code.code)) {
            onChange([...codes, code]);
          }
        }}
        disabled={disabled}
      />
    </div>
  );
}

function ProcedureDetailsFields({
  procedure,
  onUpdate,
  disabled,
}: {
  procedure: ProcedureRequest;
  onUpdate: (updates: Partial<ProcedureRequest>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <FieldLabel>{t("approximate_date")}</FieldLabel>
        <Input
          type="text"
          placeholder={t("approximate_date_placeholder")}
          value={procedure.occurrence.occurrence_string ?? ""}
          onChange={(e) =>
            onUpdate({
              occurrence: e.target.value
                ? { occurrence_string: e.target.value }
                : {},
            })
          }
          disabled={disabled}
        />
      </div>
      {PROCEDURE_STATUS_WITH_REASON.includes(procedure.status) && (
        <div>
          <FieldLabel>{t("status_reason")}</FieldLabel>
          <ValueSetSelect
            system="system-procedure-status-reason"
            value={procedure.status_reason}
            placeholder={t("select_status_reason")}
            onSelect={(code) => onUpdate({ status_reason: code })}
            disabled={disabled}
          />
        </div>
      )}
      <div>
        <FieldLabel>{t("body_site")}</FieldLabel>
        <CodeListInput
          system="system-body-site"
          codes={procedure.body_site}
          onChange={(body_site) => onUpdate({ body_site })}
          placeholder={t("select_body_site")}
          disabled={disabled}
        />
      </div>
      <div>
        <FieldLabel>{t("reason")}</FieldLabel>
        <CodeListInput
          system="system-procedure-reason"
          codes={procedure.reason}
          onChange={(reason) => onUpdate({ reason })}
          placeholder={t("select_reason")}
          disabled={disabled}
        />
      </div>
      <div>
        <FieldLabel>{t("category")}</FieldLabel>
        <CodeListInput
          system="system-procedure-category"
          codes={procedure.category}
          onChange={(category) => onUpdate({ category })}
          placeholder={t("select_category")}
          disabled={disabled}
        />
      </div>
      <div>
        <FieldLabel>{t("note")}</FieldLabel>
        <Input
          type="text"
          placeholder={t("additional_notes")}
          value={procedure.note || ""}
          onChange={(e) => onUpdate({ note: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function convertToProcedureRequest(procedure: Procedure): ProcedureRequest {
  return {
    id: procedure.id,
    code: procedure.code,
    status: procedure.status,
    status_reason: procedure.status_reason,
    category: procedure.category,
    occurrence: procedure.occurrence,
    body_site: procedure.body_site,
    reason: procedure.reason,
    outcome: procedure.outcome,
    note: procedure.note,
    encounter: procedure.encounter,
    created_date: procedure.created_date,
    created_by: procedure.created_by,
  };
}

interface ProcedureRowProps {
  procedure: ProcedureRequest;
  index: number;
  disabled?: boolean;
  onUpdate: (index: number, updates: Partial<ProcedureRequest>) => void;
  onRemove: (index: number) => void;
}

function ProcedureActionsMenu({
  showDetails,
  status,
  disabled,
  onToggleDetails,
  onRemove,
}: {
  showDetails: boolean;
  status: string;
  disabled?: boolean;
  onToggleDetails: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="size-9"
          aria-label={t("actions")}
        >
          <DotsVerticalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onToggleDetails}>
          <Pencil2Icon className="size-4 mr-2" />
          {showDetails ? t("hide_details") : t("show_details")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onRemove}
          disabled={status === "entered_in_error"}
        >
          <MinusCircledIcon className="size-4 mr-2" />
          {status === "entered_in_error"
            ? t("already_marked_as_error")
            : t("remove_procedure")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ProcedureRow = React.memo(function ProcedureRow({
  procedure,
  index,
  disabled,
  onUpdate,
  onRemove,
}: ProcedureRowProps) {
  const { t } = useTranslation();

  const [showDetails, setShowDetails] = useState(() => hasDetails(procedure));
  const [isOpen, setIsOpen] = useState(!procedure.id);
  const isMobile = useBreakpoints({ default: true, md: false });

  const isProcedureInSheet = index === -1;

  const handleUpdate = useCallback(
    (updates: Partial<ProcedureRequest>) => onUpdate(index, updates),
    [index, onUpdate],
  );

  const handleOccurrenceChange = useCallback(
    (occurrence: ProcedureOccurrence) => onUpdate(index, { occurrence }),
    [index, onUpdate],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value as ProcedureRequest["status"];
      onUpdate(index, {
        status,
        // A reason only qualifies statuses that take one.
        ...(!PROCEDURE_STATUS_WITH_REASON.includes(status) && {
          status_reason: null,
        }),
      });
    },
    [index, onUpdate],
  );

  const handleOutcomeChange = useCallback(
    (outcome: ProcedureOutcome | null) => onUpdate(index, { outcome }),
    [index, onUpdate],
  );

  const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

  const mainFields = (
    <>
      <div>
        <FieldLabel>{t("date_performed")}</FieldLabel>
        <OccurrenceInput
          occurrence={procedure.occurrence}
          onChange={handleOccurrenceChange}
          disabled={disabled}
        />
      </div>
      <div>
        <FieldLabel>{t("status")}</FieldLabel>
        <StatusSelect
          status={procedure.status}
          onValueChange={handleStatusChange}
          isExistingRecord={!!procedure.id}
          disabled={disabled}
        />
      </div>
      <div>
        <FieldLabel>{t("outcome")}</FieldLabel>
        <OutcomeSelect
          outcome={procedure.outcome}
          onValueChange={handleOutcomeChange}
          disabled={disabled}
        />
      </div>
    </>
  );

  if (isProcedureInSheet) {
    return (
      <div className="space-y-3">
        {mainFields}
        <ProcedureDetailsFields
          procedure={procedure}
          onUpdate={handleUpdate}
          disabled={disabled}
        />
      </div>
    );
  }

  // For mobile view - Card Layout
  if (isMobile) {
    const occurrenceLabel = formatProcedureOccurrence(procedure.occurrence);
    return (
      <div className="group hover:bg-gray-50">
        <Card
          className={cn(
            "mb-2 rounded-lg border-0 shadow-none",
            isOpen && "border border-primary-500",
          )}
        >
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            key={procedure.id || `procedure-${procedure.code.code}-${index}`}
          >
            <CollapsibleTrigger asChild>
              <CardHeader
                className={cn(
                  "p-2 rounded-lg shadow-none bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                  {
                    "bg-gray-200 border border-gray-300": !isOpen,
                  },
                )}
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <CardTitle
                        className="text-base text-gray-950 break-words"
                        title={procedure.code.display}
                      >
                        {procedure.code.display}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isOpen && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("remove_procedure")}
                          disabled={
                            disabled || procedure.status === "entered_in_error"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                          }}
                          className="h-10 w-10 p-4 border border-gray-400 bg-white shadow text-destructive"
                        >
                          <MinusCircledIcon className="size-5" />
                        </Button>
                      )}
                      {/* Decorative: the whole card header is the toggle. */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-hidden
                        tabIndex={-1}
                        className="h-10 w-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
                      >
                        {isOpen ? (
                          <ChevronsDownUp className="size-5" />
                        ) : (
                          <ChevronsUpDown className="size-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {!isOpen && (
                    <div className="text-sm mt-1 text-gray-600">
                      {[
                        occurrenceLabel,
                        t(procedure.status),
                        procedure.outcome &&
                          t(`procedure_outcome__${procedure.outcome}`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-3 pt-2 space-y-3 rounded-lg bg-gray-50">
                {mainFields}
                <ProcedureDetailsFields
                  procedure={procedure}
                  onUpdate={handleUpdate}
                  disabled={disabled}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    );
  }

  // For desktop view - Table Row
  return (
    <>
      <TableRow className={cn(disabled && "opacity-40 pointer-events-none")}>
        <TableCell className="font-medium">
          <div
            className="truncate max-w-[300px]"
            title={procedure.code.display}
          >
            {procedure.code.display}
          </div>
        </TableCell>
        <TableCell>
          <OccurrenceInput
            occurrence={procedure.occurrence}
            onChange={handleOccurrenceChange}
            disabled={disabled}
          />
        </TableCell>
        <TableCell>
          <StatusSelect
            status={procedure.status}
            onValueChange={handleStatusChange}
            isExistingRecord={!!procedure.id}
            disabled={disabled}
          />
        </TableCell>
        <TableCell>
          <OutcomeSelect
            outcome={procedure.outcome}
            onValueChange={handleOutcomeChange}
            disabled={disabled}
          />
        </TableCell>
        <TableCell className="text-center">
          <ProcedureActionsMenu
            showDetails={showDetails}
            status={procedure.status}
            disabled={disabled}
            onToggleDetails={() => setShowDetails((value) => !value)}
            onRemove={handleRemove}
          />
        </TableCell>
      </TableRow>
      {showDetails && (
        <TableRow className={cn(disabled && "opacity-40 pointer-events-none")}>
          <TableCell colSpan={5} className="px-3 pb-3">
            <ProcedureDetailsFields
              procedure={procedure}
              onUpdate={handleUpdate}
              disabled={disabled}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

function warnIfProcedureListed(
  procedures: ProcedureRequest[],
  code: Code,
  t: (key: string) => string,
) {
  // Repeat procedures are real (two caesareans, serial transfusions), so a
  // duplicate code only warns instead of blocking.
  if (
    procedures.some(
      (procedure) =>
        procedure.code.code === code.code &&
        procedure.status !== "entered_in_error",
    )
  ) {
    toast.warning(t("procedure_already_listed_warning"));
  }
}

export function ProcedureQuestion({
  patientId,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  initializeQuestionnaireResponseCB,
  disabled,
  encounterId,
}: ProcedureQuestionProps) {
  const { t } = useTranslation();

  const isPreview = patientId === "preview";
  const procedures =
    (questionnaireResponse.values?.[0]?.value as ProcedureRequest[]) || [];
  const [showProcedureSelection, setShowProcedureSelection] = useState(false);
  const [newProcedure, setNewProcedure] = useState<Partial<ProcedureRequest>>(
    PROCEDURE_INITIAL_VALUE,
  );
  const isMobile = useBreakpoints({ default: true, md: false });

  const { data: patientProcedures } = useQuery({
    queryKey: ["procedures", patientId, encounterId],
    queryFn: query(procedureApi.listProcedures, {
      pathParams: { patientId },
      queryParams: {
        limit: 100,
        encounter: encounterId,
      },
    }),
    enabled: !isPreview,
  });

  // Saved as entered in error: read-only for the rest of the session.
  const erroredIds = new Set(
    patientProcedures?.results
      .filter((procedure) => procedure.status === "entered_in_error")
      .map((procedure) => procedure.id),
  );

  // Reconcile fresh server data without reinitializing on clinician edits.
  const initializeResponse = useEffectEvent(() => {
    if (
      patientProcedures?.results &&
      (initializeQuestionnaireResponseCB ||
        questionnaireResponse.values.length === 0)
    ) {
      (initializeQuestionnaireResponseCB ?? updateQuestionnaireResponseCB)(
        [
          {
            type: "procedure",
            value: patientProcedures.results.map(convertToProcedureRequest),
          },
        ],
        questionnaireResponse.question_id,
      );
    }
  });

  useEffect(() => {
    initializeResponse();
  }, [patientProcedures]);

  const updateProcedures = (newProcedures: ProcedureRequest[]) =>
    updateQuestionnaireResponseCB(
      [{ type: "procedure", value: newProcedures }],
      questionnaireResponse.question_id,
    );

  const addNewProcedure = (code: Code) => {
    updateProcedures([
      ...procedures,
      { ...newProcedure, code } as ProcedureRequest,
    ]);
    setShowProcedureSelection(false);
    setNewProcedure(PROCEDURE_INITIAL_VALUE);
  };

  const handleCodeSelect = (code: Code) => {
    warnIfProcedureListed(procedures, code, t);
    if (isMobile) {
      setNewProcedure({ ...PROCEDURE_INITIAL_VALUE, code });
      setShowProcedureSelection(true);
    } else {
      addNewProcedure(code);
    }
  };

  const handleConfirmProcedure = () => {
    if (!newProcedure.code) return;
    addNewProcedure(newProcedure.code);
  };

  const handleRemoveProcedure = (index: number) => {
    const procedure = procedures[index];
    if (procedure.id) {
      // For existing records, update status to entered_in_error
      updateProcedures(
        procedures.map((p, i) =>
          i === index ? { ...p, status: "entered_in_error" as const } : p,
        ),
      );
    } else {
      // For new records, remove them completely
      updateProcedures(procedures.filter((_, i) => i !== index));
    }
  };

  const handleUpdateProcedure = (
    index: number,
    updates: Partial<ProcedureRequest>,
  ) => {
    updateProcedures(
      procedures.map((procedure, i) =>
        i === index ? { ...procedure, ...updates } : procedure,
      ),
    );
  };

  const handleUpdateNewProcedure = useCallback(
    (_: number, updates: Partial<ProcedureRequest>) =>
      setNewProcedure((prev) => ({ ...prev, ...updates })),
    [],
  );

  const addProcedurePlaceholder = t("add_procedure", {
    count: procedures.length + 1,
  });

  const rows = procedures.map((procedure, index) => (
    <ProcedureRow
      procedure={procedure}
      index={index}
      disabled={disabled || (!!procedure.id && erroredIds.has(procedure.id))}
      onUpdate={handleUpdateProcedure}
      onRemove={handleRemoveProcedure}
      key={procedure.id || `procedure-${procedure.code.code}-${index}`}
    />
  ));

  return (
    <div className="space-y-2">
      {procedures.length > 0 &&
        (isMobile ? (
          <div>{rows}</div>
        ) : (
          <div className="rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[40%]">{t("procedure")}</TableHead>
                  <TableHead className="text-center">
                    {t("date_performed")}
                  </TableHead>
                  <TableHead className="text-center">{t("status")}</TableHead>
                  <TableHead className="text-center">{t("outcome")}</TableHead>
                  <TableHead className="text-center">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{rows}</TableBody>
            </Table>
          </div>
        ))}

      {isMobile ? (
        <EntitySelectionDrawer
          open={showProcedureSelection}
          onOpenChange={setShowProcedureSelection}
          system="system-procedure-code"
          entityType="procedure"
          disabled={disabled}
          onEntitySelected={handleCodeSelect}
          onConfirm={handleConfirmProcedure}
          placeholder={addProcedurePlaceholder}
        >
          <ProcedureRow
            procedure={newProcedure as ProcedureRequest}
            index={-1}
            disabled={disabled}
            onUpdate={handleUpdateNewProcedure}
            onRemove={noop}
          />
        </EntitySelectionDrawer>
      ) : (
        <ValueSetSelect
          system="system-procedure-code"
          placeholder={addProcedurePlaceholder}
          onSelect={handleCodeSelect}
          disabled={disabled}
        />
      )}
    </div>
  );
}
