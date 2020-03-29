import React, { useState } from 'react';
import SessionRouter from './Router/SessionRouter';
import AppRouter from './Router/AppRouter';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './Redux/actions';
import './App.scss';
import {Loading} from "./Components/Common/Loading";
import { useAbortableEffect, statusType } from './Common/utils';
const img = 'https://coronasafe.network/break-chain.png';

const App: React.FC = () => {
  const dispatch: any = useDispatch();
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [user, setUser] = useState(null);
  
  useAbortableEffect(async (status: statusType) => {
    const res = await dispatch(getCurrentUser());
    if (!status.aborted && res && res.statusCode === 200) {
        setUser(res.data);
    }
  }, [dispatch]);

  if (!currentUser || currentUser.isFetching) {
    return (
        <Loading/>
    );
  }
  if (currentUser && currentUser.data) {
    return <AppRouter/>;
  } else {
    return <SessionRouter/>;
  }
};

export default App;
