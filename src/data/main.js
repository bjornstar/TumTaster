// TumTaster v0.6.0 -- http://tumtaster.bjornstar.com
//  - By Bjorn Stromberg (@bjornstar)

var API_KEY = '0b9cb426e9ffaf2af34e68ae54272549';

var settings = defaultSettings;

var savedSettings = localStorage['settings'];

try {
	if (savedSettings) {
		settings = JSON.parse(savedSettings);
	}
} catch (e) {
	console.error('Failed to parse settings: ', e);
}

var ports = {};
var tracks = {};

var scData = {};

function getDetails(url, cb) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url + '.json?client_id=' + API_KEY, true);

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			var response;
			try {
				response = JSON.parse(xhr.responseText);
			} catch (e) {
				return cb(e);
			}
			cb(null, response);
		}
	}

	xhr.send();
}

function broadcast(msg) {
	for (var portId in ports) {
		ports[portId].postMessage(msg);
	}
}

function addToLibrary(track, seenBefore) {
	var id = track.id;

	broadcast({ track: track });

	if (!track.streamable || seenBefore) {
		return;
	}

	function failOrFinish() {
		playnextsong(id);
	}

	if (track.streamable) {
		soundManager.createSound({
			id: id,
			url: track.streamUrl,
			onloadfailed: failOrFinish,
			onfinish: failOrFinish
		});
	}

	tracks[id] = track;
}

function addSoundCloudTrack(post, details) {
	var track = {
		downloadUrl: details.uri + '/download?client_id=' + API_KEY,
		streamUrl: details.uri + '/stream?client_id=' + API_KEY,

		downloadable: details.downloadable,
		streamable: details.streamable,

		artist: details.user ? details.user.username : '',
		title: details.title,
		id: details.id,

		postId: post.postId
	};

	var seenBefore = scData.hasOwnProperty(track.id);
	scData[track.id] = details;

	addToLibrary(track, seenBefore);
}

var addPosts = {
	tumblr: function (post) {
		post.downloadUrl = post.baseUrl + '?play_key=' + post.postKey;
		post.streamUrl = post.downloadUrl;

		post.downloadable = true;
		post.streamable = true;

		post.id = post.postId;

		addToLibrary(post);
	},
	soundcloud: function (post) {
		getDetails(post.baseUrl, function (e, details) {
			if (e) {
				return console.error(error);
			}

			details = details || {};

			if (details.kind === 'track') {
				return addSoundCloudTrack(post, details);
			}

			for (var i = 0; i < details.tracks.length; i += 1) {
				addSoundCloudTrack(post, details.tracks[i]);
			}
		});
	}
}

function messageHandler(port, message) {
	if (message === 'getSettings') {
		return port.postMessage({ settings: settings});
	}

	if (message.hasOwnProperty('post')) {
		var post = message.post;
		addPosts[post.type](post);
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

	if (settings['shuffle']) {
		var s = Math.floor(Math.random()*soundManager.soundIDs.length+1);
		next_song = soundManager.soundIDs[s];
	}

	if (settings['repeat'] && bad_idea == previous_song) {
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

document.addEventListener('DOMContentLoaded', function () {
	soundManager.setup({'preferFlash': false});
});
