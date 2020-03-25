import React from 'react';
import { useRedirect, useRoutes } from 'hookrouter';
import Header from '../Components/Common/Header';
import {PrivateDashboard} from "../Components/Dashboard/PrivateDashboard";
import { FacilityCreate } from '../Components/Facility/FacilityCreate';
import { HospitalList } from '../Components/Facility/HospitalList';
import {Analytics} from "../Components/Dashboard/Analytics";
import {Stats} from "../Components/Dashboard/Stats";
import ManageUsers from "../Components/Users/ManageUsers";
import {PatientRegister} from "../Components/Patient/PatientRegister";
import { TeleConsultation } from '../Components/Patient/TeleConsultation';
import { PatientDischarge } from '../Components/Patient/PatientDischarge';
import { TreatmentForm } from '../Components/Patient/TreatmentForm';

const routes = {
    '/': () => <PrivateDashboard/>,
    '/privatedashboard': () => <PrivateDashboard/>,
    '/analytics': () => <Analytics/>,
    '/facilities': () => <HospitalList />,
    '/facilities/create': () => <FacilityCreate />,
    '/stats' : () => <Stats/>,
    '/patient/register':()=> <PatientRegister />,
    '/patient/tele-consult':()=> <TeleConsultation />,
    '/patient/discharge':()=> <PatientDischarge />,
    '/patient/treatment':()=> <TreatmentForm />,
    '/users': () => <ManageUsers/>,
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
