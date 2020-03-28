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
                <div className="copy-right" >
                    <a href="https://coronasafe.network" >  Corona Care Network </a>
                </div>
            </div>
        </div>
    )
};

export default SessionRouter;
