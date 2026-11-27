"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import styles from "./page.module.css";
import Footer from "@/components/Footer/page";
import CreateAlbum from "@/components/CreateAlbum/page";

type Album = {
    id: string;
    name: string;
    created_at: string;
};

export default function AlbumPage() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasCouple, setHasCouple] = useState(false);
    // 新しく作成したアルバムを一覧に追加
    function handleAlbumCreated(newAlbum: Album) {
        setAlbums((prevAlbums) => [
            newAlbum,
            ...prevAlbums,
        ]);
    }

    useEffect(() => {
        const supabase = createClient();

        async function loadAlbums() {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setErrorMessage("ログインしてください。");
                setLoading(false);
                return;
            }

            // 所属しているカップルグループを取得
            const { data: member, error: memberError } = await supabase
                .from("couple_members")
                .select("couple_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (memberError) {
                setErrorMessage("グループ情報を取得できませんでした。");
                setLoading(false);
                return;
            }

            if (!member) {
                setLoading(false);
                return;
            }

            setHasCouple(true);

            // グループに所属するアルバムを取得
            const { data, error } = await supabase
                .from("albums")
                .select("id, name, created_at")
                .eq("couple_id", member.couple_id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("アルバム取得エラー:", error.message);
                setErrorMessage("アルバムを取得できませんでした。");
            } else {
                setAlbums(data ?? []);
            }

            setLoading(false);
        }

        void loadAlbums();
    }, []);

    return (
        <main>
            <h1></h1>
            <hr />
            {loading ? (
                <p>アルバムを読み込み中...</p>
            ) : (
                <>
                    {errorMessage && (
                        <p role="alert">{errorMessage}</p>
                    )}

                    {!errorMessage && !hasCouple && (
                        <section>
                            <p>まずはパートナーとのグループを作成しよう！</p>
                            <Link href="/couple">
                                パートナー連携へ
                            </Link>
                        </section>
                    )}

                    <CreateAlbum onCreated={handleAlbumCreated} />

                    {hasCouple && (
                        <>
                            <section>
                                {albums.length === 0 ? (
                                    <p>
                                        まだアルバムがありません。
                                        最初のアルバムを作成しよう！
                                    </p>
                                ) : (
                                    <ul>
                                        {albums.map((album) => (
                                            <li key={album.id}>
                                                <Link href={`/album/${album.id}`}>
                                                    {album.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}
                    <Link href="/album/new" className={styles.newAlbum}>
                        <Image
                            src="newIcon.svg"
                            alt=""
                            width={37}
                            height={42}
                        />
                    </Link>
                </>
            )}
            <Footer />
        </main>
    );
}