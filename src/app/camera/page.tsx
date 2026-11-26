"use client";
import { useState } from "react";
import Camera from "@/components/Camera/page";
import PhotoSave from "@/components/PhotoSave/page";

export default function CameraPage() {
    const [photo, setPhoto] = useState<string | null>(null);
    const handlePhotoTaken = (imageData: string,
    ) => {
        setPhoto(
            imageData
        );
    };

    return (
        <main>
            <Camera
                onPhotoTaken={handlePhotoTaken}
                onRetake={() => setPhoto(null)}
            />
            {photo && (
                <PhotoSave
                    photo={
                        photo
                    }
                />
            )}
        </main>
    );
}