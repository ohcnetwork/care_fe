import { QuestionnaireCreatePage } from "@/components/QuestionnaireV2/manage/QuestionnaireCreatePage";
import { QuestionnaireDetailPage } from "@/components/QuestionnaireV2/manage/QuestionnaireDetailPage";
import { QuestionnaireListPage } from "@/components/QuestionnaireV2/manage/QuestionnaireListPage";
import { QuestionnaireRevisionPage } from "@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage";
import { QuestionnaireStudioPage } from "@/components/QuestionnaireV2/studio/QuestionnaireStudioPage";
import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { ValueSetList } from "@/components/ValueSet/ValueSetList";

import { AppRoutes } from "@/Routers/AppRouter";
import { PermissionsIndex } from "@/pages/Admin/Permissions/PermissionsIndex";
import RolesIndex from "@/pages/Admin/Roles/RolesIndex";
import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";
import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";
import { ActionConfigurationForm } from "@/pages/Admin/actions/ActionConfigurationForm";
import { ActionConfigurationList } from "@/pages/Admin/actions/ActionConfigurationList";
import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";
import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";
import {
  AppStoreCategoryPage,
  AppStoreDetailsPage,
  AppStoreDeveloperPage,
  FeaturedAppsPage,
  InstalledAppsPage,
  PlugConfigList,
} from "@/pages/Apps/PlugConfigList";
import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import ImmunizationPolicyList from "@/pages/ImmunizationPolicies/ImmunizationPolicyList";
import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";
import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";
import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";

const INSTANCE_SCOPE = {
  authContext: "instance",
  basePath: "/admin/questionnaires",
} as const;

const AdminRoutes: AppRoutes = {
  "/admin/immunization-policies": () => (
    <ImmunizationPolicyList scope={immunizationPolicyScope()} />
  ),
  "/admin/immunization-policies/new": () => (
    <ImmunizationPolicyForm scope={immunizationPolicyScope()} />
  ),
  "/admin/immunization-policies/:id": ({ id }) => (
    <ImmunizationPolicyForm scope={immunizationPolicyScope()} id={id} />
  ),
  "/admin/questionnaires": () => (
    <QuestionnaireListPage scope={INSTANCE_SCOPE} />
  ),
  // Must be registered before "/admin/questionnaires/:id" — raviger matches
  // routes in object order, and "new" would otherwise be captured as an :id.
  "/admin/questionnaires/new": () => (
    <QuestionnaireCreatePage scope={INSTANCE_SCOPE} />
  ),
  // Must be registered before "/admin/questionnaires/:id" for the same
  // reason — otherwise "edit" would be captured as an :id.
  "/admin/questionnaires/:id/edit": ({ id }) => (
    <QuestionnaireStudioPage scope={INSTANCE_SCOPE} id={id} />
  ),
  // Registered before "/admin/questionnaires/:id" like the routes above.
  "/admin/questionnaires/:id/versions/:revisionId": ({ id, revisionId }) => (
    <QuestionnaireRevisionPage
      scope={INSTANCE_SCOPE}
      id={id}
      revisionId={revisionId}
    />
  ),
  "/admin/questionnaires/:id": ({ id }) => (
    <QuestionnaireDetailPage scope={INSTANCE_SCOPE} id={id} />
  ),
  "/admin/actions": () => <ActionConfigurationList />,
  // Before "/admin/actions/:id" — raviger matches in object order.
  "/admin/actions/new": () => <ActionConfigurationForm />,
  "/admin/actions/:id": ({ id }) => <ActionConfigurationForm id={id} />,
  "/admin/valuesets": () => <ValueSetList scope={INSTANCE_VALUESET_SCOPE} />,
  "/admin/valuesets/create": () => (
    <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} />
  ),
  "/admin/valuesets/:id/edit": ({ id }) => (
    <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} id={id} />
  ),
  "/admin/patient_identifier_config": () => <PatientIdentifierConfigList />,
  "/admin/patient_identifier_config/new": () => <PatientIdentifierConfigForm />,
  "/admin/patient_identifier_config/:id": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/patient_identifier_config/:id/edit": ({ id }) => (
    <PatientIdentifierConfigForm configId={id} />
  ),
  "/admin/tag_config": () => <TagConfigList />,
  "/admin/tag_config/:id": ({ id }) => <TagConfigView tagId={id} />,
  "/admin/rbac/permissions": () => <PermissionsIndex />,
  "/admin/rbac/roles": () => <RolesIndex />,
  "/admin/apps/all": () => <PlugConfigList />,
  "/admin/apps/featured": () => <FeaturedAppsPage />,
  "/admin/apps": () => <InstalledAppsPage />,
  "/admin/apps/categories/:slug": ({ slug }) => (
    <AppStoreCategoryPage slug={slug} />
  ),
  "/admin/apps/developers/:slug": ({ slug }) => (
    <AppStoreDeveloperPage slug={slug} />
  ),
  "/admin/apps/store/:slug": ({ slug }) => <AppStoreDetailsPage slug={slug} />,
  "/admin/apps/:slug": ({ slug }) => <PlugConfigEdit slug={slug} />,
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
