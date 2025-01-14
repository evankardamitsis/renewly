"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useUserContext } from '@/hooks/useUserContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { formatBytes } from '@/lib/utils/file-utils'
import { useProjectFiles, useUploadProjectFile, useDeleteProjectFile } from '@/lib/react-query'
import type { ProjectFile } from '@/lib/types/project-files'

interface ProjectFilesProps {
    projectId: string
}

const queryKeys = {
    projectFiles: (projectId: string) => ({
        queryKey: ['project-files', projectId]
    })
} as const

export function ProjectFiles({ projectId }: ProjectFilesProps) {
    const { data: userData } = useUserContext()
    const queryClient = useQueryClient()
    const [isUploading, setIsUploading] = useState(false)
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
        try {
            await deleteFile(file.id)
            toast.success('File deleted successfully')
            queryClient.invalidateQueries(queryKeys.projectFiles(projectId))
        } catch (error) {
            console.error('Error deleting file:', error)
            toast.error('Failed to delete file')
        }
    }

    return (
        <div className="space-y-4">
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
                <div className="space-y-2">
                    {files.map((file) => (
                        <Card key={file.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                                <Icons.file className="h-6 w-6" />
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" asChild>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/project-files/${file.storage_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Icons.download className="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(file)}
                                >
                                    <Icons.trash className="h-4 w-4" />
                                </Button>
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