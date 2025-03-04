"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useUserContext } from '@/hooks/useUserContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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

function FilePreview({ file, onFileClick }: { file: ProjectFile; onFileClick?: () => void }) {
    const fileType = getFileTypeFromName(file.name)
    const previewUrl = `/api/files/${file.storage_path}/preview`

    // Image preview
    if (fileType.startsWith('image/')) {
        return (
            <div
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted cursor-pointer"
                onClick={onFileClick}
            >
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

    // PDF preview
    if (fileType === 'application/pdf') {
        return (
            <div
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted cursor-pointer group"
                onClick={onFileClick}
            >
                <iframe
                    src={previewUrl}
                    className="h-full w-full pointer-events-none"
                    title={`PDF preview: ${file.name}`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.maximize className="h-8 w-8 text-white" />
                    <span className="text-xs text-white mt-2">Click to expand</span>
                </div>
            </div>
        )
    }

    // CSV preview
    if (fileType === 'text/csv') {
        return (
            <div
                className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted cursor-pointer group"
                onClick={onFileClick}
            >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Icons.table className="h-12 w-12" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.maximize className="h-8 w-8 text-white" />
                    <span className="text-xs text-white mt-2">Click to view data</span>
                </div>
            </div>
        )
    }

    // Document preview (doc, docx)
    if (fileType.includes('word')) {
        return (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted p-2">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.fileText className="h-12 w-12" />
                </div>
            </div>
        )
    }

    // Spreadsheet preview (xls, xlsx)
    if (fileType.includes('excel')) {
        return (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted p-2">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.table className="h-12 w-12" />
                </div>
            </div>
        )
    }

    // Default file icon
    return (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-muted">
            <Icons.file className="h-12 w-12" />
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
    const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [csvData, setCsvData] = useState<string[][]>([])

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
            const message = error instanceof Error ? error.message : 'Failed to upload file'
            toast.error(message)
        } finally {
            setIsUploading(false)
        }
    }, [projectId, userData?.user?.id, uploadFile, queryClient])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1
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

    const getSignedUrl = async (file: ProjectFile) => {
        try {
            const response = await fetch(`/api/files/${file.storage_path}/download`)
            const { url } = await response.json()
            return url
        } catch (error) {
            console.error('Error getting signed URL:', error)
            toast.error('Failed to load preview')
            return null
        }
    }

    const handleFileSelect = async (file: ProjectFile) => {
        const type = getFileTypeFromName(file.name)
        setSelectedFile(file)

        if (type === 'application/pdf') {
            const url = await getSignedUrl(file)
            if (url) setPreviewUrl(url)
        } else if (type === 'text/csv') {
            try {
                const response = await fetch(`/api/files/${file.storage_path}/download`)
                const { url } = await response.json()
                const csvResponse = await fetch(url)
                const text = await csvResponse.text()
                // Parse CSV more robustly
                const rows = text.split(/\r?\n/).filter(Boolean).map(row => {
                    // Handle quoted values with commas
                    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
                    return matches.map(val => val.replace(/^"|"$/g, '').trim())
                })
                setCsvData(rows)
            } catch (error) {
                console.error('Error loading CSV:', error)
                toast.error('Failed to load CSV data')
            }
        }
    }

    return (
        <div className="space-y-4">
            <Dialog
                open={!!selectedFile}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedFile(null)
                        setPreviewUrl('')
                        setCsvData([])
                    }
                }}
            >
                <DialogContent className="max-w-4xl h-[80vh] flex items-center justify-center p-0">
                    <DialogTitle className="sr-only">
                        {selectedFile ? `Preview: ${selectedFile.name}` : 'File Preview'}
                    </DialogTitle>
                    {selectedFile && (
                        <div className="relative w-full h-full">
                            {getFileTypeFromName(selectedFile.name).startsWith('image/') ? (
                                <Image
                                    src={`/api/files/${selectedFile.storage_path}/preview`}
                                    alt={selectedFile.name}
                                    fill
                                    className="object-contain"
                                    sizes="80vw"
                                />
                            ) : getFileTypeFromName(selectedFile.name) === 'text/csv' && csvData.length > 0 ? (
                                <div className="w-full h-full overflow-auto p-6">
                                    <table className="w-full border-collapse bg-background">
                                        <thead className="sticky top-0 bg-background">
                                            <tr>
                                                {csvData[0]?.map((header, i) => (
                                                    <th key={i} className="border px-4 py-2 bg-muted text-left">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvData.slice(1).map((row, i) => (
                                                <tr key={i}>
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="border px-4 py-2">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    className="h-full w-full"
                                    title={`PDF preview: ${selectedFile.name}`}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Icons.spinner className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
                            Supported formats: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text (TXT, CSV)
                            <br />
                            Maximum file size: 3MB
                        </p>
                    </>
                )}
            </Card>

            {files.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {files.map((file) => (
                        <Card key={file.id} className="overflow-hidden">
                            <FilePreview
                                file={file}
                                onFileClick={() => handleFileSelect(file)}
                            />
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