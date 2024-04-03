import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { PerformedByModel } from "../../Components/HCX/misc";
import { classNames, formatName } from "../../Utils/utils";
import CareIcon, { IconName } from "../icons/CareIcon";
import RecordMeta from "./RecordMeta";

export interface TimelineEvent<TType = string> {
  type: TType;
  timestamp: string;
  by: PerformedByModel | undefined;
  icon: IconName;
  notes?: string;
  cancelled?: boolean;
}

interface TimelineProps {
  className?: string;
  children: React.ReactNode | React.ReactNode[];
  name: string;
}

const TimelineContext = createContext("");

export default function Timeline({ className, children, name }: TimelineProps) {
  return (
    <div className={className} id="list">
      <ol role="list" className="space-y-6">
        <TimelineContext.Provider value={name}>
          {children}
        </TimelineContext.Provider>
      </ol>
    </div>
  );
}

interface TimelineNodeProps {
  event: TimelineEvent;
  title?: React.ReactNode;
  /**
   * Used to add a suffix to the auto-generated title. Will be ignored if `title` is provided.
   */
  titleSuffix?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  name?: string;
  isLast: boolean;
}

export const TimelineNode = (props: TimelineNodeProps) => {
  const name = useContext(TimelineContext);
  const { t } = useTranslation();

  return (
    <li className="relative flex gap-x-4">
      <div
        className={classNames(
          props.isLast ? "h-6" : "-bottom-6",
          "absolute left-0 top-0 flex w-6 justify-center"
        )}
      >
        <div className="w-px bg-gray-300" />
      </div>

      <div
        className={classNames(
          props.className,
          "group flex w-full flex-col items-start gap-y-1"
        )}
      >
        <div className="relative flex w-full justify-between gap-x-4">
          <div
            className={classNames(
              "flex w-full gap-x-4",
              props.event.cancelled && "line-through"
            )}
          >
            {props.title || (
              <TimelineNodeTitle event={props.event}>
                <div className="flex w-full justify-between gap-2">
                  <p className="flex-auto py-0.5 text-xs leading-5 text-gray-600 md:w-2/3">
                    {props.event.by && (
                      <span className="font-medium text-gray-900">
                        {props.event.by.username.startsWith("asset")
                          ? t("virtual_nursing_assistant")
                          : `${formatName(props.event.by)} ${
                              props.event.by.user_type &&
                              `(${props.event.by.user_type})`
                            }`}{" "}
                      </span>
                    )}
                    {props.titleSuffix
                      ? props.titleSuffix
                      : `${props.event.type} the ${props.name || name}.`}
                  </p>
                  <div className="md:w-fit">
                    {props.actions && (
                      <TimelineNodeActions>{props.actions}</TimelineNodeActions>
                    )}
                    <RecordMeta
                      className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                      time={props.event.timestamp}
                    />
                  </div>
                </div>
              </TimelineNodeTitle>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-y-2 pl-10">
          <TimelineNodeNotes>{props.event.notes}</TimelineNodeNotes>
          {props.children}
        </div>
      </div>
    </li>
  );
};

interface TimelineNodeTitleProps {
  children: React.ReactNode | React.ReactNode[];
  event: TimelineEvent;
}

export const TimelineNodeTitle = (props: TimelineNodeTitleProps) => {
  return (
    <>
      <div className="relative flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-200 transition-all duration-200 ease-in-out group-hover:bg-primary-500">
        <CareIcon
          className="text-base text-gray-700 transition-all duration-200 ease-in-out group-hover:text-white"
          aria-hidden="true"
          icon={props.event.icon}
        />
      </div>

      <div className="flex w-full flex-wrap justify-between gap-2">
        {props.children}
      </div>
    </>
  );
};

export const TimelineNodeActions = (props: {
  children: React.ReactNode | React.ReactNode[];
}) => {
  return <div className="flex justify-end gap-2">{props.children}</div>;
};

interface TimelineNodeNotesProps {
  children?: React.ReactNode | React.ReactNode[];
  icon?: IconName;
}

export const TimelineNodeNotes = ({
  children,
  icon = "l-notes",
}: TimelineNodeNotesProps) => {
  if (!children) {
    return;
  }

  return (
    <div className="flex w-full items-start gap-2 rounded-md p-3 ring-1 ring-inset ring-gray-200">
      <CareIcon icon={icon} className="text-lg text-gray-700" />
      <div className="mt-1 flex-auto text-xs text-gray-700">{children}</div>
    </div>
  );
};
