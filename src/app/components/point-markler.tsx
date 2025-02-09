"use client";

import L from "leaflet";
import { Marker, MarkerProps } from "react-leaflet";
import { Marker as LeafletMarker } from 'leaflet';
export const PointMarker: React.ComponentType<
  MarkerProps & React.RefAttributes<LeafletMarker<any>>
> = (props) => {
  return (
    <Marker
      {...props}
      icon={
        new L.Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      }
    />
  );
};
