import React from "react";
import { Login } from "./Components/Auth/Login";
import coronasafeLogo from "./assets/images/coronasafeLogo.png";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  header: {
    height: "8vh",
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%"
  },
  logo: {
    maxHeight: "100%"
  }
}));

function App() {
  const classes = useStyles();
  return (
    <div>
      <div className={classes.header}>
        <img className={classes.logo} alt="logo" src={coronasafeLogo} />
      </div>
      <Login />
    </div>
  );
}

export default App;
