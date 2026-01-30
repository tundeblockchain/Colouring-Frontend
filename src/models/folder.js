/**
 * Folder model
 */
export class Folder {
  constructor(data) {
    this.id = data.id || ''
    this.userId = data.userId || ''
    this.name = data.name || ''
    this.color = data.color || '#64B5F6'
    this.createdAt = data.createdAt || new Date().toISOString()
    this.coloringPageCount = data.coloringPageCount || 0
    this.thumbnailUrl = data.thumbnailUrl || null
    this.isPinned = data.isPinned || false
  }
}
