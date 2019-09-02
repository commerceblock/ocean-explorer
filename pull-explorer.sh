#!/bin/bash

rm -rf ocean-explorer

echo "Cloning ocean explorer repository..."
git clone git@github.com:commerceblock/ocean-explorer.git "ocean-explorer"
cd "ocean-explorer"

echo "Removing un-needed files..."
rm -rf .git
rm -rf views/
rm -rf public/*

echo "Running yarn..."
yarn

cd ".."

echo "Running asset compilation yarn & compiling assets..."
yarn

echo "Compiling assets & templates..."
yarn prod

echo "Complete! To start the node server update ocean-explorer/helpers/env.js & run 'cd ocean-explorer && yarn start'"
