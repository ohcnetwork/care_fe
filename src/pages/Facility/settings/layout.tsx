import { Redirect, useRoutes } from "raviger";
import { Suspense } from "react";

import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { lazyPage } from "@/Routers/lazyPage";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

const BillingSettingsLayout = lazyPage(
  () => import("@/pages/Facility/settings/billing/layout"),
  "BillingSettingsLayout",
);

const ReferralAvailabilitySettings = lazyPage(
  () => import("./referrals/ReferralAvailabilitySettings"),
);
const QuestionnaireFillPage = lazyPage(
  () => import("@/components/QuestionnaireV2/fill/QuestionnaireFillPage"),
  "QuestionnaireFillPage",
);
const QuestionnaireCreatePage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireCreatePage"),
  "QuestionnaireCreatePage",
);
const QuestionnaireDetailPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireDetailPage"),
  "QuestionnaireDetailPage",
);
const QuestionnaireListPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireListPage"),
  "QuestionnaireListPage",
);
const QuestionnaireRevisionPage = lazyPage(
  () => import("@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage"),
  "QuestionnaireRevisionPage",
);
const QuestionnaireStudioPage = lazyPage(
  () => import("@/components/QuestionnaireV2/studio/QuestionnaireStudioPage"),
  "QuestionnaireStudioPage",
);
const ValueSetEditor = lazyPage(
  () => import("@/components/ValueSet/ValueSetEditor"),
  "ValueSetEditor",
);
const ValueSetList = lazyPage(
  () => import("@/components/ValueSet/ValueSetList"),
  "ValueSetList",
);
const WorkspaceEditor = lazyPage(
  () => import("@/components/Workspace/WorkspaceEditor"),
  "WorkspaceEditor",
);
const WorkspaceList = lazyPage(
  () => import("@/components/Workspace/WorkspaceList"),
  "WorkspaceList",
);
const TagConfigList = lazyPage(
  () => import("@/pages/Admin/TagConfig/TagConfigList"),
);
const TagConfigView = lazyPage(
  () => import("@/pages/Admin/TagConfig/TagConfigView"),
);
const CreateDevice = lazyPage(
  () => import("@/pages/Facility/settings/devices/CreateDevice"),
);
const DeviceDetail = lazyPage(
  () => import("@/pages/Facility/settings/devices/DeviceShow"),
);
const DevicesList = lazyPage(
  () => import("@/pages/Facility/settings/devices/DevicesList"),
);
const UpdateDevice = lazyPage(
  () => import("@/pages/Facility/settings/devices/UpdateDevice"),
);
const ImmunizationPolicyForm = lazyPage(
  () => import("@/pages/ImmunizationPolicies/ImmunizationPolicyForm"),
);
const ImmunizationPolicyList = lazyPage(
  () => import("@/pages/ImmunizationPolicies/ImmunizationPolicyList"),
);
const PatientIdentifierConfigForm = lazyPage(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm"),
);
const PatientIdentifierConfigList = lazyPage(
  () =>
    import("@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList"),
);
const FacilityResponses = lazyPage(
  () => import("./FacilityResponses"),
  "FacilityResponses",
);
const ActivityDefinitionForm = lazyPage(
  () => import("./activityDefinition/ActivityDefinitionForm"),
);
const ActivityDefinitionList = lazyPage(
  () => import("./activityDefinition/ActivityDefinitionList"),
);
const ActivityDefinitionView = lazyPage(
  () => import("./activityDefinition/ActivityDefinitionView"),
);
const ChargeItemDefinitionDetail = lazyPage(
  () => import("./chargeItemDefinitions/ChargeItemDefinitionDetail"),
  "ChargeItemDefinitionDetail",
);
const ChargeItemDefinitionsList = lazyPage(
  () => import("./chargeItemDefinitions/ChargeItemDefinitionsList"),
  "ChargeItemDefinitionsList",
);
const CreateChargeItemDefinition = lazyPage(
  () => import("./chargeItemDefinitions/CreateChargeItemDefinition"),
  "CreateChargeItemDefinition",
);
const UpdateChargeItemDefinition = lazyPage(
  () => import("./chargeItemDefinitions/UpdateChargeItemDefinition"),
  "UpdateChargeItemDefinition",
);
const GeneralSettings = lazyPage(
  () => import("./general/general"),
  "GeneralSettings",
);
const HealthcareServiceForm = lazyPage(
  () => import("./healthcareService/HealthcareServiceForm"),
);
const HealthcareServiceList = lazyPage(
  () => import("./healthcareService/HealthcareServiceList"),
);
const HealthcareServiceShow = lazyPage(
  () => import("./healthcareService/HealthcareServiceShow"),
);
const LocationImport = lazyPage(() => import("./locations/LocationImport"));
const LocationSettings = lazyPage(() => import("./locations/LocationSettings"));
const ObservationDefinitionForm = lazyPage(
  () => import("./observationDefinition/ObservationDefinitionForm"),
);
const ObservationDefinitionList = lazyPage(
  () => import("./observationDefinition/ObservationDefinitionList"),
);
const ObservationDefinitionView = lazyPage(
  () => import("./observationDefinition/ObservationDefinitionView"),
);
const FacilityOrganizationList = lazyPage(
  () => import("./organizations/FacilityOrganizationList"),
);
const ProductForm = lazyPage(() => import("./product/ProductForm"));
const ProductList = lazyPage(() => import("./product/ProductList"));
const ProductView = lazyPage(() => import("./product/ProductView"));
const ProductKnowledgeForm = lazyPage(
  () => import("./productKnowledge/ProductKnowledgeForm"),
);
const ProductKnowledgeList = lazyPage(
  () => import("./productKnowledge/ProductKnowledgeList"),
);
const ProductKnowledgeView = lazyPage(
  () => import("./productKnowledge/ProductKnowledgeView"),
);
const SpecimenDefinitionDetail = lazyPage(
  () => import("./specimen-definitions/SpecimenDefinitionDetail"),
  "SpecimenDefinitionDetail",
);
const SpecimenDefinitionForm = lazyPage(
  () => import("./specimen-definitions/SpecimenDefinitionForm"),
);
const SpecimenDefinitionsList = lazyPage(
  () => import("./specimen-definitions/SpecimenDefinitionsList"),
  "SpecimenDefinitionsList",
);
const TokenCategoryForm = lazyPage(
  () => import("./tokenCategory/TokenCategoryForm"),
);
const TokenCategoryList = lazyPage(
  () => import("./tokenCategory/TokenCategoryList"),
);
const TokenCategoryView = lazyPage(
  () => import("./tokenCategory/TokenCategoryView"),
);

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/referrals": () => <ReferralAvailabilitySettings facilityId={facilityId} />,
  "/immunization-policies": () => (
    <ImmunizationPolicyList scope={immunizationPolicyScope(facilityId)} />
  ),
  "/immunization-policies/new": () => (
    <ImmunizationPolicyForm scope={immunizationPolicyScope(facilityId)} />
  ),
  "/immunization-policies/:id": ({ id }: { id: string }) => (
    <ImmunizationPolicyForm
      scope={immunizationPolicyScope(facilityId)}
      id={id}
    />
  ),
  "/": () => <Redirect to={`/facility/${facilityId}/settings/general`} />,
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/responses": () => <FacilityResponses facilityId={facilityId} />,
  "/questionnaire": () => (
    <QuestionnaireFillPage subject={{ type: "facility", facilityId }} />
  ),
  "/questionnaire/:questionnaireId": ({
    questionnaireId,
  }: {
    questionnaireId: string;
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "facility", facilityId }}
      questionnaireId={questionnaireId}
    />
  ),
  "/departments": () => <FacilityOrganizationList />,
  "/departments/:id/:tab": ({ id, tab }: { id: string; tab: string }) => (
    <FacilityOrganizationList organizationId={id} currentTab={tab} />
  ),
  "/locations": () => <LocationSettings facilityId={facilityId} />,
  "/locations/import": () => <LocationImport facilityId={facilityId} />,
  "/locations/:id": ({ id }: { id: string }) => (
    <LocationSettings facilityId={facilityId} locationId={id} />
  ),
  "/devices": () => <DevicesList facilityId={facilityId} />,
  "/devices/create": () => <CreateDevice facilityId={facilityId} />,
  // Questionnaire fill for the device subject. Registered before
  // "/devices/:id" — raviger matches routes in object order.
  "/devices/:id/questionnaire": ({ id }: { id: string }) => (
    <QuestionnaireFillPage
      subject={{ type: "device", facilityId, deviceId: id }}
    />
  ),
  "/devices/:id/questionnaire/:questionnaireId": ({
    id,
    questionnaireId,
  }: {
    id: string;
    questionnaireId: string;
  }) => (
    <QuestionnaireFillPage
      subject={{ type: "device", facilityId, deviceId: id }}
      questionnaireId={questionnaireId}
    />
  ),
  "/devices/:id/responses": ({ id }: { id: string }) => (
    <DeviceDetail facilityId={facilityId} deviceId={id} tab="responses" />
  ),
  "/devices/:id": ({ id }: { id: string }) => (
    <DeviceDetail facilityId={facilityId} deviceId={id} />
  ),
  "/devices/:id/edit": ({ id }: { id: string }) => (
    <UpdateDevice facilityId={facilityId} deviceId={id} />
  ),
  "/specimen_definitions": () => (
    <SpecimenDefinitionsList facilityId={facilityId} />
  ),
  "/specimen_definitions/create": () => (
    <SpecimenDefinitionForm facilityId={facilityId} />
  ),
  "/specimen_definitions/new": () => (
    <SpecimenDefinitionForm facilityId={facilityId} />
  ),
  "/specimen_definitions/:specimenSlug": ({
    specimenSlug,
  }: {
    specimenSlug: string;
  }) => (
    <SpecimenDefinitionDetail
      facilityId={facilityId}
      specimenSlug={specimenSlug}
    />
  ),
  "/specimen_definitions/:specimenSlug/edit": ({
    specimenSlug,
  }: {
    specimenSlug: string;
  }) => (
    <SpecimenDefinitionForm
      facilityId={facilityId}
      specimenSlug={specimenSlug}
    />
  ),
  "/observation_definitions": () => (
    <ObservationDefinitionList facilityId={facilityId} />
  ),
  "/observation_definitions/new": () => (
    <ObservationDefinitionForm facilityId={facilityId} />
  ),
  "/observation_definitions/:observationSlug/edit": ({
    observationSlug,
  }: {
    observationSlug: string;
  }) => (
    <ObservationDefinitionForm
      facilityId={facilityId}
      observationSlug={observationSlug}
    />
  ),
  "/observation_definitions/:observationSlug": ({
    observationSlug,
  }: {
    observationSlug: string;
  }) => (
    <ObservationDefinitionView
      facilityId={facilityId}
      observationSlug={observationSlug}
    />
  ),
  "/activity_definitions": () => (
    <ActivityDefinitionList facilityId={facilityId} />
  ),
  "/activity_definitions/categories/:categorySlug": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ActivityDefinitionList
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  ),
  "/activity_definitions/categories/:categorySlug/new": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ActivityDefinitionForm
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  ),
  "/activity_definitions/new": () => (
    <ActivityDefinitionForm facilityId={facilityId} />
  ),
  "/activity_definitions/:activityDefinitionSlug": ({
    activityDefinitionSlug,
  }: {
    activityDefinitionSlug: string;
  }) => (
    <ActivityDefinitionView
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  ),
  "/activity_definitions/:activityDefinitionSlug/edit": ({
    activityDefinitionSlug,
  }: {
    activityDefinitionSlug: string;
  }) => (
    <ActivityDefinitionForm
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  ),
  "/healthcare_services": () => (
    <HealthcareServiceList facilityId={facilityId} />
  ),
  "/healthcare_services/new": () => (
    <HealthcareServiceForm facilityId={facilityId} />
  ),
  "/healthcare_services/:id": ({ id }: { id: string }) => (
    <HealthcareServiceShow facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/healthcare_services/:id/edit": ({ id }: { id: string }) => (
    <HealthcareServiceForm facilityId={facilityId} healthcareServiceId={id} />
  ),
  "/billing*": () => <BillingSettingsLayout />,
  "/charge_item_definitions": () => (
    <ChargeItemDefinitionsList facilityId={facilityId} />
  ),
  "/charge_item_definitions/categories/:slug": ({ slug }: { slug: string }) => (
    <ChargeItemDefinitionsList facilityId={facilityId} categorySlug={slug} />
  ),
  "/charge_item_definitions/categories/:slug/new": ({
    slug,
  }: {
    slug: string;
  }) => (
    <CreateChargeItemDefinition facilityId={facilityId} categorySlug={slug} />
  ),
  "/charge_item_definitions/:slug": ({ slug }: { slug: string }) => (
    <ChargeItemDefinitionDetail facilityId={facilityId} slug={slug} />
  ),
  "/charge_item_definitions/:slug/edit": ({ slug }: { slug: string }) => (
    <UpdateChargeItemDefinition facilityId={facilityId} slug={slug} />
  ),
  "/product_knowledge": () => <ProductKnowledgeList facilityId={facilityId} />,
  "/product_knowledge/categories/:categorySlug": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ProductKnowledgeList facilityId={facilityId} categorySlug={categorySlug} />
  ),
  "/product_knowledge/categories/:categorySlug/new": ({
    categorySlug,
  }: {
    categorySlug: string;
  }) => (
    <ProductKnowledgeForm facilityId={facilityId} categorySlug={categorySlug} />
  ),
  "/product_knowledge/:slug": ({ slug }: { slug: string }) => (
    <ProductKnowledgeView facilityId={facilityId} slug={slug} />
  ),
  "/product_knowledge/:slug/edit": ({ slug }: { slug: string }) => (
    <ProductKnowledgeForm facilityId={facilityId} slug={slug} />
  ),
  "/product": () => <ProductList facilityId={facilityId} />,
  "/product/:id": ({ id }: { id: string }) => (
    <ProductView facilityId={facilityId} productId={id} />
  ),
  "/product/:id/edit": ({ id }: { id: string }) => (
    <ProductForm facilityId={facilityId} productId={id} />
  ),
  "/token_category": () => <TokenCategoryList facilityId={facilityId} />,
  "/token_category/new": () => <TokenCategoryForm facilityId={facilityId} />,
  "/token_category/:id": ({ id }: { id: string }) => (
    <TokenCategoryView facilityId={facilityId} tokenCategoryId={id} />
  ),
  "/token_category/:id/edit": ({ id }: { id: string }) => (
    <TokenCategoryForm facilityId={facilityId} tokenCategoryId={id} />
  ),

  "/patient_identifier_config": () => (
    <PatientIdentifierConfigList facilityId={facilityId} />
  ),
  "/patient_identifier_config/new": () => (
    <PatientIdentifierConfigForm facilityId={facilityId} />
  ),
  "/patient_identifier_config/:id": ({ id }: { id: string }) => (
    <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />
  ),
  "/patient_identifier_config/:id/edit": ({ id }: { id: string }) => (
    <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />
  ),
  "/tag_config": () => <TagConfigList facilityId={facilityId} />,
  "/tag_config/:tagId": ({ tagId }: { tagId: string }) => (
    <TagConfigView facilityId={facilityId} tagId={tagId} />
  ),
  // NOTE: keep "/questionnaires" registered before the catch-all "*" route.
  "/questionnaires": () => (
    <QuestionnaireListPage
      scope={{
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/questionnaires`,
      }}
    />
  ),
  // Must be registered before "/questionnaires/:id" — raviger matches routes
  // in object order, and "new" would otherwise be captured as an :id.
  "/questionnaires/new": () => (
    <QuestionnaireCreatePage
      scope={{
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/questionnaires`,
      }}
    />
  ),
  // Must be registered before "/questionnaires/:id" for the same reason —
  // otherwise "edit" would be captured as an :id.
  "/questionnaires/:id/edit": ({ id }: { id: string }) => (
    <QuestionnaireStudioPage
      scope={{
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/questionnaires`,
      }}
      id={id}
    />
  ),
  // Registered before "/questionnaires/:id" like the routes above.
  "/questionnaires/:id/versions/:revisionId": ({
    id,
    revisionId,
  }: {
    id: string;
    revisionId: string;
  }) => (
    <QuestionnaireRevisionPage
      scope={{
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/questionnaires`,
      }}
      id={id}
      revisionId={revisionId}
    />
  ),
  "/questionnaires/:id": ({ id }: { id: string }) => (
    <QuestionnaireDetailPage
      scope={{
        authContext: "facility",
        facilityId,
        basePath: `/facility/${facilityId}/settings/questionnaires`,
      }}
      id={id}
    />
  ),
  "/valuesets": () => (
    <ValueSetList scope={valueSetScopeForFacility(facilityId)} />
  ),
  // Before "/valuesets/:id/edit" — raviger matches routes in object order.
  "/valuesets/create": () => (
    <ValueSetEditor scope={valueSetScopeForFacility(facilityId)} />
  ),
  "/valuesets/:id/edit": ({ id }: { id: string }) => (
    <ValueSetEditor scope={valueSetScopeForFacility(facilityId)} id={id} />
  ),
  "/workspaces": () => (
    <WorkspaceList scope={workspaceScopeForFacility(facilityId)} />
  ),
  "/workspaces/create": () => (
    <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} />
  ),
  "/workspaces/:id/edit": ({ id }: { id: string }) => (
    <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} id={id} />
  ),
  "*": () => <ErrorPage />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const basePath = `/facility/${facilityId}/settings`;
  const routeResult = useRoutes(getRoutes(facilityId), {
    basePath,
    routeProps: {
      facilityId,
    },
  });

  return (
    <div className="min-w-0 px-4 pb-4">
      <Suspense fallback={<Loading />}>{routeResult}</Suspense>
    </div>
  );
}
