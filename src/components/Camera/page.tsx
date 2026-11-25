"use client";
import { useEffect, useRef, useState, } from "react";
import Image from "next/image";
import styles from "./page.module.css";

type CameraCaptureProps = {
    onPhotoTaken: (
        photo: string,
        width: number,
        height: number
    ) => void;
};

export default function Camera({ onPhotoTaken }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const [photo, setPhoto] = useState<string | null>(null);
    const [photoSize, setPhotoSize] = useState({ width: 0, height: 0, });
    const [error, setError] = useState<string | null>(null);

    // カメラ起動
    useEffect(() => {
        let isMounted = true;
        const initializeCamera =
            async () => {
                try {
                    setError(null);
                    const stream =
                        await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode:
                                    "user",
                            },
                            audio: false,
                        });
                    if (!isMounted) {
                        stream
                            .getTracks()
                            .forEach(
                                (track) =>
                                    track.stop()
                            );
                        return;
                    }
                    mediaStreamRef.current = stream;
                    if (
                        videoRef.current
                    ) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play();
                        console.log(
                            "カメラ映像を開始しました"
                        );
                    }
                } catch (error) {
                    console.error(
                        "カメラの起動に失敗しました:",
                        error
                    );

                    if (isMounted) {
                        setError(
                            "カメラを起動できませんでした。"
                        );
                    }
                }
            };

        initializeCamera();

        return () => {
            isMounted = false;
            if (
                mediaStreamRef.current
            ) {
                mediaStreamRef.current
                    .getTracks()
                    .forEach(
                        (track) =>
                            track.stop()
                    );
                mediaStreamRef.current = null;
            }
        };
    }, []);

    // 撮影
    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            console.error(
                "videoまたはcanvasが取得できません"
            );
            return;
        }

        const width = video.videoWidth;
        const height = video.videoHeight;

        console.log(
            "撮影時のvideoサイズ:",
            {
                width,
                height,
            }
        );

        if (width === 0 || height === 0) {
            setError(
                "カメラの準備が完了していません。もう一度試してください。"
            );
            return;
        }

        canvas.width = width;
        canvas.height = height;
        const context =
            canvas.getContext(
                "2d"
            );

        if (!context) {
            setError(
                "写真の撮影に失敗しました。"
            );
            return;
        }

        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );
        console.log("写真の生成に成功");
        setPhoto(
            imageData
        );

        setPhotoSize({
            width,
            height,
        });

        // 親へ写真を渡す
        onPhotoTaken(
            imageData,
            width,
            height
        );
    };

    // 撮り直す
    const retakePhoto =
        async () => {
            console.log("撮り直し");
            setPhoto(null);
            setPhotoSize({
                width: 0,
                height: 0,
            });
            setError(null);
            setTimeout(
                async () => {
                    try {
                        if (!mediaStreamRef.current) {
                            console.log(
                                "Streamがありません"
                            );
                            return;
                        }
                        if (videoRef.current) {
                            videoRef.current.srcObject = mediaStreamRef.current;
                            await videoRef.current.play();
                            console.log(
                                "撮り直し用カメラを再表示しました"
                            );
                        }
                    } catch (error) {
                        console.error(
                            "カメラ再表示エラー:",
                            error
                        );
                        setError(
                            "カメラを再表示できませんでした。"
                        );
                    }
                },
                100
            );
        };

    return (
        <div>
            {error && (
                <p>
                    {error}
                </p>
            )}
            {!photo ? (
                <>
                    <div>
                        <video
                            ref={
                                videoRef
                            }
                            autoPlay
                            playsInline
                            muted
                            onLoadedMetadata={() => {
                                console.log("カメラ映像の準備完了");
                                console.log(
                                    "videoWidth:",
                                    videoRef.current
                                        ?.videoWidth
                                );

                                console.log(
                                    "videoHeight:",
                                    videoRef.current
                                        ?.videoHeight
                                );
                            }}
                            style={{
                                width: "100%",
                                maxWidth: "200px",
                            }}
                        />
                    </div>

                    <button onClick={takePhoto}>
                        撮影
                    </button>
                </>
            ) : (
                <>
                    <div>
                        <Image
                            src={
                                photo
                            }
                            alt="撮影した写真"
                            width={
                                photoSize.width
                            }
                            height={
                                photoSize.height
                            }
                            style={{
                                width:
                                    "100%",
                                maxWidth:
                                    "200px",
                                height:
                                    "auto",
                            }}
                        />
                    </div>

                    <button
                        onClick={
                            retakePhoto
                        }
                    >
                        撮り直す
                    </button>
                </>
            )}

            <canvas
                ref={
                    canvasRef
                }
                style={{
                    display:
                        "none",
                }}
            />
        </div>
    );
}