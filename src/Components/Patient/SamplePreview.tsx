import React, {useCallback, useEffect, useState} from 'react';
import {Box, Button, Paper, Typography} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {useDispatch} from "react-redux";
import {Loading} from "../Common/Loading";
import { sampleReport} from "../../Redux/actions";
import {statusType, useAbortableEffect} from "../../Common/utils";

const useStyles = makeStyles({
    root: {
        width: '100%'
    },
    contentDiv: {
        minHeight: '100vh'
    },
    internalUse: {
        color: '#FC1514 !important',
    },
    allLogo: {
        maxWidth: '400px',
        height: '50px',
        objectFit: 'contain',
    },
    printBtn: {
        margin: '10px',
        paddingTop: '10px'
    },
    mainHeader: {
        fontWeight: 600,
        backgroundColor: '#000000 !important',
        color: '#FFFFFF !important'
    },
    subHeader: {
        fontWeight: 600,
        backgroundColor: '#444444 !important',
        color: '#FFFFFF !important',
    },
    borderTop: {
        borderTop: '1px solid gray',
    },
    borderBottom: {
        borderBottom: '1px solid gray',
    },
    borderRight: {
        borderRight: '1px solid gray',
    },
    borderLeft: {
        borderLeft: '1px solid gray'
    },
    cellTitle: {
        textAlign: 'right',
        fontWeight: 600,
        paddingRight: '8px',
        paddingLeft: '4px'
    },
    cellText: {
        textAlign: 'left',
        paddingLeft: '8px',
        paddingRight: '4px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    },
    cellTBPadding: {
        paddingTop: '8px',
        paddingBottom: '8px'
    },
    marginRight10: {
        marginRight: '10px'
    },
    boldText: {
        fontWeight: 'bold'
    }

});
const coronasafeLogo = 'https://cdn.coronasafe.network/coronaSafeLogo.png';

export default function SampleReport(props: any) {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const { id } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [sampleData, setSampleData] = useState();
    let report: any = null;
    let reportData: any = null;
    // let sampleDetails: any = null;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatch(sampleReport({ id }));
            if (!status.aborted) {
                if (res && res.data) {
                    setSampleData(res.data.results);
                }
                setIsLoading(false);
            }
        },
        [dispatch, id]
    );

    useAbortableEffect(
        (status: statusType) => {
            fetchData(status);
        },
        [fetchData]
    );

    if (sampleData) {
        reportData = (<>
            <Box display="flex" flexDirection="row" justifyContent="flex-end" displayPrint="none"
                className={classes.printBtn}>
                <Button
                    color="primary"
                    variant="contained"
                    size="small"
                    onClick={() => window.print()}>Print Report</Button>
            </Box>

            <Box display="block">
                <Box component="div" display="flex" flexDirection="column">
                    <Box component="div" display="flex" flexDirection="row" justifyContent="space-between"
                        alignItems="center"
                        className={`${classes.borderTop} ${classes.borderRight} ${classes.borderBottom} ${classes.borderLeft}`}>
                        <Box justifySelf="flex-start" style={{ padding: '8px' }}>
                        </Box>
                        <Box justifySelf="flex-end">
                            <Box style={{ padding: '8px' }}>
                                <img src={coronasafeLogo} className={classes.allLogo} alt="Coronasafe" />
                            </Box>
                        </Box>
                    </Box>
                    <Box component="div" display="flex" flexDirection="row" justifyContent="flex-start"
                        className={`${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom}`}>
                        <Box style={{
                            background: '#4da0b4',
                            padding: '10px 20px'
                        }} className={`${classes.borderRight} ${classes.cellTBPadding} w3-center`}>
                            <img src={coronasafeLogo} className={classes.allLogo} alt="PipeDiver" />
                        </Box>
                        <Box className={`${classes.cellTBPadding} w3-black`} style={{ padding: '20px', width: '100%' }}>
                            <Typography style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                                ICMR Specimen Referral Data for COVID-19 (SARS-CoV2)
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" flexDirection="row" justifyContent="center"
                        className={`${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                        <Typography component="h6" variant="h6" className={classes.internalUse}
                            style={{ fontWeight: 'bold' }}>
                            FOR INTERNAL USE ONLY
                        </Typography>
                    </Box>
                         <Box display='flex' flexDirection='column'>
                            <Box display="flex" flexDirection="row" justifyContent="center"
                                 className={`${classes.mainHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderTop} ${classes.cellTBPadding}`}>
                                <Typography component="h6" variant="h6">
                                    Sample Id
                                </Typography>
                            </Box>

                            <div style={{border: "solid 5px black"}}>
                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        SECTION A - MANDATORY FIELDS
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        A.1 PERSON DETAILS
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Patient Name
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Patient Name
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Age
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Age
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Present Patient Village or Town
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Present Patient Village or Town
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Gender
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Gender
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Mobile Number (Self)
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Mobile Number
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                District of Present Residence
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                District of Present Residence
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Nationality
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Nationality
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                State Of Present Residence
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                State Of Present Residence
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>


                                <Box display="flex" flexDirection="row" justifyContent="center" className={`${classes.subHeader}
                 ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        A.2 SPECIMEN INFORMATION FROM REFERRING AGENCY
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Collection Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Collection Date
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Label
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Label
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Sample Repeated
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Sample Repeated
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Sample Collection Facility Name
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Sample Collection Facility Name
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Collection Facility Pin code
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Collection Facility PinCode
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" justifyContent="center" className={`${classes.subHeader}
                 ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        A.3 Patient Category
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Symptomatic International Traveller in last 14 days
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Symptomatic contact of lab confirmed Case
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Symptomatic Healthcare Worker
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Hospitalized SARI(Severe Acute Respiratory Illness Patient)
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Asymptomatic Direct and High Risk contact of confirmed case - family Member
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Asymptomatic Healthcare worker in contact with confimred case without adequete
                                                protection
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>


                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        SECTION B - OTHER FIELDS TO BE UPDATED
                                    </Typography>
                                </Box>
                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        B.1 PERSON DETAILS
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Present Patient Address
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                present Patient Address
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Pin code
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                682030
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Email Id
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                care@coronasafe.network
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Date Of Birth
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                01-01-2020
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Patient Aadhar Number
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Not Avaliable
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Patient Passport Number
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Passport Number
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        B.2 EXPOSURE HISTORY ( 2 WEEKS BEFORE THE ONSET OF SYMPTOMS )
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Travel to foreign country in last 14 days
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {/* Places of travel only if above is true*/}
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Places of travel
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                places of travel
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Travel Start Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Start Date
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Travel End Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                End Date
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                In Contact with lab confimed Covid 19 Patient
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Name of Confirmed Contacted Covid Patient
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Name
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Quarantine Status
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Yes
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Quarantine Location
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                home
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Health care worker working in a hospital involved in managing patients
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Yes
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        B.3 PERSON DETAILS
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Date of Onset of Symptoms
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Date
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Symptoms
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Symptoms
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                First Symptom
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Symptom
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Person has Severe Acute Respiratory illness
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Person Has Acute Respiratory Illness
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        B.4 UNDERLYING MEDICAL CONDITIONS
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Medical Conditions
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Conditions
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Immuno Compromised Conditions
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>


                                <Box display="flex" flexDirection="row" justifyContent="center"
                                     className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                    <Typography component="h6" variant="h6">
                                        B.5 HOSPITALIZATION , TREATMENT AND INVESTIGATION
                                    </Typography>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Hospitalization Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                13-04-2020
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Diagnosis
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Diagnosis
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Differential diagnosis
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Differential diagnosis
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Etiology Identified
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Etiliology
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Asypical Presentation
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                True
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Unusual or Unexpected Course
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Yes
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Outcome
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Outcome
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Outcome Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                20-01-2020
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Hospital Name / Address
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Hospital Name
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Hospital Phone Number
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Phone Number
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Name of Doctor
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Name of doctor
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}>
                                        <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                                Signature & Date
                                            </Typography>
                                        </Box>
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Signature and Date
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </div>
                        </Box>
                </Box>
            </Box>
        </>)
    }
    if (isLoading) {
        report = (
            <Box display="flex" flexDirection="row" justifyContent="center" displayPrint="none"
                className={classes.contentDiv}>
                <Loading />
            </Box>);
    } else if (sampleData && reportData) {
        report = reportData;
    } else if (!sampleData) {
        report = (
            <Box display="flex" flexDirection="row" justifyContent="center" displayPrint="none"
                className={classes.contentDiv}>
                <Typography component="h5" variant="h5" style={{ alignSelf: 'center' }}>
                    No Data Found
                </Typography>
            </Box>);
    }
    return (
        <Paper className={classes.root}>
            {report}
        </Paper>
    );

};
