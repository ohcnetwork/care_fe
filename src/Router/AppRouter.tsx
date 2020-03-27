import React from 'react';
import { useRedirect, useRoutes } from 'hookrouter';
import Header from '../Components/Common/Header';
import { PrivateDashboard } from "../Components/Dashboard/PrivateDashboard";
import { FacilityCreate } from '../Components/Facility/FacilityCreate';
import { HospitalList } from '../Components/Facility/HospitalList';
import { Analytics } from "../Components/Dashboard/Analytics";
import { Stats } from "../Components/Dashboard/Stats";
import ManageUsers from "../Components/Users/ManageUsers";
import { PatientRegister } from "../Components/Patient/PatientRegister";
import { TeleConsultation } from '../Components/Patient/TeleConsultation';
import { PatientDischarge } from '../Components/Patient/PatientDischarge';
import { TreatmentForm } from '../Components/Patient/TreatmentForm';
import { FacilityHome } from '../Components/Facility/FacilityHome';
import { CareCenterJoinForm } from "../Components/Facility/CareCenterJoinForm";
import { BedCapacityForm } from '../Components/Facility/BedCapacityForm';
import { DoctorCapacityForm } from '../Components/Facility/DoctorCapacityForm';

const routes = {
    '/': () => <PrivateDashboard />,
    '/privatedashboard': () => <PrivateDashboard />,
    '/analytics': () => <Analytics />,
    '/facility': () => <HospitalList />,
    '/facility/create': () => <FacilityCreate />,
    '/facility/:facilityId/update': ({ facilityId }: any) => <FacilityCreate facilityId={facilityId} />,
    '/facility/:facilityId': ({ facilityId }: any) => <FacilityHome facilityId={facilityId} />,
    '/facility/:facilityId/bed': ({ facilityId }: any) => <BedCapacityForm facilityId={facilityId} />,
    '/facility/:facilityId/doctor': ({ facilityId }: any) => <DoctorCapacityForm facilityId={facilityId} />,
    '/facility/:facilityId/bed/:id': ({ facilityId, id }: any) => <BedCapacityForm facilityId={facilityId} id={id} />,
    '/facility/:facilityId/doctor/:id': ({ facilityId, id }: any) => <DoctorCapacityForm facilityId={facilityId} id={id} />,
    '/stats': () => <Stats />,
    '/patient/register': () => <PatientRegister />,
    '/patient/tele-consult': () => <TeleConsultation />,
    '/patient/discharge': () => <PatientDischarge />,
    '/patient/treatment': () => <TreatmentForm />,
    '/users': () => <ManageUsers />,
    '/join': () => <CareCenterJoinForm />,
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
                    <a href="https://coronasafe.network">   Corona Care Network </a>
                </div>
            </div>
        </div>
    );
};

export default AppRouter;
