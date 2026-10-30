"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewAlbumPage() {
    const [name, setName] = useState("ふたりの思い出");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage("");

        const albumName = name.trim();

        if (!albumName) {
            setMessage("アルバム名を入力してください。");
            return;
        }
        setLoading(true);
        const supabase = createClient();
        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError || !user) {
                router.push("/login");
                return;
            }

            // アルバムを作成し、作成者をメンバーに登録
            const { data: albumId, error: createError } = await supabase.rpc(
                "create_couple",
                {
                    p_name: albumName,
                }
            );

            if (createError) {
                throw createError;
            }

            if (!albumId) {
                throw new Error("アルバムIDを取得できませんでした");
            }

            // 作成したアルバムの詳細ページへ移動
            router.push(`/album/${albumId}`);
            router.refresh();


        } catch (error: unknown) {
            console.error(
                "アルバム作成エラー:",
                JSON.stringify(error, null, 2)
            );

            if (typeof error === "object" && error !== null) {
                const detail = error as {
                    message?: string;
                    code?: string;
                    details?: string;
                    hint?: string;
                };

                const errorText = [
                    detail.message,
                    detail.code ? `コード: ${detail.code}` : "",
                    detail.details ? `詳細: ${detail.details}` : "",
                    detail.hint ? `ヒント: ${detail.hint}` : "",
                ]
                    .filter(Boolean)
                    .join("\n");

                setMessage(errorText || "アルバムの作成に失敗しました。");
            } else {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "アルバムの作成に失敗しました。"
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>共有アルバムを作成</h1>
            <form onSubmit={handleCreate}>
                <div>
                    <label htmlFor="albumName">アルバム名</label>
                    <input
                        id="albumName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                    />
                </div>
                {message && <p role="alert">{message}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? "作成中..." : "作成する"}
                </button>
            </form>
            <p>
                <Link href="/album">アルバム一覧に戻る</Link>
            </p>
        </main>
    );
}