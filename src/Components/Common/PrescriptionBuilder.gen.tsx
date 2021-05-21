/* TypeScript file generated from PrescriptionBuilder.re by genType. */
/* eslint-disable import/first */


import * as React from 'react';

// @ts-ignore: Implicit any on import
import * as PrescriptionBuilderBS__Es6Import from './PrescriptionBuilder.bs';
const PrescriptionBuilderBS: any = PrescriptionBuilderBS__Es6Import;

import {t as Prescription__Prescription_t} from '@coronasafe/prescription-builder/src/Types/Prescription__Prescription.gen';

// tslint:disable-next-line:interface-over-type-literal
export type Props<T1> = { readonly prescriptions: Prescription__Prescription_t[]; readonly setPrescriptions: (_1:((_1:T1) => Prescription__Prescription_t[])) => void };

export const make: React.ComponentType<{ readonly prescriptions: Prescription__Prescription_t[]; readonly setPrescriptions: (_1:((_1:any) => Prescription__Prescription_t[])) => void }> = PrescriptionBuilderBS.make;
