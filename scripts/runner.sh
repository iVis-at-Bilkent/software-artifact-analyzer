#!/usr/bin/env bash
PATH=/usr/bin:/bin:/home/ivis/.nvm/versions/node/v14.19.3/bin
echo "starting runner $(date)" >> bash-script.log
npm i >> bash-script.log
npm run ng build >> bash-script.log
sudo "$(which node)" server.js >> bash-script.log
echo "runner ended $(date)" >> bash-script.log