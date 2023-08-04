interface TabValue {
  value: number;
  label: string;
}
interface TabChange {
  (value: number): void;
}
interface NavTabsProps {
  active?: number;
  options?: TabValue[];
  onChange: TabChange;
}

export default function NavTabs(props: NavTabsProps) {
  const { active, options, onChange } = props;
  return (
    <div>
      <div className="p-2 sm:hidden">
        <select
          className="focus:ring-blue form-select mt-1 block w-full border-gray-300 py-2 pl-3 pr-10 text-base leading-6 transition duration-150 ease-in-out focus:border-blue-300 focus:outline-none sm:text-sm sm:leading-5"
          value={active}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {options?.map((option: TabValue) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex justify-around">
            {options?.map((option: TabValue) => (
              <button
                key={option.value}
                className={
                  option.value === active
                    ? "ml-8 whitespace-nowrap border-b-2 border-indigo-500 px-1 py-4 text-sm font-medium leading-5 text-indigo-600 focus:border-indigo-700 focus:text-indigo-800 focus:outline-none"
                    : "whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium leading-5 text-gray-500 hover:border-gray-300 hover:text-gray-700 focus:border-gray-300 focus:text-gray-700 focus:outline-none"
                }
                onClick={(_) => onChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
