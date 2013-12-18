var bg = chrome.extension.getBackgroundPage();
var sm = bg.soundManager;

var div_loading, div_position, div_position2, nowplaying;

document.addEventListener("DOMContentLoaded", function () {
  var stopLink = document.getElementById("stop");
  var pauseLink = document.getElementById("pause");
  var playLink = document.getElementById("play");
  var nextLink = document.getElementById("next");
  var randomLink = document.getElementById("random");

  stopLink.addEventListener("click", function(e) {
      sm.stopAll();
      e.preventDefault();
      e.stopPropagation();
  }, false);

  pauseLink.addEventListener("click", function(e) {
      pause();
      e.preventDefault();
      e.stopPropagation();
  }, false);

  playLink.addEventListener("click", function(e) {
      sm.resumeAll();
      e.preventDefault();
      e.stopPropagation();
  }, false);

  nextLink.addEventListener("click", function(e) {
      playnextsong();
      e.preventDefault();
      e.stopPropagation();
  }, false);

  randomLink.addEventListener("click", function(e) {
      playrandomsong();
      e.preventDefault();
      e.stopPropagation();
  }, false);

  div_loading = document.getElementById('loading');
  div_position = document.getElementById('position');
  div_position2 = document.getElementById('position2');
  nowplaying = document.getElementById('nowplaying');

  var playlist = document.getElementById("playlist");

  var PNGremove = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGFJREFUeNpiXLVmfTwDA8MEIHYICwm8COTrA9kHgLiAEch5D2QIAPEHkABUIZjPBNIBlQAJLEBS6MAEMgqqAxkUgMQZkewQQJKE6ESSAAkkIFlxgAlq5AeoaxciuaEAIMAAiDAi7M96B5wAAAAASUVORK5CYII=';

  setInterval(updateStatus, 200);

  switch (bg.settings["mp3player"]) {
    case "flash":
      var pl = sm.sounds;
      for (x in pl) {
        var liSong = document.createElement('li');
        var aSong = document.createElement('a');
        aSong.id = pl[x].sID;
        aSong.addEventListener("click", function(e) {
            play(null, e.target.id);
            e.preventDefault();
            e.stopPropagation();
        }, false);
        aSong.href = "#";
        aSong.innerHTML = pl[x].sID;
        var aRemove = document.createElement('a');
        aRemove.className = "remove";
        aRemove.href = "#";
        aRemove.addEventListener("click", function(e) {
            console.log(e.target.parentNode.previousSibling.id);
            remove(e.target.parentNode.previousSibling.id);
            e.preventDefault();
            e.stopPropagation();
        }, false);
        var imgRemove = document.createElement('img');
        imgRemove.src = PNGremove;
        aRemove.appendChild(imgRemove);
        liSong.appendChild(aSong);
        liSong.appendChild(aRemove);
        playlist.appendChild(liSong);
        //document.write('<li id="'+pl[x].sID+'">');
        //document.write('<a href="javascript:void(play(\''+pl[x].url+'\',\''+pl[x].sID+'\'))">'+pl[x].sID+'</a>');
        //document.write('<a class="remove" href="javascript:void(remove(\''+pl[x].sID+'\'))"><img src="'+PNGremove+'" /></a></li>\r\n');
      }
      break;
    case "html5":
      var pl = bg.getJukebox();
      for (x in pl) {
        if (pl[x].id!=undefined) {
          //document.write('<li id="'+pl[x].id+'">');
          //document.write('<a href="javascript:void(play(\''+pl[x].src+'\',\''+pl[x].id+'\'))">'+pl[x].id+'</a>');
          //document.write('<a class="remove" href="javascript:void(remove(\''+pl[x].id+'\'))"><img src="'+PNGremove+'" /></a></li>\r\n');
        }
      }
      break;
  }
});

function remove(song_id) {
  switch (bg.settings["mp3player"]) {
    case "flash":
      sm.destroySound(song_id);
      var song_li = document.getElementById(song_id);
      song_li.parentNode.parentNode.removeChild(song_li.parentNode);
      break;
    case "html5":
      bg.removeSong(song_id);
      var song_li = document.getElementById(song_id);
      song_li.parentNode.parentNode.removeChild(song_li.parentNode);
      break;
  }
}

function pause() {
  current_song = get_currentsong();
  current_song.pause();
}

function play(song_url,post_url) {
  switch (bg.settings["mp3player"]) {
    case "flash":
      sm.stopAll();
      var mySoundObject = sm.getSoundById(post_url);
      mySoundObject.play();
      break;
    case "html5":
      bg.playSong(song_url,post_url);
      break;
  }
}

function get_currentsong() {
	var song_nowplaying = null;
	switch (bg.settings["mp3player"]){
	case "flash":
		for (sound in sm.sounds) {
			if (sm.sounds[sound].playState == 1 && !song_nowplaying) {
				song_nowplaying = sm.sounds[sound];
			}
		}
		break;
	case "html5":
		var pl = bg.getJukebox();
		for (var x=0;x<pl.length;x++) {
			if (pl[x].currentTime<pl[x].duration && pl[x].currentTime>0 && !pl[x].paused) {
				song_nowplaying = pl[x];
			}
		}
		break;
	}
	return song_nowplaying;
}

function playnextsong() {
	var current_song = get_currentsong();
	var current_song_sID;

	if (current_song) {
		current_song.stop();
		current_song_sID = current_song.sID;
	}

	bg.playnextsong(current_song_sID);
}

function playrandomsong() {
	var current_song = get_currentsong();
	var current_song_sID;
	if (current_song) {
		current_song.stop();
		current_song_sID = current_song.sID;
	}
	bg.playrandomsong(current_song_sID);
}

function updateStatus() {
	var current_song = get_currentsong();
	if (current_song != undefined) {
		switch(bg.settings["mp3player"]) {
		case "flash":
			if (current_song.bytesTotal > 0) {
			div_loading.style.width = (100 * current_song.bytesLoaded / current_song.bytesTotal) + '%';
			}
			div_position.style.left = (100 * current_song.position / current_song.durationEstimate) + '%';
			div_position2.style.width = (100 * current_song.position / current_song.durationEstimate) + '%';
			break;
		case "html5":
			div_position.style.left = (100 * current_song.currentTime / current_song.duration) + '%';
			div_position2.style.width = (100 * current_song.currentTime / current_song.duration) + '%';
			break;
		}
	}
	if (current_song && nowplaying.innerHTML != current_song.id) {
		nowplaying.innerHTML = current_song.id;
	}
}