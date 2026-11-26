"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/supabase/client";
import CreateMemories from "@/components/CreateMemories/page";
import Footer from "@/components/Footer/page";

type Album = {
    id: string;
    name: string;
    couple_id: string;
};

type AlbumPost = {
    id: string;
    user_id: string;
    message: string;
    image_path: string | null;
    created_at: string;
};

type DisplayPost = AlbumPost & {
    imageUrl: string | null;
};

export default function AlbumDetailPage() {
    const params = useParams<{ id: string }>();
    const albumId = params.id;

    const [album, setAlbum] = useState<Album | null>(null);
    const [posts, setPosts] = useState<DisplayPost[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // アルバム内の投稿を取得
    const loadPosts = useCallback(async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from("album_posts")
            .select("id, user_id, message, image_path, created_at")
            .eq("album_id", albumId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("投稿取得エラー:", error.message);
            setMessage(`投稿を取得できませんでした: ${error.message}`);
            return;
        }

        const displayPosts: DisplayPost[] = await Promise.all(
            (data ?? []).map(async (post) => {
                let imageUrl: string | null = null;

                if (post.image_path) {
                    const { data: signedData, error: signedError } =
                        await supabase.storage
                            .from("album-photos")
                            .createSignedUrl(post.image_path, 3600);

                    if (signedError) {
                        console.error(
                            "写真URL取得エラー:",
                            signedError.message
                        );
                    } else {
                        imageUrl = signedData.signedUrl;
                    }
                }

                return { ...post, imageUrl };
            })
        );

        setPosts(displayPosts);
    }, [albumId]);

    // アルバム情報を取得
    useEffect(() => {
        let cancelled = false;

        async function loadAlbum() {
            setLoading(true);
            setAlbum(null);
            setPosts([]);
            setMessage("");

            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (cancelled) return;

            if (authError || !user) {
                setMessage("ログインしてください。");
                setLoading(false);
                return;
            }

            setUserId(user.id);

            const { data, error } = await supabase
                .from("albums")
                .select("id, name, couple_id")
                .eq("id", albumId)
                .maybeSingle();

            if (cancelled) return;

            if (error || !data) {
                setMessage(
                    "アルバムが見つからないか、閲覧権限がありません。"
                );
                setLoading(false);
                return;
            }

            setAlbum(data);
            await loadPosts();

            if (!cancelled) {
                setLoading(false);
            }
        }

        void loadAlbum();

        return () => {
            cancelled = true;
        };
    }, [albumId, loadPosts]);

    return (
        <main>
            {loading ? (
                <p>アルバムを読み込み中...</p>
            ) : (
                <>
                    {album && (
                        <>
                            <h1>{album.name}</h1>

                            <hr />

                            {userId && (
                                <CreateMemories
                                    coupleId={album.couple_id}
                                    albumId={album.id}
                                    userId={userId}
                                    onPosted={loadPosts}
                                />
                            )}

                            <hr />

                            <section>
                                <h2>ふたりの思い出</h2>

                                {posts.length === 0 ? (
                                    <p>
                                        まだ投稿はありません。
                                        最初の思い出を投稿しよう！
                                    </p>
                                ) : (
                                    <ul>
                                        {posts.map((post) => (
                                            <li key={post.id}>
                                                <p>
                                                    {new Date(
                                                        post.created_at
                                                    ).toLocaleString("ja-JP")}
                                                </p>

                                                {post.message && (
                                                    <p
                                                        style={{
                                                            whiteSpace: "pre-wrap",
                                                        }}
                                                    >
                                                        {post.message}
                                                    </p>
                                                )}

                                                {post.imageUrl && (
                                                    <Image
                                                        src={post.imageUrl}
                                                        alt="アルバムの写真"
                                                        width={400}
                                                        height={300}
                                                        unoptimized
                                                        style={{
                                                            display: "block",
                                                            width: "100%",
                                                            maxWidth: "400px",
                                                            height: "auto",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                )}

                                                <p>
                                                    {post.user_id === userId
                                                        ? "あなたの投稿"
                                                        : "パートナーの投稿"}
                                                </p>

                                                <hr />
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <button
                                    type="button"
                                    onClick={() => void loadPosts()}
                                >
                                    投稿を再読み込み
                                </button>
                            </section>
                        </>
                    )}
                </>
            )}

            {message && <p role="status">{message}</p>}
            <Footer />
        </main>
    );
}