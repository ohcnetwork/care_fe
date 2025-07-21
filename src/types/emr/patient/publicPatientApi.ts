import { HttpMethod, Type } from "@/Utils/request/api";
import { AppointmentPatientRegister } from "@/pages/Patient/Utils";

import { Patient } from "./patient";

export default {
  createPatient: {
    path: "/api/v1/otp/patient/",
    method: HttpMethod.POST,
    TBody: Type<Partial<AppointmentPatientRegister>>(),
    TRes: Type<Patient>(),
    auth: {
      key: "Authorization",
      value: "Bearer {token}",
      type: "header",
    },
  },
};
