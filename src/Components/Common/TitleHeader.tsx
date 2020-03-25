import React from 'react';
import { Grid, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    propsChildren: {
        marginBottom: '10px',
    }
});

interface TitleHeaderProps {
    title: string;
    showSearch: boolean;
    children: JSX.Element[] | JSX.Element;
};
const TitleHeader = (props: TitleHeaderProps) => {
    const { title, showSearch } = props;
    const classes = useStyles();

    return (
        <Box bgcolor="#EEEEEE" style={{ paddingLeft: '10px', marginTop:'15px' }}>
            <Grid container spacing={2} className={classes.propsChildren} alignItems="center">
                <Grid item xs={showSearch ? 12 : 6} sm={4} md={4}>
                    {title && <Typography gutterBottom variant="h6" component="h5">
                        {title}
                    </Typography>}
                </Grid>
                <Grid item xs={showSearch ? 12 : 6} md={8} sm={8} container>
                    <Grid item xs container justify="flex-end" alignItems="center" spacing={2}>
                        {props.children}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    )
};

export default TitleHeader;