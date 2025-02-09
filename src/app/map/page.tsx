"use client"

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, TagIcon, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
import { Merchant } from '@/server/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from "@/lib/client";
import dynamic from "next/dynamic"
import { getDistanceFromLatLonInMeters } from '@/lib/utils';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const LocationMarker = dynamic(() => import('../components/map-marker').then((mod) => mod.LocationMarker), { ssr: false });
const PointMarker = dynamic(() => import('../components/point-markler').then((mod) => mod.PointMarker), { ssr: false });

// Create a custom icon for current location once on the client
let currentLocationIcon: any = null;
if (typeof window !== "undefined") {
  // Import Leaflet only for browser runtime
  const L = require("leaflet");
  currentLocationIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="width: 100%; height: 100%; background: blue; border-radius: 50%;"></div>
        <div id="cone" style="
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 10px solid blue;
        "></div>
      </div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default function Map() {
  const [point, setPoint] = useState<[number, number]>([-8.6976, 115.1762]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ position: [number, number], merchants: Merchant[] }>>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showCard, setShowCard] = useState(true);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const queryClient = useQueryClient();
  // Reference to hold the current point so our watchPosition callback always has the latest value
  const currentPointRef = useRef(point);
  useEffect(() => {
    currentPointRef.current = point;
  }, [point]);
  // Ref for debouncing updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: nearbyMerchants, isPending: isLoadingMerchants, isError: isErrorMerchants, refetch: refetchMerchants, error: nearbyMerchantError } = useQuery({
    queryKey: ["get-nearby-merchant"],
    queryFn: async () => {
      const res = await client.merchant.near.$get({
        latitude: point[0],
        longitude: point[1],
      });
      const jsonRes =  await res.json();

      return jsonRes.data;
    },
  });

  useEffect(() => {
    if (nearbyMerchants) {
      setMerchants([
        ...merchants,
        ...nearbyMerchants.filter((merchant) => !merchants.some((m) => m.registrationId === merchant.registrationId)),
      ]);
      setSearchHistory((prevHistory) => [
        ...prevHistory,
        { position: point, merchants: nearbyMerchants },
      ]);
    }
  }, [nearbyMerchants]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["get-nearby-merchant"] });
  }, [point]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPoint([lat, lng]);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setShowLocationDialog(true);
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          // Update only if moved more than 5 meters from our last saved position
          if (
            !currentPointRef.current ||
            getDistanceFromLatLonInMeters(
              currentPointRef.current[0],
              currentPointRef.current[1],
              newPosition[0],
              newPosition[1]
            ) > 5
          ) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              setPoint(newPosition);
            }, 1000); // Debounce delay 1 second
          }
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }
  }, []);

  // Function to request user location using Geolocation API
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setShowLocationDialog(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint([position.coords.latitude, position.coords.longitude]);
        setShowLocationDialog(false);
      },
      (error) => {
        alert("Unable to retrieve your location.");
        setShowLocationDialog(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">LPG Merchant Locator</h1>
          </div>
          {isLoadingMerchants && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-4 rounded-lg shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          {isErrorMerchants && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{nearbyMerchantError?.message}</p>
            </div>
          )}
          <div className="h-[600px] rounded-lg overflow-hidden relative z-10">
            {/* Modal for requesting location access */}
            {showLocationDialog && !isLoadingMerchants && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-sm mx-auto">
                  <h2 className="text-xl font-bold mb-4">Location Permission</h2>
                  <p className="mb-4">Allow this app to access your current location?</p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowLocationDialog(false)}
                      className="px-4 py-2 bg-gray-300 rounded"
                    >
                      Deny
                    </button>
                    <button
                      onClick={handleRequestLocation}
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      Allow
                    </button>
                  </div>
                </div>
              </div>
            )}
            <MapContainer
              center={point}
              zoom={13}
              className="z-10"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker onLocationSelect={handleLocationSelect} />
              {merchants.map((merchant) => (
                <Marker
                  key={merchant.registrationId}
                  position={[merchant.location.latitude, merchant.location.longitude]}
                  eventHandlers={{
                    click: () => {
                      setSelectedMerchant(merchant);
                      setShowCard(true);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-lg">{merchant.merchantName}</h3>
                      <p className="text-gray-600">{merchant.address}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Distance: {(merchant.distance * 1000).toFixed(0)}m
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {searchHistory.map((search, index) => (
                  search.position !== point ? (
                    <PointMarker
                    key={`search-${index}`}
                    position={search.position}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold">Search Location #{index + 1}</h3>
                        <p className="text-sm text-gray-500">
                          Found {search.merchants.length} merchants
                        </p>
                      </div>
                    </Popup>
                  </PointMarker>
                  ) : (
                    (
                      <Marker
                        key={`search-${index}`}
                        position={point}
                        icon={currentLocationIcon}
                      />
                    )
                  )
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4">All Found Merchants ({merchants.length})</h2>
          <div className="space-y-4">
            {merchants.map((merchant) => (
              <div
                key={merchant.registrationId}
                className="border-b last:border-b-0 pb-4 last:pb-0 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedMerchant(merchant);
                  setShowCard(true);
                }}
              >
                <h3 className="font-bold">{merchant.merchantName}</h3>
                <p className="text-gray-600">{merchant.address}</p>
                <p className="text-sm text-gray-500">
                  Distance: {(merchant.distance * 1000).toFixed(0)}m
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Merchant Card */}
      {showCard && selectedMerchant && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 transition-transform duration-300 transform translate-y-0">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedMerchant.merchantName}</h3>
                <p className="text-gray-600 mt-1">{selectedMerchant.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="text-blue-500 w-4 h-4" />
                  <p className="text-sm text-gray-500">
                    {(selectedMerchant.distance * 1000).toFixed(0)}m away
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCard(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
