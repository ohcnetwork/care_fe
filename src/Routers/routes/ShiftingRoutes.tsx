import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ShiftCreate } from "../../Components/Patient/ShiftCreate";
import ShiftDetails from "../../Components/Shifting/ShiftDetails";
import { ShiftDetailsUpdate } from "../../Components/Shifting/ShiftDetailsUpdate";
import ListView from "../../Components/Shifting/ListView";
import BoardView from "../../Components/Shifting/BoardView";
import { Redirect } from "raviger";
import { AppRoutes } from "../AppRouter";

const getDefaultView = () =>
  localStorage.getItem("defaultShiftView") === "list" ? "list" : "board";

const ShiftingRoutes: AppRoutes = {
  "/shifting": () => <Redirect to={`/shifting/${getDefaultView()}`} />,
  "/shifting/board": () => (
    <DndProvider backend={HTML5Backend}>
      <BoardView />
    </DndProvider>
  ),
  "/shifting/list": () => <ListView />,
  "/shifting/:id": ({ id }) => <ShiftDetails id={id} />,
  "/shifting/:id/update": ({ id }) => <ShiftDetailsUpdate id={id} />,
  "/facility/:facilityId/patient/:patientId/shift/new": ({
    facilityId,
    patientId,
  }) => <ShiftCreate facilityId={facilityId} patientId={patientId} />,
};

export default ShiftingRoutes;
