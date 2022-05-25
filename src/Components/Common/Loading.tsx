import React from "react";
import { Grid } from "@mui/material";
const img = "https://cdn.coronasafe.network/break-chain.webp";
const Loading = () => {
  return (
    <Grid container>
      <Grid item xs={12} sm={12} md={12} lg={12} style={{ display: "flex" }}>
        <Grid container justifyContent="center" alignItems="center">
          <div className="App">
            <header className="App-header">
              <img src={img} className="App-logo" alt="logo" />
            </header>
          </div>
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Loading;
