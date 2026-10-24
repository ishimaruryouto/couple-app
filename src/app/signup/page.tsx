"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        setLoading(false);
        if (error) {
            setMessage(error.message);
            return;
        }

        if (data.session) {
            router.push("/");
            router.refresh();
        } else {
            setMessage(
                "登録を受け付けました。メールを確認してアカウントを有効化してください。"
            );
        }
    }

    return (
        <main>
            <h1>新規登録</h1>
            <form onSubmit={handleSignup}>
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
                    <label htmlFor="password">パスワード（6文字以上）</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? "登録中..." : "アカウントを作成"}
                </button>
            </form>
            {message && <p role="status">{message}</p>}
            <p>
                すでにアカウントをお持ちの方は{" "}
                <a href="/login">ログイン</a>
            </p>
        </main>
    );
}
