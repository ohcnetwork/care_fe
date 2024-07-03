import { classNames } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";

export const Occupany_badge = (props: {
  occupied: number;
  total: number;
  tooltip: string;
  title: string;
}) => {
  let total_capacity = props.total;
  const occupied_capacity = props.occupied,
    tooltip = props.tooltip,
    badge_title = props.title;
  if (total_capacity == undefined) {
    total_capacity = 0;
  }
  return (
    <div
      id="occupany-badge"
      className={`tooltip button-size-default ml-auto flex w-fit items-center justify-center rounded-md px-2 ${occupied_capacity / total_capacity > 0.85 ? "button-danger-border bg-red-500" : "button-primary-border bg-primary-100"}`}
    >
      <span
        className="tooltip-text tooltip-top"
        style={{ whiteSpace: "pre-line" }}
      >
        {tooltip}
      </span>{" "}
      <CareIcon
        icon="l-bed"
        className={classNames(
          "mr-2",
          occupied_capacity / total_capacity > 0.85
            ? "text-white"
            : "text-primary-600",
        )}
      />{" "}
      <dt
        className={`text-sm font-semibold ${occupied_capacity / total_capacity > 0.85 ? "text-white" : "text-gray-700"}`}
      >
        {badge_title}: {occupied_capacity} / {total_capacity}{" "}
      </dt>{" "}
    </div>
  );
};
