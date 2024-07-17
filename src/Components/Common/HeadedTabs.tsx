interface tab {
  name: string;
  value: string;
}

interface headedTabsProps {
  tabs: tab[];
  handleChange: any;
  currentTabState: string;
}

export default function HeadedTabs(props: headedTabsProps) {
  const { tabs, handleChange, currentTabState } = props;
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-secondary-300 focus:border-primary-500 focus:ring-primary-500"
          defaultValue={tabs[0].value}
          onChange={(e) => {
            handleChange(
              tabs.filter((tab) => tab.name === e.target.value)[0].value,
            );
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.value}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-secondary-200">
          <nav
            className="-mb-px flex items-center justify-center"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <div
                key={tab.name}
                id={tab.name.split(" ").join("-").toLowerCase()}
                className={`${
                  tab.value === currentTabState
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700"
                } w-1/4 cursor-pointer border-b-2 px-1 py-4 text-center text-sm font-medium`}
                onClick={() => {
                  handleChange(tab.value);
                }}
              >
                {tab.name}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
