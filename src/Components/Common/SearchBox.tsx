import React, { ChangeEvent } from 'react';
import { Theme, InputBase } from '@material-ui/core';
import { makeStyles, withStyles, createStyles } from '@material-ui/core/styles';

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