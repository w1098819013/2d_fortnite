#!/bin/bash
PORT_NUM="$1";

if [ -z "$PORT_NUM" ];
then
    echo "Usage: ./setup.bash PORT_NUM"
	echo "Hint: ./setup.bash [10230:10239]" # our port range is 10230-10239

    exit 0
fi

sed -e "s/PORT_NUM/$PORT_NUM/"  port_number_template.js > port_number.js

sqlite3 db/database.db < db/schema.sql

npm install