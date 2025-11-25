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
 */
export function findQuerysetLoop(
  template: string,
  sectionKey: string,
): { exists: boolean; insertPosition?: number } {
  // Look for: {% for item in sectionKey %}
  const loopStartRegex = new RegExp(
    `{%\\s*for\\s+\\w+\\s+in\\s+${sectionKey}\\s*%}`,
    "i",
  );
  const loopEndRegex = /{%\s*endfor\s*%}/gi;

  const loopStartMatch = template.match(loopStartRegex);

  if (!loopStartMatch) {
    return { exists: false };
  }

  const loopStartPos = loopStartMatch.index! + loopStartMatch[0].length;

  // Find the corresponding endfor
  let endforPos = -1;
  let currentPos = loopStartPos;
  const restOfTemplate = template.slice(loopStartPos);

  // Simple depth tracking to handle nested loops
  const forMatches = Array.from(
    restOfTemplate.matchAll(/{%\s*for\s+\w+\s+in\s+\w+\s*%}/gi),
  );
  const endforMatches = Array.from(restOfTemplate.matchAll(loopEndRegex));

  // Find the matching endfor for our loop
  for (const endforMatch of endforMatches) {
    const endforPosition = endforMatch.index!;
    // Count how many 'for' statements are between loopStart and this endfor
    const nestedFors = forMatches.filter(
      (forMatch) =>
        forMatch.index! < endforPosition && forMatch.index! >= currentPos,
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
  return { exists: true, insertPosition: endforPos };
}

/**
 * Generates insertion content for a queryset field
 * Handles both new loop creation and adding to existing loop
 */
export function generateQuerysetInsertion(
  template: string,
  sectionKey: string,
  fieldKey: string,
  cursorPosition: number,
): InsertionResult {
  const loopInfo = findQuerysetLoop(template, sectionKey);

  if (loopInfo.exists && loopInfo.insertPosition !== undefined) {
    // Loop exists, add field inside it
    const itemVar = getSingularForm(sectionKey); // medications -> medication
    const fieldInsertion = `\n    <li>{{ ${itemVar}.${fieldKey} }}</li>`;

    return insertAtCursor(template, fieldInsertion, loopInfo.insertPosition);
  } else {
    // Loop doesn't exist, create new loop
    const itemVar = getSingularForm(sectionKey);
    const loopContent = `
<h3>${capitalizeFirst(sectionKey)}</h3>
<ul>
{% for ${itemVar} in ${sectionKey} %}
    <li>{{ ${itemVar}.${fieldKey} }}</li>
{% endfor %}
</ul>
`;

    return insertAtCursor(template, loopContent, cursorPosition);
  }
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
    <div class="header">
        <h1>DISCHARGE SUMMARY</h1>
        <h3>{{ encounter.facility_name }}</h3>
        <p>{{ encounter.facility_address }}</p>
    </div>

    <!-- Patient Information -->
    <div class="section">
        <div class="section-title">PATIENT INFORMATION</div>
        <div class="info-row"><span class="label">Name:</span> {{ patient.name }}</div>
        <div class="info-row"><span class="label">Age/Gender:</span> {{ patient.age }} / {{ patient.gender }}</div>
        <div class="info-row"><span class="label">Blood Group:</span> {{ patient.blood_group }}</div>
        <div class="info-row"><span class="label">Date of Birth:</span> {{ patient.date_of_birth }}</div>
        <div class="info-row"><span class="label">Contact:</span> {{ patient.phone_number }}</div>
        <div class="info-row"><span class="label">Emergency Contact:</span> {{ patient.emergency_phone_number }}</div>
        <div class="info-row"><span class="label">Address:</span> {{ patient.address }}</div>
    </div>

    <!-- Encounter Details -->
    <div class="section">
        <div class="section-title">ENCOUNTER DETAILS</div>
        <div class="info-row"><span class="label">Admission Number:</span> {{ encounter.external_identifier }}</div>
        <div class="info-row"><span class="label">Admission Date:</span> {{ encounter.admission_date }}</div>
        <div class="info-row"><span class="label">Discharge Date:</span> {{ encounter.discharge_date }}</div>
        <div class="info-row"><span class="label">Encounter Type:</span> {{ encounter.encounter_class }}</div>
        <div class="info-row"><span class="label">Priority:</span> {{ encounter.priority }}</div>
        <div class="info-row"><span class="label">Status:</span> {{ encounter.status }}</div>
    </div>

    <!-- Diagnosis -->
    <div class="section">
        <div class="section-title">DIAGNOSIS</div>
        <table>
            <thead>
                <tr>
                    <th>Diagnosis</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Severity</th>
                    <th>Recorded Date</th>
                </tr>
            </thead>
            <tbody>
                {% for diagnosis in diagnoses %}
                <tr>
                    <td>{{ diagnosis.diagnosis_name }}</td>
                    <td>{{ diagnosis.diagnosis_code }}</td>
                    <td>{{ diagnosis.clinical_status }}</td>
                    <td>{{ diagnosis.severity }}</td>
                    <td>{{ diagnosis.recorded_date }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <!-- Symptoms -->
    <div class="section">
        <div class="section-title">SYMPTOMS</div>
        <table>
            <thead>
                <tr>
                    <th>Symptom</th>
                    <th>Severity</th>
                    <th>Onset Date</th>
                    <th>Duration</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {% for symptom in symptoms %}
                <tr>
                    <td>{{ symptom.symptom_name }}</td>
                    <td>{{ symptom.severity }}</td>
                    <td>{{ symptom.onset_date }}</td>
                    <td>{{ symptom.duration }}</td>
                    <td>{{ symptom.clinical_status }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>

    <!-- Medications -->
    <div class="section">
        <div class="section-title">MEDICATIONS PRESCRIBED</div>
        {% for medication in medications %}
        <div style="margin-bottom: 15px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #28a745;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">{{ medication.medication_name }}</div>
            <div class="info-row"><span class="label">Status:</span> {{ medication.status }}</div>
            <div class="info-row"><span class="label">Intent:</span> {{ medication.intent }}</div>
            <div class="info-row"><span class="label">Priority:</span> {{ medication.priority }}</div>
            <div class="info-row"><span class="label">Prescribed Date:</span> {{ medication.prescribed_date }}</div>
            {% if medication.note %}
            <div class="info-row" style="margin-top: 8px;"><span class="label">Additional Note:</span> {{ medication.note }}</div>
            {% endif %}
            {% if medication.logged_by %}
            <div class="info-row"><span class="label">Prescribed By:</span> {{ medication.logged_by }}</div>
            {% endif %}
        </div>
        {% endfor %}
    </div>

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

    <!-- Discharge Summary & Advice -->
    <div class="section">
        <div class="section-title">DISCHARGE SUMMARY & ADVICE</div>
        <p>{{ encounter.discharge_summary_advice }}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This is a computer-generated discharge summary.</p>
        <p><strong>{{ encounter.facility_name }}</strong> | {{ encounter.facility_address }}</p>
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
