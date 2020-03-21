import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './Redux/actions';
import AppRouter from "./Router/AppRouter";
import SessionRouter from "./Router/SessionRouter";

const App: React.FC = () => {
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
    return (
        <div>

        </div>
    );
  }
  if (user) {
    return <AppRouter/>;
  } else {
    return <SessionRouter/>;
  }
};

export default App;
