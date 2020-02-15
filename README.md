# Capture360 - Photograph and share your creations @ 360 degrees!

## Hardware (www.futurashop.it)
- Raspberry Pi 3 A+
- MicroSD card (4Gb minimum)
- Pi Camera
- Stepper motor driver for Raspberry Pi
- Stepper motor NEMA 17
- DC/DC step down (12V -> 5V)
- 12V 2A power supply

## Setup
1) Download "Raspbian Buster with desktop" and flash your MicroSD card
2) Before remove your MicroSD card from your PC, create "ssh" empty file and "wpa_supplicant.conf" file and for this last file put inside it these lines:
```
country=US  # Your 2-digit country code
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
network={
    ssid="YOUR_NETWORK_NAME"
    psk="YOUR_PASSWORD"
    key_mgmt=WPA-PSK
}
```
3) Put MicroSD card in your Raspberry Pi, switch on the power supply and wait few seconds
4) Discover the IP of your Raspberry Pi and connect to it with Putty or MobaXTerm in SSH
5) Execute sudo raspi-config and make the configuration (this is valid for italian Raspberry Pi):
```
Network Options -> Hostname: capture360
Boot Options -> Desktop/CLI: Desktop autologin
Localisation Options -> Change Locale: it_IT.UTF-8 UTF-8, seleziona it_IT.UTF-8
Localisation Options -> Change Timezone: Europe, Rome
Localisation Options -> Change Keyboard Layout
Localisation Options -> Change WiFi Country: IT
Interfacing Options -> Camera: Yes
Advanced Options -> Expand Filesystem
```
6) Reboot
7) Reconnect to SSH and execute this sequence of commands one by one:
```
cd /home/pi/
git clone https://github.com/open-electronics/capture360.git
cd capture360/
sudo chmod a+x install.sh
sudo bash install.sh
```
8) After the automatic reboot at the end of setup open your browser and go to:   http://capture360:5000/
9) Have fun!
