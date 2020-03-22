import React from 'react';
import {useRedirect, useRoutes} from 'hookrouter';
import {PublicDashboard} from "../Components/Dashboard/PublicDashboard";
import Header from '../Components/Common/Header';

const routes = {
    '/': () => <PublicDashboard/>,
    '/dashboard': () => <PublicDashboard/>,
};

const AppRouter = () => {
    useRedirect('/', '/dashboard');
    const pages = useRoutes(routes);
    return (
        <div>
      <Header/>

            <div className="main-content w3-padding">
                {pages}
            </div>
            <div className="app-footer">
                <div className="copy-right">
                    Corona Care Network

                </div>

            </div>
        </div>
    );
};

export default AppRouter;
