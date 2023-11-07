import { Redirect } from "raviger";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import ListView from "@/Components/Resource/ListView";
import BoardView from "@/Components/Resource/ResourceBoardView";
import ResourceDetails from "@/Components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/Components/Resource/ResourceDetailsUpdate";
import { DetailRoute } from "@/Routers/types";

const getDefaultView = () =>
  localStorage.getItem("defaultResourceView") === "list" ? "list" : "board";

export default {
  "/resource": () => <Redirect to={`/resource/${getDefaultView()}`} />,
  "/resource/board": () => (
    <DndProvider backend={HTML5Backend}>
      <BoardView />
    </DndProvider>
  ),
  "/resource/list": () => <ListView />,
  "/resource/:id": ({ id }: DetailRoute) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }: DetailRoute) => (
    <ResourceDetailsUpdate id={id} />
  ),
};
