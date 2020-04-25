#!/usr/bin/env node
"use strict";

const pandoc = require("pandoc-filter")
const fs = require('fs')
const https = require('https')
const twemoji = require('twemoji')
const shell = require('shelljs')
const path = require('path')

const inkscape_path = shell.which("inkscape").stdout.split("\n")[0].trim()

const source = "noto-emoji"
// const source = "twemoji"

function imageSourceGenerator(icon, options) {
	return icon
}

function svg_to_pdf(src) {
	const full_target = path.join(process.cwd(), src.replace(/\.svg$/, ".pdf"))
	const full_src = path.join(process.cwd(), src)
	const cmd_line = `"${inkscape_path}" --export-pdf "${full_target}" "${full_src}"`
	if (!fs.existsSync(full_target))
		shell.exec(cmd_line)
	return full_target
}

async function get_emoji(icon) {
	var src, dirname
	if (source == "noto-emoji") {
		src = `https://raw.githubusercontent.com/googlefonts/noto-emoji/master/svg/emoji_u${icon}.svg`
		dirname = "noto-emoji"
	}
	else if (source == "twemoji") {
		src = `${twemoji.base}svg/${icon}.svg`
		dirname = "twemoji"
	}
	const filename = `./${dirname}/${icon}.svg`
	if (!fs.existsSync(dirname))
		fs.mkdirSync(dirname)
	if (!fs.existsSync(filename)) {
		const file = fs.createWriteStream(filename)
		await new Promise((resolve, reject) => {
			const request = https.get(src, function (response) {
				response.pipe(file)
				file.on('finish', () => {
					file.close();  // close() is async, call cb after close completes.
					resolve()
				})
			})
		})
	}
	return filename
}

async function replace_emojis(text) {
	var text_w_img = twemoji.parse(text, { callback: imageSourceGenerator })
	var split = text_w_img.split(/\<img class="emoji" draggable="false" alt="([^"]+)" src="([^"]+)"\/>/g)
	if (split.length == 1)
		return pandoc.Str(split[0])
	
	const result_array = []
	for (var it = 0; it < split.length; it += 3) {
		if (split[it] !== "") {
			if (/^\s+$/g.test(split[it])) result_array.push(pandoc.Space())
			else result_array.push(pandoc.Str(split[it]))
		}
		if (it + 2 < split.length && split[it + 2] !== null) {
			const id = ""
			const classes = []
			const attrs = []
			const caption_list = []
			if (split[it + 1] !== null) {
				const str_emoji = pandoc.Str(split[it + 1])
				str_emoji.__skip = true
				caption_list.push(str_emoji)
			}
			var src = split[it + 2]
			src = await get_emoji(src)
			src = svg_to_pdf(src)
			attrs.push(["height", "1em"])
			const img_emoji = pandoc.Image([id, classes, attrs], caption_list, [src, "fig:"])
			result_array.push(img_emoji)
		}
	}
	return result_array
}

function wait_debugger() {
	var time = process.hrtime()
	while(waiting) {
		debugger
		if (process.hrtime(time)[0]) waiting=false
		time = process.hrtime()
	}
}

var waiting=true
async function action(obj, format, meta) {
	if (obj.__skip) return
	var { t: type, c: value } = obj

	// wait_debugger()

	if (type === "Str") {
		return replace_emojis(value)
	}
	else if (type == "Code") {
		// var [[code_identifier, code_classes, code_attributes], code_text] = value
		// return pandoc.Code([code_identifier, code_classes, code_attributes], code_text)
	}
	else if (type == "RawBlock") {
		// var [raw_format, raw_text] = value
		// return pandoc.RawBlock(raw_format, raw_text)
	}
	else if (type == "CodeBlock") {
		// var [[code_identifier, code_classes, code_attributes], code_text] = value
		// return pandoc.CodeBlock([code_identifier, code_classes, code_attributes], code_text)
	}
}

pandoc.stdio(action);
