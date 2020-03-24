import React from 'react';
import { Checkbox, Grid, IconButton, Radio, TextField, NativeSelect } from '@material-ui/core';
import { KeyboardDatePicker, KeyboardTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import DeleteIcon from '@material-ui/icons/Delete';
import FormControl from '@material-ui/core/FormControl';
import Box from '@material-ui/core/Box';
import { NativeSelectInputProps } from '@material-ui/core/NativeSelect/NativeSelectInput';

export interface DefaultNativeSelectInputProps  extends NativeSelectInputProps {
    options: Array<{id: string | number, text: string}>,
    placeholder?: string;
    label?: string;
}

export const TextInputField = (props: any) => {
    const { placeholder, onChange, value, name, variant, type, margin, errors, label, inputProps } = props;
    return (
        <div>
            <TextField
                label={label}
                type={type}
                fullWidth
                variant={variant}
                margin={margin}
                placeholder={placeholder}
                onChange={onChange}
                value={value}
                name={name}
                inputProps={inputProps}
            />
            <ErrorHelperText error={errors}/>
        </div>
    );
};

export const MultilineInputField = (props: any) => {
    const { placeholder, onChange, value, name, variant, errors } = props;
    return (
        <div>
        <TextField
            multiline
            rows={5}
            fullWidth
            variant={variant}
            margin="normal"
            placeholder={placeholder}
            onChange={onChange}
            value={value}
            name={name}
        />
            <ErrorHelperText error={errors}/>
        </div>
    );
};

export const RadioButtonField = (props: any) => {
    const { options, onChange, handleDeleteOption, errors } = props;
    return (
        <div>
            {options.map((opt: any, idx: number) => {
                return (
                    <Grid container key={idx}>
                        <Grid item>
                            <Radio disabled style={{ paddingLeft: 0 }}/>
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
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].text}/>
                                </Grid>
                                <Grid xs={4} item>
                                    <TextField
                                        type="number"
                                        name="score"
                                        value={opt.score}
                                        placeholder="Score"
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].score}/>
                                </Grid>
                                <Grid xs={4} item>
                                    {options.length > 1
                                        ? (
                                            <Grid item style={{ flexGrow: 1, textAlign: 'right' }}>
                                                <IconButton onClick={() => handleDeleteOption(idx)}>
                                                    <DeleteIcon fontSize="small"/>
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

export const CheckboxInputField = (props: any) => {
    const { options, onChange, handleDeleteOption, errors } = props;
    return (
        <div>
            {options.map((opt: any, idx: number) => {
                return (
                    <Grid container key={idx}>
                        <Grid item>
                            <Checkbox disabled style={{ paddingLeft: 0 }}/>
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
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].text}/>
                                </Grid>
                                <Grid xs={4} item>
                                    <TextField
                                        type="number"
                                        name="score"
                                        value={opt.score}
                                        placeholder="Score"
                                        onChange={e => onChange(e, idx)}
                                    />
                                    <ErrorHelperText error={errors && errors[idx] && errors[idx].score}/>
                                </Grid>
                                <Grid xs={4} item>
                                    {options.length > 1
                                        ? (
                                            <Grid item style={{ flexGrow: 1, textAlign: 'right' }}>
                                                <IconButton onClick={() => handleDeleteOption(idx)}>
                                                    <DeleteIcon fontSize="small"/>
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

export const DateInputField = (props: any) => {
    const { value, onChange, label, errors } = props;
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
                margin="normal"
                id="date-picker-dialog"
                label={label || "Date picker dialog"}
                format="MM/dd/yyyy"
                value={value}
                onChange={onChange}
                KeyboardButtonProps={{
                    'aria-label': 'change date',
                }}
            />
            <ErrorHelperText error={errors}/>
        </MuiPickersUtilsProvider>
    );
};

export const TimeInputField = (props: any) => {
    const { value, onChange } = props;
    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardTimePicker
                margin="normal"
                id="time-picker"
                label="Time picker"
                value={value}
                onChange={onChange}
                KeyboardButtonProps={{
                    'aria-label': 'change time',
                }}
            />
        </MuiPickersUtilsProvider>
    );
};

export const ErrorHelperText = (props: any) => {
    const { error } = props;
    return (
        <div className="error-text">{error}</div>
    );
};

export const ShowRadioOptions = (props: any) => {
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

export const ShowCheckboxOptions = (props: any) => {
    const { options, onChange, values } = props;
    return (
        <div>
            {options.map((opt: any, i: number) => {
                const checked = values.findIndex((val: any) => val.answerId == opt.id);
                return (
                    <div key={i}>
                        <Checkbox
                            checked={checked !== -1}
                            value={opt.id}
                            onChange={onChange}
                        /> {opt.text}
                    </div>
                );
            })}
        </div>
    );
};

export const NativeSelectField = (props: DefaultNativeSelectInputProps) => {
    const { options, variant, placeholder, label } = props;
    return (
        <FormControl style={{width: "100%"}} variant={variant}>
            {label && (<Box>{label}</Box>)}
            <NativeSelect {...props}>
                {options.map((opt: any) => {
                    return <option value={opt.id} key={opt.id}>{opt.text}</option>
                })}
            </NativeSelect>
        </FormControl>
    );
};
