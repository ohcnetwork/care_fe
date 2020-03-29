import React, { useEffect, useState, useCallback } from 'react';
import Grid from '@material-ui/core/Grid';
import { Card, CardContent, CardHeader, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { getFacilities, getAllPatient } from "../../Redux/actions";
import TitleHeader from "../Common/TitleHeader";
import Pagination from "../Common/Pagination";
import AddCard from '../Common/AddCard';
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: '8px'
    },
    card: {
        height: 160,
        width: '100%',
        backgroundColor: '#FFFFFF',
        cursor: 'pointer'
    },
    title: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: 400,
        //padding: '10px',
        //fontSize: '14px',
        display: 'inline-block',
        [theme.breakpoints.up('md')]: {
            width: '12vw'
        },
        [theme.breakpoints.down('sm')]: {
            width: '40vw'
        },
        [theme.breakpoints.down('xs')]: {
            width: '65vw'
        }
    },
    content: {
        padding: '5px 10px'
    },
    cardHeader: {
        padding: '10px'
    },
    contentText: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        [theme.breakpoints.up('md')]: {
            width: '10vw'
        },
        [theme.breakpoints.down('sm')]: {
            width: '40vw'
        },
        [theme.breakpoints.down('xs')]: {
            width: '40vw'
        }
    },
    spacing: {
        marginLeft: theme.spacing(1)
    },
    margin: {
        margin: theme.spacing(1)
    },
    addUserCard: {
        marginTop: '50px'
    },
    paginateTopPadding: {
        paddingTop: '50px'
    },
    userCardSideTitle: {
        fontSize: '13px'
    },
    toolTip: {
        fontSize: '13px'
    },
    displayFlex: {
        display: 'flex'
    },
    minHeight: {
        minHeight: '65vh'
    }
}));

export const PatientManager = () => {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const initialData: any[] = [];
    const [data, setData] = useState(initialData);

    let managePatients: any = null;
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [offset, setOffset] = useState(0);

    const limit = 15;

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const res = await dispatch(getAllPatient({ limit, offset }));
        if (res && res.data) {
            setData(res.data.results);
            setTotalCount(res.data.count);
        }
        setIsLoading(false);
    }, [dispatch, offset]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    let patientList: any[] = [];
    if (data && data.length) {
        patientList = data.map((patient: any, idx: number) => {
            return (
                <Grid item xs={12} md={3} key={`usr_${patient.id}`} className={classes.root}>
                    <Card className={classes.card} onClick={() => navigate(`/patient/${patient.id}`)}>
                        <CardHeader
                            className={classes.cardHeader}
                            title={
                                <span className={classes.title}>
                                    <Tooltip
                                        title={<span className={classes.toolTip}>{patient.name}</span>}
                                        interactive={true}>
                                        <span>{patient.name}</span>
                                    </Tooltip>
                                </span>
                            }
                        />
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Age - </span>{patient.age}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Contact with carrier - </span>{patient.contact_with_carrier}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Status - </span>{patient.is_active}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            );
        });
    }

    if (isLoading || !data) {
        managePatients = (
            <Loading />
        );
    } else if (data && data.length) {
        managePatients = (
            <>
                {patientList}
                {(totalCount > limit) && (
                    <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{ totalCount }}
                            onChange={handlePagination}
                        />
                    </Grid>
                )}
            </>
        );

    } else if (data && data.length === 0) {
        managePatients = (
            <Grid item xs={12} md={12} className={classes.displayFlex}>
                <Grid container justify="center" alignItems="center">
                    <h5> No Patients Found</h5>
                </Grid>
            </Grid>
        );
    }

    return (
        <div>
            <TitleHeader title="Patients" showSearch={false}>

            </TitleHeader>

            <Grid container>
                {managePatients}
            </Grid>
        </div>
    );

};
