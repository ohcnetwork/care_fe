import React, { useEffect, useState } from 'react';
import SessionRouter from './Router/SessionRouter';
import AppRouter from './Router/AppRouter';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './Redux/actions';
import { CircularProgress } from '@material-ui/core';
import './App.scss';

const App: React.FC = () => {
  const dispatch: any = useDispatch();
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  console.log("currentUser", currentUser)
  const [user, setUser] = useState(null);
  console.log("user", user)
  useEffect(() => {
    dispatch(getCurrentUser()).then((resp: any) => {
      const res = resp ;
      if (res && res.statusCode === 200) {
        setUser(res);
      }
    });
  }, [dispatch]);

  if (!currentUser || currentUser.isFetching) {
    return (
        <div className="textMarginCenter">
          <CircularProgress />
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
