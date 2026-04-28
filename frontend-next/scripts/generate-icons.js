const fs = require('fs')
const zlib = require('zlib')

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const FILENAME_PREFIX = 'icon-'
const ICON_DIR = './public/icons'

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const chunk = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(chunk), 0)
  return Buffer.concat([len, chunk, crc])
}

function createPNG(size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const pixels = []
  const bg = [255, 105, 0, 255]
  for (let y = 0; y < size; y++) {
    pixels.push(0)
    for (let x = 0; x < size; x++) {
      pixels.push(...bg)
    }
  }
  const idatData = zlib.deflateSync(Buffer.from(pixels))

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ])
}

if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true })
}

ICON_SIZES.forEach(size => {
  const png = createPNG(size)
  const path = `${ICON_DIR}/${FILENAME_PREFIX}${size}x${size}.png`
  fs.writeFileSync(path, png)
  console.log(`Wrote ${path} (${png.length} bytes)`)
})
