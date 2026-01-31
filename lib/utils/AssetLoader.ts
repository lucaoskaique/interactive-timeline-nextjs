import * as THREE from 'three'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import progressPromise from './progressPromise'

export interface CustomTexture extends THREE.Texture {
  size?: THREE.Vector2
  mediaType?: 'image' | 'video'
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
}

interface Assets {
  textures: {
    [month: string]: {
      [filename: string]: CustomTexture
    }
  }
  fonts: {
    [fontName: string]: Font
  }
}

interface AssetList {
  [month: string]: string[]
}

export default class AssetLoader {
  isMobile: boolean
  assets: Assets
  assetList: AssetList
  renderer: THREE.WebGLRenderer | null
  progressEl: HTMLElement | null
  progressBar: HTMLElement | null
  videosToLoad: number

  constructor(isMobile: boolean) {
    this.isMobile = isMobile
    this.assets = {
      textures: {},
      fonts: {},
    }
    this.assetList = {}
    this.renderer = null
    this.progressEl = document.querySelector('.progress-percent')
    this.progressBar = document.querySelector('.progress-circle .line')
    this.videosToLoad = 0
  }

  load(assetList: AssetList, renderer: THREE.WebGLRenderer): Promise<Assets> {
    this.assetList = assetList
    this.renderer = renderer

    const assetLoadPromises: Promise<any>[] = []

    // Load images + videos
    const imageLoader = new THREE.TextureLoader()
    imageLoader.crossOrigin = ''

    const preload = true

    for (const month in this.assetList) {
      this.assetList[month].forEach((filename) => {
        if (~filename.indexOf('.mp4')) {
          const video = document.createElement('video')
          video.style.cssText = 'position:absolute;height:0'
          video.muted = true
          video.autoplay = false
          video.loop = true
          video.crossOrigin = 'anonymous'
          video.setAttribute('muted', 'true')
          video.setAttribute('webkit-playsinline', 'true')
          video.setAttribute('playsinline', 'true')
          video.preload = 'metadata'
          video.src = `assets/${month}/${filename}`
          document.body.appendChild(video)
          video.load() // must call after setting/changing source

          if (preload) {
            assetLoadPromises.push(
              new Promise((resolve) => {
                this.videoPromise(video, month, filename, resolve)
              })
            )
          } else {
            this.createVideoTexture(video, month, filename, null)
          }
        } else {
          if (preload) {
            assetLoadPromises.push(
              new Promise((resolve) => {
                imageLoader.load(`assets/${month}/${filename}`, (texture) =>
                  this.createImageTexture(texture, month, filename, resolve)
                )
              })
            )
          } else {
            this.createImageTexture(null, month, filename, null)
          }
        }
      })
    }

    // Load Fonts
    const fontLoader = new FontLoader()
    const fonts = [
      'fonts/gentilis_bold.typeface.json',
      'fonts/gentilis_regular.typeface.json',
      'fonts/helvetiker_bold.typeface.json'
    ]

    for (let i = 0; i < fonts.length; i++) {
      assetLoadPromises.push(
        new Promise((resolve) =>
          fontLoader.load(fonts[i], (font) => {
            this.assets.fonts[font.data.familyName] = font
            resolve(undefined)
          })
        )
      )
    }

    return new Promise((resolve) => {
      progressPromise(assetLoadPromises, this.update.bind(this)).then(() => {
        resolve(this.assets)
      })
    })
  }

  update(completed: number, total: number): void {
    const progress = Math.round((completed / total) * 100)
    if (this.progressEl) this.progressEl.innerHTML = progress + '%'
    if (this.progressBar) {
      ;(this.progressBar as HTMLElement).style.strokeDashoffset = String(
        252.363 - 252.363 * (completed / total)
      )
    }
  }

  videoPromise(
    video: HTMLVideoElement,
    month: string,
    filename: string,
    resolve: (value: any) => void,
    retry?: boolean
  ): void {
    if (retry) video.load()

    if (!this.isMobile) {
      video.oncanplaythrough = () => this.createVideoTexture(video, month, filename, resolve)
    } else {
      video.onloadeddata = () => {
        video.onerror = null
        this.createVideoTexture(video, month, filename, resolve)
      }

      video.onerror = () => {
        video.onloadeddata = null
        this.videoPromise(video, month, filename, resolve, true)
      }
    }
  }

  createImageTexture(
    texture: THREE.Texture | null,
    month: string,
    filename: string,
    resolve: ((value: any) => void) | null
  ): void {
    // if preloaded
    if (resolve && texture) {
      const customTexture = texture as CustomTexture
      const image = customTexture.image as HTMLImageElement
      customTexture.size = new THREE.Vector2(image.width / 2, image.height / 2)
      customTexture.needsUpdate = true

      customTexture.name = `${month}/${filename}`
      customTexture.mediaType = 'image'
      customTexture.anisotropy = this.renderer!.capabilities.getMaxAnisotropy()

      if (!this.assets.textures[month]) this.assets.textures[month] = {}
      this.assets.textures[month][filename] = customTexture

      resolve(customTexture)
    } else {
      const loadedTexture = new THREE.TextureLoader().load(
        `assets/${month}/${filename}`,
        (tex) => {
          const customTex = tex as CustomTexture
          const image = customTex.image as HTMLImageElement
          customTex.size = new THREE.Vector2(image.width / 2, image.height / 2)
          customTex.needsUpdate = true
        }
      ) as CustomTexture
      loadedTexture.size = new THREE.Vector2(10, 10)

      loadedTexture.name = `${month}/${filename}`
      loadedTexture.mediaType = 'image'
      loadedTexture.anisotropy = this.renderer!.capabilities.getMaxAnisotropy()

      if (!this.assets.textures[month]) this.assets.textures[month] = {}
      this.assets.textures[month][filename] = loadedTexture
    }
  }

  createVideoTexture(
    video: HTMLVideoElement,
    month: string,
    filename: string,
    resolve: ((value: any) => void) | null
  ): void {
    const texture = new THREE.VideoTexture(video) as CustomTexture
    texture.minFilter = texture.magFilter = THREE.LinearFilter
    texture.name = `${month}/${filename}`
    texture.mediaType = 'video'
    texture.anisotropy = this.renderer!.capabilities.getMaxAnisotropy()

    // if preloaded
    if (resolve) {
      const video = texture.image as HTMLVideoElement
      texture.size = new THREE.Vector2(
        video.videoWidth / 2,
        video.videoHeight / 2
      )

      if (!this.isMobile) {
        video.oncanplaythrough = null
      } else {
        video.src = ''
        video.load()
        video.onloadeddata = null
      }

      resolve(texture)
    } else {
      texture.size = new THREE.Vector2(1, 1)

      video.oncanplaythrough = () => {
        const videoEl = texture.image as HTMLVideoElement
        texture.size = new THREE.Vector2(
          videoEl.videoWidth / 2,
          videoEl.videoHeight / 2
        )
        texture.needsUpdate = true
        video.oncanplaythrough = null
      }
    }

    if (!this.assets.textures[month]) this.assets.textures[month] = {}
    this.assets.textures[month][filename] = texture
  }
}

export type { Assets, AssetList }
