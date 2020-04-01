import {
  AppBar,
  Button,
  Drawer,
  Grid,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/styles';
import { navigate, usePath, A } from 'hookrouter';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DonutLargeIcon from '@material-ui/icons/DonutLarge';
import DashboardIcon from '@material-ui/icons/Dashboard';
import { get } from 'lodash';
import PersonIcon from '@material-ui/icons/Person';
import InboxIcon from '@material-ui/icons/Inbox';
import ListAltIcon from '@material-ui/icons/ListAlt';
import SettingsIcon from '@material-ui/icons/Settings';
import WorkIcon from '@material-ui/icons/Work';
import TimeToLeaveIcon from '@material-ui/icons/TimeToLeave';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
const img = 'https://care-staging-coronasafe.s3.amazonaws.com/static/images/logos/black-logo.svg';
const drawerWidth = 240;
const useStyles = makeStyles({
  flexGrow: {
    flexGrow: 1
  },
  rightAlign: {
    float: 'right'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  noDecoration:{
    textDecoration:'none'
  }
});
const Header = () => {
  const classes = useStyles();
  const dispatch: any = useDispatch();
  const state: any = useSelector(state => state);
  const { currentUser } = state;
  const [drawer, setDrawer] = useState(false);
  const path = usePath();
  const url = path.split('/');
  const toggleDrawer = () => {
    setDrawer(!drawer);
  };


  let menus = [
    {
      title: 'Facilities',
      link: '/facility',
      icon: <DashboardIcon style={{ color: '#666', marginRight: '4px' }}/>
    },
    // {
    //   title: 'Patients',
    //   link: '/patients',
    //   icon: <InboxIcon style={{color: '#666', marginRight: '4px'}}/>
    // },
    {
      title: 'Ambulances',
      link: '/ambulancelist',
      icon: <TimeToLeaveIcon style={{color: '#666', marginRight: '4px'}}/>
    },
    {
      title: 'Sample Test',
      link: '/samplelist',
      icon: <LocalHospitalIcon style={{color: '#666', marginRight: '4px'}}/>
    },
    {
      title: 'Users',
      link: '/users',
      icon: <PersonIcon style={{color: '#666', marginRight: '4px'}}/>
    }
  ];
  const loginUser = `${get(currentUser, 'data.first_name', '')} ${get(currentUser, 'data.last_name', '')}`;
  const sideBar = (
      <div className="toolbar" style={{position:'relative'}}>
        <List>
          {menus.map((item) => {
            const parts = item.link.split('/');
            return <ListItem
                button
                key={item.title}
                onClick={() => navigate(item.link)}
                selected={url.includes(parts && parts[1])}
            >
              {item.icon}
              <ListItemText style={{ marginLeft: '4px' }} primary={item.title}/>
            </ListItem>;
          })}
        </List>
      </div>
  );
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const headerSection = () => {
    return (
        <AppBar position="fixed" className={`appBar`}>
          <Toolbar style={{color: 'black'}}>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer}
                className="menuButton"
            >
              <MenuIcon/>
            </IconButton>
            <Typography variant="h6">
            <A href='/'> <img src={img} alt="care logo"style={{ height: '25px' }}/></A>
            </Typography>
            <div className={classes.flexGrow}>

              <Button className={classes.rightAlign} color="inherit" aria-haspopup="true" onClick={handleClick}
                      endIcon={<ArrowDropDownIcon style={{ fontSize: '25px' }}/>}>
                {loginUser}
              </Button>
              <Menu

                  elevation={0}
                  getContentAnchorEl={null}
                  anchorEl={anchorEl}
                  keepMounted
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                  }}

                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    style: {
                      maxHeight: 190
                    }
                  }}
              >
                <MenuItem onClick={() => {
                  localStorage.removeItem('care_access_token');
                  localStorage.removeItem('care_refresh_token');
                  navigate('/login');
                  window.location.reload();
                }}>Logout</MenuItem>
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
    );
  };

  return (
      <div className="header-section">
        {headerSection()}
        <Hidden smUp implementation="css">
          <Drawer
              className={classes.drawer}
              variant="temporary"
              classes={{
                paper: classes.drawerPaper
              }}
              open={drawer}
              onClose={toggleDrawer}
              ModalProps={{
                keepMounted: true // Better open performance on mobile.
              }}
          >
            {sideBar}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
              open
              variant="permanent"
              className={classes.drawer}
              classes={{
                paper: classes.drawerPaper
              }}
          >
            {sideBar}
          </Drawer>
        </Hidden>
      </div>
  );
};

export default Header;
