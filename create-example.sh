npm install

pandoc --template="template.tex" -o example.pdf readme.md \
    --filter=emoji_filter.js -M emoji=noto-emoji --from gfm
