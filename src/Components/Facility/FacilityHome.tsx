import React, { useEffect, useState, useCallback } from 'react';
import { Grid, Typography, Button, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { navigate } from 'hookrouter';
import { getFacility, listCapacity, listDoctor } from "../../Redux/actions";
import BedTypeCard from "./BedTypeCard";
import { Loading } from '../Common/Loading';
import DoctorsCountCard from './DoctorsCountCard';
import { BED_TYPES, DOCTOR_SPECIALIZATION } from "../../Constants/constants";
import DISTRICTS from "../../Constants/Static_data/districts.json";
import { FacilityModal, CapacityModal, DoctorModal } from './models';

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
        marginTop: "10px",
        maxWidth: "560px",
        background: "white",
        padding: "20px 20px 5px",
    }
}));

export const FacilityHome = (props: any) => {
    const { facilityId } = props;
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const [facilityData, setFacilityData] = useState<FacilityModal>({});
    const [capacityData, setCapacityData] = useState<Array<CapacityModal>>([]);
    const [doctorData, setDoctorData] = useState<Array<DoctorModal>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async () => {
        const facilityRes = await dispatch(getFacility(facilityId));
        if (facilityRes && facilityRes.data) {
            setFacilityData(facilityRes.data);
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
    }, [dispatch, facilityId]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [dispatch, fetchData]);

    if (isLoading) {
        return <Loading />
    }

    let capacityList: any = null;
    if (!capacityData || !capacityData.length) {
        capacityList = (
            <h5>No Bed Types Found</h5>
        );
    } else {
        capacityList = capacityData.map((data: CapacityModal) => {
            return (
                <BedTypeCard facilityId={facilityId} key={`bed_${data.id}`} {...data} />
            )
        });
    }

    let doctorList: any = null;
    if (!doctorData || !doctorData.length) {
        doctorList = (
            <h5>No Doctors Found</h5>
        );
    } else {
        doctorList = doctorData.map((data: DoctorModal) => {
            return (
                <DoctorsCountCard facilityId={facilityId} key={`bed_${data.id}`} {...data} />
            )
        });
    }

    const districtName = DISTRICTS.find(i => i.id === facilityData.district)?.name;

    return (
        <div className={`w3-content ${classes.content}`}>
            <h2>Facility</h2>
            <Grid container style={{ padding: "10px", marginBottom: '5px' }} spacing={2}>
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" component="h6">{facilityData.name}</Typography>
                    <Typography>Address : {facilityData.address}</Typography>
                    <Typography>Phone : {facilityData.phone_number}</Typography>
                    <Typography>District : {districtName}</Typography>
                    <Typography>Oxygen Capacity :{` ${facilityData.oxygen_capacity} Litres`}</Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Grid container spacing={1} direction="column">
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={() => navigate(`/facility/${facilityId}/update`)}>
                                Update Hospital Info
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={() => navigate(`/facility/${facilityId}/bed`)}
                                disabled={capacityList.length === BED_TYPES.length}>
                                Add More Bed Types
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={() => navigate(`/facility/${facilityId}/doctor`)}
                                disabled={doctorList.length === DOCTOR_SPECIALIZATION.length}>
                                Add More Doctor Types
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container style={{ padding: "10px"}} spacing={1}>
                <Grid item xs={12} md={6} className="w3-center">
                    <Button fullWidth variant="contained" color="primary" size="small"
                        onClick={() => navigate(`/facility/${facilityId}/patient`)}>
                        Add More Patient
                    </Button>
                </Grid>
                <Grid item xs={12} md={6} className="w3-center">
                    <Button fullWidth variant="contained" color="primary" size="small"
                        onClick={() => navigate(`/facility/${facilityId}/patients`)}>
                        View Patients
                    </Button>
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
        </div>
    );

};
