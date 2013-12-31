var API_KEY = '0b9cb426e9ffaf2af34e68ae54272549';

var settings = defaultSettings;

try {
	settings = JSON.parse(localStorage["settings"]);
} catch (e) {

}

var ports = {};
var tracks = {};

function addTrack(newTrack) {
	var id = newTrack.postId;
	var url = newTrack.streamUrl;

	if (newTrack.postKey) {
		url = url + '?play_key=' + newTrack.postKey;
	}

	if (newTrack.type === 'soundcloud') {
		url = url + '/download?client_id=' + API_KEY;
	}

	newTrack.downloadUrl = url;

	soundManager.createSound({
		id: id,
		url: url,
		onloadfailed: function(){playnextsong(newTrack.postId)},
		onfinish: function(){playnextsong(newTrack.postId)}
	});

	tracks[id] = newTrack;

	broadcast({ track: newTrack });
}

function broadcast(msg) {
	for (var portId in ports) {
		ports[portId].postMessage(msg);
	}
}

function messageHandler(port, message) {
	if (message === 'getSettings') {
		return port.postMessage({ settings: settings});
	}

	if (message.hasOwnProperty('track')) {
		addTrack(message.track);
	}
}

function connectHandler(port) {
	ports[port.portId_] = port;

	port.onMessage.addListener(function onMessageHandler(message) {
		messageHandler(port, message);
	});

	port.postMessage({ settings: settings });

	port.onDisconnect.addListener(function onDisconnectHandler() {
		disconnectHandler(port);
	});
}

function disconnectHandler(port) {
	delete ports[port.portId_];
}

chrome.runtime.onConnect.addListener(connectHandler);

function playnextsong(previous_song) {
  var bad_idea = null;
  var first_song = null;
  var next_song = null;
  for (x in soundManager.sounds) {
    if (soundManager.sounds[x].sID != previous_song && bad_idea == previous_song && next_song == null) {
      next_song = soundManager.sounds[x].sID;
    }
    bad_idea = soundManager.sounds[x].sID;
    if (first_song == null) {
      first_song = soundManager.sounds[x].sID;
    }
  }

  if (settings["shuffle"]) {
    var s = Math.floor(Math.random()*soundManager.soundIDs.length+1);
    next_song = soundManager.soundIDs[s];
  }

  if (settings["repeat"] && bad_idea == previous_song) {
    next_song = first_song;
  }

  if (next_song != null) {
    var soundNext = soundManager.getSoundById(next_song);
    soundNext.play();
  }
}

function playrandomsong(previous_song) {
  var x = Math.floor(Math.random()*soundManager.soundIDs.length+1);
  var mySoundObject = soundManager.getSoundById(soundManager.soundIDs[x]);
  mySoundObject.play();
}

document.addEventListener("DOMContentLoaded", function () {
  soundManager.setup({"preferFlash": false});
});