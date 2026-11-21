"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function CameraPage() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // カメラのStreamを保持する
    const mediaStreamRef =
        useRef<MediaStream | null>(null);

    const [photo, setPhoto] =
        useState<string | null>(null);

    // 撮影した写真のサイズ
    const [photoSize, setPhotoSize] = useState({
        width: 0,
        height: 0,
    });

    const [error, setError] =
        useState<string | null>(null);

    // カメラを起動
    useEffect(() => {
        let isMounted = true;

        const initializeCamera = async () => {
            try {
                setError(null);
                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        video: {
                            facingMode: "user",
                        },
                        audio: false,
                    });

                // コンポーネントがまだ存在している場合だけ処理
                if (!isMounted) {
                    stream
                        .getTracks()
                        .forEach((track) => {
                            track.stop();
                        });
                    return;
                }
                // Streamを保存
                mediaStreamRef.current = stream;
                // videoにStreamを接続
                if (videoRef.current) {
                    videoRef.current.srcObject =
                        stream;
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

        // ページを離れたらカメラ停止
        return () => {
            isMounted = false;
            if (
                mediaStreamRef.current
            ) {
                mediaStreamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });
                mediaStreamRef.current =
                    null;
            }
        };
    }, []);

    // 撮影
    const takePhoto = () => {
        const video =
            videoRef.current;
        const canvas =
            canvasRef.current;

        if (!video || !canvas) {
            console.error(
                "videoまたはcanvasが取得できません"
            );
            return;
        }

        // カメラ映像のサイズ
        const width =
            video.videoWidth;
        const height =
            video.videoHeight;
        console.log(
            "撮影時のvideoサイズ:",
            {
                width,
                height,
            }
        );

        // サイズが取得できない場合
        if (
            width === 0 ||
            height === 0
        ) {
            console.error(
                "カメラ映像のサイズを取得できません"
            );
            setError(
                "カメラの準備が完了していません。もう一度試してください。"
            );
            return;
        }

        // canvasサイズ
        canvas.width = width;
        canvas.height = height;
        const context =
            canvas.getContext(
                "2d"
            );

        if (!context) {
            console.error(
                "canvasのcontextを取得できません"
            );

            setError(
                "写真の撮影に失敗しました。"
            );

            return;
        }

        // カメラ映像をcanvasへコピー
        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );

        // 画像データへ変換
        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );

        console.log(
            "写真の生成に成功しました"
        );

        // 写真を保存
        setPhoto(
            imageData
        );

        // サイズを保存
        setPhotoSize({
            width,
            height,
        });
    };

    // 撮り直す
    const retakePhoto =
        async () => {
            console.log(
                "撮り直しを開始"
            );
            // 写真を消す
            setPhoto(null);
            // サイズをリセット
            setPhotoSize({
                width: 0,
                height: 0,
            });

            // カメラを再接続
            setTimeout(async () => {
                try {
                    // Streamが存在するか確認
                    if (
                        !mediaStreamRef.current
                    ) {
                        console.log(
                            "Streamがないためカメラを再起動します"
                        );
                        return;
                    }

                    // videoにStreamを再設定
                    if (
                        videoRef.current
                    ) {
                        videoRef.current.srcObject =
                            mediaStreamRef.current;

                        await videoRef.current.play();

                        console.log(
                            "撮り直し用カメラを再表示しました"
                        );

                        console.log(
                            "videoWidth:",
                            videoRef.current
                                .videoWidth
                        );

                        console.log(
                            "videoHeight:",
                            videoRef.current
                                .videoHeight
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
            }, 100);
        };

    // 保存
    const savePhoto = () => {
        console.log(
            "保存する写真:",
            photo
        );

        alert(
            "保存処理は次のステップで実装します。"
        );
    };

    return (
        <main>
            <h1>
                カメラ
            </h1>
            {/* 撮影前 */}
            {!photo ? (
                <>
                    <div>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onLoadedMetadata={() => {
                                console.log(
                                    "カメラ映像の準備完了"
                                );

                                console.log(
                                    "videoWidth:",
                                    videoRef
                                        .current
                                        ?.videoWidth
                                );

                                console.log(
                                    "videoHeight:",
                                    videoRef
                                        .current
                                        ?.videoHeight
                                );
                            }}
                            style={{
                                width:
                                    "100%",
                                maxWidth:
                                    "200px",
                            }}
                        />
                    </div>

                    <button
                        onClick={
                            takePhoto
                        }
                    >
                        📷 撮影する
                    </button>
                </>
            ) : (
                <>
                    {/* 撮影した写真 */}
                    <div>
                        <Image
                            src={photo}
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

                    <div>
                        <button
                            onClick={
                                retakePhoto
                            }
                        >
                            撮り直す
                        </button>

                        <button
                            onClick={
                                savePhoto
                            }
                        >
                            保存する
                        </button>
                    </div>
                </>
            )}

            {/* 撮影用canvas */}
            <canvas
                ref={
                    canvasRef
                }
                style={{
                    display:
                        "none",
                }}
            />
        </main>
    );
}