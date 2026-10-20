#!/usr/bin/env bash
cd ~/ai-project/AI
echo "វាយសំណួរ ហើយចុច Enter (ទទេ + Enter ដើម្បីចេញ)"
while true; do
  read -r -p "
សំណួរ: " q < /dev/tty
  [ -z "$q" ] && break
  node eval/ask.mjs "$q"
done
