import React, { useEffect, useState } from 'react';
import SessionRouter from './Router/SessionRouter';
import AppRouter from './Router/AppRouter';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './Redux/actions';
import { CircularProgress } from '@material-ui/core';
import './App.scss';
import Grid from "@material-ui/core/Grid";
const img = 'https://coronasafe.network/break-chain.png';
const App: React.FC = () => {
  const dispatch: any = useDispatch();
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    dispatch(getCurrentUser()).then((resp: any) => {
      const res = resp ;
      if (res && res.statusCode === 200) {
        setUser(res.data);
      }
    });
  }, [dispatch]);

  if (!currentUser || currentUser.isFetching) {
    return (
        <div className="App">
          <header className="App-header">
            <img src={img} className="App-logo" alt="logo" />
          </header>
        </div>
    );
  }
  if (currentUser && currentUser.data) {
    return <AppRouter/>;
  } else {
    return <SessionRouter/>;
  }
};

export default App;
