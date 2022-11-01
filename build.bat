@echo off
title MapsResearch Build Script

echo Compiling Typescript...
call tsc

echo Paking NodeJS...
call pkg index.js -c package.json -t node18-win

echo Zipping Files ^& Folders...
call tar -cavf MapsResearch.zip index.html main.css main.js chromium-1045629
