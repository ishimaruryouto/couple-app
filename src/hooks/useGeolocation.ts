"use client";

import { useState } from "react";
import type { LocationData } from "@/types/location";

export const useGeolocation = () => {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string>("");

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("このブラウザは位置情報に対応していません");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });

                setError("");
            },
            (error) => {
                setError("位置情報を取得できませんでした");
                console.error(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return {
        location,
        error,
        getLocation,
    };
};