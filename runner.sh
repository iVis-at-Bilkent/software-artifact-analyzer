#!/usr/bin/env bash
PATH=/usr/bin:/bin:/home/ivis/.nvm/versions/node/v14.19.3/bin
echo "starting runner $(date)" >> bash-script.log
npm i 
npm run ng build 
sudo "$(which node)" server.js 
echo "runner ended $(date)" 