import React from 'react';
import { Grid, Typography, Theme, InputBase, Box, Card, CardHeader, CardContent, Fade, CircularProgress } from '@material-ui/core';
import { makeStyles, withStyles, createStyles, fade } from '@material-ui/core/styles';

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


const SearchBox = (props: any) => {

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