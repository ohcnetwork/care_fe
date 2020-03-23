#!/bin/bash


npm run build

tar -czf build.tar.gz dist/

scp build.tar.gz netlify@34.93.26.100:/home/netlify/releases/
ssh netlify@34.93.26.100 'cd /home/netlify/releases/; tar xf build.tar.gz; cp -rf /opt/care_fe/dist /opt/care_fe/dist.old; mv dist /opt/care_fe/dist'
