import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
    root: {
      minWidth: 200,
      width: 300,
      margin: "auto",
      transition: "0.3s",
      boxShadow: "0 8px 40px -12px rgba(0,0,0,0.3)",
     "&:hover": {
        boxShadow: "0 16px 70px -12.125px rgba(0,0,0,0.3)",
     },
    },
    title: {
      fontSize: 14,
    },
    pos: {
      marginBottom: 12,
    },
  });

export const HospitalView = (props:any) => {
    const classes = useStyles();
    return (
        <Card className={classes.root} variant="outlined">
          <CardContent>
            <Typography variant="h5" component="h2">
              {props.name}
            </Typography>
            <Typography variant="body2" component="p">
              Address: {props.addr}
              <br />
              Phone: {props.phone}
              <br />
              District: {props.district}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" variant="contained" color="primary">View</Button>
          </CardActions>
        </Card>
      )
}
