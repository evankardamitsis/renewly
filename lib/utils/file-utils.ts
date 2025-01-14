import { FileUploadError } from "@/lib/types/project-files";

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ACCEPTED_FILE_TYPES = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
        ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
    ],
    "text/plain": [".txt"],
};

export function formatBytes(bytes: number, decimals = 2) {
    if (!bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateFile(file: File): FileUploadError | null {
    if (file.size > MAX_FILE_SIZE) {
        return {
            message: `File size exceeds ${formatBytes(MAX_FILE_SIZE)}`,
            code: "size_exceeded",
        };
    }

    const fileType = Object.entries(ACCEPTED_FILE_TYPES).find(
        ([type, extensions]) => {
            if (file.type === type) return true;
            if (type.endsWith("/*")) {
                const baseType = type.split("/")[0];
                return file.type.startsWith(`${baseType}/`);
            }
            return extensions.some((ext) =>
                file.name.toLowerCase().endsWith(ext)
            );
        },
    );

    if (!fileType) {
        return {
            message: "File type not supported",
            code: "invalid_type",
        };
    }

    return null;
}

export function getFileTypeFromName(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (!extension) return "unknown";

    for (const [type, extensions] of Object.entries(ACCEPTED_FILE_TYPES)) {
        if (extensions.some((ext) => ext.endsWith(extension))) {
            return type;
        }
    }

    return "application/octet-stream";
}
