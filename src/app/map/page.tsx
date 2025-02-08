"use client"

import React, { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
import { Merchant } from '@/server/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from "@/lib/client";
import dynamic from "next/dynamic"

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const LocationMarker = dynamic(() => import('../components/map-marker').then((mod) => mod.LocationMarker), { ssr: false });


export default function Map() {
  const [point, setPoint] = useState<[number, number]>([-8.6976, 115.1762]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ position: [number, number], merchants: Merchant[] }>>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showCard, setShowCard] = useState(true);

  const queryClient = useQueryClient();

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
          <div className="h-[600px] rounded-lg overflow-hidden relative">
            <MapContainer
              center={point}
              zoom={13}
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
                <Marker
                  key={`search-${index}`}
                  position={search.position}
                  // icon={new L.Icon({
                  //   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  //   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  //   iconSize: [25, 41],
                  //   iconAnchor: [12, 41],
                  //   popupAnchor: [1, -34],
                  //   shadowSize: [41, 41]
                  // })}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">Search Location #{index + 1}</h3>
                      <p className="text-sm text-gray-500">
                        Found {search.merchants.length} merchants
                      </p>
                    </div>
                  </Popup>
                </Marker>
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
