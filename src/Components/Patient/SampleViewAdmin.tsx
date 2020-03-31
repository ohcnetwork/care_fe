import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Grid,
    Typography,
    Card,
    CardHeader,
    CardContent,
    Tooltip, Button
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Pagination from '../Common/Pagination';
import TitleHeader from '../Common/TitleHeader';
import {getTestList, patchSample} from "../../Redux/actions";
import { Loading } from '../Common/Loading';
import { useAbortableEffect, statusType } from '../../Common/utils';
import * as Notification from "../../Utils/Notifications";

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: '8px'
    },
    card: {
        height: 160,
        width: '100%',
        backgroundColor: '#FFFFFF',
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
    }
}));

export default function SampleViewAdmin(props: any) {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const initialData: any[] = [];
    let manageSamples: any = null;
    const [sample, setSample] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [offset, setOffset] = useState(0);

    const limit = 15;

    const fetchData = useCallback(async (status: statusType) => {
        setIsLoading(true);
        const res = await dispatch(getTestList({ limit, offset }));
        if (!status.aborted) {
            if (res && res.data) {
                setSample(res.data.results);
                setTotalCount(res.data.count);
            }
            setIsLoading(false);
        }
    }, [dispatch, offset]);

    useAbortableEffect((status: statusType) => {
        fetchData(status);
    }, [fetchData]);

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    const handleApproval = (status: number, sample: any) => {
        const sampleData = {
            id: sample.id,
            status,
            date_of_sample: null,
            date_of_result: null,
            consultation : sample.consultation_id
        };
        let statusName = '';
       if(status === 1){
           statusName = 'Approved'
       }
       else{

           statusName = 'Denied'
       }
      dispatch(patchSample(sample.id, sampleData)).then((resp:any) => {
          if(resp.status === 201 || resp.status === 200) {
              Notification.Success({
                  msg: `Request ${statusName}`
              });
              window.location.reload();
          }
        })
    };

    let sampleList: any[] = [];
    if (sample && sample.length) {
        sampleList = sample.map((sample: any, idx: number) => {
            return (
                <Grid item xs={12} md={3} key={`usr_${sample.id}`}
                      className={classes.root}>
                    <Card className={classes.card} >
                        <CardHeader className={classes.cardHeader}
                                    title={<span className={classes.title}><Tooltip title={<span className={classes.toolTip}>Consultation Id -{sample.id}</span>}
                                                                                    interactive={true}><span>{sample.id}</span></Tooltip></span>}
                        />
                       <CardContent>
                           {
                               sample.status === 'REQUEST_SUBMITTED' &&
                               <Button style={{color: 'green'}} variant="outlined" onClick ={ (e) => handleApproval(2, sample)}>
                                   Approve
                               </Button>
                           }

                           {' '}
                           {
                               sample.status === 'REQUEST_SUBMITTED' &&
                               <Button style={{color: 'red'}} variant="outlined" onClick ={ (e) => handleApproval(3, sample)}>
                                   Deny
                               </Button>
                           }
                       </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Status - </span>{sample.status}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Result - </span>{sample.result}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Date Of Sample - </span>{sample.date_of_sample}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            );
        });
    }

    if (isLoading || !sample) {
        manageSamples = (
            <Loading />
        );
    } else if (sample && sample.length) {
        manageSamples = (
            <>
                {sampleList}
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
    } else if (sample && sample.length === 0) {
        manageSamples = (
            <Grid item xs={12} md={12} className="textMarginCenter">
                <h5 style={{color: 'red'}}> You are not Authorised to access this Page</h5>
            </Grid>
        );
    }

    return (
        <div>
            <TitleHeader title="Sample Collection" showSearch={false}>

            </TitleHeader>
            <Grid container>
                {manageSamples}
            </Grid>
        </div>
    );

}
