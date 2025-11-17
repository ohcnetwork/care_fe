---
applyTo: "src/types/**/*.{ts,tsx}"
---

# TypeScript Type Definitions Instructions

## CARE Type Organization Structure
- emr/: Electronic Medical Records (patient/, tagConfig/, etc.)
- facility/: Hospital/clinic facility management types
- auth/: Authentication and authorization types
- user/: User roles (doctor, nurse, admin) and permissions
- billing/: Healthcare billing and insurance types
- inventory/: Medical equipment and supplies
- scheduling/: Appointments, shifts, medical procedures

## Healthcare Domain Enums
```typescript
// Follow existing enum patterns from patient.ts
export enum BloodGroupChoices {
  A_negative = "A_negative",
  A_positive = "A_positive", 
  B_negative = "B_negative",
  B_positive = "B_positive",
  AB_negative = "AB_negative",
  AB_positive = "AB_positive", 
  O_negative = "O_negative",
  O_positive = "O_positive",
  Unknown = "unknown",
}
```

## Medical Interface Patterns
```typescript
// EMR-specific interface patterns
export interface PatientRead {
  id: string;
  name: string;
  blood_group?: BloodGroupChoices;
  instance_tags: TagConfig[];
  geo_organization: Organization;
  instance_identifiers: PatientIdentifier[];
  created_by: UserReadMinimal | null;
  year_of_birth: number;
  // Always include medical-specific fields
}
```

## Import Path Conventions for Types
- Cross-domain imports: `import { TagConfig } from "@/types/emr/tagConfig/tagConfig"`
- Organization imports: `import { Organization } from "@/types/organization/organization"`
- User imports: `import { UserReadMinimal } from "@/types/user/user"`
- Patient identifiers: `import { PatientIdentifier } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig"`
- EMR patient types: `import { PatientRead, PatientCreate } from "@/types/emr/patient/patient"`
- Facility types: `import { FacilityRead, FacilityCreate } from "@/types/facility/facility"`

## Healthcare Data Validation Types
- Medical records: Strict validation for patient safety (blood type, allergies, medications)
- Dosage validation: Numeric types with units (mg, ml, etc.)
- Date/time validation: Medical appointments, medication schedules, shift timings
- Identifier validation: Patient ID, facility ID, insurance numbers

## API Response Type Patterns
```typescript
// Paginated medical records
export interface PatientListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PatientRead[];
}

// Medical procedure responses  
export interface EncounterRead {
  id: string;
  patient: PatientRead;
  facility: { id: string; name: string; };
  status: EncounterStatus;
  created_date: string; // ISO 8601
  care_team: CareTeamResponse[];
}
```

## Medical Form Type Patterns
```typescript
// Patient admission form
export interface PatientAdmissionForm {
  personalInfo: {
    name: string;
    age: number;
    blood_group: BloodGroupChoices;
    emergency_phone_number: string;
  };
  medicalHistory: {
    allergies: string[];
    currentMedications: MedicationRead[];
    previousSurgeries: string[];
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
  };
}
```

## Role-Based Access Types
```typescript
// User permissions for healthcare roles
export interface CurrentUserRead extends UserRead, Permissions {
  user_type: UserType;
  facilities: FacilityBareMinimum[];
  home_facility: FacilityBareMinimum;
}

export type UserType = 'doctor' | 'nurse' | 'staff' | 'volunteer' | 'administrator';
```

## Zod Schema Integration
```typescript
import { z } from 'zod';

// Create zod schemas matching TypeScript interfaces
export const PatientAdmissionSchema = z.object({
  name: z.string().min(2).max(100),
  age: z.number().min(0).max(150),
  bloodGroup: z.nativeEnum(BloodGroupChoices),
});

export type PatientAdmissionFormData = z.infer<typeof PatientAdmissionSchema>;
```

## Medical Data Privacy
- Mark PHI (Protected Health Information) appropriately
- Never include PII (name, address, phone) in analytics types
- Use hashed/anonymized IDs where applicable
