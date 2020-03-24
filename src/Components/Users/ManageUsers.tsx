import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Grid,
    Typography,
    Card,
    CardHeader,
    CardContent,
    CircularProgress,
    Tooltip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Pagination from '../Common/Pagination';
import TitleHeader from '../Common/TitleHeader';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: '8px'
    },
    card: {
        height: 120,
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
        padding:'5px 10px'
    },
    cardHeader:{
        padding:'10px'
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
    userCardSideTitle:{
        fontSize: '13px'
    },
    toolTip:{
        fontSize:'13px'
    }
}));

export default function ManageUsers(props: any) {
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const initialData: any[] = [];
    let manageUsers: any = null;
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const limit = 15;
    const initialPaginateData = {
        page: 1,
        offset: 0,
        limit
    };
    const [ currentPage, setCurrentPage ] = useState(1);

    const fetchData = (paginateData: any) => {
        setIsLoading(true);
        dispatch(userList)
            .then((resp:any)=> {
                console.log(resp.results);
                setData(resp.results);
                setTotalCount(resp.results.length);
            });
    };
    useEffect(() => {
        fetchData(initialPaginateData);
    }, [dispatch]);

    const handlePagination = (page: any, perPage: any) => {
        setCurrentPage(page);
        const paginateData = {
            page,
            offset: perPage,
            limit
        };
            fetchData(paginateData);
    };


    let userList: any[] = [];
    if (data && data.length) {
        userList = data.map((user: any, idx: number) => {
            return (
                <Grid item xs={12} md={3}  key={`usr_${user.id}`}
                      className={classes.root}>
                    <Card className={classes.card}>
                        <CardHeader className={classes.cardHeader}
                                    title={<span className={classes.title}><Tooltip title={<span className={classes.toolTip}>{user.name}</span>}
                                                                                    interactive={true}><span>{user.name}</span></Tooltip></span>}
                        />
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>District - </span>{user.district}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            );
        });
    }

    if (isLoading || !data) {
        manageUsers = (
            <Grid item xs={12} md={12}>
                <div className="textMarginCenter">
                    <CircularProgress/>
                </div>
            </Grid>
        );
    } else if (data && data.length) {
        manageUsers = userList;
    } else if (data && data.length === 0) {
        manageUsers = (
            <Grid item xs={12} md={12} className="textMarginCenter">
                <h5> No Users Found</h5>
            </Grid>
        );
    }

    return (
        <div>
            <TitleHeader title="Users" showSearch={false}>

            </TitleHeader>
            <Grid container>
                {manageUsers}
                {(data && data.length > 0 && totalCount > limit) && (
                    <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{ totalCount }}
                            onChange={handlePagination}
                        />
                    </Grid>)}
            </Grid>
        </div>
    );

}
