import { buildSignature } from '@berghain/signature'
import type { NextPerson, ScenarioManifest } from '../types'

class ImageLoader {
  private manifestCache = new Map<number, ScenarioManifest>()
  private imageCache = new Map<string, string>()
  private loadingPromises = new Map<string, Promise<string>>()

  async loadManifest(scenario: number): Promise<ScenarioManifest> {
    if (this.manifestCache.has(scenario)) {
      return this.manifestCache.get(scenario)!
    }

    try {
      const response = await fetch(`/manifest/scenario-${scenario}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load manifest for scenario ${scenario}`)
      }
      
      const manifest: ScenarioManifest = await response.json()
      this.manifestCache.set(scenario, manifest)
      return manifest
    } catch (error) {
      console.error(`Error loading manifest for scenario ${scenario}:`, error)
      // Return empty manifest as fallback
      return { scenario, mapping: {} }
    }
  }

  async getImageUrl(scenario: number, person: NextPerson): Promise<string> {
    try {
      // Build signature from person attributes
      const signature = buildSignature(scenario, person.attributes)
      
      // Check cache first
      const cacheKey = `${scenario}-${signature}`
      if (this.imageCache.has(cacheKey)) {
        return this.imageCache.get(cacheKey)!
      }

      // Check if already loading
      if (this.loadingPromises.has(cacheKey)) {
        return this.loadingPromises.get(cacheKey)!
      }

      // Start loading
      const loadPromise = this._loadImage(scenario, signature)
      this.loadingPromises.set(cacheKey, loadPromise)

      const url = await loadPromise
      this.loadingPromises.delete(cacheKey)
      this.imageCache.set(cacheKey, url)
      
      return url
    } catch (error) {
      console.error('Error getting image URL:', error)
      // TODO: Fallback to /people/fallback.webp if signature not found
      return '/people/fallback.webp'
    }
  }

  private async _loadImage(scenario: number, signature: string): Promise<string> {
    const manifest = await this.loadManifest(scenario)
    const filenames = manifest.mapping[signature]
    
    if (!filenames || filenames.length === 0) {
      // TODO: Fallback to /people/fallback.webp if signature not found
      console.warn(`No images found for signature: ${signature}`)
      return '/people/fallback.webp'
    }

    // Pick random filename for variety
    const randomIndex = Math.floor(Math.random() * filenames.length)
    const filename = filenames[randomIndex]
    
    return `/people/${filename}`
  }

  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  }

  clearCache() {
    this.imageCache.clear()
    this.manifestCache.clear()
  }
}

export const imageLoader = new ImageLoader()
