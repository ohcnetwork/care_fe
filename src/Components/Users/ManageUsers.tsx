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
import {getUserList, readUser} from "../../Redux/actions";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Paper, { PaperProps } from '@material-ui/core/Paper';

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
        dispatch(getUserList(paginateData))
            .then((resp:any)=> {
                const res = resp && resp.data;
                setData(res.results);
                setTotalCount(res.count);
                setIsLoading(false);
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
                                    title={<span className={classes.title}><Tooltip title={<span className={classes.toolTip}>{user.username}</span>}
                                                                                    interactive={true}><span>{user.username}</span></Tooltip></span>}
                        />
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Full Name - </span>{`${user.first_name} ${user.last_name}`}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Role - </span>{user.user_type}
                            </Typography>
                        </CardContent>
                        <CardContent className={classes.content}>
                            <Typography>
                                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>Contact - </span>{user.phone_number}
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
