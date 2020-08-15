import React, { useCallback, useState } from 'react';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import loadable from '@loadable/component';
import { useDispatch } from "react-redux";
const Loading = loadable( () => import("../Common/Loading"));
import { sampleReport } from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { SampleReportModel } from "./models";
import moment from "moment";

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
const coronasafeLogo = 'https://cdn.coronasafe.network/coronaSafeLogo.webp';

interface samplePreviewProps {
    id: string;
    sampleId: string;
}
export default function SampleReport(props: samplePreviewProps) {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const { id, sampleId } = props;
    const [isLoading, setIsLoading] = useState(false);
    const [sampleData, setSampleData] = useState<SampleReportModel>({});
    let report: any = null;
    let reportData: any = null;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res: any = await dispatch(sampleReport(id, sampleId));

            if (!status.aborted) {
                if (res && res.data) {
                    setSampleData(res.data);
                }
            }
            setIsLoading(false);
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
            <Box display="block overflow-scroll h-screen" id="section-to-print">
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
                        <Box className={`${classes.cellTBPadding} text-black`} style={{ padding: '20px', width: '100%' }}>
                            <Typography style={{ fontSize: '18px', fontWeight: 'bold' }}>
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
                                Sample Id : {sampleId}
                            </Typography>
                        </Box>
                        <Box display="flex" flexDirection="row" justifyContent="center"
                             className={`${classes.mainHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderTop} ${classes.cellTBPadding}`}>
                            <Typography component="h6" variant="h6">
                                Patient Id : {id}
                            </Typography>
                        </Box>
                        <div style={{ border: "solid 5px black" }}>
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.name}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.age_years} years{''}  {sampleData && sampleData.personal_details && sampleData.personal_details.age_months} Months
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.local_body_name}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.gender}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.phone_number}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.district_name}
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
                                            Indian
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.state_name}
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
                                            {sampleData && sampleData.specimen_details && moment(sampleData.specimen_details.created_date).format("lll")}
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
                                            {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_label}
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
                                            {sampleData && sampleData.specimen_details && sampleData.specimen_details.is_repeated_sample !== null ? sampleData.specimen_details.is_repeated_sample ? 'Yes' : 'No' : ''}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.hospital_name}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.hospital_pincode}
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
                                <Box width="100%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight} ${classes.borderLeft}`}>
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 0' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 0 - Repeat Sample of Positive Case / Follow Up case
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 1' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 1 - Symptomatic International Traveller in last 14 days
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 2' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 2 - Symptomatic contact of lab confirmed Case
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 3' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 3 - Symptomatic Healthcare Worker
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 4' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 4 - Hospitalized SARI (Severe Acute Respiratory illness Patient)
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 5a' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 5a - Asymptomatic Direct and High Risk contact of confirmed case - family Member
                                            </Typography>
                                        </Box>
                                    }
                                    {sampleData && sampleData.specimen_details && sampleData.specimen_details.icmr_category === 'Cat 5b' &&
                                        <Box width="35%" className={`${classes.cellTBPadding}`}>
                                            <Typography className={`${classes.cellText}`}>
                                                Cat 5b - Asymptomatic Healthcare worker in contact with confimred case without adequete protection
                                            </Typography>
                                        </Box>
                                    }
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.address}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.pincode}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.email}
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.date_of_birth}
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
                                            ....................
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
                                            {sampleData && sampleData.personal_details && sampleData.personal_details.passport_no}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.has_travel_to_foreign_last_14_days !== null ? sampleData.exposure_history.has_travel_to_foreign_last_14_days ? 'Yes' : 'No' : ''}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.places_of_travel}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.travel_start_date}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.travel_end_date}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.contact_with_confirmed_case !== null ? sampleData.exposure_history.contact_with_confirmed_case ? 'Yes' : 'No' : ''}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.contact_case_name}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.was_quarantined !== null ? sampleData.exposure_history.was_quarantined ? 'Yes' : 'No' : ''}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.quarantined_type}
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
                                            {sampleData && sampleData.exposure_history && sampleData.exposure_history.healthcare_worker !== null ? sampleData.exposure_history.healthcare_worker ? 'Yes' : 'No' : ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box display="flex" flexDirection="row" justifyContent="center"
                                className={`${classes.subHeader} ${classes.borderRight} ${classes.borderLeft} ${classes.borderBottom} ${classes.cellTBPadding}`}>
                                <Typography component="h6" variant="h6">
                                    B.3 CLINICAL SYMPTOMS AND SIGNS
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.date_of_onset_of_symptoms}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.symptoms && !!sampleData.medical_conditions.symptoms.length && sampleData.medical_conditions.symptoms.join(', ')}
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
                                            -
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.has_sari !== null ? sampleData.medical_conditions.has_sari ? 'Yes' : 'No' : ''}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.has_ari !== null ? sampleData.medical_conditions.has_ari ? 'Yes' : 'No' : ''}
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
                                {/* <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}> */}
                                <Box width="33.1%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                    <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                        Medical Conditions
                                            </Typography>
                                </Box>
                                <Box width="69%" className={`${classes.cellTBPadding}`}>
                                    <Typography className={`${classes.cellText}`}>
                                        {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.medical_conditions_list && !!sampleData.medical_conditions.medical_conditions_list.length && sampleData.medical_conditions.medical_conditions_list.join(', ')}
                                    </Typography>
                                </Box>
                                {/* </Box> */}
                                {/*<Box width="50%" display="flex" flexDirection="row" className={`${classes.borderRight}`}>*/}
                                {/*    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>*/}
                                {/*        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>*/}
                                {/*            Immuno Compromised Conditions*/}
                                {/*        </Typography>*/}
                                {/*    </Box>*/}
                                {/*    <Box width="35%" className={`${classes.cellTBPadding}`}>*/}
                                {/*        <Typography className={`${classes.cellText}`}>*/}
                                {/*            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.has_sari}*/}
                                {/*        </Typography>*/}
                                {/*    </Box>*/}
                                {/*</Box>*/}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.hospitalization_date}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box width="50%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight}`}>
                                    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                            Diagnosis
                                            </Typography>
                                    </Box>
                                    <Box width="35%" className={`${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellText}`}>
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.diagnosis}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.diff_diagnosis}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box width="50%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight}`}>
                                    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                            Etiology Identified
                                            </Typography>
                                    </Box>
                                    <Box width="35%" className={`${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellText}`}>
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.etiology_identified}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.is_atypical_presentation !== null ? sampleData.medical_conditions.is_atypical_presentation ? 'Yes' : 'No' : ''}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box width="50%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight}`}>
                                    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                            Unusual or Unexpected Course
                                            </Typography>
                                    </Box>
                                    <Box width="35%" className={`${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellText}`}>
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.is_unusual_course !== null ? sampleData.medical_conditions.is_unusual_course ? 'Yes' : 'No' : ''}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Box display="flex" flexDirection="row" className={`${classes.borderBottom}`}>
                                {/* <Box width="50%" display="flex" flexDirection="row"
                                         className={`${classes.borderRight} ${classes.borderLeft}`}> */}
                                <Box width="33.1%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                    <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                        Outcome
                                            </Typography>
                                </Box>
                                <Box width="69%" className={`${classes.cellTBPadding}`}>
                                    <Typography className={`${classes.cellText}`}>
                                        {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.diagnosis}
                                    </Typography>
                                </Box>
                                {/* </Box> */}
                                {/*<Box width="50%" display="flex" flexDirection="row"*/}
                                {/*     className={`${classes.borderRight} ${classes.borderLeft}`}>*/}
                                {/*    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>*/}
                                {/*        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>*/}
                                {/*            Outcome Date*/}
                                {/*        </Typography>*/}
                                {/*    </Box>*/}
                                {/*    <Box width="35%" className={`${classes.cellTBPadding}`}>*/}
                                {/*        <Typography className={`${classes.cellText}`}>*/}
                                {/*            20-01-2020*/}
                                {/*        </Typography>*/}
                                {/*    </Box>*/}
                                {/*</Box>*/}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.hospital_name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box width="50%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight}`}>
                                    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                            Hospital Phone Number
                                            </Typography>
                                    </Box>
                                    <Box width="35%" className={`${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellText}`}>
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.hospital_phone_number}
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
                                            {sampleData && sampleData.medical_conditions && sampleData.medical_conditions.doctor_name}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box width="50%" display="flex" flexDirection="row"
                                    className={`${classes.borderRight}`}>
                                    <Box width="65%" className={`${classes.borderRight} ${classes.cellTBPadding}`}>
                                        <Typography className={`${classes.cellTitle} ${classes.marginRight10}`}>
                                            Signature & Date
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
