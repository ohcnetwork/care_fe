interface HeaderComponentProps {
  searchBox: React.ReactNode;
  secondarySearchBox?: React.ReactNode;
  switchTabs?: React.ReactNode;
  externalButton?: React.ReactNode;
  advancedFilter: React.ReactNode;
  sortDropDown?: React.ReactNode;
  exportButton?: React.ReactNode;
  addComponentDetails?: React.ReactNode;
  qrScan?: React.ReactNode;
}
const Header = (props: HeaderComponentProps) => {
  return (
    <>
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
        <div className="mr-2 w-full">{props.searchBox}</div>
        {props.secondarySearchBox && (
          <div className="mr-2 w-full">{props.secondarySearchBox}</div>
        )}
        <div className="flex w-full flex-col items-center justify-end   gap-2 lg:w-fit lg:flex-row">
          {props.switchTabs && <> {props.switchTabs}</>}

          {props.externalButton && <> {props.externalButton}</>}
          {props.advancedFilter && <> {props.advancedFilter}</>}
          {props.sortDropDown && <>{props.sortDropDown}</>}
          {props.exportButton && <>{props.exportButton}</>}
          <div className="mb-2 flex w-full flex-col items-center lg:mb-0 lg:w-fit lg:flex-row lg:gap-5">
            {props.addComponentDetails && <>{props.addComponentDetails}</>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
