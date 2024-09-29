import ResultItem from "../../Components/ExternalResult/ResultItem";
import ResultList from "../../Components/ExternalResult/ResultList";
import ResultUpdate from "../../Components/ExternalResult/ResultUpdate";
import { AppRoutes } from "../AppRouter";

const ExternalResultRoutes: AppRoutes = {
  "/external_results": () => <ResultList />,
  "/external_results/:id": ({ id }) => <ResultItem id={id} />,
  "/external_results/:id/update": ({ id }) => <ResultUpdate id={id} />,
};

export default ExternalResultRoutes;
