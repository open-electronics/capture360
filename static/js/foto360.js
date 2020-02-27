//	Initialize form elements
$(document).ready(function(){
	$(".collapsible").collapsible();
	//	Photo
	$("#PhotoBtnStop").hide();
    $("#PhotoProgress").css("width", "0%");
	//	GIF
	$("#GIFBtnStop").hide();
    $("#GIFProgress").css("width", "0%");
	//	Video
	$("#VideoBtnStop").hide();
    $("#VideoProgress").css("width", "0%");
    GetStatus();
    RefreshList();
    setInterval(GetStatus, 2000);
    setInterval(RefreshList, 3000);
});

//  Variables
CurrentMode = null;

//	mode: 0 Photo, 1 GIF, 2 Video
function Start(mode) {
	var m = mode;
	switch(mode) {
		case 0:
			var r = $("#PhotoResolution").val();
			var p = $("#PhotoShoots").val();
			var f = 1;
			var t = 1;
		break;
		case 1:
			var r = $("#GIFResolution").val();
			var p = $("#GIFShoots").val();
			var f = $("#GIFFPS").val();
			var t = $("#GIFTurns").val();
		break;
		case 2:
			var r = $("#VideoResolution").val();
            var p = 1;
			var f = $("#VideoFPS").val();
			var t = $("#VideoTurns").val();
		break;
	}
	$.ajax({
		type: "POST",
		url: "/start",
		data : {
			mode : m,
			resolution : r,
			pics : p,
			fps : f,
			turns : t
		},
		cache: false
	}).done(function( data ) {
		if (data != "") {
            M.toast({html: data});
        } else {
            CurrentMode = mode;
            switch(mode) {
                case 0:
                    $("#PhotoBtnStart").html("Wait...");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#GIFBtnInizia").addClass("disabled");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#PhotoBtnStop").show();
                    $("#PhotoProgress").css("width", "0%");
                    $("#PhotoStatus").html("<i></i>");
                break;
                case 1:
                    $("#GIFBtnStart").html("Wait...");
                    $("#GIFBtnStart").addClass("disabled");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#GIFBtnStop").show();
                    $("#GIFProgress").css("width", "0%");
                    $("#GIFStatus").html("<i></i>");
                break;
                case 2:
                    $("#VideoBtnStart").html("Wait...");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#GIFBtnStart").addClass("disabled");
                    $("#VideoBtnStop").show();
                    $("#VideoProgress").css("width", "0%");
                    $("#VideoStatus").html("<i></i>");
                break;
            }
            $.ajax({
                type: "POST",
                url: "/shoot",
                cache: false
            });
        }
	});
}

//  Trigger button: start shooting from trigger button setup
function Trigger() {

	$.ajax({
		type: "POST",
		url: "/trigger",
		cache: false
	}).done(function( data ) {
		if (data != "") {
            M.toast({html: data});
        } else {
            $.ajax({
                type: "POST",
                url: "/shoot",
                cache: false
            });
        }
	});
    
}

//	mode: 0 Foto, 1 GIF, 2 Video
function Stop(mode) {
	$.ajax({
		type: "POST",
		url: "/stop",
		cache: false
	}).done(function( data ) {
		if (data != "") {
            M.toast({html: data});
        } else {
            ResetControls(mode, false);
        }
	});
}


