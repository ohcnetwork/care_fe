import { TextField, TextFieldProps } from '@material-ui/core';
import Grid from "@material-ui/core/Grid";
import InputAdornment from "@material-ui/core/InputAdornment";
import { makeStyles } from '@material-ui/core/styles';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';
import SearchIcon from "@material-ui/icons/Search";
import { debounce } from "lodash";
import React, { useCallback, useState } from 'react';

const useStyles = makeStyles(theme => ({
    searchboxInput: {
        background: "#ffffff"
    },
    searchboxSticky: {
        position: "sticky",
        zIndex: 1,
        top: "0px",
        background: "#edf2f7",
    }
}));

type TextFieldPropsExtended = TextFieldProps & { errors: string, search: (value: string) => void }

export const InputSearchBox = (props: TextFieldPropsExtended) => {
    const classes = useStyles();
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
        <Grid item xs={6} md={12} className={classes.searchboxSticky}>
            <Grid container justify="center" alignItems="center" className='mt-4'>
                <TextField
                    name="search"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state}
                    placeholder={placeholder}
                    InputProps={{
                        endAdornment: <InputAdornment position="start">{state ? <HighlightOffRoundedIcon className="cursor-pointer text-gray-500" onClick={clearSearch} /> : <SearchIcon className="text-gray-500" />}</InputAdornment>
                    }}
                    onChange={handleKeyDown}
                    className={`MuiInput-fullWidth ${classes.searchboxInput}`}
                />
            </Grid>
        </Grid>
    )
}