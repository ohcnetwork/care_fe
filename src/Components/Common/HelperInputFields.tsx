import React from 'react';
import { Checkbox, Grid, IconButton, Radio, TextField, InputLabel, NativeSelect, TextFieldProps, FormControlLabel, FormControlLabelProps, Select, Input, Chip, MenuItem, ListItemText } from '@material-ui/core';
import { KeyboardDatePicker, KeyboardTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import Autocomplete from '@material-ui/lab/Autocomplete';
import DateFnsUtils from '@date-io/date-fns';
import DeleteIcon from '@material-ui/icons/Delete';
import FormControl from '@material-ui/core/FormControl';
import Box from '@material-ui/core/Box';
import { NativeSelectInputProps } from '@material-ui/core/NativeSelect/NativeSelectInput';
import { SelectProps } from '@material-ui/core/Select';

export interface DefaultSelectInputProps extends Omit<SelectProps, 'onChange'> {
    options: Array<any>;
    optionArray?: boolean;
    placeholder?: string;
    label?: string;
    margin?: 'dense' | 'none';
    optionKey?: string,
    optionValue?: string,
    onChange?: (e: any, child?: any) => void,
    name: string;
    labelId?: string;
    errors?: string;
    showEmpty?: boolean;
}

export interface MultiSelectInputProps extends Omit<SelectProps, 'onChange'> {
    options: Array<any>;
    optionArray?: boolean;
    placeholder?: string;
    label?: string;
    margin?: 'dense' | 'none';
    optionKey?: string,
    optionValue?: string,
    onChange?: (e: any, child?: any) => void,
}

export interface DefaultNativeSelectInputProps extends NativeSelectInputProps {
    options: Array<{ id: string | number, text?: string }>,
    placeholder?: string;
    label?: string;
    optionKey?: string,
    optionValue?: string,
}

// Type Declarations
type TextFieldPropsExtended = TextFieldProps & { errors: string }
type Option = { text: string; score: number; }
interface InputProps {
    options: Array<Option>;
    onChange: (
        e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, index: number
    ) => void;
    handleDeleteOption: (index: number) => void;
    errors: Array<Option>;
    onKeyDown: (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => void;
}
interface DateInputFieldProps {
    value: string;
    onChange: (date: MaterialUiPickersDate, value?: string | null | undefined) => void;
    label: string;
    errors: string;
    variant?: "standard" | "outlined" | "filled";
    maxDate?: Date;
    disabled?: boolean;
    margin?: "none" | "dense" | "normal";
};
interface TimeInputFieldProps {
    value: string;
    onChange: (date: MaterialUiPickersDate, value?: string | null | undefined) => void;
};


interface CheckboxProps extends Omit<FormControlLabelProps, 'control'> {
    label: string;
};

interface OptionsProps {
    options: Array<{ id: number | string; text: string; }>,
    onChange: (
        e: React.ChangeEvent<HTMLInputElement>, checked: boolean
    ) => void;
    values: Array<{ answerId: number }>
};


export const TextInputField = (props: TextFieldPropsExtended) => {
    const { onChange, type, errors, onKeyDown } = props;
    const inputType = type === 'number' ? 'text' : type;
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (typeof onChange !== 'function') {
            return
        }
        if (type === 'number' && event.target.value) {
            event.target.value = event.target.value.replace(/\D/, '');
        }
        onChange(event);
    }
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (typeof onKeyDown !== 'function') {
            return
        }
        onKeyDown(event);
    }
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

export const MultilineInputField = (props: TextFieldPropsExtended) => {
    const { errors } = props;
    return (
        <div>
            <TextField
                {...props}
                multiline
                fullWidth
            />
            <ErrorHelperText error={errors} />
        </div>
    );
};

export const RadioButtonField = (props: InputProps) => {
    const { options, onChange, handleDeleteOption, errors } = props;
    return (
        <div>
            {options.map((opt: Option, idx: number) => {
                return (
                    <Grid container key={idx}>
                        <Grid item>
                            <Radio disabled style={{ paddingLeft: 0 }} />
                        </Grid>
                        <Grid item style={{ flexGrow: 1 }}>
                            <Grid container spacing={2}>
                                <Grid xs={4} item>
                                    <TextField
                                        name="text"
                                        value={opt.text}
                                        placeholder={`option ${idx + 1}`}
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].text} />
                                </Grid>
                                <Grid xs={4} item>
                                    <TextField
                                        type="number"
                                        name="score"
                                        value={opt.score}
                                        placeholder="Score"
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].score} />
                                </Grid>
                                <Grid xs={4} item>
                                    {options.length > 1
                                        ? (
                                            <Grid item style={{ flexGrow: 1, textAlign: 'right' }}>
                                                <IconButton onClick={() => handleDeleteOption(idx)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Grid>
                                        ) : null}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </div>
    );
};

export const CheckboxInputField = (props: InputProps) => {
    const { options, onChange, handleDeleteOption, errors } = props;
    return (
        <div>
            {options.map((opt: Option, idx: number) => {
                return (
                    <Grid container key={idx}>
                        <Grid item>
                            <Checkbox disabled style={{ paddingLeft: 0 }} />
                        </Grid>
                        <Grid item style={{ flexGrow: 1 }}>
                            <Grid container spacing={2}>
                                <Grid xs={4} item>
                                    <TextField
                                        name="text"
                                        value={opt.text}
                                        placeholder={`option ${idx + 1}`}
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].text} />
                                </Grid>
                                <Grid xs={4} item>
                                    <TextField
                                        type="number"
                                        name="score"
                                        value={opt.score}
                                        placeholder="Score"
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].score} />
                                </Grid>
                                <Grid xs={4} item>
                                    {options.length > 1
                                        ? (
                                            <Grid item style={{ flexGrow: 1, textAlign: 'right' }}>
                                                <IconButton onClick={() => handleDeleteOption(idx)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Grid>
                                        ) : null}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                );
            })}
        </div>
    );
};

