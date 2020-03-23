#!/bin/bash


npm run build

tar -czf build.tar.gz dist/

echo $SSH_KEY > ./id_rsa && chmod 400 ./id_rsa


scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ./id_rsa build.tar.gz netlify@34.93.26.100:/home/netlify/releases/
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ./id_rsa netlify@34.93.26.100 'cd /home/netlify/releases/; tar xf build.tar.gz; cp -rf /opt/care_fe/dist /opt/care_fe/dist.old; mv dist /opt/care_fe/dist'

rm ./id_rsa
