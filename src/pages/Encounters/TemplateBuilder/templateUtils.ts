/**
 * Utility functions for template building and smart insertion
 */

interface InsertionResult {
  newTemplate: string;
  cursorPosition: number;
}

/**
 * Inserts content at cursor position or at the end of the template
 */
export function insertAtCursor(
  template: string,
  content: string,
  cursorPosition: number,
): InsertionResult {
  const before = template.slice(0, cursorPosition);
  const after = template.slice(cursorPosition);
  const newTemplate = before + content + after;
  const newCursorPosition = cursorPosition + content.length;

  return {
    newTemplate,
    cursorPosition: newCursorPosition,
  };
}

/**
 * Generates insertion content for a single object field
 * Example: patient.name -> {{ patient.name }}
 */
export function generateSingleObjectInsertion(
  sectionKey: string,
  fieldKey: string,
): string {
  return `{{ ${sectionKey}.${fieldKey} }}`;
}

/**
 * Checks if a queryset loop already exists in the template
 * Returns the position where to insert the field, or null if loop doesn't exist
 * @param template - The template string
 * @param loopTarget - The full path to loop over (e.g., "encounter.care_team")
 */
export function findQuerysetLoop(
  template: string,
  loopTarget: string,
): { exists: boolean; insertPosition?: number; itemVar?: string } {
  // Escape dots for regex
  const escapedTarget = loopTarget.replace(/\./g, "\\.");
  // Look for: {% for item in loopTarget %}
  const loopStartRegex = new RegExp(
    `{%\\s*for\\s+(\\w+)\\s+in\\s+${escapedTarget}\\s*%}`,
    "i",
  );
  const loopEndRegex = /{%\s*endfor\s*%}/gi;

  const loopStartMatch = template.match(loopStartRegex);

  if (!loopStartMatch) {
    return { exists: false };
  }

  const itemVar = loopStartMatch[1]; // Capture the loop variable name
  const loopStartPos = loopStartMatch.index! + loopStartMatch[0].length;

  // Find the corresponding endfor
  let endforPos = -1;
  const restOfTemplate = template.slice(loopStartPos);

  // Simple depth tracking to handle nested loops
  const forMatches = Array.from(
    restOfTemplate.matchAll(/{%\s*for\s+\w+\s+in\s+[\w.]+\s*%}/gi),
  );
  const endforMatches = Array.from(restOfTemplate.matchAll(loopEndRegex));

  // Find the matching endfor for our loop
  for (const endforMatch of endforMatches) {
    const endforPosition = endforMatch.index!;
    // Count how many 'for' statements are between loopStart and this endfor
    const nestedFors = forMatches.filter(
      (forMatch) => forMatch.index! < endforPosition,
    ).length;

    if (nestedFors === 0) {
      endforPos = loopStartPos + endforPosition;
      break;
    }
  }

  if (endforPos === -1) {
    return { exists: false };
  }

  // Insert position is just before the {% endfor %}
  return { exists: true, insertPosition: endforPos, itemVar };
}

/**
 * Represents a for loop in the template */
interface LoopInfo {
  /** What to iterate over, e.g., "encounter.medications" or "medication.dosages" */
  iterateOver: string;
  /** Loop variable name, e.g., "medication" */
  as: string;
}

/**
 * Generates nested for loops for queryset fields.
 *
 * @example
 * // Single queryset: medications -> drug_name
 * // Generates:
 * // {% for medication in encounter.medications %}
 * //     {{ medication.drug_name }}
 * // {% endfor %}
 *
 * @example
 * // Nested querysets: questionnaire_responses -> responses -> answer
 * // Generates:
 * // {% for questionnaire_response in encounter.questionnaire_responses %}
 * //     {% for response in questionnaire_response.responses %}
 * //         {{ response.answer }}
 * //     {% endfor %}
 * // {% endfor %}
 */
