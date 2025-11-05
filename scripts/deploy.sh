#!/usr/bin/env sh

set -e

# dumb stuff
mv .gitignore .gitignore_temp

deno deploy --prod

mv .gitignore_temp .gitignore
