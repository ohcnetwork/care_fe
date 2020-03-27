import React from 'react';
import { Box, Card, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

interface AddCardProps {
    title: string;
    onClick: any
}

const useStyles = makeStyles(theme => ({
    card: {
        background: '#ffffff',
        border: 'dashed 1px #333',
        cursor: 'pointer',
        minHeight: '120px',
        lineHeight: '120px',
    },
    addPaper: {
        padding: '25px',
        height: 160,
        background: '#FFFFFF',
    },
    box: {
        height:120
    }
}));


const AddCard = (props: AddCardProps) => {
    const { title, onClick } = props;
    const classes = useStyles();
    return (
        <Grid item xs={12} md={6} lg={4} xl={3} style={{ padding: '8px' }}>
            <Card className={`${classes.card} ${classes.addPaper}`} onClick={() => onClick()}>
                <Box className={classes.box} display="flex" justifyContent="center" alignItems="center">
                    <Typography>
                        {title}
                    </Typography>
                </Box>
            </Card>
        </Grid>
    )
};

export default AddCard;