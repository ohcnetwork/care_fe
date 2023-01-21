import React from "react";
import { Grid } from "@material-ui/core";
import useConfig from "../../Common/hooks/useConfig";
const Loading = () => {
  const { app_loader_image } = useConfig();
  return (
    <Grid container>
      <Grid item xs={12} sm={12} md={12} lg={12} style={{ display: "flex" }}>
        <Grid container justify="center" alignItems="center">
          <div className="App">
            <header className="App-header">
              <img src={app_loader_image} className="App-logo" alt="logo" />
            </header>
          </div>
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Loading;
