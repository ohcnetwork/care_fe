import React from 'react';
import {useRedirect, useRoutes} from 'hookrouter';
import {PublicDashboard} from "../Components/Dashboard/PublicDashboard";

const routes = {
    '/': () => <PublicDashboard/>,
    '/dashboard': () => <PublicDashboard/>,
};

const AppRouter = () => {
    useRedirect('/', '/dashboard');
    const pages = useRoutes(routes);
    return (
        <div>
            <div className="w3-padding">
                {pages}
            </div>
        </div>
    );
};

export default AppRouter;
