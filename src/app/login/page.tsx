"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);
        if (error) {
            setMessage("ログインできませんでした。入力内容を確認してください。");
            return;
        }
        router.push("/");
        router.refresh();
    }

    return (
        <main>
            <h1>ログイン</h1>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">メールアドレス</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">パスワード</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "ログイン中..." : "ログイン"}
                </button>
            </form>
            {message && <p role="status">{message}</p>}
            <p>
                アカウントをお持ちでない方は{" "}
                <a href="/signup">新規登録</a>
            </p>
        </main>
    );
}
