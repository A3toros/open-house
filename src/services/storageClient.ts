export const storageClient = {
  async uploadMedia(file: Blob, type: 'audio' | 'photo'): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Media upload failed')
    }

    return response.json()
  },
}

