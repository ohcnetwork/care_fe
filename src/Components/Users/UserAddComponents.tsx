import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";

export const validateRule = (
  condition: boolean,
  content: JSX.Element | string,
) => {
  return (
    <div>
      {condition ? (
        <CareIcon icon="l-check-circle" className="text-xl text-green-500" />
      ) : (
        <CareIcon icon="l-times-circle" className="text-xl text-red-500" />
      )}{" "}
      <span
        className={classNames(condition ? "text-primary-500" : "text-red-500")}
      >
        {content}
      </span>
    </div>
  );
};
