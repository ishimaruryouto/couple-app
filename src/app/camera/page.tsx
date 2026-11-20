"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "photo" | "video";
type CameraFacing = "user" | "environment";

type CameraProps = {
    albumId: string;
    userId: string;
};

export default function Camera({ albumId, userId }: CameraProps) {
    console.log("Camera albumId:", albumId);
    console.log("Camera userId:", userId);
    const supabase = createClient();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [cameraMode, setCameraMode] = useState<Mode>("photo");
    const [cameraFacing, setCameraFacing] =
        useState<CameraFacing>("environment");
    const [isRecording, setIsRecording] = useState(false);

    // カメラの起動・切り替え
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // 現在のカメラを停止
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => {
                        track.stop();
                    });
                    streamRef.current = null;
                }

                const newStream =
                    await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: cameraFacing,
                        },
                        audio: true,
                    });
                currentStream = newStream;
                streamRef.current = newStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch (error) {
                console.error(
                    "カメラの起動に失敗しました:",
                    error
                );
            }
        };
        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, [cameraFacing]);


    // 写真撮影
    const takePhoto = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        if (!context) return;

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            async (blob) => {
                if (!blob) return;

                console.log("撮影");
                console.log(blob);

                const fileName = `${crypto.randomUUID()}.jpg`;
                const storagePath = `${albumId}/${fileName}`;

                // Storageに保存
                const { error: uploadError } =
                    await supabase.storage
                        .from("photo")
                        .upload(storagePath, blob, {
                            contentType: "image/jpeg",
                            upsert: false,
                        });

                // Storageへの保存に失敗した場合
                if (uploadError) {
                    console.error(
                        "写真のアップロードに失敗しました:",
                        uploadError
                    );
                    return;
                }

                console.log("Storageへの保存に成功しました");

                // 現在ログインしているユーザーを取得
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                console.log("現在ログインしているユーザー:", user?.id);

                if (!user) {
                    console.error("ログインユーザーが取得できません");
                    return;
                }

                // photoテーブルに登録
                console.log("photo登録データ:", {
                    album_id: albumId,
                    user_id: user.id,
                    storage_path: storagePath,
                });

                const { error: dbError } =
                    await supabase
                        .from("photo")
                        .insert({
                            album_id: albumId,
                            user_id: user.id,
                            storage_path: storagePath,
                        });

                if (dbError) {
                    console.error(
                        "photoテーブルへの登録に失敗しました:",
                        JSON.stringify(dbError, null, 2)
                        // dbError
                    );
                    return;
                }

                console.log("photoテーブルへの登録に成功しました");
            },
            "image/jpeg",
            0.9
        );
    };


    // 動画撮影開始
    const startRecording = () => {
        const stream = streamRef.current;

        if (!stream) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, {
                type: recorder.mimeType,
            });
            console.log("動画を撮影しました");
            console.log(blob);
            // ここでSupabase Storageへアップロード
        };

        recorder.start();
        setIsRecording(true);
    };

    // 動画撮影停止
    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        setIsRecording(false);
    };

    // 撮影ボタン
    const handleCapture = () => {
        if (cameraMode === "photo") {
            takePhoto();
        } else {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }
    };

    // 内カメラ・外カメラ切り替え
    const switchCamera = () => {
        // 動画撮影中は切り替えない
        if (isRecording) return;
        setCameraFacing((prev) =>
            prev === "environment"
                ? "user"
                : "environment"
        );
    };

    return (
        <>
            <h1>カメラ</h1>
            {/* カメラ映像 */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: "100%",
                    maxWidth: "200px",
                }}
            />

            {/* 写真・動画切り替え */}
            <div>
                <button
                    type="button"
                    onClick={() => setCameraMode("photo")}
                >
                    写真
                </button>

                <button
                    type="button"
                    onClick={() => setCameraMode("video")}
                >
                    動画
                </button>
            </div>

            {/* 内カメラ・外カメラ切り替え */}
            <div>
                <button
                    type="button"
                    onClick={switchCamera}
                    disabled={isRecording}
                >
                    {cameraFacing === "environment"
                        ? "内カメラに切り替える"
                        : "外カメラに切り替える"}
                </button>
            </div>

            {/* 撮影ボタン */}
            <div>
                <button
                    type="button"
                    onClick={handleCapture}
                >
                    {cameraMode === "photo"
                        ? "📷 写真を撮影"
                        : isRecording
                            ? "⏹ 録画停止"
                            : "● 録画開始"}
                </button>
            </div>

            <div>
                {albumId}
            </div>
        </>
    );
}