#!/bin/bash

echo "* * * Checking internet connection... * * *"
wget -q --tries=10 --timeout=20 --spider http://google.com
if [[ $? -eq 0 ]]; then
	echo "...online!"
else
	echo "ERROR: no internet connection!"
	exit 1
fi

echo "* * * Updating * * *"
sudo apt-get update >> /dev/null

echo "* * * Installing gpac * * *"
sudo apt-get install gpac -y >> /dev/null

echo "* * * Installing flask * * *"
pip3 install flask >> /dev/null

echo "* * * Installing imageio * * *"
pip3 install imageio >> /dev/null

echo "* * * Setting autostart for: server.py * * *"
sudo touch /lib/systemd/system/capture360.service
echo "[Unit]" >> /lib/systemd/system/capture360.service
echo "Description=Capture360 server service" >> /lib/systemd/system/capture360.service
echo "After=multi-user.target" >> /lib/systemd/system/capture360.service
echo "[Service]" >> /lib/systemd/system/capture360.service
echo "ExecStart=/usr/bin/python3 -u server.py" >> /lib/systemd/system/capture360.service
echo "WorkingDirectory=/home/pi/capture360/" >> /lib/systemd/system/capture360.service
echo "StandardOutput=inherit" >> /lib/systemd/system/capture360.service
echo "StandardError=inherit" >> /lib/systemd/system/capture360.service
echo "Restart=always" >> /lib/systemd/system/capture360.service
echo "User=pi" >> /lib/systemd/system/capture360.service
echo "[Install]" >> /lib/systemd/system/capture360.service
echo "WantedBy=multi-user.target" >> /lib/systemd/system/capture360.service
sudo chmod 644 /lib/systemd/system/capture360.service
sudo systemctl daemon-reload
sudo systemctl enable capture360.service

echo " "
echo " "
echo "*******************************"
echo "      INSTALLATION DONE!       "
echo "*******************************"
echo "Rebooting..."

sudo reboot