"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Account() {
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        async function getUser() {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error("ユーザー情報の取得に失敗しました", error.message);
            }
            setEmail(user?.email ?? null);
            setLoading(false);
        }
        getUser();
    }, []);

    return (
        <>
            {loading ? (
                <p>アカウント情報を確認中...</p>
            ) : email ? (
                <section>
                    <p>ログイン中のアカウント</p>
                    <p>{email}</p>
                </section>
            ) : (
                <section>
                    <p>ログインしていません。</p>
                    <a href="/login">ログイン</a>
                    {" / "}
                    <a href="/signup">新規登録</a>
                </section>
            )}
        </>
    )
}