import React, { useState, useEffect } from "react";
import LocationPicker from "react-leaflet-location-picker";
import Popover from '@material-ui/core/Popover';
import axios from 'axios';
import { makeStyles } from "@material-ui/styles";
import { TextInputField } from "../Common/HelperInputFields"

const DEFAULT_MARKER_RADIUS = 100;
const KEYS = {
    "ENTER_KEY": 13
}

const useStyles = makeStyles(theme => ({
    locationItem: {
        border: "1px solid #C4C4CD",
        cursor: "pointer",
    },
    locationResults: {
        width: '300px',
        height: '100px'
    },
    placeholder: {
        paddingTop: '15%',
        paddingLeft: '25%',
    }
}));

interface LocationSearchAndPickProps {
    latitude: number,
    longitude: number,
    onSelectLocation: (location: any) => void,
}

export const LocationSearchAndPick = (props: LocationSearchAndPickProps) => {
    const classes = useStyles();
    const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
    const [locationSearchValue, setLocationSearchValue] = useState<string>('');
    const [searchResultAnchorEl, setSearchResultAnchorEl] = React.useState<EventTarget & Element | null>(null);
    const [isLocationSearchInProgress, setIsLocationSearchInProgress] = useState(false);
    const [latitude, setLatitude] = useState<number>(props.latitude);
    const [longitude, setLongitude] = useState<number>(props.longitude);

    useEffect(() => {
        setLatitude(props.latitude);
        setLongitude(props.longitude)
    }, [props.latitude, props.longitude])

    const geocode = async (address: string) => {
        const endpoint: string = 'https://nominatim.openstreetmap.org/search';
        await axios.get(`${endpoint}?format=json&q=${address}`)
            .then((res: any) => {
                setLocationSearchResults(res.data);
                setIsLocationSearchInProgress(false);
            });
    }

    const handleLocSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.keyCode === KEYS.ENTER_KEY) {
            setIsLocationSearchInProgress(true);
            setSearchResultAnchorEl(event.currentTarget);
            geocode(locationSearchValue);
            event.stopPropagation();
        }
    }

    const handleLocationSelect = (location: any) => {
        setSearchResultAnchorEl(null);
        props.onSelectLocation(location);
    }

    const renderLocationResults = () => {
        const locResultListOpen = Boolean(searchResultAnchorEl);
        const searchResultPopoverId = 'search-result-popover';
        return (<Popover
            id={searchResultPopoverId}
            open={locResultListOpen}
            anchorEl={searchResultAnchorEl}
            onClose={() => setSearchResultAnchorEl(null)}
            anchorOrigin={{
                horizontal: 'center',
                vertical: 'bottom',
            }}
            transformOrigin={{
                horizontal: 'center',
                vertical: 'top',
            }}
            style={{ position: 'absolute' }}
        >
            <div className={classes.locationResults}>
                {isLocationSearchInProgress ? <div className={classes.placeholder}>Loading...</div> :
                    locationSearchResults.length === 0 ? <div className={classes.placeholder}>No Results </div> :
                        locationSearchResults.map((location: any, index: number) => (
                            <div className={classes.locationItem}
                                onClick={() => handleLocationSelect(location)}
                                key={index}>
                                {location.display_name}
                            </div>
                        ))
                }
            </div>
        </Popover>);
    }

    const circleMode = {
        banner: false,
        control: {
            onClick: (point: number[]) => {
                props.onSelectLocation({ lat: point[0], lon: point[1] });
            },
            values: [{ center: [latitude, longitude], radius: DEFAULT_MARKER_RADIUS }],
        }
    };

    return (<div key={`${latitude}_${longitude}`}><TextInputField
        value={locationSearchValue}
        variant="outlined"
        errors=''
        onChange={(e: any) => { setLocationSearchValue(e.target.value); }}
        onKeyDown={handleLocSearchKeyDown}
        placeholder={"Search Locations..."}
    />
        {renderLocationResults()}
        <LocationPicker
            showInputs={false}
            mapStyle={{ width: 300, height: 300 }}
            circleMode={circleMode}
            bindMap={false}
            startPort={{
                center: [latitude, longitude],
                zoom: 12,
            }}

        /></div>)
}
