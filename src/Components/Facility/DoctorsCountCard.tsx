import React from 'react';
import { Grid, Typography, Button } from "@material-ui/core";
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    countText:{
        fontSize: '2.25rem'
    }
});

const DoctorsCountCard = (props: any) => {
    const { data } = props;
    const classes = useStyles();
    return (
        <Grid item xs={12} md={6}>
            <div className="w3-card" >
                <div className="w3-padding">
                    <Grid container direction="column" justify="center" alignItems="center" spacing={1}>
                        <Grid item>
                            <Typography className={classes.countText}>
                                11
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography className="w3-text-grey">
                                General Medicine Doctors
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button variant="outlined">
                                Edit
                            </Button>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </Grid>
    );
};

export default DoctorsCountCard;