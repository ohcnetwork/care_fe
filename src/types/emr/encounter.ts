// Disable autoformatting so that keys maintain wrapped

// prettier-ignore
export const encounterQuestionnaireJSON = {
  "slug": "encounter-form",
  "version": "1.0",
  "title": "Encounter Form",
  "description": "Questionnaire for patient encounters/consultations",
  "status": "active",
  "subject_type": "patient",
  "styling_metadata": {},
  "questions": [
    {
      "text": "Consultation Details",
      "type": "group",
      "link_id": "1",
      "questions": [
        {
          "text": "Route to Facility",
          "type": "choice",
          "link_id": "1.1",
          "required": true,
          "answer_option": [
            { "value": "10", "display": "Direct" },
            { "value": "20", "display": "Referred" },
            { "value": "30", "display": "Transfer" }
          ]
        },
        {
          "text": "Symptoms",
          "type": "group",
          "link_id": "1.2",
          "required": true,
          "questions": [
            {
              "text": "Is the patient Asymptomatic?",
              "type": "boolean",
              "link_id": "1.2.1"
            },
            {
              "text": "Symptoms List",
              "type": "structured",
              "link_id": "1.2.2"
            }
          ]
        },
        {
          "text": "History of present illness",
          "type": "text",
          "link_id": "1.3"
        },
        {
          "text": "Examination details and Clinical conditions",
          "type": "text",
          "link_id": "1.4"
        },
        {
          "text": "Body Measurements",
          "type": "group",
          "link_id": "1.5",
          "questions": [
            {
              "text": "Weight (kg)",
              "type": "decimal",
              "link_id": "1.5.1"
            },
            {
              "text": "Height (cm)",
              "type": "decimal",
              "link_id": "1.5.2"
            }
          ]
        },
        {
          "text": "Decision after consultation",
          "type": "choice",
          "link_id": "1.6",
          "required": true,
          "answer_option": [
            { "value": "A", "display": "Admit" },
            { "value": "R", "display": "Refer" },
            { "value": "OP", "display": "OP Consultation" },
            { "value": "DC", "display": "Discharge" },
            { "value": "DD", "display": "Declare Death" }
          ]
        },
        {
          "text": "Encounter Date & Time",
          "type": "dateTime",
          "link_id": "1.7",
          "required": true
        },
        {
          "text": "Patient Number",
          "type": "string",
          "link_id": "1.8"
        },
        {
          "text": "Category",
          "type": "choice",
          "link_id": "1.9",
          "required": true,
          "answer_option": [
            { "value": "Category-A", "display": "Mild" },
            { "value": "Category-B", "display": "Moderate" },
            { "value": "Category-C", "display": "Severe" }
          ]
        }
      ]
    },
    {
      "text": "Diagnosis",
      "type": "group",
      "link_id": "2",
      "required": true,
      "questions": [
        {
          "text": "Diagnoses",
          "type": "structured",
          "link_id": "2.1"
        }
      ]
    },
    {
      "text": "Treatment Plan",
      "type": "group",
      "link_id": "3",
      "questions": [
        {
          "text": "Investigations Suggestions",
          "type": "structured",
          "link_id": "3.1"
        },
        {
          "text": "Procedure Suggestions",
          "type": "structured",
          "link_id": "3.2"
        },
        {
          "text": "Treatment Plan / Treatment Summary",
          "type": "text",
          "link_id": "3.3"
        },
        {
          "text": "General Instructions (Advice)",
          "type": "text",
          "link_id": "3.4"
        },
        {
          "text": "Special Instructions",
          "type": "text",
          "link_id": "3.5"
        },
        {
          "text": "Treating Doctor",
          "type": "string",
          "link_id": "3.6",
          "required": true
        },
        {
          "text": "Review After",
          "type": "choice",
          "link_id": "3.7",
          "answer_option": [
            { "value": "0", "display": "No Review" },
            { "value": "1", "display": "1 Day" },
            { "value": "2", "display": "2 Days" },
            { "value": "3", "display": "3 Days" },
            { "value": "4", "display": "4 Days" },
            { "value": "5", "display": "5 Days" },
            { "value": "6", "display": "6 Days" },
            { "value": "7", "display": "1 Week" },
            { "value": "14", "display": "2 Weeks" },
            { "value": "28", "display": "4 Weeks" }
          ]
        },
        {
          "text": "Telemedicine",
          "type": "group",
          "link_id": "3.8",
          "questions": [
            {
              "text": "Would you like to refer the patient for remote monitoring to an external doctor?",
              "type": "boolean",
              "link_id": "3.8.1"
            },
            {
              "text": "Assigned to",
              "type": "string",
              "link_id": "3.8.2"
            }
          ]
        }
      ]
    }
  ]
};
