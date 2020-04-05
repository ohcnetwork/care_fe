import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Typography from "@material-ui/core/Typography";
import React from "react";
import PageTitle from "../Common/PageTitle";
import { DriverDetailsForm, driverForm, initDriverData } from "./DriverDetailsForm";
import { initVehicleData, VehicleDetailsForm, vehicleForm } from "./VehicleDetailsForm";

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      style={{ color: "white" }}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

const a11yProps = (index: any) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  };
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  },
  marginBottom10: {
    marginBottom: "10px"
  },
  formBottomPadding: {
    paddingBottom: "10px"
  },
  tabSection: {
    color: "black",
    background: "white"
  },
  cardContent: {
    marginTop: "-20px"
  },
  checkBoxLabel: {
    marginLeft: "8px"
  },
  dateField: {
    marginTop: "8px"
  },
  selectField: {
    marginBottom: "10px"
  },
  selectLabel: {
    color: "black",
    padding: "10px 0px"
  }
}));

export default function AmbulanceOnboarding() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const [vehicleObj, setVehicleObj] = React.useState<vehicleForm>(
    initVehicleData
  );
  const [driverObj, setDriverObj] = React.useState<driverForm>(initDriverData);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    // prevent navigating to driver details without entering vehicle details
    if (newValue === 1 && !vehicleObj.isValid) {
      return;
    }
    setValue(newValue);
  };

  const updateVehicleObj = (form: vehicleForm) => {
    setVehicleObj(form);
    if (form.isValid) {
      setValue(1);
    }
  };

  const updateDriverObj = (form: driverForm) => {
    setDriverObj(form);
  };

  return (
    <div className="max-w-3xl mx-auto">
    <PageTitle title="Ambulance Registration" />

      <AppBar position="static">
        <Tabs
          value={value}
          className={classes.tabSection}
          style={{ color: "black" }}
          variant="fullWidth"
          onChange={handleChange}
        >
          <Tab label="Vehicle Details" {...a11yProps(0)} />
          <Tab label="Driver Details" {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <VehicleDetailsForm
          classes={classes}
          vehicleDetails={vehicleObj}
          setVehicleObj={updateVehicleObj}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <DriverDetailsForm
          classes={classes}
          vehicleInfo={vehicleObj}
          driverInfo={driverObj}
          setDriverObj={updateDriverObj}
        />
      </TabPanel>
    </div>
  );
}
