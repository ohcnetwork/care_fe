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
          className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
          defaultValue={tabs[0].value}
          onChange={(e) => {
            handleChange(
              tabs.filter((tab) => tab.name === e.target.value)[0].value
            );
          }}
        >
          {tabs.map((tab) => (
            <option key={tab.value}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav
            className="-mb-px flex items-center justify-center cursor: pointer"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <div
                key={tab.name}
                className={`
              ${
                tab.value === currentTabState
                  ? " border-primary-500 text-primary-600 cursor: pointer "
                  : " border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor: pointer "
              },
              ' w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm '
            `}
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
