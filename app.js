const fs = require('fs')
const https = require('https')
const twemoji = require('twemoji')

source = "noto-emoji"
// source = "twemoji"

function imageSourceGenerator(icon, options) {
  if (source == "noto-emoji") {
    src = "https://raw.githubusercontent.com/googlefonts/noto-emoji/master/svg/emoji_u"+icon+options.ext
    dirname = "noto-emoji"
  }
  else if (source == "twemoji") {
    src = ''.concat(
      options.base, // by default Twitter Inc. CDN
      options.size, // by default "72x72" string
      '/',
      icon,         // the found emoji as code point
      options.ext   // by default ".png"
    )
    dirname = "twemoji"
  }
  filename = ''.concat(
    "./",
    dirname, // by default "72x72" string
    '/',
    icon,         // the found emoji as code point
    options.ext   // by default ".png"
  )
  if (!fs.existsSync(dirname))
    fs.mkdirSync(dirname)
  if (!fs.existsSync(filename)) {
    const file = fs.createWriteStream(filename)
    const request = https.get(src, function (response) {
      response.pipe(file)
      file.on('finish', () => {
        file.close();  // close() is async, call cb after close completes.
      })
    })
  }
  return filename
}

async function main() {
  fs.readFile("readme.md", 'utf8', function (err, data) {
    if (err) throw err
    text = twemoji.parse(data, {
      callback: imageSourceGenerator,
      ext: '.svg',
      folder: 'svg'
    })
    text = text.replace(/\<img class="emoji" draggable="false" alt="[^"]+" src="([^"]+)"\/>/g, "![]($1)")
    // text = text.replace(/┣/g, "├")
    // text = text.replace(/┃/g, "│")
    // text = text.replace(/┗/g, "└")
    fs.writeFileSync("output.md", text)
  })
}

main()
