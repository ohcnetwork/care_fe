import React from 'react';
import { AppBar, Toolbar, Typography, } from '@material-ui/core';

const img = 'https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/black-logo.svg';
const TopBar = () => {
    return (
        <AppBar position="fixed" className="appBar">
        <Toolbar>
            <Typography variant="h5">
                <img src={img} style={{height:"25px"}} />
            </Typography>
        </Toolbar>
        </AppBar>
    )
};

export default TopBar;