export const DateInputField = (props: DateInputFieldProps) => {
    const { value, onChange, label, errors, variant, maxDate, disabled, margin } = props;
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
                inputVariant={variant || 'standard'}
                margin={margin || "normal"}
                id="date-picker-dialog"
                label={label || "Date picker dialog"}
                format="MM/dd/yyyy"
                value={value}
                onChange={onChange}
                maxDate={maxDate}
                disabled={disabled}
                KeyboardButtonProps={{
                    'aria-label': 'change date',
                }}
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
                    'aria-label': 'change time',
                }}
            />
        </MuiPickersUtilsProvider>
    );
};

export const ErrorHelperText = (props: { error: string | number }) => {
    const { error } = props;
    return (
        <div className="error-text">{error}</div>
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
                        /> {opt.text}
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
                            control={<Checkbox
                                checked={checked}
                                value={opt.id}
                                onChange={onChange}
                            />}
                            label={opt.text}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export const NativeSelectField = (props: DefaultNativeSelectInputProps) => {
    const { options, variant, label, optionKey, optionValue } = props;
    return (
        <FormControl style={{ width: "100%" }} variant={variant} margin="dense">
            {label && (<Box>{label}</Box>)}
            <NativeSelect {...props}>
                {options.map((opt: any) => {
                    return <option value={optionKey ? opt[optionKey] : opt.id} key={opt.id} disabled={opt.disabled}>
                        {optionValue ? opt[optionValue] : opt.text}
                    </option>
                })}
            </NativeSelect>
        </FormControl>
    );
};

export const SelectField = (props: DefaultSelectInputProps) => {
    const { options, optionArray, label, name, labelId, variant, margin, optionKey, optionValue, errors, value, showEmpty, ...restProps } = props;
    return (<>
        <FormControl style={{ width: "100%" }} variant={variant} margin={margin}>
            {label && (<InputLabel htmlFor={labelId}>{label}</InputLabel>)}
            <Select 
            native 
            inputProps={{
                name: name,
                id: labelId,
            }}
            value={value}
            {...restProps}>
                {showEmpty && <option aria-label="None" value="" />}
                {!optionArray && options.map((opt: any) => {
                    const value = optionKey ? opt[optionKey] : opt.id;
                    const text = optionValue ? opt[optionValue] : opt.text;
                    return (<option value={value} key={opt.id} disabled={opt.disabled}>
                        {text}
                    </option>)
                })}
                {optionArray && options.map((opt: any) => {
                    return <option value={opt} key={opt}>
                        {opt}
                    </option>
                })}
            </Select>
        </FormControl>
        {!!errors && <ErrorHelperText error={errors} />}
    </>);
};

export const MultiSelectField = (props: MultiSelectInputProps) => {
    const { options, label, value, variant, margin, optionKey, optionValue, ...restProps } = props;
    const optKey = optionKey ? optionKey : "id";
    const optVal = optionValue ? optionValue : "text";
    return (
        <FormControl className="w-full" variant={variant} margin={margin}>
            <Select
                multiple
                {...restProps}
                value={value}
                input={<Input id={`${label}_chip`} />}
                renderValue={(selected: any) => (
                    <div className="flex flex-wrap">
                        {selected.map((value: any) => {
                            const label = options.find(opt => value === opt[optKey])?.[optVal];
                            return (
                                <Chip key={value} label={label} className="m-1" />
                            )
                        })}
                    </div>
                )}
            >
                {options.map((opt: any) => {
                    const selected = value as Array<any>;
                    return (<MenuItem key={opt.id} value={opt[optKey]}>
                        <Checkbox checked={selected.indexOf(opt[optKey]) > -1} />
                        <ListItemText primary={opt[optVal]} />
                    </MenuItem>
                    )
                })}
            </Select>
        </FormControl>
    );
};

export const CheckboxField = (props: CheckboxProps) => {
    const { onChange, checked, name, style } = props;
    return (
        <FormControlLabel
            style={style}
            control={<Checkbox
                checked={checked}
                name={name}
                onChange={onChange}
            />}
            {...props}
        />
    );
};

export const AutoCompleteMultiField = (props: any) => {
    const { id, options, label, variant, placeholder, errors, onChange, value } = props;
    return (<>
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
    </>)
}