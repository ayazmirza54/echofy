
#!/usr/bin/env bash

FOLDER="${1:-.}"
MODE="${2:-insensitive}"

if [[ "$MODE" == "sensitive" ]]; then
    PATTERN="Echofy"
else
    PATTERN="[Ff][Ll][Oo][Ww][Vv][Oo][Ii][Cc][Ee]"
fi

grep -rIlZ --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=build \
    -e "$PATTERN" "$FOLDER" |
while IFS= read -r -d '' file; do
    sed -i "s/$PATTERN/Echofy/g" "$file"
    echo "Updated: $file"
done

echo "Replacement complete!"

