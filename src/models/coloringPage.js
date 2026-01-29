/**
 * Coloring Page model
 */
export class ColoringPage {
  constructor(data) {
    this.id = data.id || ''
    this.userId = data.userId || ''
    this.title = data.title || ''
    this.prompt = data.prompt || ''
    this.imageUrl = data.imageUrl || ''
    this.thumbnailUrl = data.thumbnailUrl || ''
    this.type = data.type || 'text' // text, wordArt, drawing, photo
    this.style = data.style || 'fast'
    this.dimensions = data.dimensions || '2:3'
    this.isFavorite = data.isFavorite || false
    this.folderId = data.folderId || null
    this.createdAt = data.createdAt || new Date().toISOString()
  }
}
