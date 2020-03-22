import React from 'react';
import { useRedirect, useRoutes } from 'hookrouter';
import Header from '../Components/Common/Header';
import {PrivateDashboard} from "../Components/Dashboard/PrivateDashboard";

const routes = {
    '/': () => <PrivateDashboard/>,
    '/privatedashboard': () => <PrivateDashboard/>
};

const AppRouter = () => {
    useRedirect('/', '/privatedashboard');
    const pages = useRoutes(routes);
    return (
        <div>
            <Header />
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
