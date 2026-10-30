#!/usr/bin/env bash
# Convierte los documentos comerciales (Markdown) a .docx para subirlos a SharePoint.
set -euo pipefail
cd "$(dirname "$0")/1-sharepoint/documentos"
mkdir -p docx
for f in *.md; do
  pandoc "$f" -o "docx/${f%.md}.docx"
  echo "OK docx/${f%.md}.docx"
done
