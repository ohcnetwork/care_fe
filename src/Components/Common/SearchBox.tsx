import React, { useCallback, useState, useEffect } from "react";
import { TextFieldProps } from "@material-ui/core";
import debounce from "lodash/debounce";

type TextFieldPropsExtended = TextFieldProps & {
  errors: string;
  search: (value: string) => void;
  value?: string;
};

export const InputSearchBox = (props: TextFieldPropsExtended) => {
  const { search, placeholder, value } = props;
  const [searchValue, setSearchValue] = useState(value);
  const handler = useCallback(debounce(search, 500), [search]);

  const handleKeyDown = (event: any) => {
    const value = event.target.value;
    setSearchValue(value);
    if (value.length === 0 || value.length > 2) {
      handler(value);
    }
  };

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    handler("");
    setSearchValue("");
  };

  const inputProps = {
    placeholder,
    onChange: handleKeyDown,
    value: searchValue,
  };

  return (
    <div className="md:flex sticky top-0 bg-gray-100">
      <div className="relative rounded-md shadow-sm max-w-sm w-full">
        <input
          name="search"
          type="text"
          {...inputProps}
          className="form-input block w-full pr-8 pr-3 sm:text-sm sm:leading-5"
        />
        {searchValue ? (
          <div
            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
            onClick={clearSearch}
          >
            <span className="text-gray-500 sm:text-sm sm:leading-5">
              <i className="fas fa-times text-md "></i>
            </span>
          </div>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm sm:leading-5">
              <i className="fas fa-search text-md "></i>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
