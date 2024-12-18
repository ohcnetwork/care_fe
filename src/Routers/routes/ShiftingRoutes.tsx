import { Redirect } from "raviger";

import { ReferralLetter } from "@/components/Shifting/ReferralLetter";
import ShiftDetails from "@/components/Shifting/ShiftDetails";
import BoardView from "@/components/Shifting/ShiftingBoard";
import ListView from "@/components/Shifting/ShiftingList";

import { AppRoutes } from "@/Routers/AppRouter";

const getDefaultView = () =>
  localStorage.getItem("defaultShiftView") === "list" ? "list" : "board";

const ShiftingRoutes: AppRoutes = {
  "/shifting": () => <Redirect to={`/shifting/${getDefaultView()}`} />,
  "/shifting/board": () => <BoardView />,
  "/shifting/list": () => <ListView />,
  "/shifting/:id": ({ id }) => <ShiftDetails id={id} />,
  "/shifting/:id/referral-letter": ({ id }) => <ReferralLetter id={id} />,
};

export default ShiftingRoutes;