//  Get shooting status
function GetStatus() {
	$.ajax({
		type: "POST",
		url: "/status",
        dataType: "json",
		cache: false
	}).done(function( data ) {
        //  Check if shooting is finished
		if(CurrentMode != null && data.ShootFinished == true) {
            ResetControls(CurrentMode, true);
            CurrentMode = null;
        }
        //  Refresh page? Check if shooting is running and set web form
        if(CurrentMode == null && data.CurrentFolder != null) {
            CurrentMode = parseInt(data.CurrentFolder.split("_")[2]);
            switch(CurrentMode) {
                case 0:
                    $("#PhotoBox").addClass("active");
                    $("#PhotoBtnStart").html("Wait...");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#GIFBtnStart").addClass("disabled");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#PhotoBtnStop").show();
                break;
                case 1:
                    $("#GIFBox").addClass("active");
                    $("#GIFBtnStart").html("Wait...");
                    $("#GIFBtnStart").addClass("disabled");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#GIFBtnStop").show();
                break;
                case 1:
                    $("#VideoBox").addClass("active");
                    $("#VideoBtnStart").html("Wait...");
                    $("#VideoBtnStart").addClass("disabled");
                    $("#PhotoBtnStart").addClass("disabled");
                    $("#GIFBtnStart").addClass("disabled");
                    $("#VideoBtnStop").show();
                break;
            }
            $(".collapsible").collapsible({accordion: false});
        }
        //  Refresh progress bar
        if (data.CurrentFolder != null) {
            CurrentMode = parseInt(data.CurrentFolder.split("_")[2]);
            switch(CurrentMode) {
                case 0:
                    $("#PhotoProgress").css("width", data.ShootProgress + "%");
                break;
                case 1:
                    $("#GIFProgress").css("width", data.ShootProgress + "%");
                break;
                case 2:
                    $("#VideoProgress").css("width", data.ShootProgress + "%");
                break;
            }
        }
        //  Refresh preview image
        if(CurrentMode == null) {
            d = new Date();
            $("#PreviewImage").attr("src", "/static/preview/preview.jpg?"+d.getTime());
            $("#PreviewImage").css("max-width", "80%");
            $("#PreviewImage").css("height", "auto");
        } else {
            $("#PreviewImage").attr("src", "/static/img/shooting.jpg?");
            $("#PreviewImage").css("max-width", "80%");
            $("#PreviewImage").css("height", "auto");
        }
        //  Refresh current status
        switch(CurrentMode) {
            case 0:
                $("#PhotoStatus").html("<i>" + data.ShootStatus + "</i>");
            break;
            case 1:
                $("#GIFStatus").html("<i>" + data.ShootStatus + "</i>");
            break;
            case 2:
                $("#VideoStatus").html("<i>" + data.ShootStatus + "</i>");
            break;
        }
        //  Update trigger button
        switch(data.Config.Mode) {
            case 0:
                $("#TriggerButtonParams").html("photo, Resolution " + data.Config.Resolution + ", Shoots " + data.Config.Pics);
            break;
            case 1:
                $("#TriggerButtonParams").html("GIF, Resolution " + data.Config.Resolution + ", Shoots " + data.Config.Pics + ", FPS " + data.Config.FPS + ", Turns " + data.Config.Turns);
            break;
            case 2:
                $("#TriggerButtonParams").html("video, Resolution " + data.Config.Resolution + ", FPS " + data.Config.FPS + ", Turns " + data.Config.Turns);
            break;
        }
	}, "json");
}


//  Refresh shootings list
function RefreshList() {
	$.ajax({
		type: "POST",
		url: "/refresh",
        dataType: "json",
		cache: false
	}).done(function( data ) {
        var items = [];
        data['Dirs'].sort().reverse();
        items.push('<li class="collection-item"><b>Shootings</b></li>');
        $.each(data['Dirs'], function(i, item) {
            items.push('<li data-name="'+ item +'" class="collection-item"><div>' + FormatName(item) + 
            '<div class="secondary-content"><a onclick="Download(\''+ item +
            '\')" href="#"><i class="material-icons">file_download</i></a>&nbsp;&nbsp;&nbsp;<a href="#" onclick="Delete(\''+ item +
            '\')"><i class="material-icons">delete</i></a></div></div></li>');
        }); 
        $('#Shoots').html( items.join('') );
	});
}


//  Format shoot name
function FormatName(name) {

    var NewName = name.substr(8, 2) + "/" + name.substr(5, 2) + "/" + name.substr(0, 4) + " " + name.substr(11, 8).replace("-", ":").replace("-", ":");
    Mode = parseInt(name.split("_")[2]);
    switch(Mode) {
        case 0:
            NewName = "<i class='tiny material-icons'>camera_alt</i>&nbsp;&nbsp;&nbsp;" + NewName;
        break;
        case 1:
            NewName = "<i class='tiny material-icons'>gif</i>&nbsp;&nbsp;&nbsp;" + NewName;
        break;
        case 2:
            NewName = "<i class='tiny material-icons'>videocam</i>&nbsp;&nbsp;&nbsp;" + NewName;
        break;
    }
   
    return NewName;
    
}


