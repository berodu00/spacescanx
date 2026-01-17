import { put, del } from '@vercel/blob'
import { nanoid } from 'nanoid'

export async function uploadVideo(file: File) {
    const filename = `${nanoid()}-${file.name}`
    const blob = await put(filename, file, {
        access: 'public',
    })
    return blob
}

export async function deleteVideo(url: string) {
    await del(url)
}
