"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import styles from "./page.module.css";

export default function NewAlbumPage() {
    const router = useRouter();

    const [albumName, setAlbumName] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const name = albumName.trim();

        if (!name) {
            setErrorMessage("アルバム名を入力してください。");
            return;
        }

        setSaving(true);
        setErrorMessage("");

        try {
            const supabase = createClient();

            // ログインユーザーを取得
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error("ログインしてください。");
            }

            // 所属グループを取得
            const { data: member, error: memberError } = await supabase
                .from("couple_members")
                .select("couple_id")
                .eq("user_id", user.id)
                .single();

            if (memberError || !member) {
                throw new Error("カップルグループが見つかりません。");
            }

            // 新しいアルバムを作成
            const { error: insertError } = await supabase
                .from("albums")
                .insert({
                    couple_id: member.couple_id,
                    name,
                    created_by: user.id,
                });

            if (insertError) {
                throw insertError;
            }

            // アルバム一覧に戻る
            router.push("/album");
            router.refresh();

        } catch (error: unknown) {
            console.error("アルバム作成エラー:", error);

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "アルバムの作成に失敗しました。"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main>
            <p>
                <Link href="/album">
                    ← アルバム一覧に戻る
                </Link>
            </p>

            <h1>新しいアルバムを作成</h1>

            <form onSubmit={handleCreate}>
                <div>
                    <label htmlFor="album-name">
                        アルバム名
                    </label>

                    <br />

                    <input
                        id="album-name"
                        type="text"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                        placeholder="例：初デート、クリスマス、大阪旅行"
                        maxLength={100}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "作成中..." : "アルバムを作成"}
                </button>
            </form>

            {errorMessage && (
                <p role="alert">{errorMessage}</p>
            )}
        </main>
    );
}