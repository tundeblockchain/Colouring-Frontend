/**
 * Download an image from a URL and save it with the given filename.
 */
export const downloadImage = async (imageUrl, title) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title || 'coloring-page'}.png`
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Download failed:', err)
  }
}
