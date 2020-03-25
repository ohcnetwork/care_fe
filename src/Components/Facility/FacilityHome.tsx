import React, { useEffect, useState } from 'react';
import { Grid, CircularProgress, Paper, Typography, Button, Divider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { navigate } from 'hookrouter';
import { getFacility } from "../../Redux/actions";
import TitleHeader from "../Common/TitleHeader";
import BedTypeCard from "./BedTypeCard";
import { Loading } from '../Common/Loading';
import DoctorsCountCard from './DoctorsCountCard';



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
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = () => {
        dispatch(getFacility(facilityId))
            .then((resp: any) => {
                if (resp && resp.data) {
                    setFacilityData(resp.data)
                    setIsLoading(false);
                }
            });
    };

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [dispatch]);

    if (isLoading) {
        return (
            <Grid container>
                <Grid item md={12} className={classes.displayFlex}>
                    <Grid container justify="center" alignItems="center">
                        <Loading />
                    </Grid>
                </Grid>
            </Grid>)
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
                            <Button fullWidth variant="contained" color="primary" size="small">
                                Update Hospital Info
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small">
                                Add More Bed Types
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small">
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
                <BedTypeCard />
            </Grid>
            <Grid container style={{ padding: "10px", marginBottom: '15px' }} spacing={1}>
                <Grid item xs={12} md={12}>
                    <h5>Doctors Count</h5>
                    <Divider />
                </Grid>
                <DoctorsCountCard />
            </Grid>

        </div>
    );

}
