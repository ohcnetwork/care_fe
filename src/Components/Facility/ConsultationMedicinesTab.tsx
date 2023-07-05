import { useState } from "react";
import MedicineAdministrationsTable from "../Medicine/MedicineAdministrationsTable";
import PrescriptionsTable from "../Medicine/PrescriptionsTable";
import { ConsultationTabProps } from "../../Common/constants";

export default function ConsultationMedicinesTab({
  consultationId,
  consultationData,
}: ConsultationTabProps) {
  const [medicinesKey, setMedicinesKey] = useState(0);
  return (
    <div>
      <div className="mt-4">
        <PrescriptionsTable
          key={medicinesKey}
          consultation_id={consultationId}
          onChange={() => setMedicinesKey((k) => k + 1)}
          readonly={!!consultationData.discharge_date}
        />
      </div>
      <div className="mt-8">
        <PrescriptionsTable
          key={medicinesKey}
          consultation_id={consultationId}
          is_prn
          onChange={() => setMedicinesKey((k) => k + 1)}
          readonly={!!consultationData.discharge_date}
        />
      </div>
      <div className="mt-8">
        <MedicineAdministrationsTable
          key={medicinesKey}
          consultation_id={consultationId}
        />
      </div>
    </div>
  );
}
