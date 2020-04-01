import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  Grid,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Tooltip
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Pagination from "../Common/Pagination";
import TitleHeader from "../Common/TitleHeader";
import { getUserList } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import { useAbortableEffect, statusType } from "../../Common/utils";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    padding: "8px"
  },
  card: {
    height: 160,
    width: "100%",
    backgroundColor: "#FFFFFF"
  },
  title: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: 400,
    //padding: '10px',
    //fontSize: '14px',
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "12vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "65vw"
    }
  },
  content: {
    padding: "5px 10px"
  },
  cardHeader: {
    padding: "10px"
  },
  contentText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
    [theme.breakpoints.up("md")]: {
      width: "10vw"
    },
    [theme.breakpoints.down("sm")]: {
      width: "40vw"
    },
    [theme.breakpoints.down("xs")]: {
      width: "40vw"
    }
  },
  spacing: {
    marginLeft: theme.spacing(1)
  },
  margin: {
    margin: theme.spacing(1)
  },
  addUserCard: {
    marginTop: "50px"
  },
  paginateTopPadding: {
    paddingTop: "50px"
  },
  userCardSideTitle: {
    fontSize: "13px"
  },
  toolTip: {
    fontSize: "13px"
  }
}));

export default function ManageUsers(props: any) {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  let manageUsers: any = null;
  const [users, setUsers] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);

  const limit = 15;

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getUserList({ limit, offset }));
      if (!status.aborted) {
        if (res && res.data) {
          setUsers(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [dispatch, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let userList: any[] = [];
  if (users && users.length) {
    userList = users.map((user: any, idx: number) => {
      return (
        <div key={`usr_${user.id}`} className="w-full md:w-1/2 mt-4 px-2">
          <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black">
            <CardHeader
              className={classes.cardHeader}
              title={
                <span className={classes.title}>
                  <Tooltip
                    title={
                      <span className={classes.toolTip}>{user.username}</span>
                    }
                    interactive={true}
                  >
                    <span>{user.username}</span>
                  </Tooltip>
                </span>
              }
            />
            <CardContent className={classes.content}>
              <Typography>
                <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                  Full Name:{" "}
                </span>
                {`${user.first_name} ${user.last_name}`}
              </Typography>
            </CardContent>
            {user.user_type && (
              <CardContent className={classes.content}>
                <Typography>
                  <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                    Role:{" "}
                  </span>
                  {user.user_type}
                </Typography>
              </CardContent>
            )}
            {user.phone_number && (
              <CardContent className={classes.content}>
                <Typography>
                  <span className={`w3-text-gray ${classes.userCardSideTitle}`}>
                    Contact:{" "}
                  </span>
                  {user.phone_number}
                </Typography>
              </CardContent>
            )}
          </div>
        </div>
      );
    });
  }

  if (isLoading || !users) {
    manageUsers = <Loading />;
  } else if (users && users.length) {
    manageUsers = (
      <>
        {userList}
        {totalCount > limit && (
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
  } else if (users && users.length === 0) {
    manageUsers = (
      <Grid item xs={12} md={12} className="textMarginCenter">
        <h5> No Users Found</h5>
      </Grid>
    );
  }

  return (
    <div>
      <div className="font-semibold text-3xl p-4 mt-4 border-b-4 border-orange-500">
        Users
      </div>

      <div className="flex flex-wrap mt-4">{manageUsers}</div>
    </div>
  );
}
