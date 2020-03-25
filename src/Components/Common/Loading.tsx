import React from 'react';
import { Grid } from "@material-ui/core";
const img = 'https://coronasafe.network/break-chain.png';
export const Loading = () => {
    return (
        <Grid container>
            <Grid item xs={12} sm={12} md={12} lg={12} style={{ display: 'flex' }}>
                <Grid container justify="center" alignItems="center">
                    <div className="App">
                        <header className="App-header">
                            <img src={img} className="App-logo" alt="logo" />
                        </header>
                    </div>
                </Grid>
            </Grid>
        </Grid>
    )
};
