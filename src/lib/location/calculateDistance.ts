import type { LocationData } from "@/types/location";

export const calculateDistance = (
    location1: LocationData,
    location2: LocationData
): number => {
    const R = 6371000; // 地球の半径（m）

    // 度数法からラジアンに変換
    const toRadians = (degree: number) => {
        return (degree * Math.PI) / 180;
    };

    const lat1 = toRadians(location1.latitude);
    const lat2 = toRadians(location2.latitude);

    const latDiff = toRadians(
        location2.latitude - location1.latitude
    );

    const lonDiff = toRadians(
        location2.longitude - location1.longitude
    );

    // Haversine公式
    const a =
        Math.sin(latDiff / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(lonDiff / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
};