export function generateNestedQuerysetInsertion(
  template: string,
  contextKey: string,
  fieldKeys: string[],
  querysetLevels: { index: number; key: string }[],
  cursorPosition: number,
): InsertionResult {
  const loops = buildLoopChain(contextKey, fieldKeys, querysetLevels);
  console.log("loops", loops);
  const fieldReference = buildFieldReference(fieldKeys, querysetLevels);
  console.log("fieldReference", fieldReference);

  // Check if outermost loop already exists in template
  const existingLoop = findQuerysetLoop(template, loops[0].iterateOver);

  if (existingLoop.exists && existingLoop.insertPosition !== undefined) {
    // Add to existing loop
    const content = buildContentForExistingLoop(
      loops,
      fieldReference,
      existingLoop.itemVar,
    );
    return insertAtCursor(template, content, existingLoop.insertPosition);
  }

  // Create new nested loop structure
  const content = buildNewLoopStructure(loops, fieldReference, fieldKeys);
  return insertAtCursor(template, content, cursorPosition);
}

/**
 * Builds the chain of loops needed for nested querysets.
 *
 * For path: encounter -> questionnaire_responses -> responses -> answer
 * With querysets at: questionnaire_responses (index 0), responses (index 1)
 *
 * Returns:
 * [
 *   { iterateOver: "encounter.questionnaire_responses", as: "questionnaire_response" },
 *   { iterateOver: "questionnaire_response.responses", as: "response" }
 * ]
 */
function buildLoopChain(
  contextKey: string,
  fieldKeys: string[],
  querysetLevels: { index: number; key: string }[],
): LoopInfo[] {
  return querysetLevels.map((level, i) => {
    const itemVar = getSingularForm(level.key);

    if (i === 0) {
      // First loop iterates over context.path
      const path = fieldKeys.slice(0, level.index + 1).join(".");
      return { iterateOver: `${contextKey}.${path}`, as: itemVar };
    }

    // Subsequent loops iterate over previous_item.path
    const prevLevel = querysetLevels[i - 1];
    const prevItemVar = getSingularForm(prevLevel.key);
    const pathSegment = fieldKeys
      .slice(prevLevel.index + 1, level.index + 1)
      .join(".");

    return { iterateOver: `${prevItemVar}.${pathSegment}`, as: itemVar };
  });
}

/**
 * Builds the final field reference (e.g., "response.answer")
 */
function buildFieldReference(
  fieldKeys: string[],
  querysetLevels: { index: number; key: string }[],
): string {
  const lastQueryset = querysetLevels[querysetLevels.length - 1];
  const innermostVar = getSingularForm(lastQueryset.key);

  // Path after the last queryset (could be empty, single field, or nested path)
  const remainingPath = fieldKeys.slice(lastQueryset.index + 1).join(".");

  return remainingPath ? `${innermostVar}.${remainingPath}` : innermostVar;
}

/**
 * Builds content to insert into an existing loop
 */
function buildContentForExistingLoop(
  loops: LoopInfo[],
  fieldReference: string,
  existingItemVar?: string,
): string {
  const depth = loops.length;

  if (depth === 1) {
    // Single loop - just add the field
    const itemVar = existingItemVar || loops[0].as;
    const fieldParts = fieldReference.split(".");
    const fieldPath = fieldParts.slice(1).join("."); // Remove the item var prefix
    return `\n    <li>{{ ${itemVar}.${fieldPath} }}</li>`;
  }

  // Multiple loops - add inner loops
  let content = "\n";
  const baseIndent = "    ";

  // Open inner loops (skip first since it already exists)
  for (let i = 1; i < loops.length; i++) {
    const loop = loops[i];
    // Adjust iterateOver to use existing item var for first inner loop
    const iterateOver =
      i === 1
        ? `${existingItemVar || loops[0].as}.${loop.iterateOver.split(".").slice(1).join(".")}`
        : loop.iterateOver;
    const indent = baseIndent.repeat(i);
    content += `${indent}{% for ${loop.as} in ${iterateOver} %}\n`;
  }

  // Add field
  const innerIndent = baseIndent.repeat(depth);
  content += `${innerIndent}<li>{{ ${fieldReference} }}</li>\n`;

  // Close inner loops
  for (let i = loops.length - 1; i >= 1; i--) {
    const indent = baseIndent.repeat(i);
    content += `${indent}{% endfor %}\n`;
  }

  return content;
}

