import React, { useState } from "react";
import { make as PrescriptionBuilder } from "../Common/PrescriptionBuilder.gen";
import {t as Prescription_t} from '@coronasafe/prescription-builder/src/Types/Prescription__Prescription.gen';

export default function Prescription() {
    const [prescription, setPrescription] = useState<Prescription_t[]>([]);
    return (
        <PrescriptionBuilder prescriptions={prescription} setPrescriptions={setPrescription} />
    )
}