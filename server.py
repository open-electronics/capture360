from flask import Flask, send_file, redirect, url_for, abort, request, jsonify, Response, render_template
import time
import glob
from datetime import datetime
import os
import sys
import imageio
import json
from contextlib import closing
from zipfile import ZipFile, ZIP_DEFLATED
import RPi.GPIO as GPIO
from Motor import Motor
import picamera



app = Flask(__name__)

global motor, Config, CurrentShoot, ShootSettings, ShootFinished, ShootStatus

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BOARD)

motor = Motor(12, 11, 7, 32, 200)
Config = {}
CurrentShoot = None
ShootSettings = (None, None, None, None)
ShootFinished = False
ShootProgress = 0
ShootStatus = ""

#   Main page
@app.route("/")
def Index():
    return render_template('index.html')


#   Start shooting
@app.route("/start", methods = ['POST'])
def Start():
    global CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    if CurrentShoot == None:
        CreateShooting(request.form["mode"], request.form["resolution"], request.form["pics"], request.form["fps"], request.form["turns"])
        return ""
    else:
        return "Arleady shooting!"


#   Stop shooting
@app.route("/stop", methods = ['POST'])
def Stop():
    global CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    if CurrentShoot != None:
        DeleteShoot(CurrentShoot)
        CurrentShoot = None
        ShootSettings = (None, None, None, None)
        ShootFinished = True
        ShootProgress = 0
        ShootStatus = ""
        return ""
    else:
        return "Nothing to stop!"


#   Set trigger button mode and parameters
@app.route("/set_trigger_button", methods = ['POST'])
def SetTriggerButton():
    global Config
    Config["Mode"] = int(request.form["mode"])
    Config["Resolution"] = request.form["resolution"]
    Config["Pics"] = int(request.form["pics"])
    Config["FPS"] = int(request.form["fps"])
    Config["Turns"] = int(request.form["turns"])
    try:
        with open("static/config/config.json", "w") as ConfigFile:
            json.dump(Config, ConfigFile)
    except:
        print("ERROR: Can't write configuration file.")
        sys.exit()
    if(Config["Mode"] == 0):
        return "Trigger button set to photo"
    elif(Config["Mode"] == 1):
        return "Trigger button set to GIF"
    else:
        return "Trigger button set to video"
        
        
#   Shooting procedure 
@app.route("/shoot", methods = ['POST'])
def Shoot():
    global CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    if CurrentShoot != None and ShootSettings[0] != None:
        Mode = int(CurrentShoot.split("_")[2])
        #   Photo or GIF
        if Mode == 0 or Mode == 1:
            Cont = 0        
            #   Turns
            for j in range(ShootSettings[3]):
                #   Pics per single turn
                for i in range(ShootSettings[1]):
                    if CurrentShoot != None:
                        motor.MoveDegrees(360 / ShootSettings[1])
                        time.sleep(0.1)
                        Done = False
                        while not Done and CurrentShoot != None:
                            try:
                                with picamera.PiCamera() as camera:
                                    camera.resolution = (int(ShootSettings[0].split("x")[0]), int(ShootSettings[0].split("x")[1]))
                                    time.sleep(1.5)
                                    camera.capture("static/shoot/" + CurrentShoot + "/" + str(Cont) + ".jpg")
                                    Done = True
                            except:
                                pass
                        time.sleep(0.6)
                        Cont += 1
                        ShootProgress = int(Cont * 100 / (ShootSettings[3] * ShootSettings[1]))
        #   Video
        else:
            Done = False
            while not Done and CurrentShoot != None:
                try:
                    with picamera.PiCamera(framerate = ShootSettings[2]) as camera:
                        camera.resolution = (int(ShootSettings[0].split("x")[0]), int(ShootSettings[0].split("x")[1]))
                        camera.start_recording("static/shoot/" + CurrentShoot + "/video.h264")
                        for i in range(360 * ShootSettings[3]):
                            motor.MoveDegrees(1)
                            ShootProgress = int(i * 100 / (360 * ShootSettings[3]))
                        camera.stop_recording()
                        Done = True
                except:
                    pass
        #   End: make ZIP
        if Mode == 0:
            ShootStatus = "Shooting finished. Creating ZIP..."
            if os.path.isdir("static/shoot/" + CurrentShoot):
                os.system("sudo cp -R static/widget/ static/shoot/w_" + CurrentShoot)
                os.system("sudo cp static/shoot/" + CurrentShoot + "/* static/shoot/w_" + CurrentShoot + "/img/")
                os.system("sudo sed -i 's/CHANGE_THIS/" + str(ShootSettings[3] * ShootSettings[1]) + "/g' static/shoot/w_" + CurrentShoot + "/index.html")
                ZipDir("static/shoot/w_" + CurrentShoot, "static/shoot/" + CurrentShoot + ".zip")
                os.system("sudo rm -R static/shoot/w_" + CurrentShoot)
        #   End: make GIF
        if Mode == 1:
            ShootStatus = "Shooting finished. Creating GIF..."
            FileList = glob.glob("static/shoot/" + CurrentShoot + "/*.jpg")
            list.sort(FileList, key=lambda x: int(x.split(".jpg")[0].split("/")[3])) 
            with imageio.get_writer("static/shoot/" + CurrentShoot + "/animation.gif", mode='I', duration=(1/ShootSettings[2])) as writer:
                for filename in FileList:
                    image = imageio.imread(filename)
                    writer.append_data(image)
        #   End: convert video in mp4
        if Mode == 2:
            ShootStatus = "Video finished. Converting video..."
            os.system("sudo MP4Box -add static/shoot/" + CurrentShoot + "/video.h264 static/shoot/" + CurrentShoot + "/video.mp4")
            os.system("sudo rm static/shoot/" + CurrentShoot + "/video.h264")
        #   Shooting finished
        CurrentShoot = None
        ShootSettings = (None, None, None, None)
        ShootFinished = True
        ShootStatus = ""
    return ""


