import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  ContextPathOption,
  SELF_CONTEXT_PATH,
} from "@/components/QuestionnaireV2/builder/actionVariables";

import {
  ActionInstructionDefinition,
  ActionParamSchema,
  QuestionnaireActionInstruction,
} from "@/types/questionnaire/actions";

import { TagResource } from "@/types/emr/tagConfig/tagConfig";

import { ParamValueInput } from "./ParamValueInput";
import { TagConfigParamPicker } from "./TagConfigParamPicker";
import {
  ActionVariableSources,
  contextPathLabel,
  humanize,
  instructionLabel,
  instructionTypeLabel,
} from "./labels";

type ParamKind = "string" | "number" | "boolean" | "enum" | "json";

type SchemaDefs = Record<string, ActionParamSchema> | undefined;

/** Pydantic renders `str | None` as `anyOf` (the first non-null branch is
 *  the one the author fills in) and an Enum as a `$ref` into `$defs`. */
function resolveSchema(
  schema: ActionParamSchema,
  defs: SchemaDefs,
): ActionParamSchema {
  if (schema.$ref) {
    const name = schema.$ref.split("/").pop() ?? "";
    const target = defs?.[name];
    return target
      ? { ...resolveSchema(target, defs), ...withoutRef(schema) }
      : schema;
  }
  if (!schema.anyOf) return schema;
  const branch =
    schema.anyOf.find((candidate) => candidate.type !== "null") ??
    schema.anyOf[0];
  return { ...resolveSchema(branch, defs), ...withoutAnyOf(schema) };
}

function withoutRef({ $ref: _ref, ...rest }: ActionParamSchema) {
  return rest;
}

function withoutAnyOf({ anyOf: _anyOf, ...rest }: ActionParamSchema) {
  return rest;
}

function paramKindOf(schema: ActionParamSchema, defs: SchemaDefs): ParamKind {
  const resolved = resolveSchema(schema, defs);
  const type = Array.isArray(resolved.type)
    ? resolved.type.find((entry) => entry !== "null")
    : resolved.type;
  if (resolved.enum && resolved.enum.every((v) => typeof v === "string")) {
    return "enum";
  }
  switch (type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "json";
  }
}

/** The params a freshly picked instruction starts with — schema defaults
 *  only, so a required param without one stays blank and the save rule
 *  flags it. */
export function defaultParams(
  definition: ActionInstructionDefinition,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(definition.input_schema.properties ?? {})
      .filter(([, schema]) => schema.default !== undefined)
      .map(([name, schema]) => [name, schema.default]),
  );
}

/**
 * The context path an instruction is applied to: the one reachable path
 * whose type matches its declared context, else the submission itself.
 * Not an author choice — nothing on the backend distinguishes the two
 * today, so there is no control for it, only a line saying what resolved.
 */
export function defaultContextPath(
  definition: ActionInstructionDefinition | undefined,
  contextPaths: ContextPathOption[],
): string {
  const matches = definition
    ? contextPaths.filter((option) => option.contextType === definition.context)
    : [];
  return matches.length === 1 ? matches[0].path : SELF_CONTEXT_PATH;
}

/** A fresh instruction for `definition`, params at their defaults. */
export function newInstruction(
  definition: ActionInstructionDefinition,
  contextPaths: ContextPathOption[],
): QuestionnaireActionInstruction {
  return {
    slug: definition.slug,
    params: defaultParams(definition),
    context: defaultContextPath(definition, contextPaths),
  };
}

/** Anything the typed controls cannot express is edited as JSON text —
 *  committed on blur, and kept as text while it does not parse. */
function JsonParamInput({
  id,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  "aria-label": string;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(() =>
    value === undefined ? "" : JSON.stringify(value, null, 2),
  );
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="space-y-1">
      <Textarea
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className="font-mono text-xs"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text.trim() === "") {
            setInvalid(false);
            onChange(undefined);
            return;
          }
          try {
            onChange(JSON.parse(text));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
      />
      {invalid && (
        <p className="text-xs text-red-600">{t("action_param_json_invalid")}</p>
      )}
    </div>
  );
}

interface InstructionEditorProps {
  /** Stable per-instruction DOM id prefix. */
  idPrefix: string;
  instruction: QuestionnaireActionInstruction;
  definitions: ActionInstructionDefinition[] | undefined;
  contextPaths: ContextPathOption[];
  sources: ActionVariableSources;
  /** The studio mount's facility, for pickers that list facility-scoped
   *  records (tags). */
  facilityId?: string;
  onChange: (instruction: QuestionnaireActionInstruction) => void;
  onRemove: () => void;
}

const TAG_RESOURCES = new Set<string>(Object.values(TagResource));

function tagResourceOf(schema: ActionParamSchema): TagResource | undefined {
  const resource = schema["x-care-resource"];
  return resource && TAG_RESOURCES.has(resource)
    ? (resource as TagResource)
    : undefined;
}

