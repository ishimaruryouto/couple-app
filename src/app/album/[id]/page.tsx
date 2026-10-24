"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Album = {
    id: string;
    name: string;
};

export default function AlbumDetailPage() {
    return (
        <Suspense fallback={<p>アルバムを読み込み中...</p>}>
            <AlbumDetailContent />
        </Suspense>
    )
}

function AlbumDetailContent() {
    const { id } = useParams<{ id: string }>();
    const [album, setAlbum] = useState<Album | null>(null);
    const [message, setMessage] = useState("読み込み中...");

    useEffect(() => {
        async function loadAlbum() {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                setMessage("ログインしてください。");
                return;
            }
            const { data, error } = await supabase
                .from("couples")
                .select("id, name")
                .eq("id", id)
                .maybeSingle();
            if (error || !data) {
                setMessage("アルバムが見つからないか、閲覧権限がありません。");
                return;
            }
            setAlbum(data);
            setMessage("");
        }
        void loadAlbum();
    }, [id]);

    return (
        <main>
            {album ? (
                <>
                    <h1>{album.name}</h1>
                    <p>共有アルバムを作成しました！</p>
                    <p>次はここに写真やデートの感想を保存できるようにします。</p>
                </>
            ) : (
                <p>{message}</p>
            )}
            <Link href="/album">アルバム一覧に戻る</Link>
        </main>
    );
}