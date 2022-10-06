import React from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { createCustomEqual } from "fast-equals";
import { isLatLngLiteral } from "@googlemaps/typescript-guards";

import { GMAPS_API_KEY } from "../../Common/env";
import Spinner from "./Spinner";

const render = (status: Status) => {
  if (status === "LOADING") {
    return <Spinner />;
  }

  return <h1>{status}</h1>;
};

interface GLocationPickerProps {
  lat: number;
  lng: number;
  handleOnChange: (location: google.maps.LatLng) => void;
}

const GLocationPicker = ({
  lat,
  lng,
  handleOnChange,
}: GLocationPickerProps) => {
  const [location, setLocation] = React.useState<google.maps.LatLng | null>(
    null
  );
  const [zoom, setZoom] = React.useState(4);
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral>({
    lat,
    lng,
  });

  React.useEffect(() => {
    const setLatLng = async () => {
      const latLng = await new google.maps.LatLng(lat, lng);
      setLocation(latLng);
    };

    if (lat && lng) setLatLng();
  }, [lat, lng]);

  const onClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) handleOnChange(e.latLng);
  };

  const onIdle = (m: google.maps.Map) => {
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());
  };

  return (
    <div className="flex w-96 h-96">
      <Wrapper libraries={["places"]} apiKey={GMAPS_API_KEY} render={render}>
        <Map
          center={center}
          onClick={onClick}
          onIdle={onIdle}
          handleOnChange={handleOnChange}
          zoom={zoom}
          style={{ flexGrow: "1", height: "100%" }}
        >
          {location && <Marker position={location} />}
        </Map>
      </Wrapper>
    </div>
  );
};
interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  handleOnChange?: (location: google.maps.LatLng) => void;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({
  onClick,
  onIdle,
  handleOnChange,
  children,
  style,
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();
  const [searchBox, setSearchBox] =
    React.useState<google.maps.places.SearchBox>();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(
        new window.google.maps.Map(ref.current, { mapTypeControl: false })
      );
    }
  }, [ref, map]);

  React.useEffect(() => {
    if (searchRef.current && !searchBox) {
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
          handleOnChange(places[0].geometry.location);
        }
      });
    }
  }, [searchRef, map, searchBox, handleOnChange]);

  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
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
      <div ref={ref} style={style} />
      <input
        id="pac-input"
        ref={searchRef}
        type="text"
        className="absolute top-2 left-2 p-2 rounded"
        placeholder="Start typing to search"
      />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { map });
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

const deepCompareEqualsForMaps = createCustomEqual(
  // @ts-ignore
  (deepEqual) => (a: any, b: any) => {
    if (
      isLatLngLiteral(a) ||
      a instanceof google.maps.LatLng ||
      isLatLngLiteral(b) ||
      b instanceof google.maps.LatLng
    ) {
      return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
    }

    // @ts-ignore
    return deepEqual(a, b);
  }
);

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

export default GLocationPicker;
