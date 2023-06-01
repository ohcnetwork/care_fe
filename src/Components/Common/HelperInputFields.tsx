import "react-phone-input-2/lib/high-res.css";

import {
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  FormControlLabelProps,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  NativeSelect,
  Select,
  TextField,
  TextFieldProps,
} from "@material-ui/core";
import {
  DatePickerProps,
  KeyboardDatePicker,
  KeyboardDateTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import PhoneInput, { ICountryData } from "react-phone-input-2";
import React, { ChangeEvent, useEffect, useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import Box from "@material-ui/core/Box";
import ButtonV2 from "./components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DateFnsUtils from "@date-io/date-fns";
import FormControl from "@material-ui/core/FormControl";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { NativeSelectInputProps } from "@material-ui/core/NativeSelect/NativeSelectInput";
import { SelectProps } from "@material-ui/core/Select";

export interface DefaultSelectInputProps extends Omit<SelectProps, "onChange"> {
  options: Array<any>;
  optionArray?: boolean;
  placeholder?: string;
  label?: string;
  margin?: "dense" | "none";
  optionKey?: string;
  optionValue?: string;
  onChange?: (e: any, child?: any) => void;
  name: string;
  labelId?: string;
  errors?: string;
  showEmpty?: boolean;
}

export interface MultiSelectInputProps extends Omit<SelectProps, "onChange"> {
  options: Array<any>;
  optionArray?: boolean;
  placeholder?: string;
  label?: string;
  margin?: "dense" | "none";
  optionKey?: string;
  optionValue?: string;
  onChange?: (e: any, child?: any) => void;
  errors?: string;
  selectAllId?: string;
  selectAll?: boolean;
  onSelectAllClick?: (prev: boolean) => void;
}

export interface DefaultNativeSelectInputProps extends NativeSelectInputProps {
  options: Array<{ id: string | number; text?: string }>;
  placeholder?: string;
  label?: string;
  optionKey?: string;
  optionValue?: string;
}

// Type Declarations
type TextFieldPropsExtended = TextFieldProps & { errors: string };
type ActionTextFieldProps = TextFieldPropsExtended & {
  actionIcon?: React.ReactElement;
  action?: () => void;
};

interface DateInputFieldProps extends DatePickerProps {
  value: string;
  onChange: (
    date: MaterialUiPickersDate,
    value?: string | null | undefined
  ) => void;
  label?: string;
  min?: string;
  max?: string;
  errors: string;
  inputVariant?: "standard" | "outlined" | "filled";
  disabled?: boolean;
  margin?: "none" | "dense" | "normal";
}

interface CheckboxProps extends Omit<FormControlLabelProps, "control"> {
  label: string;
}

/**
 * Deprecated. Use `TextFormField` instead.
 */
export const LegacyTextInputField = (props: TextFieldPropsExtended) => {
  const { onChange, type, errors, onKeyDown } = props;
  const inputType = type === "number" || type === "float" ? "text" : type;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange !== "function") {
      return;
    }
    if (type === "number" && event.target.value) {
      event.target.value = event.target.value.replace(/\D/, "");
    }
    if (type === "float" && event.target.value) {
      event.target.value = event.target.value.replace(/(?!\.)\D/, "");
    }
    onChange(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof onKeyDown !== "function") {
      return;
    }
    onKeyDown(event);
  };
  return (
    <div>
      <TextField
        {...props}
        fullWidth
        type={inputType}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <LegacyErrorHelperText error={errors} />
    </div>
  );
};

/**
 * Deprecated. Use `TextFormField` instead.
 */
export const LegacyActionTextInputField = (props: ActionTextFieldProps) => {
  const { onChange, type, errors, onKeyDown } = props;
  const inputType = type === "number" || type === "float" ? "text" : type;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange !== "function") {
      return;
    }
    if (type === "number" && event.target.value) {
      event.target.value = event.target.value.replace(/\D/, "");
    }
    if (type === "float" && event.target.value) {
      event.target.value = event.target.value.replace(/(?!\.)\D/, "");
    }
    onChange(event);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof onKeyDown !== "function") {
      return;
    }
    onKeyDown(event);
  };
  return (
    <div>
      <div className="flex gap-2 items-center">
        <TextField
          {...props}
          fullWidth
          type={inputType}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {props.actionIcon && (
          <div
            className="flex items-center ml-1 mt-1 border border-gray-400 rounded px-4 h-10 cursor-pointer hover:bg-gray-200"
            onClick={props.action ?? undefined}
          >
            {props.actionIcon}
          </div>
        )}
      </div>
      <LegacyErrorHelperText error={errors} />
    </div>
  );
};

