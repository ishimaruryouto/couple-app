"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import CreateMemories from "@/components/CreateMemories/page";

type Album = {
    id: string;
    name: string;
    couple_id: string;
};

export default function NewAlbumPage() {
    const router = useRouter();

    const [albums, setAlbums] = useState<Album[]>([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // アルバム一覧を取得
    useEffect(() => {
        let cancelled = false;

        async function loadAlbums() {
            const supabase = createClient();

            try {
                // ログインユーザーを取得
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    throw new Error("ログインしてください。");
                }

                // 所属しているカップルを取得
                const { data: members, error: memberError } =
                    await supabase
                        .from("couple_members")
                        .select("couple_id")
                        .eq("user_id", user.id);

                if (memberError) {
                    throw memberError;
                }

                const coupleIds = (members ?? []).map(
                    (member) => member.couple_id
                );

                if (coupleIds.length === 0) {
                    throw new Error(
                        "カップルグループが見つかりません。"
                    );
                }

                // カップルに紐づくアルバム一覧を取得
                const { data: albumData, error: albumError } =
                    await supabase
                        .from("albums")
                        .select("id, name, couple_id")
                        .in("couple_id", coupleIds)
                        .order("created_at", { ascending: false });

                if (albumError) {
                    throw albumError;
                }

                if (cancelled) return;

                setUserId(user.id);
                setAlbums(albumData ?? []);

            } catch (error: unknown) {
                if (cancelled) return;

                console.error("アルバム取得エラー:", error);

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "アルバムの取得に失敗しました。"
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadAlbums();

        return () => {
            cancelled = true;
        };
    }, []);

    // 選択したアルバムを取得
    const selectedAlbum = albums.find(
        (album) => album.id === selectedAlbumId
    );

    return (
        <main>
            <p>
                <Link href="/album">
                    ← アルバム一覧に戻る
                </Link>
            </p>

            <h1>思い出を投稿</h1>

            {loading ? (
                <p>読み込み中...</p>
            ) : (
                <>
                    {errorMessage && (
                        <p role="alert">{errorMessage}</p>
                    )}

                    {!errorMessage && (
                        <>
                            <div>
                                <label htmlFor="album-select">
                                    投稿先のアルバム
                                </label>

                                <br />

                                <select
                                    id="album-select"
                                    value={selectedAlbumId}
                                    onChange={(e) =>
                                        setSelectedAlbumId(e.target.value)
                                    }
                                >
                                    <option value="">
                                        アルバムを選択してください
                                    </option>

                                    {albums.map((album) => (
                                        <option
                                            key={album.id}
                                            value={album.id}
                                        >
                                            {album.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {albums.length === 0 && (
                                <p>
                                    投稿できるアルバムがありません。
                                </p>
                            )}

                            {selectedAlbum && userId && (
                                <CreateMemories
                                    key={selectedAlbum.id}
                                    coupleId={selectedAlbum.couple_id}
                                    albumId={selectedAlbum.id}
                                    userId={userId}
                                    onPosted={async () => {
                                        router.push(
                                            `/album/${selectedAlbum.id}`
                                        );
                                    }}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </main>
    );
}