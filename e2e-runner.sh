#!/usr/bin/env bash
PATH=/usr/bin:/bin:/home/ivis/.nvm/versions/node/v14.19.3/bin
npm run e2e && bash -c "echo 'Tested on visuall.heroku.com at $(date)' >> e2e-results.txt"