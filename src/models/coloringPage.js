/**
 * Coloring Page model
 * @typedef {'processing' | 'completed' | 'failed'} ColoringPageStatus
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
    // Async generation: treat missing status as completed for backward compatibility
    this.status = data.status ?? 'completed'
    this.errorMessage = data.errorMessage ?? null
  }
}
