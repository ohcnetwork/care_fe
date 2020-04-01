import React from 'react';
import { AppBar, Toolbar, Typography, } from '@material-ui/core';
import {A} from "hookrouter";

const img = 'https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/black-logo.svg';
const TopBar = () => {
    return (
        <AppBar position="fixed" className="appBar">
        <Toolbar>
            <Typography variant="h5" style={{marginLeft:"25px"}}>
                <A href={'/'} ><img src= {img} style={{height:"25px"}}  alt="care logo"/> </A>
            </Typography>
        </Toolbar>
        </AppBar>
    )
};

export default TopBar;
