"use client";
import { useState } from "react";
import { createClient } from "@/supabase/client";
import Image from "next/image";
import PhotoSelectModal from "@/components/PhotoSelectModal/PhotoSelectModal";

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
            <h2>思い出を投稿</h2>
            <form onSubmit={handlePost}>
                <div>
                    <label htmlFor="post-message">メッセージ</label>
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

                {/* <div>
                    <label htmlFor="post-photo">写真（5MB以下）</label>
                    <br />
                    <input
                        id="post-photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            setSelectedFile(e.target.files?.[0] ?? null)
                        }
                    />
                </div> */}
                <div>
                    <p>写真を追加</p>

                    <button
                        type="button"
                        onClick={() => {
                            setIsModalOpen(true);
                        }}
                        disabled={saving}
                    >
                        ＋ 写真を選択
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
                <button type="submit" disabled={saving}>
                    {saving ? "投稿中..." : "思い出を投稿する"}
                </button>
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
