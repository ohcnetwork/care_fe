import { HttpMethod, Type } from "@/Utils/request/api";
import { AppointmentPatientRegister } from "@/pages/Patient/Utils";

import { PatientRead } from "./patient";

export default {
  createPatient: {
    path: "/api/v1/otp/patient/",
    method: HttpMethod.POST,
    TBody: Type<Partial<AppointmentPatientRegister>>(),
    TRes: Type<PatientRead>(),
    auth: {
      key: "Authorization",
      value: "Bearer {token}",
      type: "header",
    },
  },
};
