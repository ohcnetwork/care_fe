import React from 'react';
import { useRedirect, useRoutes } from 'hookrouter';
import Header from '../Components/Common/Header';
import { PrivateDashboard } from "../Components/Dashboard/PrivateDashboard";
import { FacilityCreate } from '../Components/Facility/FacilityCreate';
import { HospitalList } from '../Components/Facility/HospitalList';
import { Analytics } from "../Components/Dashboard/Analytics";
import ManageUsers from "../Components/Users/ManageUsers";
import { PatientRegister } from "../Components/Patient/PatientRegister";
import { TeleConsultation } from '../Components/Patient/TeleConsultation';
import { PatientDischarge } from '../Components/Patient/PatientDischarge';
import { TreatmentForm } from '../Components/Patient/TreatmentForm';
import { FacilityHome } from '../Components/Facility/FacilityHome';
import { CareCenterJoinForm } from "../Components/Facility/CareCenterJoinForm";
import { BedCapacityForm } from '../Components/Facility/BedCapacityForm';
import { DoctorCapacityForm } from '../Components/Facility/DoctorCapacityForm';
import { PatientManager } from "../Components/Patient/ManagePatients";
import { PatientHome } from '../Components/Patient/PatientHome';
import { SampleTest } from '../Components/Patient/SampleTest';
import { SampleTestList } from '../Components/Patient/SampleTestList';
import { Consultation } from '../Components/Facility/Consultation';
import { ConsultationList } from '../Components/Facility/ConsultationList';
import { DailyRounds } from '../Components/Patient/DailyRounds';
import { DailyRoundsList } from '../Components/Patient/DailyRoundsList';

const routes = {
    '/': () => <HospitalList />,
    '/dash': () => <HospitalList />,
    '/analytics': () => <Analytics />,
    '/facility': () => <HospitalList />,
    '/facility/create': () => <FacilityCreate />,
    '/facility/:facilityId/update': ({ facilityId }: any) => <FacilityCreate facilityId={facilityId} />,
    '/facility/:facilityId': ({ facilityId }: any) => <FacilityHome facilityId={facilityId} />,
    '/facility/:facilityId/bed': ({ facilityId }: any) => <BedCapacityForm facilityId={facilityId} />,
    '/facility/:facilityId/doctor': ({ facilityId }: any) => <DoctorCapacityForm facilityId={facilityId} />,
    '/facility/:facilityId/patients': ({ facilityId }: any) => <PatientManager facilityId={facilityId} />,
    '/facility/:facilityId/patient': ({ facilityId }: any) => <PatientRegister facilityId={facilityId} />,
    '/facility/:facilityId/patient/:id': ({ facilityId, id }: any) => <PatientHome facilityId={facilityId} id={id} />,
    '/facility/:facilityId/patient/:id/update': ({ facilityId, id }: any) => <PatientRegister facilityId={facilityId} id={id} />,
    '/facility/:facilityId/patient/:patientId/consultation': ({ facilityId, patientId }: any) => <Consultation facilityId={facilityId} patientId={patientId} />,
    '/facility/:facilityId/patient/:patientId/consultation/:id': ({ facilityId, patientId, id }: any) => <Consultation facilityId={facilityId} patientId={patientId} id={id} />,
    '/facility/:facilityId/patient/:patientId/consultation-list': ({ facilityId, patientId }: any) => <ConsultationList facilityId={facilityId} patientId={patientId} />,
    '/facility/:facilityId/patient/:patientId/sample-test': ({ facilityId, patientId }: any) => <SampleTest facilityId={facilityId} patientId={patientId} />,
    '/facility/:facilityId/patient/:patientId/sample-test-list': ({ facilityId, patientId }: any) => <SampleTestList facilityId={facilityId} patientId={patientId} />,
    '/facility/:facilityId/patient/:patientId/sample-test/:id/update': ({ facilityId, patientId, id }: any) => <SampleTest facilityId={facilityId} patientId={patientId} id={id} />,
    '/facility/:facilityId/patient/:id/treatment': ({ facilityId, id }: any) => <TreatmentForm facilityId={facilityId} id={id} />,
    '/facility/:facilityId/bed/:id': ({ facilityId, id }: any) => <BedCapacityForm facilityId={facilityId} id={id} />,
    '/facility/:facilityId/doctor/:id': ({ facilityId, id }: any) => <DoctorCapacityForm facilityId={facilityId} id={id} />,
    '/facility/:facilityId/consultation/:id':({ facilityId, id }: any)=> <Consultation facilityId={facilityId} id={id} />,
    '/facility/:facilityId/consultation-list':({ facilityId }: any)=> <ConsultationList facilityId={facilityId} />,
    '/patients': () => <PatientManager />,
    '/patient/:id': ({ id }: any) => <PatientHome id={id} />,
    '/patient/tele-consult': () => <TeleConsultation />,
    '/patient/discharge': () => <PatientDischarge />,
    '/patient/treatment': () => <TreatmentForm />,
    '/users': () => <ManageUsers />,
    '/join': () => <CareCenterJoinForm />,
    '/daily-rounds':()=><DailyRounds />,
    '/daily-rounds-list':()=><DailyRoundsList />
};

const AppRouter = () => {
    useRedirect('/', '/dash');
    const pages = useRoutes(routes);
    return (
        <div>
            <Header />
            <div className="main-content w3-padding">
                {pages}
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
    );
};

export default AppRouter;
