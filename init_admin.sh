#!/bin/bash

# echo "Running init,create admin user..."
# npm run init || echo "Init failed or already done"

# echo "Starting app..."
# exec node app.js

docker exec 4ge-app npm run init
