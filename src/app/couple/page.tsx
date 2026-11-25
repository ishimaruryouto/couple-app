"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import styles from "./page.module.css";

type Couple = {
    id: string;
    name: string;
};

export default function CouplePage() {
    const [couples, setCouples] = useState<Couple[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const supabase = createClient();

        async function loadCouples() {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();
            if (authError || !user) {
                setErrorMessage("ログインしてください。");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from("couple_members")
                .select("couples(id, name)")
                .eq("user_id", user.id);

            if (error) {
                console.error("グループ取得エラー:", error.message);
                setErrorMessage("グループを取得できませんでした。");
            } else {
                const result = (data ?? []).flatMap((item) => {
                    const related = item.couples;
                    if (Array.isArray(related)) {
                        return related.filter(
                            (couple): couple is Couple => couple !== null
                        );
                    }
                    return related ? [related as Couple] : [];
                });
                setCouples(result);
            }
            setLoading(false);
        }
        void loadCouples();
    }, []);

    return (
        <main>
            <h1>カップルグループ</h1>
            <hr />
            {loading ? (
                <p>グループを読み込み中...</p>
            ) : (
                <>
                    {errorMessage && (
                        <p role="alert">{errorMessage}</p>
                    )}
                    {couples.length === 0 && !errorMessage ? (
                        <section>
                            <p>まだグループに参加していません。</p>
                            <p>
                                <Link href="/couple/new">
                                    グループを作成する
                                </Link>
                            </p>
                            <p>
                                <Link href="/join">
                                    招待コードで参加する
                                </Link>
                            </p>
                        </section>
                    ) : (
                        <section>
                            <h2>所属グループ</h2>

                            <ul>
                                {couples.map((couple) => (
                                    <li key={couple.id}>
                                        <Link
                                            href={`/album/${couple.id}`}
                                        >
                                            {couple.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}