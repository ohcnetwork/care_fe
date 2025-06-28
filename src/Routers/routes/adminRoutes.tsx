import QuestionnaireEditor from "@/components/Questionnaire/QuestionnaireEditor";
import { QuestionnaireList } from "@/components/Questionnaire/QuestionnaireList";
import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { ValueSetList } from "@/components/ValueSet/ValueSetList";

import { AppRoutes } from "@/Routers/AppRouter";

const AdminRoutes: AppRoutes = {
  "/admin/questionnaire": () => <QuestionnaireList />,
  "/admin/questionnaire/create": () => <QuestionnaireEditor />,
  "/admin/questionnaire/:id/edit": ({ id }) => <QuestionnaireEditor id={id} />,
  "/admin/valuesets": () => <ValueSetList />,
  "/admin/valuesets/create": () => <ValueSetEditor />,
  "/admin/valuesets/:slug/edit": ({ slug }) => <ValueSetEditor slug={slug} />,
};

export default AdminRoutes;
