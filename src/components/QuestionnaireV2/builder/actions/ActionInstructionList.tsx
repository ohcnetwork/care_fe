import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ContextPathOption } from "@/components/QuestionnaireV2/builder/actionVariables";
import { useEditorRowKeys } from "@/components/QuestionnaireV2/builder/useEditorRowKeys";

import {
  ActionInstructionDefinition,
  QuestionnaireActionInstruction,
} from "@/types/questionnaire/actions";

import { InstructionEditor } from "./InstructionEditor";
import { isInstructionCompatible } from "./instructionCompatibility";
import { newInstruction } from "./instructionDefaults";
import { ActionVariableSources } from "./labels";

interface ActionInstructionListProps {
  idPrefix: string;
  instructions: QuestionnaireActionInstruction[];
  definitions: ActionInstructionDefinition[] | undefined;
  contextPaths: ContextPathOption[];
  sources: ActionVariableSources;
  facilityId?: string;
  onChange: (instructions: QuestionnaireActionInstruction[]) => void;
}

export function ActionInstructionList({
  idPrefix,
  instructions,
  definitions,
  contextPaths,
  sources,
  facilityId,
  onChange,
}: ActionInstructionListProps) {
  const { t } = useTranslation();
  const { rowKeys, removeRowKey } = useEditorRowKeys(
    idPrefix,
    instructions.length,
  );
  const compatible = definitions?.filter((definition) =>
    isInstructionCompatible(definition, contextPaths),
  );

  return (
    <>
      {instructions.map((instruction, index) => (
        <InstructionEditor
          key={rowKeys[index]}
          idPrefix={`${idPrefix}-instruction-${rowKeys[index]}`}
          instruction={instruction}
          definitions={definitions}
          contextPaths={contextPaths}
          sources={sources}
          facilityId={facilityId}
          onChange={(next) =>
            onChange(
              instructions.map((entry, i) => (i === index ? next : entry)),
            )
          }
          onRemove={() => {
            removeRowKey(index);
            onChange(instructions.filter((_, i) => i !== index));
          }}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...instructions,
            compatible?.length === 1
              ? newInstruction(compatible[0], contextPaths)
              : { slug: "", params: {}, context: "self" },
          ])
        }
      >
        <Plus className="size-4" />
        {t("action_add_instruction")}
      </Button>
    </>
  );
}
