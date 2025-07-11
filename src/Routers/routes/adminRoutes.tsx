import { navigate } from "raviger";

import QuestionnaireEditor from "@/components/Questionnaire/QuestionnaireEditor";
import { QuestionnaireList } from "@/components/Questionnaire/QuestionnaireList";
import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { ValueSetList } from "@/components/ValueSet/ValueSetList";

import { AppRoutes } from "@/Routers/AppRouter";
import { PermissionsIndex } from "@/pages/Admin/Permissions/PermissionsIndex";
import RolesIndex from "@/pages/Admin/Roles/RolesIndex";
import TagConfigForm from "@/pages/Admin/TagConfig/TagConfigForm";
import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";
import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";
import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";
import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";
import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

const AdminRoutes: AppRoutes = {
  "/admin/questionnaire": () => <QuestionnaireList />,
  "/admin/questionnaire/create": () => <QuestionnaireEditor />,
  "/admin/questionnaire/:id/edit": ({ id }) => <QuestionnaireEditor id={id} />,
  "/admin/valuesets": () => <ValueSetList />,
  "/admin/valuesets/create": () => (
    <ValueSetEditor onSuccess={() => navigate(`/admin/valuesets`)} />
  ),
  "/admin/valuesets/:slug/edit": ({ slug }) => <ValueSetEditor slug={slug} />,
  "/admin/patient_identifier_config": () => <PatientIdentifierConfigList />,
  "/admin/patient_identifier_config/new": () => <PatientIdentifierConfigForm />,
  "/admin/patient_identifier_config/:id": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/patient_identifier_config/:id/edit": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/tag_config": () => <TagConfigList />,
  "/admin/tag_config/new": () => <TagConfigForm />,
  "/admin/tag_config/:id": ({ id }) => <TagConfigView tagId={id} />,
  "/admin/tag_config/:id/edit": ({ id }) => <TagConfigForm configId={id} />,
  "/admin/rbac/permissions": () => <PermissionsIndex />,
  "/admin/rbac/roles": () => <RolesIndex />,
  ...["govt", "product_supplier", "role"].reduce((acc: AppRoutes, type) => {
    acc[`/admin/organizations/${type}/:id`] = ({ id }) => (
      <AdminOrganizationList organizationType={type} organizationId={id} />
    );
    return acc;
  }, {}),
  ...["govt", "product_supplier", "role"].reduce((acc: AppRoutes, type) => {
    acc[`/admin/organizations/${type}`] = () => (
      <AdminOrganizationList organizationType={type} />
    );
    return acc;
  }, {}),
};

export default AdminRoutes;