/**
 * Builds a complete new loop structure with HTML wrapper
 */
function buildNewLoopStructure(
  loops: LoopInfo[],
  fieldReference: string,
  fieldKeys: string[],
): string {
  const sectionName = fieldKeys[fieldKeys.length - 1];
  const baseIndent = "    ";

  let content = `\n<h3>${capitalizeFirst(sectionName)}</h3>\n<ul>\n`;

  // Open all loops
  loops.forEach((loop, i) => {
    const indent = baseIndent.repeat(i + 1);
    content += `${indent}{% for ${loop.as} in ${loop.iterateOver} %}\n`;
  });

  // Add field
  const innerIndent = baseIndent.repeat(loops.length + 1);
  content += `${innerIndent}<li>{{ ${fieldReference} }}</li>\n`;

  // Close all loops
  for (let i = loops.length - 1; i >= 0; i--) {
    const indent = baseIndent.repeat(i + 1);
    content += `${indent}{% endfor %}\n`;
  }

  content += `</ul>\n`;

  return content;
}

/**
 * Converts plural to singular form (basic implementation)
 * medications -> medication, allergies -> allergy
 */
function getSingularForm(plural: string): string {
  if (plural.endsWith("ies")) {
    return plural.slice(0, -3) + "y";
  }
  if (plural.endsWith("s")) {
    return plural.slice(0, -1);
  }
  return plural;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Default HTML template structure (Discharge Summary)
 */
export const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c5aa0; border-bottom: 1px solid #2c5aa0; margin-bottom: 10px; padding-bottom: 5px; }
        .info-row { margin: 5px 0; }
        .label { font-weight: bold; display: inline-block; min-width: 150px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .care-team-member { margin: 8px 0; padding: 8px; background-color: #f9f9f9; border-left: 3px solid #2c5aa0; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <!-- Add your content here -->

    <!-- Allergies -->
    <div class="section">
        <div class="section-title">ALLERGIES</div>
        <table>
            <thead>
                <tr>
                    <th>Allergen</th>
                    <th>Category</th>
                    <th>Criticality</th>
                    <th>Status</th>
                    <th>Reaction</th>
                </tr>
            </thead>
            <tbody>
                {% for allergy in allergies %}
                <tr>
                    <td>{{ allergy.allergen_name }}</td>
                    <td>{{ allergy.category }}</td>
                    <td><strong>{{ allergy.criticality }}</strong></td>
                    <td>{{ allergy.clinical_status }}</td>
                    <td>{{ allergy.note }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated discharge summary.</p>
    </div>
</body>
</html>`;

/**
 * Default context config based on the default template
 */
export const DEFAULT_CONTEXT_CONFIG = {
  patient: {},
  encounter: {},
  diagnoses: {},
  symptoms: {},
  allergies: {},
  medications: {},
};

/**
 * Extracts variables used in the template
 * Returns a map of section -> fields[]
 */
export function parseTemplateVariables(
  template: string,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  // Match {{ section.field }} patterns
  const variableRegex = /{{\s*(\w+)\.(\w+)\s*}}/g;
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const section = match[1];
    const field = match[2];

    if (!result[section]) {
      result[section] = [];
    }
    if (!result[section].includes(field)) {
      result[section].push(field);
    }
  }

  return result;
}

/**
 * Checks if a section is used in the template (either as single object or queryset)
 */
export function isSectionUsed(template: string, sectionKey: string): boolean {
  // Check for single object usage: {{ sectionKey.field }}
  const singleObjectRegex = new RegExp(`{{\\s*${sectionKey}\\.\\w+\\s*}}`, "i");

  // Check for queryset usage: {% for item in sectionKey %}
  const querysetRegex = new RegExp(
    `{%\\s*for\\s+\\w+\\s+in\\s+${sectionKey}\\s*%}`,
    "i",
  );

  return singleObjectRegex.test(template) || querysetRegex.test(template);
}
