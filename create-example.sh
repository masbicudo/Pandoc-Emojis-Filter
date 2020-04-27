format=pdf
npm install
pandoc --template="template.tex" -o example.$format readme.md \
    --filter=emoji_filter.js -M emoji=noto-emoji --from gfm \
    -V links-as-notes=true -V colorlinks -V urlcolor=NavyBlue
