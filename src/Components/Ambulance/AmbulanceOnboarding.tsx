import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {VehicleDetailsForm} from "./VehicleDetailsForm";
import {DriverDetailsForm} from "./DriverDetailsForm";
import {Grid} from "@material-ui/core";

interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            style={{color: 'white'}}
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </Typography>
    );
}

function a11yProps(index: any) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
}));

export default function AmbulanceOnboarding() {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setValue(newValue);
    };

    return (

        <div className={classes.root} style={{marginTop: '60px'}}>
            <Grid container spacing={2} alignContent="center" justify="center">
                <Grid item xs={12} sm={5} md={4} lg={3}>
            <AppBar position="relative">
                <Tabs value={value} style={{color: 'black'}} onChange={handleChange} >
                    <Tab label="Vehicle Details" {...a11yProps(0)} />
                    <Tab label="Driver Details" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
                <VehicleDetailsForm/>
            </TabPanel>
            <TabPanel value={value} index={1}>
               <DriverDetailsForm/>
            </TabPanel>
                </Grid></Grid>
        </div>


    );
}
