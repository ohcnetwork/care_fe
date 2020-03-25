import React from 'react';
import { Login, Register } from '../Components/Auth';
import { useRoutes } from 'hookrouter';
import TopBar from "../Components/Common/TopBar";
import { PublicDashboard } from '../Components/Dashboard/PublicDashboard';

import AmbulanceOnboarding from "../Components/Ambulance/AmbulanceOnboarding";
import { PatientRegister } from '../Components/Patient/PatientRegister';
import { TeleConsultation } from '../Components/Patient/TeleConsultation';
import { PatientDischarge } from '../Components/Patient/PatientDischarge';
import {Stats} from "../Components/Dashboard/Stats";

const routes = {
    '/': () => <Login />,
    '/login': () => <Login />,
    '/dashboard': () => <PublicDashboard />,
    '/ambulance': () => <AmbulanceOnboarding />,
    '/register': () => <Register />,
    '/patient/register':()=> <PatientRegister />,
    '/patient/tele-consult':()=> <TeleConsultation />,
    '/patient/discharge':()=> <PatientDischarge />,
    '/stats' : () => <Stats/>
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
                <div className="copy-right">
                    Corona Care Network
                </div>
            </div>
        </div>
    )
};

export default SessionRouter;
