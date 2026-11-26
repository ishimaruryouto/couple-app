"use client"
import { useRouter } from "next/navigation";
import Link from "next/link";
import Account from "@/components/Account/page";
import Footer from "@/components/Footer/page";

export default function Mypage() {
    const router = useRouter();

    async function handleLogout() {
        router.push("/login");
        router.refresh();
    }

    return (
        <>
            <Account />
            <hr />
            <button type="button" onClick={handleLogout}>
                ログアウト
            </button>
            <Link href="/photos">
                <button>写真フォルダ</button>
            </Link>
            <Footer />
        </>
    )
}
