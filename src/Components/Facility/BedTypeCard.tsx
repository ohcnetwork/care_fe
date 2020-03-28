import React from 'react';
import { Grid, Typography, Button } from "@material-ui/core";
import { makeStyles } from '@material-ui/styles';
import { CapacityModal } from './models';
import { navigate } from 'hookrouter';
import { BED_TYPES } from './constants';

interface BedTypeProps extends CapacityModal {
    facilityId: number;
}

const useStyles = makeStyles({
    marginBottom: {
        marginBottom: 5
    },
    countText: {
        fontSize: '2.25rem'
    }
});

const BedTypeCard = (props: BedTypeProps) => {
    const classes = useStyles();
    const bed = BED_TYPES.find(i => i.id === props.room_type);
    const roomType = bed ? bed.text : "Unknown";
    return (
        <Grid item xs={12} md={6}>
            <div className="w3-card" >
                <header className="w3-container">
                    <h3>{roomType}</h3>
                </header>
                <div className={`w3-container ${classes.marginBottom}`}>
                    <Grid container direction="column" justify="center" alignItems="center" spacing={1}>
                        <Grid item>
                            <Typography className={classes.countText}>
                                {props.current_capacity}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Typography className="w3-text-grey">
                                Currently Occupied
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Button variant="outlined"
                                onClick={() => navigate(`/facility/${props.facilityId}/bed/${props.room_type}`)}>
                                Edit
                            </Button>
                        </Grid>
                    </Grid>
                </div>
                <footer className="w3-container w3-black">
                    <div className="w3-center">
                        <h6>Total Capacity: {props.total_capacity} </h6>
                    </div>
                </footer>
            </div>
        </Grid>
    );
};

export default BedTypeCard;