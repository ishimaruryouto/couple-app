"use client";
import { createClient } from "@/supabase/client";

type PhotoSaveProps = {
    photo: string | null;
};

export default function PhotoSave({ photo }: PhotoSaveProps) {
    const supabase = createClient();

    const savePhoto =
        async () => {
            if (!photo) {
                console.error(
                    "保存する写真がありません"
                );
                return;
            }

            try {
                console.log(
                    "保存開始"
                );

                // ログインユーザー取得
                const {
                    data: {
                        user,
                    },
                    error:
                    userError,
                } =
                    await supabase.auth.getUser();

                if (userError || !user) {
                    console.error(
                        "ログインユーザーを取得できません:",
                        userError
                    );
                    alert(
                        "ログインしてください。"
                    );
                    return;
                }
                console.log("現在のuser_id:", user.id);

                // Base64 → Blob
                const response = await fetch(photo);
                const blob = await response.blob();
                // ファイル名
                const fileName = `${Date.now()}.jpg`;
                const storagePath = `${user.id}/${fileName}`;

                console.log("Storage保存先:", storagePath);

                // Storageへ保存
                const {
                    error:
                    uploadError,
                } =
                    await supabase.storage
                        .from(
                            "photos"
                        )
                        .upload(
                            storagePath,
                            blob,
                            {
                                contentType:
                                    "image/jpeg",
                                upsert:
                                    false,
                            }
                        );
                if (
                    uploadError
                ) {
                    console.error(
                        "Storageへの保存に失敗:",
                        uploadError
                    );
                    alert(
                        "写真の保存に失敗。。。"
                    );
                    return;
                }
                console.log(
                    "Storageへの保存に成功"
                );

                // photoテーブルへ保存
                const {
                    error:
                    insertError,
                } =
                    await supabase
                        .from(
                            "photo"
                        )
                        .insert({
                            user_id:
                                user.id,
                            storage_path:
                                storagePath,
                        });

                if (
                    insertError
                ) {
                    console.error(
                        "photoテーブルへの登録に失敗:",
                        insertError
                    );

                    // DB登録失敗時はStorageから削除
                    await supabase.storage
                        .from(
                            "photos"
                        )
                        .remove([
                            storagePath,
                        ]);

                    alert(
                        "写真情報の保存に失敗。。。"
                    );
                    return;
                }
                console.log(
                    "photoテーブルへの登録に成功"
                );
                alert(
                    "写真を保存しました"
                );
            } catch (error) {
                console.error(
                    "写真の保存中にエラー:",
                    error
                );

                alert(
                    "写真の保存中にエラーが発生しました。"
                );
            }
        };

    return (
        <button
            onClick={
                savePhoto
            }
            disabled={!photo}
        >
            保存する
        </button>
    );
}