#   Return updated status of the system (shooting or not, current shooting, mode ...)
@app.route("/status", methods = ['POST'])
def Status():
    global Config, CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    if CurrentShoot == None:
        try:
            with picamera.PiCamera() as camera:
                camera.resolution = (640, 480)
                Done = False
                while not Done:
                    try:
                        camera.capture("static/preview/preview.jpg")
                        Done = True
                    except:
                        pass
        except:
            pass
    return jsonify({"CurrentFolder": CurrentShoot,
                    "ShootFinished": ShootFinished,
                    "ShootProgress": ShootProgress,
                    "ShootStatus": ShootStatus,
                    "Resolution": ShootSettings[0],
                    "Pics": ShootSettings[1],
                    "FPS": ShootSettings[2],
                    "Turns": ShootSettings[3],
                    "Config": Config,
                    })


#   Return list of shoots
@app.route("/refresh", methods = ['POST'])
def Refresh():
    return jsonify({"Dirs": SubDirs("static/shoot")})


#   Shutdown
@app.route("/shutdown", methods = ['POST'])
def Shutdown():
    os.system("sudo shutdown -h now")
    return ""


#   Delete given shoot
@app.route("/delete", methods = ['POST'])
def DeleteShoot(s = None):
    if s == None:
        os.system("sudo rm -rf static/shoot/" + request.form["shoot"])
        os.system("sudo rm static/shoot/" + request.form["shoot"] + ".zip")
    else:
        os.system("sudo rm -rf static/shoot/" + s)
        os.system("sudo rm static/shoot/" + s + ".zip")
    return ""
    
    
#   Delete all shootings
@app.route("/delete_all", methods = ['POST'])
def DeleteAll(s = None):
    os.system("sudo rm -rf static/shoot/*")
    return ""
    
    
#   Create new shooting (start shooting)
def CreateShooting(mode, res, pics, fps, turns):
    global CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    CurrentShoot = datetime.now().strftime("%Y-%m-%d_%H-%M-%S_" + str(mode))
    os.makedirs("static/shoot/" + CurrentShoot)
    ShootSettings = (res, int(pics), int(fps), int(turns))
    ShootFinished = False
    ShootProgress = 0
    ShootStatus = "Recording..."


#   Return subdirs in a given dir
def SubDirs(a_dir):
    global CurrentShoot, ShootSettings, ShootFinished, ShootProgress, ShootStatus
    shoot = []
    for name in os.listdir(a_dir):
        if os.path.isdir(os.path.join(a_dir, name)) and name != str(CurrentShoot) and name != "w_" + str(CurrentShoot):
            shoot.append(name)
    return shoot


#   ZIP directory
def ZipDir(basedir, archivename):
    assert os.path.isdir(basedir)
    with closing(ZipFile(archivename, "w", ZIP_DEFLATED)) as z:
        for root, dirs, files in os.walk(basedir):
            for fn in files:
                if fn == archivename:
                    continue
                absfn = os.path.join(root, fn)
                zfn = absfn[len(basedir)+len(os.sep):]
                z.write(absfn, zfn)

                
#   Trigger button (physical)
def TriggerButton():
    global Config, CurrentShoot
    while True:
        if GPIO.input(int(Config["TriggerGPIO"])) == GPIO.HIGH and CurrentShoot == None:
            CreateShooting(Config["Mode"], Config["Resolution"], Config["Pics"], Config["FPS"], Config["Turns"])

            
#   Trigger button (web)
@app.route("/trigger", methods = ['POST'])            
def Trigger():
    global CurrentShoot
    if CurrentShoot == None:
        CreateShooting(Config["Mode"], Config["Resolution"], Config["Pics"], Config["FPS"], Config["Turns"])
        return ""
    else:
        return "Arleady shooting!"
 


if __name__ == '__main__':
    
    try:
        with open("static/config/config.json") as ConfigFile:
            Config = json.load(ConfigFile)
    except:
        print("ERROR: Can't load configuration file.")
        sys.exit()
        
    GPIO.setup(int(Config["TriggerGPIO"]), GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
    GPIO.add_event_detect(int(Config["TriggerGPIO"]), GPIO.RISING, callback=TriggerButton)

    
    app.run(host = '0.0.0.0', port = 5000, threaded = True)


