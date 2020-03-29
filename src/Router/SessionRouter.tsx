import React from 'react';
import { Login, Register } from '../Components/Auth';
import { useRoutes } from 'hookrouter';
import TopBar from "../Components/Common/TopBar";
import { PublicDashboard } from '../Components/Dashboard/PublicDashboard';

import AmbulanceOnboarding from "../Components/Ambulance/AmbulanceOnboarding";

const routes = {
    '/': () => <Login />,
    '/login': () => <Login />,
    '/dashboard': () => <PublicDashboard />,
    '/ambulance': () => <AmbulanceOnboarding />,
    '/register': () => <Register />
};

const SessionRouter = () => {
    const content = useRoutes(routes) || <Login />;
    return (
        <div>
            <TopBar />
            <div className="w3-padding">
                {content}
            </div>
            <div className="app-footer">
                <img src="https://care-coronasafe.s3.amazonaws.com/static/images/logos/ksdma_logo.png" alt="Care Logo" />
                <div className="copy-right">
                <a href="https://coronasafe.network/">CoronaSafe Network is an open-source public utility designed by
                  a multi-disciplinary team of innovators and volunteers who are working on a model to support
                  Government efforts with full understanding and support of Government of
                  Kerala.</a>&nbsp;<a href="https://github.com/coronasafe" className="care-secondary-color">(Github)</a>
                  </div>
            </div>
        </div>
    )
};

export default SessionRouter;
