import { Code } from "@/types/base/code/code";
import { Interpretation } from "@/types/base/qualifiedRange/qualifiedRange";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";
import { Status as ServiceRequestStatus } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

export interface DiagnosticReportFormProps {
  patientId: string;
  facilityId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionRead[];
  diagnosticReports: DiagnosticReportRead[];
  activityDefinition?: {
    diagnostic_report_codes?: Code[];
    classification?: string;
    specimen_requirements?: SpecimenDefinitionRead[];
  };
  specimens: SpecimenRead[];
  disableEdit: boolean;
  serviceRequestStatus: ServiceRequestStatus;
  onReportSaved: (report: SavedReportSignal) => void;
}

export interface SavedReportSignal {
  id: string;
  savedAt: number;
}

export interface ComponentValue {
  value: string;
  unit: string;
  interpretation?: Interpretation;
}

export interface ObservationValue {
  id: string;
  value: string;
  unit: string;
  interpretation?: Interpretation;
  status: ObservationStatus;
  components: Record<string, ComponentValue>;
}

export interface ObservationsByDefinition {
  [definitionId: string]: ObservationValue[];
}

export interface DiagnosticReportItemProps {
  report: DiagnosticReportRead;
  patientId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionRead[];
  disableEdit: boolean;
  facilityId: string;
  isMultipleDiagnosticReport: boolean;
  onReportSaved: (report: SavedReportSignal) => void;
}
