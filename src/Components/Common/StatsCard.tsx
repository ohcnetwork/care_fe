import React from 'react';
import { Grid } from '@material-ui/core';

interface StatsCardProps {
    title: string;
    children: JSX.Element[] | JSX.Element
}
const StatsCard = (props: StatsCardProps) => {
    const { title } = props;
    return (
        <Grid xs={12} md={4} item className="card-padding">
            <div className="notification-card">
                <div className="notification-head">
                    <h5>{title}</h5>
                </div>
                {props.children}
            </div>
        </Grid>
    )
};

export default StatsCard;