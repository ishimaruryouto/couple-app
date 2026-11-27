"use client";

import { useState } from "react";
import { createClient } from "@/supabase/client";
import styles from "./page.module.css";

type Album = {
    id: string;
    name: string;
    created_at: string;
};

type CreateAlbumProps = {
    onCreated: (album: Album) => void;
};

export default function CreateAlbum({
    onCreated,
}: CreateAlbumProps) {
    const [albumName, setAlbumName] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleCreate(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        const name = albumName.trim();

        if (!name) {
            setErrorMessage("アルバム名を入力してください。");
            return;
        }

        if (saving) return;

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
            const { data: member, error: memberError } =
                await supabase
                    .from("couple_members")
                    .select("couple_id")
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (memberError || !member) {
                throw new Error(
                    "カップルグループが見つかりません。"
                );
            }

            // アルバムを作成
            const { data: newAlbum, error: insertError } =
                await supabase
                    .from("albums")
                    .insert({
                        couple_id: member.couple_id,
                        name,
                        created_by: user.id,
                    })
                    .select("id, name, created_at")
                    .single();

            if (insertError) {
                throw insertError;
            }

            // 入力欄をリセット
            setAlbumName("");

            // 親コンポーネントに作成したアルバムを渡す
            onCreated(newAlbum);

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
        <section className={styles.createAlbum}>
            <h2>新しいアルバムを作成</h2>

            <form onSubmit={handleCreate}>
                <input
                    type="text"
                    value={albumName}
                    onChange={(e) =>
                        setAlbumName(e.target.value)
                    }
                    placeholder="アルバム名を入力"
                    maxLength={100}
                    required
                    disabled={saving}
                />

                <button
                    type="submit"
                    disabled={saving}
                >
                    {saving ? "作成中..." : "作成"}
                </button>
            </form>

            {errorMessage && (
                <p role="alert">{errorMessage}</p>
            )}
        </section>
    );
}