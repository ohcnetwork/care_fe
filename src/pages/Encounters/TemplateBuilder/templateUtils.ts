interface InsertionResult {
  newTemplate: string;
  cursorPosition: number;
}

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

export function generateSingleObjectInsertion(
  sectionKey: string,
  fieldKey: string,
): string {
  return `{{ ${sectionKey}.${fieldKey} }}`;
}

function loopStartMarker(loopId: string): string {
  return `<!-- loop:${loopId} -->`;
}

function loopEndMarker(loopId: string): string {
  return `<!-- endloop:${loopId} -->`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds an existing loop by its marker comments.
 * Returns insert position just before the {% endfor %} tag.
 *
 * @param template - The template string
 * @param loopId - The loop identifier (e.g., "encounter.medications")
 */
export function findLoop(
  template: string,
  loopId: string,
): { exists: boolean; insertPosition?: number } {
  const endMarker = loopEndMarker(loopId);

  // Match {% endfor %} followed by whitespace/newlines and the specific end marker
  const pattern = new RegExp(
    `({%\\s*endfor\\s*%})\\s*${escapeRegex(endMarker)}`,
    "i",
  );
  const match = template.match(pattern);

  if (match && match.index !== undefined) {
    // Insert position is at the start of {% endfor %}
    return { exists: true, insertPosition: match.index };
  }

  return { exists: false };
}

/**
 * Represents a for loop in the template
 */
interface LoopInfo {
  /** Unique identifier for this loop (used in marker comments) / What to iterate over, e.g., "encounter.medications" */
  id: string;
  /** Loop variable name, e.g., "medication" */
  as: string;
}

/**
 * Generates nested for loops for queryset fields.
 * Uses marker comments to identify loops for easy insertion.
 *
 * @example
 * // Single queryset: medications -> drug_name
 * // Generates:
 * // <!-- loop:encounter.medications -->
 * // {% for medication in encounter.medications %}
 * //     {{ medication.drug_name }}
 * // {% endfor %}
 * // <!-- endloop:encounter.medications -->
 */
export function generateNestedQuerysetInsertion(
  template: string,
  contextKey: string,
  fieldKeys: string[],
  querysetLevels: { index: number; key: string }[],
  cursorPosition: number,
): InsertionResult {
  const loops = buildLoopChain(contextKey, fieldKeys, querysetLevels);
  const fieldReference = buildFieldReference(fieldKeys, querysetLevels);

  // Check if the innermost (immediate parent) loop exists
  const innermostLoop = loops[loops.length - 1];
  const existingLoop = findLoop(template, innermostLoop.id);

  if (existingLoop.exists && existingLoop.insertPosition !== undefined) {
    // Loop exists - just add the field reference
    const content = `\n{{ ${fieldReference} }}`;
    return insertAtCursor(template, content, existingLoop.insertPosition);
  }

  // Loop doesn't exist - create all needed loops
  const content = buildNewLoopStructure(loops, fieldReference);
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
 *   { id: "encounter.questionnaire_responses", as: "questionnaire_response" },
 *   { id: "questionnaire_response.responses", as: "response" }
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
      const id = `${contextKey}.${path}`;
      return { id, as: itemVar };
    }

    // Subsequent loops iterate over previous_item.path
    const prevLevel = querysetLevels[i - 1];
    const prevItemVar = getSingularForm(prevLevel.key);
    const pathSegment = fieldKeys
      .slice(prevLevel.index + 1, level.index + 1)
      .join(".");
    const id = `${prevItemVar}.${pathSegment}`;

    return { id, as: itemVar };
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
 * Builds a complete new loop structure with marker comments
 */
function buildNewLoopStructure(
  loops: LoopInfo[],
  fieldReference: string,
): string {
  const baseIndent = "    ";
  let content = "\n";

  // Open all loops with markers
  loops.forEach((loop, i) => {
    const indent = baseIndent.repeat(i);
    content += `${indent}${loopStartMarker(loop.id)}\n`;
    content += `${indent}{% for ${loop.as} in ${loop.id} %}\n`;
  });

  // Add field
  const innerIndent = baseIndent.repeat(loops.length);
  content += `${innerIndent}{{ ${fieldReference} }}\n`;

  // Close all loops with markers (reverse order)
  for (let i = loops.length - 1; i >= 0; i--) {
    const loop = loops[i];
    const indent = baseIndent.repeat(i);
    content += `${indent}{% endfor %}\n`;
    content += `${indent}${loopEndMarker(loop.id)}\n`;
  }

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
