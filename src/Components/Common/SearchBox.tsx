import { TextFieldProps } from '@material-ui/core';
import { debounce } from "lodash";
import React, { useCallback, useState } from 'react';



type TextFieldPropsExtended = TextFieldProps & { errors: string, search: (value: string) => void }

export const InputSearchBox = (props: TextFieldPropsExtended) => {
    const [state, setState] = useState("")
    const { search, placeholder } = props;

    const handler = useCallback(debounce(search, 500), []);

    const handleKeyDown = (event: any) => {
        const value = event.target.value;
        setState(value);
        if (value.length === 0 || value.length > 2) {
            handler(value);
        }
    };

    const clearSearch = () => {
        handler("");
        setState("");
    };

    return (
        <div className="md:flex sticky top-0 bg-gray-100 border-b border-gray-200 py-3 px-3 md:px-8 z-20">
            <div className="relative rounded-md shadow-sm max-w-sm w-full">
                {state ?
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none cursor-pointer" onClick={clearSearch} >
                        <span className="text-gray-500 sm:text-sm sm:leading-5" >
                            <i className="fas fa-times text-md " ></i>
                        </span>
                    </div> :
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm sm:leading-5" >
                            <i className="fas fa-search text-md "></i>
                        </span>
                    </div>
                }
                <input name="search" type="text" value={state} placeholder={placeholder} onChange={handleKeyDown} className="form-input block w-full pl-8 pr-3 sm:text-sm sm:leading-5" />
            </div>
        </div>
    )
}
