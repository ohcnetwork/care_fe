import React from 'react';
import {useRedirect, useRoutes} from 'hookrouter';
import {PublicDashboard} from "../Components/Dashboard/PublicDashboard";
import Header from '../Components/Common/Header';

const img = 'https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/black-logo.svg';
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
        </div>
    );
};

export default AppRouter;
