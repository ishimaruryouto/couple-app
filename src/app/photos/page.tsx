"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/supabase/client";
import Account from "@/components/Account/page";
import styles from "./page.module.css";
import Footer from "@/components/Footer/page";

type Photo = {
    id: string;
    user_id: string;
    storage_path: string;
    created_at: string;
};

export default function PhotosPage() {
    const supabase = createClient();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getPhotos = async () => {
            try {
                // ログインユーザーを取得
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();
                if (userError) {
                    console.error(
                        "ユーザー情報の取得に失敗しました:",
                        userError
                    );
                    setError(
                        "ユーザー情報を取得できませんでした。"
                    );
                    return;
                }
                if (!user) {
                    setError(
                        "ログインしてください。"
                    );
                    return;
                }
                console.log(
                    "現在のuser_id:",
                    user.id
                );
                // 自分の写真だけ取得
                const {
                    data,
                    error: photoError,
                } = await supabase
                    .from("photo")
                    .select(
                        "id, user_id, storage_path, created_at"
                    )
                    .eq("user_id", user.id)
                    .order("created_at", {
                        ascending: false,
                    });
                if (photoError) {
                    console.error(
                        "写真情報の取得に失敗しました:",
                        photoError
                    );
                    setError(
                        "写真を取得できませんでした。"
                    );
                    return;
                }
                console.log("写真件数", data?.length ?? 0);
                setPhotos(data ?? []);
            } catch (error) {
                console.error(
                    "写真一覧の取得中にエラーが発生しました:",
                    error
                );
                setError(
                    "写真の取得中にエラーが発生しました。"
                );
            } finally {
                setLoading(false);
            }
        };

        getPhotos();
    }, []);

    return (
        <main>
            <Account />
            <h1>自分の写真</h1>
            {loading && (
                <p>写真を読み込み中...</p>
            )}
            {error && (
                <p>{error}</p>
            )}
            {!loading &&
                !error &&
                photos.length === 0 && (
                    <p>
                        まだ写真がありません。
                    </p>
                )}
            {!loading &&
                photos.length > 0 && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, 1fr)",
                            gap: "10px",
                        }}
                    >
                        {photos.map((photo) => {
                            const {
                                data: urlData,
                            } = supabase.storage
                                .from("photos")
                                .getPublicUrl(
                                    photo.storage_path
                                );
                            return (
                                <div
                                    key={photo.id}
                                >
                                    <Image
                                        src={urlData.publicUrl}
                                        alt="保存した写真"
                                        width={300}
                                        height={300}
                                        style={{
                                            width: "100%",
                                            height: "auto",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            <Footer />

        </main>
    );
}