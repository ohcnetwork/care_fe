import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            flexBasis: '33.33%',
            flexShrink: 0,
        },
        secondaryHeading: {
            fontSize: theme.typography.pxToRem(15),
            color: theme.palette.text.secondary,
        },
    }),
);

export default function UserProfile() {
    const classes = useStyles();

    const [expanded, setExpanded] = React.useState<string | false>(false);


    const handleChange = (panel: string) =>
        (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <div className={classes.root}>
            <ExpansionPanel expanded={expanded === 'gSetting'} onChange={handleChange('gSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="gSetting-content"
                    id="gSetting-header"
                >
                    <Typography className={classes.heading}>User Profile</Typography>
                    <Typography className={classes.secondaryHeading}>Personal Settings</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                       User Personal Settings
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'aSetting'} onChange={handleChange('aSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="aSetting-content"
                    id="aSetting-header"
                >
                    <Typography className={classes.heading}>Advanced settings</Typography>
                    <Typography className={classes.secondaryHeading}>
                      Password , Contact Number etc..
                    </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                        Email and Other info
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'sSetting'} onChange={handleChange('sSetting')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="sSetting-content"
                    id="sSetting-header"
                >
                    <Typography className={classes.heading}>Personal data</Typography>
                    <Typography className={classes.secondaryHeading}>Non Changeable</Typography>

                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <Typography>
                        Non Editable Settings. (Contact Admin to Change these)
                    </Typography>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </div>
    );
}