/**
 * Deprecated. Use `TextAreaFormField` instead.
 */
export const LegacyMultilineInputField = (props: TextFieldPropsExtended) => {
  const { errors } = props;
  return (
    <div>
      <TextField {...props} multiline fullWidth />
      <LegacyErrorHelperText error={errors} />
    </div>
  );
};

/**
 * Deprecated. Use `TextFormField` with `type="datetime-local"` instead.
 */
export const LegacyDateTimeFiled = (props: DateInputFieldProps) => {
  const { label, errors, onChange, value, margin, disabled, ...restProps } =
    props;
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDateTimePicker
        margin={margin || "normal"}
        id="date-time-picker-dialog"
        label={label}
        value={value}
        format="dd/MM/yyyy HH:mm"
        onChange={onChange}
        disabled={disabled}
        {...restProps}
      />
      <LegacyErrorHelperText error={errors} />
    </MuiPickersUtilsProvider>
  );
};

/**
 * Deprecated. Use `DateFormField` instead.
 */
export const LegacyDateInputField = (props: DateInputFieldProps) => {
  const {
    value,
    onChange,
    label,
    errors,
    min,
    max,
    // variant,
    disabled,
    margin,
    ...restProps
  } = props;
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        margin={margin || "normal"}
        id="date-picker-dialog"
        label={label}
        format="dd/MM/yyyy"
        value={value}
        onChange={onChange}
        minDate={min}
        maxDate={max}
        disabled={disabled}
        KeyboardButtonProps={{
          "aria-label": "change date",
        }}
        {...restProps}
      />
      <LegacyErrorHelperText error={errors} />
    </MuiPickersUtilsProvider>
  );
};

/**
 * Deprecated. Set `error` on the `FormField` component instead.
 * Or use `FieldError` to break out of the design.
 */
export const LegacyErrorHelperText = (props: { error?: string }) => {
  const { error } = props;
  return (
    <span
      className={`error-text text-red-500 mt-2 ml-1 transition-all duration-300 ${
        error ? "opacity-100" : "opacity-0"
      }`}
    >
      {error}
    </span>
  );
};

/**
 * Deprecated. Use `SelectFormField` instead.
 */
export const LegacyNativeSelectField = (props: any) => {
  const { options, variant, label, optionKey, optionValue, ...others } = props;
  return (
    <FormControl style={{ width: "100%" }} variant={variant} margin="dense">
      {label && <Box>{label}</Box>}
      <NativeSelect {...others}>
        {options.map((opt: any) => {
          return (
            <option
              value={optionKey ? opt[optionKey] : opt.id}
              key={opt.id}
              disabled={opt.disabled}
            >
              {optionValue ? opt[optionValue] : opt.text}
            </option>
          );
        })}
      </NativeSelect>
    </FormControl>
  );
};

/**
 * Deprecated. Use `SelectFormField` instead.
 */
export const LegacySelectField = (props: DefaultSelectInputProps) => {
  const {
    options,
    optionArray,
    label,
    name,
    labelId,
    variant,
    margin,
    optionKey,
    optionValue,
    errors,
    value,
    showEmpty,
    ...restProps
  } = props;
  return (
    <>
      <FormControl style={{ width: "100%" }} variant={variant} margin={margin}>
        {label && <InputLabel htmlFor={labelId}>{label}</InputLabel>}
        <Select
          native
          inputProps={{
            name: name,
            id: labelId,
          }}
          value={value}
          {...restProps}
        >
          {showEmpty && <option aria-label="None" value="" />}
          {!optionArray &&
            options.map((opt: any) => {
              const value = optionKey ? opt[optionKey] : opt.id;
              const text = optionValue ? opt[optionValue] : opt.text;
              return (
                <option value={value} key={opt.id} disabled={opt.disabled}>
                  {text}
                </option>
              );
            })}
          {optionArray &&
            options.map((opt: any) => {
              return (
                <option value={opt} key={opt}>
                  {opt}
                </option>
              );
            })}
        </Select>
      </FormControl>
      {!!errors && <LegacyErrorHelperText error={errors} />}
    </>
  );
};

/**
 * Deprecated. Use `MultiSelectFormField` instead.
 */
