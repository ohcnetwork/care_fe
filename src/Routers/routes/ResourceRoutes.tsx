import ResourceDetails from "../../Components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "../../Components/Resource/ResourceDetailsUpdate";
import ListView from "../../Components/Resource/ListView";
import BoardView from "../../Components/Resource/ResourceBoardView";
import { Redirect } from "raviger";
import { DetailRoute } from "../types";

const getDefaultView = () =>
  localStorage.getItem("defaultResourceView") === "list" ? "list" : "board";

export default {
  "/resource": () => <Redirect to={`/resource/${getDefaultView()}`} />,
  "/resource/board": () => <BoardView />,
  "/resource/list": () => <ListView />,
  "/resource/:id": ({ id }: DetailRoute) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }: DetailRoute) => (
    <ResourceDetailsUpdate id={id} />
  ),
};
