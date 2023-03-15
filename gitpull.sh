#!/bin/bash
cd /home/ivis/visuall/software-artifact-analyzer
git checkout -- .
echo "git pull started $(date)"
sudo git pull
echo "git pull ended $(date)"