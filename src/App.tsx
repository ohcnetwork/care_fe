import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "./Redux/actions";
import AppRouter from "./Router/AppRouter";
import SessionRouter from "./Router/SessionRouter";
import { Theme } from "@material-ui/core";
import { makeStyles, createStyles } from "@material-ui/styles";
import coronasafeLogo from "./assets/images/coronasafeLogo.png";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    header: {
      height: "8vh",
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      background: theme.palette.primary.main
    },
    logo: {
      maxHeight: "100%"
    }
  })
);

const App: React.FC = () => {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [user, setUser] = useState(null);
  useEffect(() => {
    dispatch(getCurrentUser()).then((resp: any) => {
      const res = resp && resp.data;
      if (res && res.success && res.data) {
        setUser(res.data);
      }
    });
  }, [dispatch]);

  if (!currentUser || currentUser.isFetching) {
    return <div></div>;
  }
  return (
    <div>
      <div className={classes.header}>
        <img className={classes.logo} alt="logo" src={coronasafeLogo} />
      </div>
      {user ? <AppRouter /> : <SessionRouter />}
    </div>
  );
};

export default App;
