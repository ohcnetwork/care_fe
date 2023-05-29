export default function SwitchTabs(props: {
  activeTab: boolean;
  onClickTab1: () => void;
  onClickTab2: () => void;
  Tab1: string;
  Tab2: string;
}) {
  return (
    <div className="relative w-full lg:w-52 bg-primary-500/10 rounded-md py-3 px-4 grid grid-cols-2 gap-4 items-center">
      <div
        className={`absolute bg-primary-500 py-4 z-0 rounded transition-all lg:left-1.5 duration-200 ease-out w-[50%] origin-left ${
          props.activeTab ? "lg:translate-x-[89%] right-1.5" : "left-1.5"
        }`}
      ></div>
      <div
        className={`flex items-center justify-center z-10 text-sm transition-all duration-200 ease-out cursor-pointer ${
          props.activeTab
            ? "text-primary-500 hover:text-green-600 hover:font-medium"
            : "text-white"
        } `}
        onClick={props.onClickTab1}
      >
        {props.Tab1}
      </div>
      <div
        className={`flex items-center justify-center text-white z-10 text-sm transition-all duration-200 ease-out cursor-pointer ${
          !props.activeTab
            ? "text-primary-500 hover:text-green-600 hover:font-medium ml-2"
            : "text-white"
        }`}
        onClick={props.onClickTab2}
      >
        {props.Tab2}
      </div>
    </div>
  );
}
