#!/bin/bash

if [ -f /run/secrets/ocean_user ]; then
    export RPC_USER="$(cat /run/secrets/ocean_user)"
fi

if [ -f /run/secrets/ocean_pass ]; then
    export RPC_PASSWORD="$(cat /run/secrets/ocean_pass)"
fi

if [ -f /run/secrets/mongo_pass ]; then
    export DB_PASSWORD="$(cat /run/secrets/mongo_pass)"
fi

if [ -f /run/secrets/mongo_user ]; then
    export DB_USER="$(cat /run/secrets/mongo_user)"
fi

case "$1" in
        explorer)
            echo "Running explorer"
	    sleep 24
            npm start
            ;;
        clear)
            echo "Clear all collections/indices"
            echo "Load blockchain data from genesis to latest block"
            node scripts/dbbuilder.js init clear
            ;;
        init)
            echo "Find latest block stored from block collection"
            echo "Continue loading blockchain data up to latest block"
            node scripts/dbbuilder.js init
            ;;
        check)
            echo "Go through all data and store anything that is missing"
            node scripts/dbbuilder.js check
            ;;
        update)
            echo "Load latest blockchain data"
            node scripts/dbbuilder.js update
            ;;
        shell)
            bash
            ;;
        *)
            echo $"Usage: $0 {explorer|clear|init|check|update}"
            exit 1

esac
