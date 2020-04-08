import React, { ChangeEvent } from 'react';
import { Theme, InputBase, TextField, TextFieldProps, InputLabel } from '@material-ui/core';
import { makeStyles, withStyles, createStyles } from '@material-ui/core/styles';
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import SearchIcon from "@material-ui/icons/Search";
import Grid from "@material-ui/core/Grid";

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
    searchboxInput:{
        background:"#ffffff"
    },
    searchboxSticky:{
        position: "sticky",
        zIndex: 1,
        top: "0px",
        background: "#edf2f7",
    }
}));

const BootstrapInput = withStyles((theme: Theme) =>
    createStyles({
        root: {
            'label + &': {
                marginTop: theme.spacing(3),
            },
        },
        input: {
            borderRadius: 4,
            position: 'relative',
            backgroundColor: theme.palette.common.white,
            border: '1px solid #ced4da', 
            width: '100%',
            maxWidth:300,
            height: 20,
            padding: '10px 12px', 
            transition: theme.transitions.create(['border-color', 'box-shadow']), 
        },
    }),
)(InputBase);

interface SearchBoxProps {
    placeholder: string;
    value: string;
    handleSearch: (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void
}
const SearchBox = (props: SearchBoxProps) => {

    const classes = useStyles();
    const { placeholder, handleSearch, value } = props;

    return (
        <div>
            <BootstrapInput 
                className={classes.margin} 
                placeholder={placeholder}
                value={value}
                id="bootstrap-input" 
                onChange={handleSearch} />
        </div>
    )
};

export default SearchBox;

type TextFieldPropsExtended = TextFieldProps & { errors: string }

export const InputSearchBox = (props:TextFieldPropsExtended) =>{
    const classes = useStyles();
    const { onKeyUp, placeholder, type, errors } = props;
    const inputType = type === 'number' ? 'text' : type;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (typeof onKeyUp !== 'function') {
            return
        }
        onKeyUp(event);
    }
    return(
        <Grid item xs={6} md={12} className={classes.searchboxSticky}>
        <Grid container justify="center" alignItems="center" className='mt-4'>
            {/* <InputLabel id="name-label">Name*</InputLabel> */}
            <TextField
                name="search"
                variant="outlined"
                margin="dense"
                type="text"
                placeholder = {placeholder}
                InputProps={{
                endAdornment: (
                    <InputAdornment position="start">
                    <IconButton>
                        <SearchIcon />
                    </IconButton>
                    </InputAdornment>
                    )
                }}
                onKeyUp = {handleKeyDown}
                className = {`MuiInput-fullWidth ${classes.searchboxInput}`}
            />
        </Grid>
      </Grid>
    )
}