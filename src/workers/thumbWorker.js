// src/workers/thumbWorker.js
// Papi — off-main-thread thumbnail generation.
// Decodes a full-res image file to a downscaled bitmap and re-encodes it as a
// small JPEG. Keeps the expensive full-res decode OFF the scroll/render path.

self.onmessage = async (e) => {
  const { id, file, maxW } = e.data
  try {
    // resizeWidth downscales during decode — we never hold the full-res bitmap.
    const bmp = await createImageBitmap(file, {
      resizeWidth: maxW,
      resizeQuality: 'medium',
    })
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    canvas.getContext('2d').drawImage(bmp, 0, 0)
    bmp.close()
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
    self.postMessage({ id, blob })
  } catch (err) {
    self.postMessage({ id, error: String(err) })
  }
}
