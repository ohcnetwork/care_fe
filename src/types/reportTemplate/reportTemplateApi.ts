import { HttpMethod, Type } from "@/Utils/request/api";

import {
  ReportTemplateCreate,
  ReportTemplateModel,
  ReportTemplateUpdate,
} from "./reportTemplate";

export default {
  list: {
    path: "/api/v1/facility/{facility_external_id}/report_template/",
    method: HttpMethod.GET,
    TRes: Type<ReportTemplateModel[]>,
  },
  create: {
    path: "/api/v1/facility/{facility_external_id}/report_template/",
    method: HttpMethod.POST,
    body: Type<ReportTemplateCreate>(),
  },
  get: {
    path: "/api/v1/facility/{facility_external_id}/report_template/{report_template_id}/",
    method: HttpMethod.GET,
    TRes: Type<ReportTemplateModel>(),
  },
  update: {
    path: "/api/v1/facility/{facility_external_id}/report_template/{report_template_id}/",
    method: HttpMethod.PUT,
    body: Type<ReportTemplateUpdate>(),
  },
  delete: {
    path: "/api/v1/facility/{facility_external_id}/report_template/{report_template_id}/",
    method: HttpMethod.DELETE,
  },
  getAvailableSections: {
    path: "/api/v1/facility/{facility_external_id}/report_template/get_available_section_source/",
    method: HttpMethod.GET,
    TRes: Type<string[]>(),
  },
};
