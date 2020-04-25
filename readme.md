# Converting MD to PDF

Markdown to PDF conversion is quite easy using `pandoc`.
The real problem arises when trying to use unicode emojis.
These emojis are becoming a real standard right now,
and they are also useful, since not only faces and hands
are represented, but also, as one can see below, they
can represent common concepts such as packages, folders
and files.

## Representing a file-system structure

<span>xpto</span>

<pre>
📦package \
┣ 📂dir1 \
┣ 📂dir2 \
┃ ┗ 📂subdir \
┣ 📜file1 \
┗ 📜file2
</pre>

📦package \
┣ 📂dir1 \
┣ 📂dir2 \
┃ ┗ 📂subdir \
┣ 📜file1 \
┗ 📜file2

## Compiling a PDF from this `readme.md` file

    node app.js
    pandoc --template="template.tex" -o out.pdf output.md --filter=svg_filter.py

# Using javascript filter via NodeJs

First, install the `pandoc-filter` from npm:

    npm install -g pandoc-filter

Then, run `pandoc` passing in the filter file name:

    pandoc --template="template.tex" -o out.pdf readme.md --filter=svg_filter.js

## References

- [Emojipedia](https://emojipedia.org/microsoft/)
- `\usepackage{pmboxdraw}`
- VSCode extension: [file-tree-generator](https://marketplace.visualstudio.com/items?itemName=Shinotatwu-DS.file-tree-generator)
- https://github.com/googlefonts/noto-emoji
