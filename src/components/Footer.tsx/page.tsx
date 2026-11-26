import Image from "next/image";
import style from "./page.module.css"
import Link from "next/link";

export default function Footer() {
    return (
        <footer className={style.footer}>
            <Link href="/">
                <Image
                    src="home_btn.svg"
                    alt=""
                    width={32}
                    height={32}
                />
                <p>Home</p>
            </Link>
            <Link href="/album">
                <Image
                    src="album_btn.svg"
                    alt=""
                    width={32}
                    height={32}
                />
                <p>Album</p>
            </Link>
            <Link href="/mypage">
                <Image
                    src="mypage_btn.svg"
                    alt=""
                    width={32}
                    height={32}
                />
                <p>My</p>
            </Link>
        </footer>
    );
}