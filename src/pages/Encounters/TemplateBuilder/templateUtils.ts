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

export function escapeRegex(str: string): string {
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

  // Find the outermost existing loop (traverse from outer to inner)
  let existingLoopIndex = -1;
  let insertPosition = cursorPosition;

  for (let i = 0; i < loops.length; i++) {
    const existingLoop = findLoop(template, loops[i].id);
    if (existingLoop.exists && existingLoop.insertPosition !== undefined) {
      existingLoopIndex = i;
      // Only update insertPosition if cursor is not already inside this loop
      if (
        !checkIfCursorIsInsideLoop(
          loops[i].id,
          template,
          existingLoop,
          cursorPosition,
        )
      ) {
        insertPosition = existingLoop.insertPosition;
      }
    } else {
      break;
    }
  }

  const baseIndent =
    existingLoopIndex >= 0 ? "    ".repeat(existingLoopIndex + 1) : "";

  // Build content for loops that don't exist yet
  const loopsToCreate = loops.slice(existingLoopIndex + 1);
  const content =
    loopsToCreate.length > 0
      ? buildNewLoopStructure(loopsToCreate, fieldReference, baseIndent)
      : `\n${baseIndent}{{ ${fieldReference} }}`;

  return insertAtCursor(template, content, insertPosition);
}

