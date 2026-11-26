"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/supabase/client";


type Props = {
    userId: string;
    onClose: () => void;
    onSelect: (photos: Photo[]) => void;
    initialSelectedPhotos?: Photo[];
};

type Photo = {
    id: string;
    user_id: string;
    storage_path: string;
    created_at: string;
};

export default function PhotoSelectModal({
    userId,
    onClose,
    onSelect,
    initialSelectedPhotos = [],
}: Props) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>(
        initialSelectedPhotos
    );

    useEffect(() => {
        const supabase = createClient();
        let cancelled = false;

        async function fetchPhotos() {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (cancelled) return;

            if (userError || !user || user.id !== userId) {
                setError("ユーザー情報を取得できませんでした。");
                setLoading(false);
                return;
            }

            const { data, error: photoError } = await supabase
                .from("photo")
                .select("id, user_id, storage_path, created_at")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (cancelled) return;

            if (photoError) {
                console.error("写真取得エラー:", photoError);
                setError("写真の取得に失敗しました。");
            } else {
                setPhotos(data ?? []);
            }

            setLoading(false);
        }

        fetchPhotos();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // 写真を選択・解除する関数
    function togglePhoto(photo: Photo) {
        setSelectedPhotos((prev) => {
            const isSelected = prev.some(
                (selected) => selected.id === photo.id
            );

            if (isSelected) {
                return prev.filter(
                    (selected) => selected.id !== photo.id
                );
            }

            return [...prev, photo];
        });
    } return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="写真選択"
                style={{
                    backgroundColor: "white",
                    color: "black",
                    padding: "30px",
                    borderRadius: "12px",
                }}
            >
                <h2>写真を選択</h2>

                {loading && <p>写真を読み込み中...</p>}

                {error && <p role="alert">{error}</p>}

                {!loading && !error && photos.length === 0 && (
                    <p>まだ撮影した写真がありません。</p>
                )}

                {!loading && !error && photos.length > 0 && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "10px",
                            marginTop: "20px",
                            maxHeight: "400px",
                            overflowY: "auto",
                        }}
                    >
                        {photos.map((photo) => {
                            const supabase = createClient();

                            const { data } = supabase.storage
                                .from("photos")
                                .getPublicUrl(photo.storage_path);

                            const isSelected = selectedPhotos.some(
                                (selected) => selected.id === photo.id
                            );

                            return (
                                <button
                                    key={photo.id}
                                    type="button"
                                    onClick={() => togglePhoto(photo)}
                                    aria-pressed={isSelected}
                                    aria-label={`写真を${isSelected ? "選択解除" : "選択"}`}
                                    style={{
                                        position: "relative",
                                        padding: 0,
                                        border: isSelected
                                            ? "3px solid #d77ca3"
                                            : "3px solid transparent",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Image
                                        src={data.publicUrl}
                                        alt="撮影した写真"
                                        width={120}
                                        height={120}
                                        unoptimized
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1 / 1",
                                            objectFit: "cover",
                                        }}
                                    />

                                    {isSelected && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: 5,
                                                right: 5,
                                                backgroundColor: "#d77ca3",
                                                color: "#fff",
                                                borderRadius: "50%",
                                                width: 24,
                                                height: 24,
                                                display: "grid",
                                                placeItems: "center",
                                            }}
                                        >
                                            ✓
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginTop: "20px",
                    }}
                >
                    <button type="button" onClick={onClose}>
                        キャンセル
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect(selectedPhotos)}
                    >
                        選択完了（{selectedPhotos.length}枚）
                    </button>
                </div>
            </div>
        </div>
    );
}