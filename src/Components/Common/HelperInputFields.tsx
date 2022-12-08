import DateFnsUtils from "@date-io/date-fns";
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
  Radio,
  Select,
  TextField,
  TextFieldProps,
} from "@material-ui/core";
import Box from "@material-ui/core/Box";
import FormControl from "@material-ui/core/FormControl";
import { NativeSelectInputProps } from "@material-ui/core/NativeSelect/NativeSelectInput";
import { SelectProps } from "@material-ui/core/Select";
import Autocomplete from "@material-ui/lab/Autocomplete";
import {
  DatePickerProps,
  KeyboardDatePicker,
  KeyboardDateTimePicker,
  KeyboardTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import { debounce } from "lodash";
import React, { ChangeEvent } from "react";
import PhoneInput, { ICountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/high-res.css";

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

interface OptionsProps {
  options: Array<{ id: number | string; text: string }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  values: Array<{ answerId: number }>;
}

export const TextInputField = (props: TextFieldPropsExtended) => {
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
      <ErrorHelperText error={errors} />
    </div>
  );
};

export const ActionTextInputField = (props: ActionTextFieldProps) => {
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
      <ErrorHelperText error={errors} />
    </div>
  );
};

export const MultilineInputField = (props: TextFieldPropsExtended) => {
  const { errors } = props;
  return (
    <div>
      <TextField {...props} multiline fullWidth />
      <ErrorHelperText error={errors} />
    </div>
  );
};

export const DateTimeFiled = (props: DateInputFieldProps) => {
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
      <ErrorHelperText error={errors} />
    </MuiPickersUtilsProvider>
  );
};

export const DateInputField = (props: DateInputFieldProps) => {
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
      <ErrorHelperText error={errors} />
    </MuiPickersUtilsProvider>
  );
};

export const TimeInputField = (props: any) => {
  const { value, onChange, label } = props;
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardTimePicker
        margin="normal"
        id="time-picker"
        label={label}
        value={value}
        onChange={onChange}
        KeyboardButtonProps={{
          "aria-label": "change time",
        }}
      />
    </MuiPickersUtilsProvider>
  );
};

export const ErrorHelperText = (props: { error?: string }) => {
  const { error } = props;
  return (
    <span
      className={`error-text mt-2 ml-1 transition-all duration-300 ${
        error ? "opacity-100" : "opacity-0"
      }`}
    >
      {error}
    </span>
  );
};

export const ShowRadioOptions = (props: OptionsProps) => {
  const { options, onChange, values } = props;
  return (
    <div>
      {options.map((opt: any, i: number) => {
        const checked = values.findIndex((val: any) => val.answerId == opt.id);
        return (
          <div key={i}>
            <Radio
              checked={checked !== -1}
              name="radioBtn"
              value={opt.id}
              onChange={onChange}
            />{" "}
            {opt.text}
          </div>
        );
      })}
    </div>
  );
};

export const ShowCheckboxOptions = (props: OptionsProps) => {
  const { options, onChange, values } = props;
  return (
    <div>
      {options.map((opt: any, i: number) => {
        const checked = values.indexOf(opt.id) > -1;
        return (
          <div key={i}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checked}
                  value={opt.id}
                  onChange={onChange}
                />
              }
              label={opt.text}
            />
          </div>
        );
      })}
    </div>
  );
};

export const NativeSelectField = (props: any) => {
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

export const SelectField = (props: DefaultSelectInputProps) => {
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
      {!!errors && <ErrorHelperText error={errors} />}
    </>
  );
};

export const MultiSelectField = (props: MultiSelectInputProps) => {
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
      {!!errors && <ErrorHelperText error={errors} />}
    </>
  );
};

export const CheckboxField = (props: CheckboxProps) => {
  const { onChange, checked, name, style } = props;
  return (
    <FormControlLabel
      style={style}
      control={<Checkbox checked={checked} name={name} onChange={onChange} />}
      {...props}
    />
  );
};

interface AutoCompleteMultiFieldProps {
  id: string;
  options: Array<any>;
  label: string;
  variant: string;
  placeholder: string;
  errors?: string;
  value: any;
  onChange: (e: any, selected: any) => void;
}

export const AutoCompleteMultiField = (props: AutoCompleteMultiFieldProps) => {
  const {
    id,
    options,
    label,
    variant,
    placeholder,
    errors = "",
    onChange,
    value,
  } = props;
  return (
    <>
      <Autocomplete
        multiple
        freeSolo
        id={id}
        options={options}
        onChange={onChange}
        value={value}
        filterSelectedOptions
        renderInput={(params: any) => (
          <TextField
            {...params}
            variant={variant}
            label={label}
            placeholder={placeholder}
          />
        )}
      />
      <ErrorHelperText error={errors} />
    </>
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

export const AutoCompleteAsyncField = (props: AutoCompleteAsyncFieldProps) => {
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
      <ErrorHelperText error={errors} />
    </>
  );
};

export const PhoneNumberField = (props: any) => {
  const {
    label,
    placeholder,
    errors,
    onChange,
    onlyIndia,
    value,
    turnOffAutoFormat,
    disabled,
    bgColor,
  } = props;
  const countryRestriction = onlyIndia ? { onlyCountries: ["in"] } : {};
  const onChangeHandler = debounce(onChange, 500);
  const handleChange = (
    value: string,
    data: Partial<ICountryData>,
    event: ChangeEvent<HTMLInputElement>,
    formattedValue: string
  ) => {
    onChangeHandler(formattedValue);
  };
  return (
    <>
      {label && <InputLabel>{label}</InputLabel>}
      <div className="flex items-center">
        <PhoneInput
          inputClass={` ${
            bgColor || " bg-gray-200 "
          }  py-3 text-sm border-gray-200 shadow-none focus:border-primary-400`}
          countryCodeEditable={false}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          country="in"
          disabled={disabled}
          autoFormat={!turnOffAutoFormat}
          {...countryRestriction}
        />
        <div
          className="flex items-center ml-1 mt-1 border border-gray-400 rounded px-4 h-10 cursor-pointer hover:bg-gray-200"
          onClick={(_) => onChange("+91")}
        >
          <i className="fas fa-times text-red-600" />
        </div>
      </div>
      <ErrorHelperText error={errors} />
    </>
  );
};
