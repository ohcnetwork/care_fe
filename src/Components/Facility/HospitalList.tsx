import React, { useEffect, useState, useCallback } from 'react';
import Grid from '@material-ui/core/Grid';
import { Card, CardContent, CardHeader, Tooltip, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { getFacilities } from "../../Redux/actions";
import TitleHeader from "../Common/TitleHeader";
import Pagination from "../Common/Pagination";
import AddCard from '../Common/AddCard';
import { navigate } from 'hookrouter';
import { Loading } from "../Common/Loading";
import { FacilityModal } from './models';
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

export const HospitalList = () => {
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const [data, setData] = useState<Array<FacilityModal>>([]);

    let manageFacilities: any = null;
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const limit = 15;
    const page = 1;
    const offset = 0;
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async (page, limit, offset) => {
        const res = await dispatchAction(getFacilities({page, offset, limit}));
        if (res && res.data) {
            setData(res.data.results);
            setTotalCount(res.data.count);
        }
        setIsLoading(false);
    }, [dispatchAction]);

    useEffect(() => {
        setIsLoading(true);
        fetchData(page, limit, offset);
    }, [dispatchAction, fetchData]);

    const handlePagination = (page: any, perPage: any) => {
        setCurrentPage(page);
        fetchData(page, limit, perPage);
    };
    let facilityList: any[] = [];
    if (data && data.length) {
        facilityList = data.map((facility: any, idx: number) => {
            return (
                <Grid item xs={12} md={6} lg={4} xl={3} key={`usr_${facility.id}`} className={classes.root}>
                    <Card className={classes.card} onClick={() => navigate(`/facility/${facility.id}`)}>
                        <CardHeader
                            className={classes.cardHeader}
                            title={
                                <span className={classes.title}>
                                    <Tooltip
                                        title={<span className={classes.toolTip}>{facility.name}</span>}
                                        interactive={true}>
                                        <span>{facility.name}</span>
                                    </Tooltip>
                                </span>
                            }
                        />
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>District - </span>{facility.district}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Facility Type - </span>{facility.facility_type}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Contact - </span>{facility.phone_number}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            );
        });
    }

    if (isLoading || !data) {
        manageFacilities = (
            <Loading />
        );
    } else if (data && data.length) {
        manageFacilities = facilityList;
    } else if (data && data.length === 0) {
        manageFacilities = (
            <Grid item xs={12} md={12} className={classes.displayFlex}>
                <Grid container justify="center" alignItems="center">
                    <h5> No Users Found</h5>
                </Grid>
            </Grid>
        );
    }

    return (
        <div>
            <TitleHeader title="Facilities" showSearch={false}>
            </TitleHeader>
            <Grid container className={classes.minHeight}>
                {!isLoading &&
                    <AddCard
                        title={'+ Add New Hospital'}
                        onClick={() => navigate('/facility/create')}
                    />
                }
                {manageFacilities}
            </Grid>
            <Grid container>
                {(data && data.length > 0 && totalCount > limit) && (
                    <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{ totalCount }}
                            onChange={handlePagination}
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    );

}
