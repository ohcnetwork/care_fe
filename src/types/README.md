# @care/types

TypeScript type definitions for the Care application.

## Installation

```bash
npm install @care/types
```

## Usage

```typescript
import {
  // Auth types
  RequestStatus,
  JwtTokenObtainPair,
  LoginRequest,
  LoginResponse,
  MfaMethod,
  MfaOption,

  // Base types
  BatchRequestResult,
  BatchRequestBody,
  BatchRequestError,

  // License types
  LicensesSbom,
  PackageType,

  // Location types
  LocationAssociation,

  // Plugin Config types
  PlugConfig,

  // Value Set types
  ValuesetBase,
  ValuesetFilter,
  ValuesetConcept,
  ValuesetInclude,

  // Questionnaire types
  Period,
  Quantity,
  BatchErrorResponse,
  QuestionValidationError,
  QuestionnaireTag,
  QuestionnaireTagSet,

  // Notes types
  Thread,

  // Patient types
  PatientIdentifierConfig,

  // EMR types
  TagConfig,
  Permission,
} from "@care/types";
```

## Available Types

### Auth Types

- `RequestStatus` - Enum for request status
- `JwtTokenObtainPair` - JWT token pair interface
- `LoginRequest` - Login request interface
- `LoginResponse` - Login response type
- `MfaMethod` - MFA method type
- `MfaOption` - MFA option interface

### Base Types

- `BatchRequestResult<T>` - Batch request result interface
- `BatchRequestBody` - Batch request body interface
- `BatchRequestError` - Batch request error interface

### License Types

- `LicensesSbom` - License SBOM interface
- `PackageType` - Package type union

### Location Types

- `LocationAssociation` - Location association interface

### Plugin Config Types

- `PlugConfig` - Plugin configuration interface

### Value Set Types

- `ValuesetBase` - Base value set interface
- `ValuesetFilter` - Value set filter interface
- `ValuesetConcept` - Value set concept interface
- `ValuesetInclude` - Value set include interface

### Questionnaire Types

- `Period` - Period type
- `Quantity` - Quantity interface
- `BatchErrorResponse` - Batch error response interface
- `QuestionValidationError` - Question validation error interface
- `QuestionnaireTag` - Questionnaire tag type
- `QuestionnaireTagSet` - Questionnaire tag set interface

### Notes Types

- `Thread` - Thread interface

### Patient Types

- `PatientIdentifierConfig` - Patient identifier configuration interface

### EMR Types

- `TagConfig` - Tag configuration interface
- `Permission` - Permission interface

## Development

### Building

```bash
npm run build
```

### Cleaning

```bash
npm run clean
```

## Notes

This package only includes pure TypeScript type definitions and excludes:

- API files (files ending with `*Api.ts`)
- Files with external dependencies
- React components or JSX files
- Utility functions

The types are compiled to both JavaScript and TypeScript declaration files for maximum compatibility.