function checkIfCursorIsInsideLoop(
  loopId: string,
  template: string,
  loopInfo: { exists: boolean; insertPosition?: number },
  cursorPosition: number,
): boolean {
  const startMarker = loopStartMarker(loopId);
  const startMarkerIndex = template.indexOf(startMarker);
  if (
    startMarkerIndex === -1 ||
    !loopInfo.exists ||
    loopInfo.insertPosition === undefined
  )
    return false;

  // Find the {% for %} tag after the start marker
  const afterStartMarker = template.substring(startMarkerIndex);
  const forTagPattern = /{%\s*for\s+[^%]+%}/;
  const forTagMatch = afterStartMarker.match(forTagPattern);
  if (!forTagMatch || forTagMatch.index === undefined) return false;

  // Loop content starts after the {% for ... %} tag
  const loopContentStart =
    startMarkerIndex + forTagMatch.index + forTagMatch[0].length;

  // loopInfo.insertPosition already points to the start of {% endfor %}
  const loopContentEnd = loopInfo.insertPosition;

  // Check if cursor is between the {% for %} and {% endfor %} tags
  return cursorPosition >= loopContentStart && cursorPosition <= loopContentEnd;
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
  baseIndent: string = "",
): string {
  const indentUnit = "    ";
  let content = "\n";

  // Open all loops with markers
  loops.forEach((loop, i) => {
    const indent = baseIndent + indentUnit.repeat(i);
    content += `${indent}${loopStartMarker(loop.id)}\n`;
    content += `${indent}{% for ${loop.as} in ${loop.id} %}\n`;
  });

  // Add field
  const innerIndent = baseIndent + indentUnit.repeat(loops.length);
  content += `${innerIndent}{{ ${fieldReference} }}\n`;

  // Close all loops with markers (reverse order)
  for (let i = loops.length - 1; i >= 0; i--) {
    const loop = loops[i];
    const indent = baseIndent + indentUnit.repeat(i);
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
    <title>Discharge Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c5aa0; border-bottom: 1px solid #2c5aa0; margin-bottom: 10px; padding-bottom: 5px; }
        .info-row { margin: 5px 0; }
        .label { font-weight: bold; display: inline-block; min-width: 150px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .care-team-member { margin: 8px 0; padding: 8px; background-color: #f9f9f9; border-left: 3px solid #2c5aa0; }
        .prescription { margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .medication { margin: 10px 0; padding: 10px; background-color: #f5f5f5; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Discharge Summary</h1>
        {% if encounter.status %}
        <p><strong>Encounter Status:</strong> {{ encounter.status }}</p>
        {% endif %}
    </div>

    <!-- Add your content here -->

    <!-- Allergies -->
    <div class="section">
        <div class="section-title">ALLERGIES &amp; INTOLERANCES</div>
        {% if encounter.allergy_intolerances %}
        <table>
            <thead>
                <tr>
                    <th>Allergen</th>
                    <th>Criticality</th>
                    <th>Clinical Status</th>
                    <th>Last Occurrence</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                <!-- loop:encounter.allergy_intolerances -->
                {% for allergy_intolerance in encounter.allergy_intolerances.filter(exclude_verification_status="entered_in_error") %}
                <tr>
                    <td><strong>{{ allergy_intolerance.name }}</strong></td>
                    <td>{{ allergy_intolerance.criticality }}</td>
                    <td>{{ allergy_intolerance.clinical_status }}</td>
                    <td>{{ allergy_intolerance.last_occurrence }}</td>
                    <td>{{ allergy_intolerance.note }}</td>
                </tr>
                {% endfor %}
                <!-- endloop:encounter.allergy_intolerances -->
            </tbody>
        </table>
        {% else %}
        <p>No known allergies recorded.</p>
        {% endif %}
    </div>

    <!-- Symptoms -->
    <div class="section">
        <div class="section-title">SYMPTOMS</div>
        {% if encounter.symptoms %}
        <table>
            <thead>
                <tr>
                    <th>Symptom</th>
                    <th>Clinical Status</th>
                    <th>Verification Status</th>
                    <th>Onset</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                <!-- loop:encounter.symptoms -->
                {% for symptom in encounter.symptoms.filter(exclude_verification_status="entered_in_error") %}
                <tr>
                    <td>{{ symptom.name }}</td>
                    <td>{{ symptom.clinical_status }}</td>
                    <td>{{ symptom.verification_status }}</td>
                    <td>{{ symptom.onset }}</td>
                    <td>{{ symptom.note }}</td>
                </tr>
                {% endfor %}
                <!-- endloop:encounter.symptoms -->
            </tbody>
        </table>
        {% else %}
        <p>No symptoms recorded.</p>
        {% endif %}
    </div>

    <!-- Diagnoses -->
    <div class="section">
        <div class="section-title">DIAGNOSES</div>
        {% if encounter.diagnoses %}
        <table>
            <thead>
                <tr>
                    <th>Diagnosis</th>
                    <th>Clinical Status</th>
                    <th>Verification Status</th>
                    <th>Onset</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                <!-- loop:encounter.diagnoses -->
                {% for diagnosis in encounter.diagnoses.filter(exclude_verification_status="entered_in_error") %}
                <tr>
                    <td><strong>{{ diagnosis.name }}</strong></td>
                    <td>{{ diagnosis.clinical_status }}</td>
                    <td>{{ diagnosis.verification_status }}</td>
                    <td>{{ diagnosis.onset }}</td>
                    <td>{{ diagnosis.note }}</td>
                </tr>
                {% endfor %}
                <!-- endloop:encounter.diagnoses -->
            </tbody>
        </table>
        {% else %}
        <p>No diagnoses recorded.</p>
        {% endif %}
    </div>

    <!-- Medication Prescriptions -->
    <div class="section">
        <div class="section-title">MEDICATION PRESCRIPTIONS</div>
        {% if encounter.medication_prescriptions %}
        <!-- loop:encounter.medication_prescriptions -->
        {% for medication_prescription in encounter.medication_prescriptions %}
        <div class="prescription">
            <h4>Prescription {{ loop.index }}</h4>
            <div class="info-row"><span class="label">Status:</span> {{ medication_prescription.status }}</div>
            {% if medication_prescription.prescribed_by %}
            <div class="info-row"><span class="label">Prescribed By:</span> {{ medication_prescription.prescribed_by.full_name }}</div>
            {% endif %}
            {% if medication_prescription.medications %}
            <!-- loop:medication_prescription.medications -->
            {% for medication in medication_prescription.medications %}
            <div class="medication">
                <div class="info-row"><span class="label">Medication:</span> <strong>{{ medication.name }}</strong></div>
                <div class="info-row"><span class="label">Status:</span> {{ medication.status }}</div>
                <div class="info-row"><span class="label">Intent:</span> {{ medication.intent }}</div>
                <div class="info-row"><span class="label">Priority:</span> {{ medication.priority }}</div>
                <div class="info-row"><span class="label">Authored On:</span> {{ medication.authored_on }}</div>
                {% if medication.note %}
                <div class="info-row"><span class="label">Note:</span> {{ medication.note }}</div>
                {% endif %}
                {% if medication.dosage_instructions %}
                <table>
                    <thead>
                        <tr>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Route</th>
                            <th>Method</th>
                            <th>Site</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- loop:medication.dosage_instructions -->
                        {% for dosage_instruction in medication.dosage_instructions %}
                        <tr>
                            <td>{{ dosage_instruction.dosage }}</td>
                            <td>{{ dosage_instruction.frequency }}</td>
                            <td>{{ dosage_instruction.duration }}</td>
                            <td>{{ dosage_instruction.route }}</td>
                            <td>{{ dosage_instruction.method }}</td>
                            <td>{{ dosage_instruction.site }}</td>
                        </tr>
                        {% endfor %}
                        <!-- endloop:medication.dosage_instructions -->
                    </tbody>
                </table>
                {% endif %}
            </div>
            {% endfor %}
            <!-- endloop:medication_prescription.medications -->
            {% endif %}
        </div>
        {% endfor %}
        <!-- endloop:encounter.medication_prescriptions -->
        {% else %}
        <p>No medications prescribed during this encounter.</p>
        {% endif %}
    </div>

    <!-- Questionnaire Responses -->
    <div class="section">
        <div class="section-title">QUESTIONNAIRE RESPONSES</div>
        {% if encounter.questionnaire_responses %}
        <!-- loop:encounter.questionnaire_responses -->
        {% for questionnaire_response in encounter.questionnaire_responses %}
        <div style="margin-bottom: 20px;">
            <h4>{{ questionnaire_response.title }}</h4>
            {% if questionnaire_response.description %}
            <p style="color: #666; font-style: italic;">{{ questionnaire_response.description }}</p>
            {% endif %}
            {% if questionnaire_response.responses %}
            <!-- loop:questionnaire_response.responses -->
            {% for response in questionnaire_response.responses %}
            <div style="margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #2c5aa0;">
                <div style="font-weight: bold; margin-bottom: 5px;">Q: {{ response.question.get('text', response.question) }}</div>
                <div style="margin-left: 15px;">A: {{ response.answer.get('values', [response.answer]) | map(attribute='value') | join(', ') }}</div>
            </div>
            {% endfor %}
            <!-- endloop:questionnaire_response.responses -->
            {% else %}
            <p>No responses recorded for this questionnaire.</p>
            {% endif %}
        </div>
        <hr />
        {% endfor %}
        <!-- endloop:encounter.questionnaire_responses -->
        {% else %}
        <p>No questionnaires recorded for this encounter.</p>
        {% endif %}
    </div>

    <!-- Service Requests -->
    <div class="section">
        <div class="section-title">SERVICE REQUESTS</div>
        {% if encounter.service_requests %}
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Intent</th>
                    <th>Requester</th>
                </tr>
            </thead>
            <tbody>
                <!-- loop:encounter.service_requests -->
                {% for service_request in encounter.service_requests %}
                <tr>
                    <td><strong>{{ service_request.title }}</strong></td>
                    <td>{{ service_request.category }}</td>
                    <td>{{ service_request.status }}</td>
                    <td>{{ service_request.intent }}</td>
                    <td>{% if service_request.requester %}{{ service_request.requester.full_name }}{% else %}-{% endif %}</td>
                </tr>
                {% endfor %}
                <!-- endloop:encounter.service_requests -->
            </tbody>
        </table>
        {% else %}
        <p>No service requests recorded.</p>
        {% endif %}
    </div>

    <!-- Care Team -->
    <div class="section">
        <div class="section-title">CARE TEAM</div>
        {% if encounter.care_team %}
        <!-- loop:encounter.care_team -->
        {% for care_team in encounter.care_team %}
        <div class="care-team-member">
            <div class="info-row"><span class="label">Name:</span> {% if care_team.user %}{{ care_team.user.full_name }}{% else %}-{% endif %}</div>
            <div class="info-row"><span class="label">Role:</span> {{ care_team.role }}</div>
        </div>
        {% endfor %}
        <!-- endloop:encounter.care_team -->
        {% else %}
        <p>No care team members recorded.</p>
        {% endif %}
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated discharge summary.</p>
    </div>
</body>
</html>`;
