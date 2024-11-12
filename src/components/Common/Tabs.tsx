import { type ReactNode, useEffect, useRef } from "react";

import useWindowDimensions from "@/hooks/useWindowDimensions";

import { classNames } from "@/Utils/utils";

export default function Tabs(props: {
  className?: string;
  currentTab: string | number;
  onTabChange: (value: string | number) => void;
  tabs: { text: ReactNode; value: string | number }[];
}) {
  const { className, currentTab, onTabChange, tabs } = props;
  const ref = useRef<HTMLDivElement>(null);
  const tabSwitcherRef = useRef<HTMLDivElement>(null);

  const dimensions = useWindowDimensions();

  useEffect(() => {
    const currentTabIndex = tabs.findIndex((t) => t.value === currentTab);
    if (
      typeof currentTabIndex != "number" ||
      !ref.current ||
      !tabSwitcherRef.current
    )
      return;
    const tabButton = ref.current.querySelectorAll("button")[currentTabIndex];
    if (!tabButton) return;
    tabSwitcherRef.current.style.width = tabButton.clientWidth + "px";
    tabSwitcherRef.current.style.left =
      tabButton.getBoundingClientRect().left -
      ref.current.getBoundingClientRect().left +
      ref.current.scrollLeft +
      "px";
  }, [currentTab, tabSwitcherRef.current, ref.current, dimensions]);

  return (
    <div
      className={classNames(
        "relative inline-flex w-full items-center justify-between overflow-auto rounded-md bg-primary-500/10 p-2 md:w-auto",
        className,
      )}
      ref={ref}
    >
      <div
        className="absolute inset-y-2 z-10 rounded bg-primary-500 transition-all"
        ref={tabSwitcherRef}
        style={{ left: 0 }}
      />
      {/* There has to be a better way of handling this... */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={`flex-1 whitespace-nowrap px-6 py-2 text-sm font-semibold text-transparent transition-all`}
        >
          {tab.text}
        </div>
      ))}
      <div className="absolute inset-2 z-10 flex items-center justify-between">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => onTabChange(tab.value)}
            className={`${currentTab === tab.value ? "text-white" : "text-primary-500 hover:text-primary-600"} flex-1 whitespace-nowrap px-6 py-2 text-sm font-semibold transition-all`}
          >
            {tab.text}
          </button>
        ))}
      </div>
    </div>
  );
}
