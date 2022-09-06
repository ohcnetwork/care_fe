import { useState } from "react";

type SearchSelectBaseProps<T> = {
  /**
   * The name of the input field.
   */
  name: string;
  /**
   * Placeholder text when no value is selected.
   */
  placeholder?: string;
  /**
   * The options that to be listed in the dropdown.
   */
  options: T[];
  /**
   * Instructs how to extract the label / title of an option.
   * These labels are used to filter with the search keywords.
   */
  optionLabel: (option: T) => string;
  /**
   * Callback that allows to specify icon for each option.
   * Icon will not be rendered if this callback is not defined.
   */
  optionIcon?: (option: T) => React.ReactNode;
  /**
   * Description to be shown for an option in the dropdown.
   */
  optionDescription?: (option: T) => string;
  /**
   * Callback that allows to specify whether an option is disabled or not.
   */
  optionDisabled?: (option: T) => boolean;
};

type SearchSingleSelectProps<T> = SearchSelectBaseProps<T> & {
  /**
   * Restricts SearchSelectProps for single selection only.
   */
  multiple?: false;
  value: T | null;
  onChange: (value: T | null) => void;
};

type SearchMultiSelectProps<T> = SearchSelectBaseProps<T> & {
  /**
   * Allows the SearchSelect component to select multiple options.
   */
  multiple: true;
  value: T | T[] | null;
  onChange: (value: T | T[] | null) => void;
};

type SearchSelectProps<T> =
  | SearchSingleSelectProps<T>
  | SearchMultiSelectProps<T>;

// the flow:
//
// 1. user clicks the component
// ...   focused, so options list shows up
//
// 2. types some keyword
// 3. options list filtered based on label keyword match

export default function SearchSelectV2(props: SearchSelectProps<any>) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(props.value);

  const hasDescription = !!props.optionDescription;
  const hasIcon = !!props.optionIcon;

  const options = props.options.map((option) => {
    return {
      label: props.optionLabel(option),
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
    };
  });

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
