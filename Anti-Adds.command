#!/bin/bash
cd "$(dirname "$0")"
chmod +x start_silent.sh
./start_silent.sh
osascript -e 'tell application "Terminal" to quit' &
exit
