#!/bin/bash

# Base download
URL="https://raw.githubusercontent.com/danielyxie/bitburner/master/dist/bitburner.d.ts"
outFile="src/lib/Bitburner.t.ts"
wget -O "${outFile}" "${URL}"

# The game defines objects in Bitburner.t.ts in a slightly different format than we want them

# Remove all the existing exports so we can package it up in our own module
sed -i 's/export declare //' $outFile

# Remove the empty export at the end of the file
sed -i 's/export { }//' $outFile

# Export everything in its own module
sed -i '1s/^/declare module "Bitburner" {\n/' $outFile
echo '}' >> $outFile