export const LegacyMultiSelectField = (props: MultiSelectInputProps) => {
  const {
    errors,
    options,
    label,
    value,
    variant,
    margin,
    optionKey,
    optionValue,
    selectAllId = "selectAllId",
    selectAll = false,
    onSelectAllClick,
    ...restProps
  } = props;
  const optKey = optionKey ? optionKey : "id";
  const optVal = optionValue ? optionValue : "text";

  return (
    <>
      <FormControl className="w-full" variant={variant} margin={margin}>
        <Select
          multiple
          {...restProps}
          value={value}
          input={<Input id={`${label}_chip`} />}
          renderValue={(selected: any) => (
            <div className="flex flex-wrap">
              {selected.map((value: any) => {
                const label = options.find((opt) => value === opt[optKey])?.[
                  optVal
                ];
                return <Chip key={value} label={label} className="m-1" />;
              })}
            </div>
          )}
        >
          {selectAll && (
            <MenuItem
              key={selectAllId}
              id={selectAllId}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onClickCapture={(e) => {
                e.stopPropagation();
                onSelectAllClick &&
                  onSelectAllClick((value as any[])?.length === options.length);
              }}
            >
              <Checkbox
                checked={(value as any[])?.length === options.length}
                onClick={(e) => e.stopPropagation()}
              />
              <ListItemText
                primary={"Select All"}
                onClick={(e) => e.stopPropagation()}
              />
            </MenuItem>
          )}
          {options.map((opt: any) => {
            const selected = value as Array<any>;
            return (
              <MenuItem key={opt.id} value={opt[optKey]}>
                <Checkbox checked={selected.indexOf(opt[optKey]) > -1} />
                <ListItemText primary={opt[optVal]} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      {!!errors && <LegacyErrorHelperText error={errors} />}
    </>
  );
};

/**
 * Deprecated.
 */
export const LegacyCheckboxField = (props: CheckboxProps) => {
  const { onChange, checked, name, style } = props;
  return (
    <FormControlLabel
      style={style}
      control={<Checkbox checked={checked} name={name} onChange={onChange} />}
      {...props}
    />
  );
};

interface AutoCompleteAsyncFieldProps {
  multiple?: boolean;
  className?: string;
  autoSelect?: boolean;
  margin?: string;
  variant: string;
  label?: string;
  onSearch?: (e: any) => void;
  onChange: (e: any, selected: any) => void;
  options: Array<any>;
  getOptionSelected: (option: any, value: any) => boolean;
  getOptionLabel: (option: any) => string;
  renderOption: (option: any) => JSX.Element;
  placeholder: string;
  noOptionsText?: string;
  value?: any;
  defaultValue?: any;
  loading?: boolean;
  errors?: string;
  onBlur?: (e: any) => void;
  onOpen?: (e: any) => void;
  filterOptions?: (options: any) => any;
  name?: string;
  freeSolo?: boolean;
  disabled?: boolean;
}

/**
 * Deprecated.
 *
 * Alternatives:
 * - Use `useAsyncOptions` hook along with `AutocompleteFormField` or
 * `AutocompleteMultiSelectFormField` instead.
 * - Use `AutocompleteAsync` component directly.
 *
 */
export const LegacyAutoCompleteAsyncField = (
  props: AutoCompleteAsyncFieldProps
) => {
  const {
    name,
    margin,
    options,
    label,
    getOptionSelected,
    getOptionLabel,
    renderOption,
    variant,
    placeholder,
    errors = "",
    onChange,
    onSearch,
    value,
    defaultValue,
    loading,
    onBlur,
    onOpen,
    noOptionsText,
    filterOptions,
    multiple = false,
    autoSelect = true,
    className = "",
    disabled = false,
  } = props;
  return (
    <>
      <Autocomplete
        openOnFocus
        autoComplete
        autoHighlight
        autoSelect={autoSelect}
        multiple={multiple}
        onOpen={onOpen}
        onBlur={onBlur}
        options={options}
        disabled={disabled}
        onChange={onChange}
        value={value}
        defaultValue={defaultValue}
        loading={loading}
        noOptionsText={noOptionsText}
        getOptionSelected={getOptionSelected}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        filterOptions={filterOptions}
        className={className}
        renderInput={(params: any) => (
          <TextField
            {...params}
            name={name}
            variant={variant}
            margin={margin || "normal"}
            label={label}
            onChange={onSearch}
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />
      <LegacyErrorHelperText error={errors} />
    </>
  );
};

/**
 * Deprecated. Use `PhoneNumberFormField` instead.
 */
export const LegacyPhoneNumberField = (props: any) => {
  const {
    label,
    placeholder,
    errors,
    onChange,
    onlyIndia,
    value,
    turnOffAutoFormat,
    disabled,
    countryCodeEditable = false,
    className,
    id,
    name,
    requiredError = false,
  } = props;
  const [maxLength, setMaxLength] = useState(15);
  const [enableTollFree, setEnableTollFree] = useState(
    value.startsWith("1800")
  );
  const countryRestriction = onlyIndia ? { onlyCountries: ["in"] } : {};
  const [randId, setRandId] = useState<string>("");

  useEffect(() => {
    if (value.startsWith("1800")) {
      setEnableTollFree(true);
    } else {
      setEnableTollFree(false);
    }
  }, [value]);

  useEffect(() => {
    setRandId(
      Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, "a")
    );
  }, []);

  const setFocus = () => {
    setTimeout(() => {
      const input = document.querySelector(`div#${randId} > div.visible input`);
      if (input instanceof HTMLElement) {
        input.focus();
      }
    }, 10);
  };

  useEffect(() => {
    if (enableTollFree) {
      if (value.startsWith("1800")) {
        setMaxLength(11);
      } else {
        setMaxLength(15);
      }
    } else {
      setMaxLength(15);
    }
  }, [value]);

  const handleChange = (
    value: string,
    data: Partial<ICountryData>,
    event: ChangeEvent<HTMLInputElement>,
    formattedValue: string
  ) => {
    let phone = value;
    if (phone.startsWith("91")) {
      phone = phone.replace("91", "");
    }
    if (phone.startsWith("1800")) {
      setEnableTollFree(true);
      setFocus();
      onChange(phone);
    } else {
      if (!value.startsWith("91") && !value.startsWith("1800")) {
        onChange(`91${formattedValue}`);
      } else {
        onChange(formattedValue);
      }
      if (!value.startsWith("1800")) {
        setEnableTollFree(false);
        setFocus();
      }
    }
    setFocus();
  };

  return (
    <>
      {label && <InputLabel>{label}</InputLabel>}
      <div
        id={randId}
        className={`${
          requiredError && "border border-red-500 rounded"
        } relative flex flex-col`}
      >
        <div
          className={`flex flex-row ${enableTollFree ? "visible" : "hidden"}`}
        >
          <div className="h-full w-[67px] items-center flex justify-center rounded-md border-gray-500 border py-2">
            <CareIcon className="care-l-phone w-5 h-5" />
          </div>
          <PhoneInput
            inputClass="cui-input-base pl-4 pr-10 py-5 tracking-widest"
            containerClass={className}
            value={value}
            onChange={handleChange}
            disableCountryGuess
            disableCountryCode
            disableInitialCountryGuess
            disableSearchIcon
            disableDropdown
            placeholder="(1800)... / 91 ..."
            alwaysDefaultMask
            country={undefined}
            enableLongNumbers={true}
            buttonClass="hidden"
            inputProps={{ id, name: enableTollFree ? name : "", maxLength }}
          />
          <ButtonV2
            className="mt-[2px]"
            variant="secondary"
            type="button"
            ghost
            disabled={disabled}
            onClick={() => {
              onChange("+91");
              setEnableTollFree(false);
              setFocus();
            }}
          >
            {" "}
            <CareIcon className="care-l-multiply" />
          </ButtonV2>
        </div>
        <div
          className={`flex flex-row ${enableTollFree ? "hidden" : "visible"}`}
        >
          <PhoneInput
            inputClass="cui-input-base pl-14 pr-10 py-5 tracking-widest"
            containerClass={className}
            countryCodeEditable={countryCodeEditable}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            country="in"
            disabled={disabled}
            autoFormat={!turnOffAutoFormat}
            enableLongNumbers={true}
            inputProps={{ id, name: enableTollFree ? "" : name, maxLength }}
            {...countryRestriction}
          />
          <ButtonV2
            className="mt-[2px]"
            variant="secondary"
            type="button"
            ghost
            disabled={disabled}
            onClick={() => {
              onChange("+91");
              setEnableTollFree(false);
              setFocus();
            }}
          >
            <CareIcon className="care-l-multiply" />
          </ButtonV2>
        </div>
      </div>
      {errors && <LegacyErrorHelperText error={errors} />}
    </>
  );
};
