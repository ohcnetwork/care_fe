import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import CardContent from '@material-ui/core/CardContent';

const useStyles = makeStyles(theme => ({
    card: {
        height: 90,
        width: 300,
    },
    valueField:{
        color: blue['500'],
        fontWeight:'bold'
    }
}));
interface Props {
    title: string;
    value: string | number;
}
export const StatsCard: React.FC<Props> = (props) => {
    const classes = useStyles();
    return (
        <Card className={classes.card}>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    {props.title}
                </Typography>
                <Typography className={classes.valueField} variant="h6" gutterBottom>
                    {props.value}
                </Typography>
            </CardContent>
        </Card>
    );
}
