import careConfig from "@careConfig";
import { Status, Wrapper } from "@googlemaps/react-wrapper";
import { isLatLngLiteral } from "@googlemaps/typescript-guards";
import { PopoverButton } from "@headlessui/react";
import React from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Spinner from "@/components/Common/Spinner";

import { deepEqual } from "@/common/utils";

interface GLocationPickerProps {
  lat: number;
  lng: number;
  handleOnChange: (location: google.maps.LatLng) => void;
  handleOnClose?: () => void;
  handleOnSelectCurrentLocation?: (
    setCenter: (lat: number, lng: number) => void,
  ) => void;
}

const GLocationPicker = ({
  lat,
  lng,
  handleOnChange,
  handleOnClose,
  handleOnSelectCurrentLocation,
}: GLocationPickerProps) => {
  const [location, setLocation] = React.useState<google.maps.LatLng | null>(
    null,
  );
  const [zoom, setZoom] = React.useState(4);
  const [center, setCenter] = React.useState<
    google.maps.LatLngLiteral | undefined
  >({
    lat,
    lng,
  });

  React.useEffect(() => {
    const setLatLng = async () => {
      const latLng = await new google.maps.LatLng(lat, lng);
      setLocation(latLng);
    };

    if (lat && lng)
      setLatLng().catch((err) => {
        if (err instanceof ReferenceError) {
          console.info("Google Maps API not loaded yet");
        }
      });
  }, [lat, lng, window?.google]);

  const onClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) handleOnChange(e.latLng);
  };

  const onIdle = (m: google.maps.Map) => {
    setZoom(m?.getZoom() ?? 0);
    setCenter(m?.getCenter()?.toJSON());
  };

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <Spinner />;
      case Status.SUCCESS:
        return (
          <Map
            center={center}
            onClick={onClick}
            onIdle={onIdle}
            handleOnChange={handleOnChange}
            handleOnClose={handleOnClose}
            handleOnSelectCurrentLocation={handleOnSelectCurrentLocation}
            zoom={zoom}
            style={{ flexGrow: "1", height: "100%" }}
          >
            {location && <Marker position={location} />}
          </Map>
        );
      default:
        return <h1>{status}</h1>;
    }
  };

  return (
    <div className="flex h-80 w-80 flex-col sm:h-96 sm:w-96">
      <Wrapper
        libraries={["places"]}
        apiKey={careConfig.gmapsApiKey}
        render={render}
      ></Wrapper>
    </div>
  );
};
interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  handleOnChange?: (location: google.maps.LatLng) => void;
  handleOnClose?: () => void;
  handleOnSelectCurrentLocation?: (
    setCenter: (lat: number, lng: number) => void,
  ) => void;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({
  onClick,
  onIdle,
  handleOnChange,
  handleOnClose,
  handleOnSelectCurrentLocation,
  children,
  style,
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [map, setMap] = React.useState<google.maps.Map & Partial<unknown>>();
  const mapCloseRef = React.useRef<HTMLDivElement>(null);
  const currentLocationSelectRef = React.useRef<HTMLDivElement>(null);
  const [searchBox, setSearchBox] =
    React.useState<google.maps.places.SearchBox>();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(
        new window.google.maps.Map(ref.current, {
          mapTypeControl: false,
        }),
      );
    }
  }, [ref, map]);

  React.useEffect(() => {
    if (searchRef.current && map && !searchBox) {
      map.controls[google.maps.ControlPosition.TOP_CENTER].push(
        searchRef.current,
      );

      setSearchBox(new window.google.maps.places.SearchBox(searchRef.current));
    }

    if (searchBox) {
      map?.addListener("bounds_changed", () => {
        searchBox.setBounds(map?.getBounds() as google.maps.LatLngBounds);
      });

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();

        if (
          handleOnChange &&
          places &&
          places.length > 0 &&
          places[0].geometry?.location
        ) {
          const selectedLocation = places[0].geometry.location;
          handleOnChange(selectedLocation);
          map?.setCenter(selectedLocation);
        }
      });
    }
  }, [searchRef, map, searchBox, handleOnChange]);

  React.useEffect(() => {
    if (mapCloseRef.current && map) {
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
        mapCloseRef.current,
      );
    }
  }, [mapCloseRef, map]);

  React.useEffect(() => {
    if (currentLocationSelectRef.current && map) {
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(
        currentLocationSelectRef.current,
      );
    }
  }, [currentLocationSelectRef, map]);

  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName),
      );

      if (onClick) {
        map.addListener("click", onClick);
      }

      if (onIdle) {
        map.addListener("idle", () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);

  return (
    <>
      <>
        <input
          id="pac-input"
          ref={searchRef}
          type="text"
          className="cui-input-base peer m-[10px] w-3/5 py-2.5"
          placeholder="Start typing to search"
        />
        {handleOnClose && (
          <PopoverButton>
            <div
              id="map-close"
              className="m-[10px] cursor-pointer rounded bg-white p-2"
              ref={mapCloseRef}
              onClick={handleOnClose}
            >
              <CareIcon
                icon="l-times-circle"
                className="text-2xl text-secondary-800"
              />
            </div>
          </PopoverButton>
        )}
        {handleOnSelectCurrentLocation && (
          <div
            id="current-loaction-select"
            className="m-[10px] cursor-pointer rounded bg-white p-2"
            ref={currentLocationSelectRef}
            onClick={() =>
              handleOnSelectCurrentLocation((lat: number, lng: number) =>
                map?.setCenter(new window.google.maps.LatLng(lat, lng)),
              )
            }
          >
            <CareIcon
              icon="l-user-location"
              className="text-2xl text-secondary-800"
            />
          </div>
        )}
      </>

      <div ref={ref} style={style} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement, { map });
        }
      })}
    </>
  );
};

const Marker: React.FC<google.maps.MarkerOptions> = (options) => {
  const [marker, setMarker] = React.useState<google.maps.Marker>();

  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker());
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker) {
      marker.setOptions(options);
    }
  }, [marker, options]);

  return null;
};

const deepCompareEqualsForMaps = (a: any, b: any) => {
  if (
    isLatLngLiteral(a) ||
    a instanceof google.maps.LatLng ||
    isLatLngLiteral(b) ||
    b instanceof google.maps.LatLng
  ) {
    return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
  }

  return deepEqual(a, b);
};

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[],
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

export default GLocationPicker;
