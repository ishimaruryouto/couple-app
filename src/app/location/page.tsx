"use client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance } from "@/lib/location/calculateDistance";
import { LOCATION_CONFIG } from "@/lib/location/locationConfig";
import type { LocationData } from "@/types/location";

export default function LocationPage() {
    const { location, error, getLocation } = useGeolocation();

    // テスト用：相手の仮の位置情報
    const partnerLocation: LocationData = {
        latitude: 34.7024,
        longitude: 135.4959,
        accuracy: 20,
    };

    // 2人の距離を計算
    const distance = location
        ? calculateDistance(location, partnerLocation)
        : null;

    // カメラを使用できるか判定
    const canUseCamera =
        distance !== null &&
        distance <= LOCATION_CONFIG.CAMERA_DISTANCE_LIMIT;

    return (
        <div>
            <h1>位置情報取得テスト</h1>

            <button onClick={getLocation}>
                現在地を取得
            </button>

            {location && (
                <div>
                    <h2>自分の位置情報</h2>

                    <p>緯度：{location.latitude}</p>
                    <p>経度：{location.longitude}</p>
                    <p>精度：{location.accuracy}m</p>
                </div>
            )}

            {distance !== null && (
                <div>
                    <h2>2人の距離</h2>

                    <p>{distance.toFixed(2)}m</p>

                    <h2>カメラの使用状態</h2>

                    <p>
                        {canUseCamera
                            ? "✅ カメラ使用可能"
                            : "❌ カメラ使用不可"}
                    </p>
                </div>
            )}

            {error && <p>{error}</p>}
        </div>
    );
}