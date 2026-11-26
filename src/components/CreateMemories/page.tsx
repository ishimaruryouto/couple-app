"use client";
import { useState } from "react";
import { createClient } from "@/supabase/client";
import Image from "next/image";
import PhotoSelectModal from "@/components/PhotoSelectModal/PhotoSelectModal";
import styles from "./page.module.css";

type Photo = {
    id: string;
    user_id: string;
    storage_path: string;
    created_at: string;
};

type PostFormProps = {
    coupleId: string;
    albumId: string;
    userId: string;
    onPosted: () => Promise<void>;
};

export default function CreateMemories({
    coupleId,
    albumId,
    userId,
    onPosted,
}: PostFormProps) {
    const [postMessage, setPostMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    // 写真選択モーダルの開閉状態
    const [isModalOpen, setIsModalOpen] = useState(false);

    // アプリ内で選択した写真
    const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState("");

    async function handlePost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmedMessage = postMessage.trim();

        // メッセージも写真もない場合
        if (!trimmedMessage && selectedPhotos.length === 0) {
            setStatus("メッセージか写真を入力してください。");
            return;
        }

        setSaving(true);
        setStatus("");

        const supabase = createClient();

        try {
            // 選択した写真のIDを配列にする
            const photoIds = selectedPhotos.map((photo) => photo.id);

            // RPC関数を呼び出して投稿を保存
            const { error: postError } = await supabase.rpc(
                "create_album_post",
                {
                    p_couple_id: coupleId,
                    p_album_id: albumId,
                    p_message: trimmedMessage,
                    p_photo_ids: photoIds,
                }
            );

            if (postError) {
                throw postError;
            }

            // 投稿成功後、フォームをリセット
            setPostMessage("");
            setSelectedPhotos([]);

            setStatus("投稿しました！");

            // アルバムの投稿一覧を更新
            try {
                await onPosted();
            } catch (refreshError) {
                console.error("投稿一覧の更新エラー:", refreshError);
                setStatus(
                    "投稿は保存されましたが、一覧の更新に失敗しました。"
                );
            }
        } catch (error: unknown) {
            console.error("投稿エラー:", error);

            setStatus(
                error instanceof Error
                    ? `投稿に失敗しました: ${error.message}`
                    : "投稿に失敗しました。コンソールを確認してください。"
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section>
            {/* <h2>思い出を投稿</h2> */}
            <form id="memory-form" onSubmit={handlePost}>
                <div className={styles.messageWrap}>
                    {/* <label htmlFor="post-message">メッセージ</label> */}
                    <br />
                    <textarea
                        id="post-message"
                        value={postMessage}
                        onChange={(e) => setPostMessage(e.target.value)}
                        placeholder="今日の思い出を書こう..."
                        rows={4}
                        maxLength={2000}
                    />
                </div>

                <div className={styles.btnWrap}>
                    <button
                        type="button"
                        onClick={() => {
                            setIsModalOpen(true);
                        }}
                        disabled={saving}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20 20L4 4M20 4L4 20" stroke-width="3" stroke-linecap="round" stroke="white" />
                        </svg>
                    </button>
                </div>
                {selectedPhotos.length > 0 && (
                    <div>
                        <p>選択中：{selectedPhotos.length}枚</p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "10px",
                            }}
                        >
                            {selectedPhotos.map((photo) => {
                                const supabase = createClient();

                                const { data } = supabase.storage
                                    .from("photos")
                                    .getPublicUrl(photo.storage_path);

                                return (
                                    <Image
                                        key={photo.id}
                                        src={data.publicUrl}
                                        alt="選択した写真"
                                        width={150}
                                        height={150}
                                        unoptimized
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1 / 1",
                                            objectFit: "cover",
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedFile && (
                    <p>選択中：{selectedFile.name}</p>
                )}
            </form>

            {status && <p role="status">{status}</p>}
            {isModalOpen && (
                <PhotoSelectModal
                    userId={userId}
                    initialSelectedPhotos={selectedPhotos}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={(photos) => {
                        setSelectedPhotos(photos);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </section>
    );
}
