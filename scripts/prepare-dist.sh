#!/bin/bash

npx tsc --project tsconfig.dist.json

cp README.md CHANGELOG.md LICENSE ./dist

jq 'del(.devDependencies) | del(.scripts)' package.json > ./dist/package.json