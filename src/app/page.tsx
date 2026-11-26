"use client";
import styles from "./page.module.css";
import Link from "next/link";
import Footer from "@/components/Footer/page";

export default function Home() {

  return (
    <main className={styles.page}>
      <Link href="/camera">
        <button>カメラ</button>
      </Link>
      <Footer />
    </main>
  );
}
