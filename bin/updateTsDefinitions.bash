#!/bin/bash

URL="https://raw.githubusercontent.com/danielyxie/bitburner/master/dist/bitburner.d.ts"
wget -O "src/lib/Bitburner.t.ts" "${URL}"
