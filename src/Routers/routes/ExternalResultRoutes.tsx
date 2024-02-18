import ExternalResultUpload from "../../Components/ExternalResult/ExternalResultUpload";
import ResultItem from "../../Components/ExternalResult/ResultItem";
import ResultList from "../../Components/ExternalResult/ResultList";
import ResultUpdate from "../../Components/ExternalResult/ResultUpdate";
import { DetailRoute } from "../types";

export default {
  "/external_results": () => <ResultList />,
  "/external_results/upload": () => <ExternalResultUpload />,
  "/external_results/:id": ({ id }: DetailRoute) => <ResultItem id={id} />,
  "/external_results/:id/update": ({ id }: DetailRoute) => (
    <ResultUpdate id={id} />
  ),
};
