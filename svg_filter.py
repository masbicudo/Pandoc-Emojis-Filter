#! /usr/bin/env python
"""
Pandoc filter to convert svg files to pdf as suggested at:
https://github.com/jgm/pandoc/issues/265#issuecomment-27317316
"""

__author__ = "Jerome Robert"

import mimetypes
import subprocess
import os
import sys
from pandocfilters import toJSONFilter, Image

# import cairosvg

# from svglib.svglib import svg2rlg
# from reportlab.graphics import renderPDF

# TODO add emf export if fmt=="docx" ?
fmt_to_option = {
    "latex": ("--export-pdf", "pdf"),
    "beamer": ("--export-pdf", "pdf"),
    # because of IE
    "html": ("--export-png", "png")
}


def svg_to_any(key, value, fmt, meta):
    with open("xpto123.txt", "a") as f:
        f.writelines(f"{key}\n")
        if key == 'Image':
            f.writelines(["Image"])
            f.writelines(f"{value}\n")
            attrs, alt, [src, title] = value
            mimet, _ = mimetypes.guess_type(src)
            option = fmt_to_option.get(fmt, ("--export-pdf", "pdf"))
            f.writelines(f"{mimet}\n")
            f.writelines(f"{option}\n")
            if mimet == 'image/svg+xml' and option:
                base_name, _ = os.path.splitext(src)
                eps_name = base_name + "." + option[1]
                eps_name = eps_name.replace("%20", "")
                src = src.replace("%20", " ")
                try:
                    mtime = os.path.getmtime(eps_name)
                except OSError:
                    mtime = -1
                if mtime < os.path.getmtime(src):

                    # cairosvg.svg2pdf(url=src, write_to=eps_name)

                    
                    # drawing = svg2rlg(src)
                    # renderPDF.drawToFile(drawing, eps_name)

                    import shutil
                    inkscape_path = shutil.which("inkscape")
                    cmd_line = [
                            f'"{inkscape_path}"',
                            option[0],
                            os.path.join(os.getcwd(), eps_name),
                            os.path.join(os.getcwd(), src)
                        ]
                    f.write(" ".join(cmd_line))
                    sys.stderr.write("Running %s\n" % " ".join(cmd_line))
                    os.system(" ".join(cmd_line))
                f.writelines(f"attrs={attrs}\n")
                result = Image(['', [], [("height", "1em")]], alt, [eps_name.replace("%20", " "), title])
                f.writelines(f"result={result}\n")
                return result

if __name__ == "__main__":
    toJSONFilter(svg_to_any)
