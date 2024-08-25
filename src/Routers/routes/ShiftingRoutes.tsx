import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ShiftCreate } from "../../Components/Patient/ShiftCreate";
import ShiftDetails from "../../Components/Shifting/ShiftDetails";
import { ShiftDetailsUpdate } from "../../Components/Shifting/ShiftDetailsUpdate";
import ListView from "../../Components/Shifting/ListView";
import BoardView from "../../Components/Shifting/BoardView";
import { Redirect } from "raviger";

const getDefaultView = () =>
  localStorage.getItem("defaultShiftView") === "list" ? "list" : "board";

export default {
  "/shifting": () => <Redirect to={`/shifting/${getDefaultView()}`} />,
  "/shifting/board": () => (
    <DndProvider backend={HTML5Backend}>
      <BoardView />
    </DndProvider>
  ),
  "/shifting/list": () => <ListView />,
  "/shifting/:id": ({ id }: any) => <ShiftDetails id={id} />,
  "/shifting/:id/update": ({ id }: any) => <ShiftDetailsUpdate id={id} />,
  "/facility/:facilityId/patient/:patientId/shift/new": ({
    facilityId,
    patientId,
  }: any) => <ShiftCreate facilityId={facilityId} patientId={patientId} />,
};
