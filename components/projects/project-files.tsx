"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useUserContext } from '@/hooks/useUserContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { formatBytes, getFileTypeFromName } from '@/lib/utils/file-utils'
import { useProjectFiles, useUploadProjectFile, useDeleteProjectFile } from '@/lib/react-query'
import type { ProjectFile } from '@/lib/types/project-files'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import Image from 'next/image'

interface ProjectFilesProps {
    projectId: string
}

const queryKeys = {
    projectFiles: (projectId: string) => ({
        queryKey: ['projects', projectId, 'files']
    })
} as const

function FilePreview({ file }: { file: ProjectFile }) {
    const fileType = getFileTypeFromName(file.name)

    // Use the secure API route for image previews
    const previewUrl = fileType.startsWith('image/')
        ? `/api/files/${file.storage_path}/preview`
        : null

    if (previewUrl) {
        return (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <Image
                    src={previewUrl}
                    alt={file.name}
                    fill
                    className="object-cover hover:object-contain transition-all duration-200"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )
    }

    const getFileIcon = () => {
        return <Icons.file className="h-12 w-12" />
    }

    return (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
            {getFileIcon()}
        </div>
    )
}

export function ProjectFiles({ projectId }: ProjectFilesProps) {
    const { data: userData } = useUserContext()
    const queryClient = useQueryClient()
    const [isUploading, setIsUploading] = useState(false)
    const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { data: files = [], isLoading } = useProjectFiles(projectId)
    const { mutateAsync: uploadFile } = useUploadProjectFile()
    const { mutateAsync: deleteFile } = useDeleteProjectFile()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!projectId || !userData?.user?.id) return

        setIsUploading(true)
        try {
            const file = acceptedFiles[0]
            await uploadFile({
                file,
                projectId,
                userId: userData.user.id
            })

            toast.success('File uploaded successfully')
            queryClient.invalidateQueries(queryKeys.projectFiles(projectId))
        } catch (error) {
            console.error('Error uploading file:', error)
            toast.error('Failed to upload file')
        } finally {
            setIsUploading(false)
        }
    }, [projectId, userData?.user?.id, uploadFile, queryClient])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024, // 50MB
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/plain': ['.txt']
        }
    })

    if (isLoading) {
        return (
            <Card className="p-8 text-center">
                <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
                <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
            </Card>
        )
    }

    const handleDelete = async (file: ProjectFile) => {
        setFileToDelete(file)
    }

    const confirmDelete = async () => {
        if (!fileToDelete) return

        setIsDeleting(true)
        try {
            await deleteFile(fileToDelete.id)
            toast.success('File deleted successfully')
            await queryClient.invalidateQueries(queryKeys.projectFiles(projectId))
        } catch (error) {
            console.error('Error deleting file:', error)
            toast.error('Failed to delete file')
        } finally {
            setIsDeleting(false)
            setFileToDelete(null)
        }
    }

    const handleDownload = async (file: ProjectFile) => {
        try {
            // Get the signed URL
            const urlResponse = await fetch(`/api/files/${file.storage_path}/download`)
            const { url } = await urlResponse.json()

            // Fetch the actual file
            const fileResponse = await fetch(url)
            const blob = await fileResponse.blob()

            // Create object URL and trigger download
            const objectUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = file.name
            document.body.appendChild(link)
            link.click()

            // Cleanup
            document.body.removeChild(link)
            window.URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error('Error downloading file:', error)
            toast.error('Failed to download file')
        }
    }

    return (
        <div className="space-y-4">
            <ConfirmationModal
                open={!!fileToDelete}
                onOpenChange={(open) => !open && setFileToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete File"
                description={`Are you sure you want to delete ${fileToDelete?.name}? This action cannot be undone.`}
                loading={isDeleting}
                confirmButtonText="Delete"
            />

            <Card
                {...getRootProps()}
                className="cursor-pointer border-2 border-dashed p-8 text-center hover:border-primary"
            >
                <input {...getInputProps()} />
                {isUploading ? (
                    <>
                        <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
                        <p className="mt-2 text-sm text-muted-foreground">Uploading file...</p>
                    </>
                ) : isDragActive ? (
                    <>
                        <Icons.upload className="mx-auto h-6 w-6" />
                        <p className="mt-2 text-sm text-muted-foreground">Drop the file here</p>
                    </>
                ) : (
                    <>
                        <Icons.upload className="mx-auto h-6 w-6" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            Drag and drop a file here, or click to select a file
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Supported formats: PNG, JPG, JPEG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT
                            <br />
                            Maximum file size: 50MB
                        </p>
                    </>
                )}
            </Card>

            {files.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {files.map((file) => (
                        <Card key={file.id} className="overflow-hidden">
                            <FilePreview file={file} />
                            <div className="p-3">
                                <p className="truncate text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                                <div className="mt-2 flex justify-end space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(file)}
                                        className="h-8 w-8"
                                    >
                                        <Icons.download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(file)}
                                        className="h-8 w-8"
                                    >
                                        <Icons.trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <Icons.file className="mx-auto h-6 w-6" />
                    <p className="mt-2 text-sm text-muted-foreground">No files uploaded yet</p>
                </Card>
            )}
        </div>
    )
} 