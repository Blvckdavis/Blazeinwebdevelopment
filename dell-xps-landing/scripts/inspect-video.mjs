import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()
await page.goto('http://127.0.0.1:5173/')
const result = await page.evaluate(async () => {
  const video = document.createElement('video')
  video.muted = true
  video.src = '/dell-xps-explosion.mp4'
  await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject })
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')
  let poster
  for (let i = 0; i < 4; i++) {
    video.currentTime = video.duration * (0.12 + i * 0.2)
    await new Promise((resolve) => { video.onseeked = resolve })
    ctx.drawImage(video, (i % 2) * 640, Math.floor(i / 2) * 360, 640, 360)
    if (i === 2) {
      const still = document.createElement('canvas')
      still.width = 1920; still.height = 1080
      still.getContext('2d').drawImage(video, 0, 0, 1920, 1080)
      poster = still.toDataURL('image/jpeg', 0.88).split(',')[1]
    }
  }
  return { duration: video.duration, width: video.videoWidth, height: video.videoHeight,
    contact: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], poster }
})
await mkdir('artifacts', { recursive: true })
await writeFile('artifacts/video-contact.jpg', Buffer.from(result.contact, 'base64'))
await writeFile('public/dell-xps-poster.jpg', Buffer.from(result.poster, 'base64'))
console.log({ duration: result.duration, width: result.width, height: result.height })
await browser.close()

