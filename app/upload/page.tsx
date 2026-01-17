'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadVideoAction } from '@/actions/upload'
import { useUser, SignInButton } from '@clerk/nextjs'

export default function UploadPage() {
    const { isLoaded, isSignedIn, user } = useUser()
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<string>('')
    const [jobId, setJobId] = useState<string>('')

    if (!isLoaded) return <div>Loading...</div>

    // if (!isSignedIn) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    //             <p className="text-lg">Please sign in to upload space scans.</p>
    //             <SignInButton mode="modal">
    //                 <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
    //                     Sign In / Sign Up
    //                 </button>
    //             </SignInButton>
    //             <p className="text-sm text-red-500">Note: Auth is temporarily bypassed for testing.</p>
    //         </div>
    //     )
    // }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setStatus('Uploading...')
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await uploadVideoAction(formData)
            if (result.success) {
                setStatus('Upload successful! Redirecting...')
                setJobId(result.jobId as string)
                router.push(`/results/${result.jobId}`)
            } else {
                setStatus('Upload failed: ' + result.error)
            }
        } catch (e) {
            console.error(e)
            setStatus('Upload error occurred')
        }
    }

    return (
        <div className="p-8 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">SpaceScan Upload</h1>

            <div className="mb-4">
                <label className="block mb-2 font-medium">Select Room Scan Video</label>
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
                />
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || status === 'Uploading...'}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                Upload & Analyze
            </button>

            {status && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p>{status}</p>
                </div>
            )}
        </div>
    )
}
