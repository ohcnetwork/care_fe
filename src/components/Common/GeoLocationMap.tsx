import { Map, Marker, ZoomControl } from "pigeon-maps";

interface GeoLocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function GeoLocationMap({
  latitude,
  longitude,
  onLocationSelect,
}: GeoLocationMapProps) {
  return (
    <Map
      height={400}
      center={latitude && longitude ? [latitude, longitude] : undefined}
      defaultZoom={16}
      onClick={({ latLng: [lat, lng] }) => onLocationSelect(lat, lng)}
    >
      <ZoomControl />
      {latitude && longitude && (
        <Marker width={40} anchor={[latitude, longitude]} />
      )}
    </Map>
  );
}
