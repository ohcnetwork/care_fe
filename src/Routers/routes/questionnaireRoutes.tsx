import { QuestionnaireList } from "@/components/Questionnaire";
import QuestionnaireEditor from "@/components/Questionnaire/QuestionnaireEditor";
import { QuestionnaireShow } from "@/components/Questionnaire/show";

import { AppRoutes } from "../AppRouter";

const QuestionnaireRoutes: AppRoutes = {
  "/questionnaire": () => <QuestionnaireList />,
  "/questionnaire/:id": ({ id }) => <QuestionnaireShow id={id} />,
  "/questionnaire/:id/edit": ({ id }) => <QuestionnaireEditor id={id} />,
};

export default QuestionnaireRoutes;
