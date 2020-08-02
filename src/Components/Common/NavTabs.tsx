import React from 'react';

interface TabValue {
    value: number,
    label: string
}
interface TabChange {
    (value: number):void
}
interface NavTabsProps {
    active?: number;
    options?: TabValue[];
    onChange: TabChange;
  }

export default function NavTabs(props:NavTabsProps) {
    let {active, options, onChange} = props;
    return(
        <div>
            <div className="sm:hidden p-2">
            <select 
                className="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150"
                value={active}
                onChange={e=>onChange(Number(e.target.value))}
            >
                {options?.map((option:TabValue) => 
                    <option value={option.value}>{option.label}</option>
                )}
            </select> 
            </div>
            <div className="hidden sm:block">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex justify-around">
                {options?.map((option:TabValue) =>
                    <button 
                        className={ option.value === active
                                ? "whitespace-no-wrap ml-8 py-4 px-1 border-b-2 border-indigo-500 font-medium text-sm leading-5 text-indigo-600 focus:outline-none focus:text-indigo-800 focus:border-indigo-700"
                                : "whitespace-no-wrap py-4 px-1 border-b-2 border-transparent font-medium text-sm leading-5 text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300"
                            }
                        onClick={_=>onChange(option.value)}>
                        {option.label}
                    </button>)}
                </nav>
            </div>
            </div>
        </div>

    )
}