/**
 * One "Then" step: which registered instruction runs and the inputs its
 * `input_schema` declares. Instruction and type names are plain language
 * (`labels.ts`); the registry slug never reaches the screen.
 */
export function InstructionEditor({
  idPrefix,
  instruction,
  definitions,
  contextPaths,
  sources,
  facilityId,
  onChange,
  onRemove,
}: InstructionEditorProps) {
  const { t } = useTranslation();
  const definition = definitions?.find(
    (candidate) => candidate.slug === instruction.slug,
  );
  // A saved slug the registry no longer serves — kept visible (and
  // flagged) rather than blanked, so the author sees what was there.
  const unknownSlug =
    !!definitions && !!instruction.slug && !definition
      ? instruction.slug
      : undefined;
  const properties = Object.entries(definition?.input_schema.properties ?? {});
  const defs = definition?.input_schema.$defs;
  const required = new Set(definition?.input_schema.required ?? []);
  const runsOn = contextPaths.find(
    (option) => option.path === instruction.context,
  );

  const setParam = (name: string, value: unknown) => {
    const params = { ...instruction.params };
    if (value === undefined) delete params[name];
    else params[name] = value;
    onChange({ ...instruction, params });
  };

  return (
    <div className="space-y-3 rounded-md bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">
          {t("action_instruction")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onRemove}
          aria-label={t("action_remove_instruction")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Select
        value={instruction.slug || undefined}
        onValueChange={(slug) => {
          const next = definitions?.find(
            (candidate) => candidate.slug === slug,
          );
          onChange(
            next
              ? newInstruction(next, contextPaths)
              : { slug, params: {}, context: SELF_CONTEXT_PATH },
          );
        }}
      >
        <SelectTrigger
          className="w-full"
          aria-label={t("action_instruction")}
          aria-invalid={Boolean(unknownSlug)}
        >
          <SelectValue placeholder={t("action_instruction_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {unknownSlug && (
            <SelectItem value={unknownSlug} disabled className="text-red-600">
              {humanize(unknownSlug)}
            </SelectItem>
          )}
          {(definitions ?? []).map((candidate) => (
            <SelectItem key={candidate.slug} value={candidate.slug}>
              <span className="flex items-center gap-2">
                {instructionLabel(candidate.slug, t)}
                <Badge variant="secondary" className="text-[10px]">
                  {instructionTypeLabel(candidate.instruction_type, t)}
                </Badge>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {unknownSlug && (
        <p className="text-xs text-red-600">
          {t("action_instruction_unknown")}
        </p>
      )}

      {properties.map(([name, schema]) => {
        const resolved = resolveSchema(schema, defs);
        const kind = paramKindOf(schema, defs);
        const tagResource =
          resolved["x-care-picker"] === "tag_config"
            ? tagResourceOf(resolved)
            : undefined;
        const id = `${idPrefix}-param-${name}`;
        const label = resolved.title ?? humanize(name);
        const value = instruction.params[name];
        return (
          <div key={name} className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-medium text-gray-600">
              {label}
              {required.has(name) ? (
                <span className="text-red-600"> *</span>
              ) : (
                <span className="font-normal text-gray-400">
                  {" "}
                  · {t("optional")}
                </span>
              )}
            </Label>
            {resolved.description && (
              <p className="text-xs text-gray-500">{resolved.description}</p>
            )}
            {tagResource ? (
              <TagConfigParamPicker
                id={id}
                resource={tagResource}
                facilityId={facilityId}
                value={value}
                onChange={(next) => setParam(name, next)}
                aria-label={label}
              />
            ) : kind === "boolean" ? (
              <Switch
                id={id}
                aria-label={label}
                checked={value === true}
                onCheckedChange={(checked) => setParam(name, checked)}
              />
            ) : kind === "enum" ? (
              <Select
                value={typeof value === "string" ? value : undefined}
                onValueChange={(next) => setParam(name, next)}
              >
                <SelectTrigger id={id} className="w-full" aria-label={label}>
                  <SelectValue placeholder={t("select")} />
                </SelectTrigger>
                <SelectContent>
                  {(resolved.enum ?? []).map((option) => (
                    <SelectItem key={String(option)} value={String(option)}>
                      {humanize(String(option))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : kind === "json" ? (
              <JsonParamInput
                id={id}
                value={value}
                onChange={(next) => setParam(name, next)}
                aria-label={label}
              />
            ) : (
              <ParamValueInput
                id={id}
                kind={kind}
                value={value}
                onChange={(next) => setParam(name, next)}
                sources={sources}
                aria-label={label}
              />
            )}
          </div>
        );
      })}

      {/* Said only when it is not the submission itself — the default needs
          no explaining, a neighbour ("Patient") does. */}
      {instruction.context && instruction.context !== SELF_CONTEXT_PATH && (
        <p className="text-xs text-gray-500">
          {t("action_runs_on", {
            context: runsOn ? contextPathLabel(runsOn, t) : instruction.context,
          })}
        </p>
      )}
    </div>
  );
}
