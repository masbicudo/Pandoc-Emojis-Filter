#!/usr/bin/env node
"use strict";

const pandoc = require("pandoc-filter")
const fs = require('fs')
const https = require('https')
const twemoji = require('twemoji')
const shell = require('shelljs')
const path = require('path')

function wait_debugger() {
	var hr=process.hrtime.bigint,f=wait_debugger,t
	while(!f._r){t=hr();debugger;if(hr()-t>100000000)f._r=true}
}

const inkscape_path = shell.which("inkscape").stdout.split("\n")[0].trim()

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

async function get_emoji(icon, source) {
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
			try {
				const request = https.get(src, function (response) {
					response.pipe(file)
					file.on('finish', () => {
						file.close();
						resolve()
					})
				})
			} catch (e) {
				reject(e)
			}
		})
	}
	return filename
}

async function replace_emojis(text, format, emoji_source, context) {
	var text_w_img = twemoji.parse(text, { callback: imageSourceGenerator })
	var split = text_w_img.split(/\<img class="emoji" draggable="false" alt="([^"]+)" src="([^"]+)"\/>/g)
	if (split.length == 1)
		return pandoc.Str(split[0])
	
	const result_array = []
	for (var it = 0; it < split.length; it += 3) {
		if (split[it] !== "") {
			result_array.push(pandoc.Str(split[it]))
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
			src = await get_emoji(src, emoji_source)
			src = svg_to_pdf(src)
			attrs.push(["height", "1em"])
			var img_emoji
			if (context == "Verbatim") {
				img_emoji = pandoc.RawInline("latex", `$\\includegraphics[${attrs.map(a=>a.join('=')).join(',')}]{${src.replace(/\\/g, '/')}}$`)
			}
			else {
				img_emoji = pandoc.Image([id, classes, attrs], caption_list, [src, "fig:"])
			}
			result_array.push(img_emoji)
		}
	}
	return result_array
}

async function codeblock_to_verbatim(code_text, format, emoji_source) {
	const context = "Verbatim"
	var items = await replace_emojis(code_text, format, emoji_source, context)
	return ([
		pandoc.RawBlock("latex", "\\begin{"+context+"}[commandchars=\\\\\\{\\}, mathescape]"),
		pandoc.Para([...(Array.isArray(items) ? items : [items]),]),
		pandoc.RawBlock("latex", "\\end{"+context+"}"),
	])
}

async function visit(obj, format, meta) {
	if (obj.__skip) return
	var { t: type, c: value } = obj

	if (meta.__debug && JSON.parse(meta.__debug.c))
		wait_debugger()

	const emoji_source = meta.emoji ? meta.emoji.c : process.env["emoji_source"] || "noto-emoji"
	if (type === "Str") {
		return await replace_emojis(value, format, emoji_source)
	}
	else if (type == "Code") {
		// var [[code_identifier, code_classes, code_attributes], code_text] = value
		// return pandoc.Code([code_identifier, code_classes, code_attributes], code_text)
	}
	else if (type == "RawBlock") {
		// var [raw_format, raw_text] = value
		// return pandoc.RawBlock(raw_format, raw_text)
	}
	else if (type == "RawInline") {
		var [raw_format, raw_text] = value
		return pandoc.RawInline(raw_format, raw_text)
	}
	else if (type == "CodeBlock") {
		var [[code_identifier, code_classes, code_attributes], code_text] = value
		return await codeblock_to_verbatim(code_text, format, emoji_source)
	}
}

async function visit_array(arr, format, meta) {
	// we could look for <pre> and </pre> tags
	return arr
}

pandoc.stdio({"single": visit, "array": visit_array})
