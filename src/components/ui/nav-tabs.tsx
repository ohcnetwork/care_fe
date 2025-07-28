import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageTitle from "@/components/Common/PageHeadTitle";

import { entriesOf, keysOf } from "@/Utils/utils";

interface NavTabDefinition {
  label: string;
  component: React.ReactNode;
}

interface Props<TabKey extends string> {
  tabs: Record<TabKey, NavTabDefinition>;
  currentTab?: TabKey;
  onTabChange: (tab: TabKey) => void;
  setPageTitle?: boolean;
}

export const NavTabs = <TabKey extends string>({
  tabs,
  currentTab,
  onTabChange,
  setPageTitle = true,
  ...props
}: Props<TabKey> & React.ComponentProps<typeof Tabs>) => {
  const tabsToShow = keysOf(tabs);

  return (
    <Tabs
      {...props}
      value={currentTab ?? tabsToShow[0]}
      onValueChange={(tab) => onTabChange(tab as TabKey)}
    >
      <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
        {tabsToShow.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
          >
            {tabs[option].label}
          </TabsTrigger>
        ))}
        {/* {showMoreDropdown && dropdownOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={getMoreButtonClassName()}>
                {t("more")}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleDropdownSelect(option)}
                  className="text-gray-950 font-medium text-sm"
                >
                  {t(option)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )} */}
      </TabsList>
      {entriesOf(tabs).map(([key, tab]) => (
        <TabsContent key={key} value={key}>
          {setPageTitle && <PageTitle title={tab.label} />}
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
};
