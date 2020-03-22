import React from 'react';
import { navigate } from 'hookrouter';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Typography
} from '@material-ui/core';
import '../../App.css';
import Brightness1Icon from '@material-ui/icons/Brightness1';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
    },
    listItemContainer: {
        width: 100
    },
    activeBorder: {
        borderBottomColor: '#FFFFFF',
        borderBottomWidth: 4,
        borderBottomStyle: 'solid'
    },
    inActiveBorder: {
        borderBottomColor: '#005D79',
        borderBottomWidth: 4,
        borderBottomStyle: 'solid',
    },
    itemContainer: {
        padding: 0
    },
    listItemText: {
        color: '#FFFFFF',
        fontWeight: 600,
        fontSize: 12,
        lineHeight: 2,
        letterSpacing: 0.4
    },
    activeItemIcon: {
        height: 15,
        width: 15,
        color: '#FFFFFF',
        cursor:'pointer'
    },
    inActiveItemIcon: {
        height: 15,
        width: 15,
        color: '#005D79'
    },
    listIconContainer: {
        top: -5,
        right: 5, 
        bottom: 25,
        position: 'absolute',
        justifyContent: 'flexEnd',
        width: 100,
        orderTopStyle: 'solid',
        borderTopWidth: 1,
    },
    lastListIconContainer: {
        top: -7,
        right: 7,
        bottom: 25,
        position: 'absolute',
        justifyContent: 'flexEnd',
        width: 100,
        orderTopStyle: 'solid',
        borderTopWidth: 1,
    },
    listItemTextContainer: {
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        width: 100,
        right: 45,
        paddingTop: 10
    },
    listGridContent: {
        flex: 1,
        position: 'relative'
    }
}));

export default function FarmerDetailStepper(props: any) {
    const classes = useStyles();
    const { labels, activeStateCount } = props;
    let stepCount = 0;
    return (
      <Grid container justify="center">
        <List className={classes.root}>
            {labels.map((item: any, index: any) => {
                stepCount++;
                const isActiveIcon = index < activeStateCount;
                const isActiveBorder = index < (activeStateCount -1);
                const notLastItem = labels.length !== stepCount;
                return (
                  <ListItem className={classes.itemContainer}>
                      <Grid className={classes.listItemContainer}>
                          <Grid className={classes.listGridContent}>
                            {notLastItem &&
                                <Grid className={isActiveBorder ? classes.activeBorder : classes.inActiveBorder} />
                            }
                            <ListItemIcon className={notLastItem ? classes.listIconContainer : classes.lastListIconContainer}
                                    onClick={() => { isActiveIcon && navigate(item.link) }}
                            >
                                <Brightness1Icon className={isActiveIcon ? classes.activeItemIcon : classes.inActiveItemIcon} />
                            </ListItemIcon>
                          </Grid>
                          <Grid className={classes.listItemTextContainer}>
                              <Typography className={classes.listItemText}>{item.name}</Typography>
                          </Grid>
                      </Grid>
                  </ListItem>
                );
            })}
        </List>
      </Grid>
  );
}