//  Delete given shoot directory
function Delete(shoot){
    
    $.ajax({
        type: "POST",
        url: "/delete",
        data : {
            shoot: shoot
        },
        cache: false,
    }).done(function( data ) {
        M.toast({html: "Shooting deleted."});
        var element = $('*[data-name="'+shoot+'"]');
        element.css("background-color","red")
        element.hide();
        element.remove();
    });
  
}


//  Download given shoot
function Download(shoot) {

    switch(parseInt(shoot.split("_")[2])) {
        //  ZIP
        case 0:
            location.href = "static/shoot/" + shoot + ".zip";
        break;
        //  GIF
        case 1:
            var link = document.createElement('a');
            link.href = "static/shoot/" + shoot + "/animation.gif";
            link.download = "animation.gif";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        break;
        //  Video
        case 2:
            var link = document.createElement('a');
            link.href = "static/shoot/" + shoot + "/video.mp4";
            link.download = "video.mp4";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        break;
    }
  
}



//  Set trigger button mode and parameters (mode: 0 Foto, 1 GIF, 2 Video)
function SetTriggerButton(mode) {
    
	var m = mode;
	switch(mode) {
		case 0:
			var r = $("#PhotoResolution").val();
			var p = $("#PhotoShoots").val();
			var f = 1;
			var t = 1;
		break;
		case 1:
			var r = $("#GIFResolution").val();
			var p = $("#GIFShoots").val();
			var f = $("#GIFFPS").val();
			var t = $("#GIFTurns").val();
		break;
		case 2:
			var r = $("#VideoResolution").val();
            var p = 1;
			var f = $("#VideoFPS").val();
			var t = $("#VideoTurns").val();
		break;
	}
	$.ajax({
		type: "POST",
		url: "/set_trigger_button",
		data : {
			mode : m,
			resolution : r,
			pics : p,
			fps : f,
			turns : t
		},
		cache: false
	}).done(function( data ) {
        M.toast({html: data});
	});
    
}



//  Reset controls if shooting is finished or stopped
function ResetControls(m, finished = false) {
    
    if(finished == true) {
        var perc = "100%";
    } else {
        var perc = "0%";
    }
    switch(m) {
        case 0:
            $("#PhotoBtnStart").html("Start");
            $("#PhotoBtnStart").removeClass("disabled");
            $("#GIFBtnStart").removeClass("disabled");
            $("#VideoBtnStart").removeClass("disabled");
            $("#PhotoBtnStop").hide();
            $("#PhotoProgress").css("width", perc);
            $("#PhotoStatus").html("<i></i>");
        break;
        case 1:
            $("#GIFBtnStart").html("Start");
            $("#GIFBtnStart").removeClass("disabled");
            $("#PhotoBtnStart").removeClass("disabled");
            $("#VideoBtnStart").removeClass("disabled");
            $("#GIFBtnStop").hide();
            $("#GIFProgress").css("width", perc);
            $("#GIFStatus").html("<i></i>");
        break;
        case 2:
            $("#VideoBtnStart").html("Start");
            $("#VideoBtnStart").removeClass("disabled");
            $("#PhotoBtnStart").removeClass("disabled");
            $("#GIFBtnStart").removeClass("disabled");
            $("#VideoBtnStop").hide();
            $("#VideoProgress").css("width", perc);
            $("#VideoStatus").html("<i></i>");
        break;
    }
    
}


//  Delete all shootings
function DeleteAll() {
    
	var r = confirm("Delete ALL shootings?");
	if (r == true) {
        $.ajax({
            type: "POST",
            url: "/delete_all",
            cache: false,
        }).done(function( data ) {
            M.toast({html: "All shootings deleted."});
        });
	}
    
}


//  Shutdown
function Shutdown() {
    
    $.ajax({
        type: "POST",
        url: "/shutdown",
        cache: false
    });
    M.toast({html: "Bye!"});
    
}