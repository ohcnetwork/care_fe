import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import {VehicleDetailsForm} from "./VehicleDetailsForm";
import {DriverDetailsForm} from "./DriverDetailsForm";

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
            <AppBar position="static">
                <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                    <Tab label="Vehicle Details" {...a11yProps(0)} />
                    <Tab label="Driver Details" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
                <VehicleDetailsForm/>
            </TabPanel>
            <TabPanel value={value} index={1}>
               <DriverDetailsForm/>z
            </TabPanel>
        </div>
    );
}
