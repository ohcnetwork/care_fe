import { QuestionnaireList } from "@/components/Questionnaire";
import { QuestionnaireShow } from "@/components/Questionnaire/show";

import { AppRoutes } from "../AppRouter";

const QuestionnaireRoutes: AppRoutes = {
  "/questionnaire": () => <QuestionnaireList />,
  "/questionnaire/:id": ({ id }) => <QuestionnaireShow id={id} />,
};

export default QuestionnaireRoutes;
