import { TextField, TextFieldProps, Icon } from '@material-ui/core';
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from "@material-ui/icons/Search";
import React, { useState, useCallback } from 'react';
import HighlightOffRoundedIcon from '@material-ui/icons/HighlightOffRounded';
import { debounce } from "lodash";


const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        marginTop: '10px'
    },
    card: {
        width: 300,
        height: 120,
        backgroundColor: '#C4C4C4',
        margin: theme.spacing(1),
    },
    title: {
        fontSize: 14,
    },
    spacing: {
        marginLeft: theme.spacing(1),
    },
    margin: {
        margin: theme.spacing(1),
    },
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
                        endAdornment: <InputAdornment position="start">{state ? <HighlightOffRoundedIcon className="cursor-pointer text-gray-500" onClick={clearSearch} /> : <SearchIcon className="text-gray-500"/>}</InputAdornment>
                    }}
                    onChange={handleKeyDown}
                    className={`MuiInput-fullWidth ${classes.searchboxInput}`}
                />
            </Grid>
        </Grid>
    )
}