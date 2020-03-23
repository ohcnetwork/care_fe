import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import PhoneIcon from '@material-ui/icons/Phone';
import LocationCityIcon from '@material-ui/icons/LocationCity';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
const useStyles = makeStyles({
    root: {
      minWidth: 200,
      width: 350,
      backgroundImage: "linear-gradient(to right top, #0a3ded, #0053f5, #0066fa, #0078fd, #0088ff, #0099ff, #00a9ff, #00b8ff, #00cbff, #00dcff, #25ecf9, #5ffbf1)",
      margin: "auto",
      border: "5px",
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
              <LocalHospitalIcon /> <b>{props.name}</b>
            </Typography>
            <br />
            <Typography variant="body2" component="p">
              <LocationOnIcon fontSize="small"/>  <b>Address:</b> {props.addr}
              <br />
              <PhoneIcon fontSize="small"/>  <b>Phone:</b> {props.phone}
              <br />
              <LocationCityIcon fontSize="small"/>  <b>District:</b> {props.district}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" variant="contained" color="primary">View</Button>
          </CardActions>
        </Card>
      )
}
