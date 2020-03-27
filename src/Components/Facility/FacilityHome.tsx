import React, { useEffect, useState, useCallback } from 'react';
import { Grid, CircularProgress, Paper, Typography, Button, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { navigate } from 'hookrouter';
import { getFacility, listCapacity, listDoctor } from "../../Redux/actions";
import TitleHeader from "../Common/TitleHeader";
import BedTypeCard from "./BedTypeCard";
import { Loading } from '../Common/Loading';
import DoctorsCountCard from './DoctorsCountCard';
import { CapacityModal, DoctorModal } from './modals';
import {PatientManager} from "../Patient/ManagePatients";



const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: '8px'
    },
    margin: {
        margin: theme.spacing(1)
    },
    displayFlex: {
        display: 'flex'
    },
    content: {
        maxWidth: 530,
    }
}));

export const FacilityHome = (props: any) => {
    const { facilityId } = props;
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const initialData: any = {};
    const [facilityData, setFacilityData] = useState(initialData);
    const [capacityData, setCapacityData] = useState(initialData);
    const [doctorData, setDoctorData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        const facilityRes = await dispatch(getFacility(facilityId))
        if (facilityRes && facilityRes.data) {
            setFacilityData(facilityRes.data)
            const capacityRes = await dispatch(listCapacity({}, { facilityId }));
            if (capacityRes && capacityRes.data) {
                setCapacityData(capacityRes.data.results)
            }
            const doctorRes = await dispatch(listDoctor({}, { facilityId }));
            if (doctorRes && doctorRes.data) {
                setDoctorData(doctorRes.data.results)
            }
        }
        setIsLoading(false);
    },[dispatch, facilityId]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [dispatch, fetchData]);

    if (isLoading) {
        return <Loading />
    }

    let capacityList: any = null;
    if (capacityData && capacityData.length) {
        capacityList = capacityData.map((data: CapacityModal,idx:number) => {
            return (
                <BedTypeCard key={`bed_${idx}`} {...data} />
            )
        });
    } else if (capacityData && capacityData.length === 0) {
        capacityList = (
            <h5>No Bed Types Found</h5>
        );
    }

    let doctorList: any = null;
    if (doctorData && doctorData.length) {
        doctorList = doctorData.map((data: DoctorModal,idx:number) => {
            return (
                <DoctorsCountCard key={`doc_${idx}`} {...data} />
            )
        });
    } else if (doctorData && doctorData.length === 0) {
        doctorList = (
            <h5>No Doctors Found</h5>
        );
    }

    return (
        <div className={`w3-content ${classes.content}`}>
            <TitleHeader title="Facility" showSearch={false}>
            </TitleHeader>
            <Grid container style={{ padding: "10px", marginBottom: '15px' }} spacing={1}>
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" component="h6">{facilityData && facilityData.name}</Typography>
                    <Typography>Address : {facilityData && facilityData.address}</Typography>
                    <Typography>Phone : {facilityData && facilityData.phone_number}</Typography>
                    <Typography>District : {facilityData && facilityData.district}</Typography>
                    <Typography>Oxygen Capacity :{` ${facilityData && facilityData.oxygen_capacity} Litres`}</Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                <Grid container spacing={1} direction="column">
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={()=>navigate(`/facility/${facilityId}/update`)}>
                                Update Hospital Info
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={()=>navigate(`/facility/${facilityId}/bed`)}>
                                Add More Bed Types
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={()=>navigate(`/facility/${facilityId}/doctor`)}>
                                Add More Doctor Types
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container style={{ padding: "10px", marginBottom: '15px' }} spacing={1}>
                <Grid item xs={12} md={12}>
                    <h5>Bed Types</h5>
                    <Divider />
                </Grid>
                {capacityList}
            </Grid>
            <Grid container style={{ padding: "10px", marginBottom: '15px' }} spacing={1}>
                <Grid item xs={12} md={12}>
                    <h5>Doctors Count</h5>
                    <Divider />
                </Grid>
                {doctorList}
            </Grid>
<Grid>
    <PatientManager/>
</Grid>
        </div>
    );

}
