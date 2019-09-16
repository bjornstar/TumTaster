// TumTaster -- http://tumtaster.bjornstar.com
//  - By Bjorn Stromberg (@bjornstar)
'use strict';

const API_KEY = '0b9cb426e9ffaf2af34e68ae54272549';

var settings = window.defaultSettings;

const savedSettings = window.localStorage.getItem('settings');

try {
	if (savedSettings) {
		settings = JSON.parse(savedSettings);
	}
} catch (e) {
	console.error('Failed to parse settings: ', e);
}

const ports = {};
var tracks = {};
const urls = {};

const soundcloudIds = [];

let order = 0;

function getDetails(url) {
	urls[url] = urls[url] || new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', url + '.json?client_id=' + API_KEY, true);

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 400) {
					reject(new Error(`Failed to getDetails: ${xhr.status} ${xhr.statusText}`));
				}

				try {
					resolve(JSON.parse(xhr.responseText));
				} catch (e) {
					reject(e);
				}
			}
		};

		xhr.send();
	});

	return urls[url];
}

function broadcast(msg) {
	for (let portId in ports) {
		ports[portId].postMessage(msg);
	}
}

function addToLibrary(track, seenBefore) {
	order += 1;

	const { id } = track;
	track.order = order;

	broadcast({ track });

	if (!track.streamable || seenBefore) {
		return;
	}

	function failOrFinish() {
		window.playnextsong(id);
	}

	if (track.streamable) {
		window.soundManager.createSound({
			id,
			url: track.streamUrl,
			onloadfailed: failOrFinish,
			onfinish: failOrFinish
		});
	}

	tracks[id] = track;
}

function addSoundCloudTrack({ dataset: { postUrl }, postId, seen }, { downloadable, id, permalink_url, streamable, title, uri, user }) {
	const track = {
		artist: user ? user.username : '',
		downloadable,
		downloadUrl: `${uri}/download?client_id=${API_KEY}`,
		id,
		permalinkUrl: permalink_url,
		postId,
		postUrl,
		seen,
		streamUrl: `${uri}/stream?client_id=${API_KEY}`,
		streamable,
		title
	};

	addToLibrary(track, soundcloudIds.includes(id));
}

const addPosts = {
	tumblr: function (post) {
		post.downloadUrl = post.baseUrl + '?play_key=' + post.postKey;
		post.streamUrl = post.downloadUrl;

		post.downloadable = true;
		post.streamable = true;

		post.id = post.postId;
		post.postUrl = post.dataset.postUrl;

		addToLibrary(post);
	},
	soundcloud: function (post) {
		getDetails(post.baseUrl).then(details => {
			switch (details.kind) {
			case 'track':
				return addSoundCloudTrack(post, details);
			case 'playlist':
				for (let i = 0; i < details.tracks.length; i += 1) {
					addSoundCloudTrack(post, details.tracks[i]);
				}
				break;
			default:
				console.error('I don\'t know how to handle', details);
			}
		}).catch(console.error);
	}
};

function messageHandler(port, message) {
	if (message === 'getSettings') {
		return port.postMessage({ settings: settings});
	}

	if (message.hasOwnProperty('post')) {
		const post = message.post;
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

window.chrome.runtime.onConnect.addListener(connectHandler);

window.playnextsong = (lastSoundID) => {
	const { soundManager } = window;

	if (!soundManager.soundIDs.length) {
		return;
	}

	const currentIndex = soundManager.soundIDs.indexOf(lastSoundID);

	const nextIndex = (currentIndex + 1) % soundManager.soundIDs.length;

	const nextSound = soundManager.getSoundById(soundManager.soundIDs[nextIndex]);

	nextSound.play();
};

window.playprevsong = (lastSoundID) => {
	const { soundManager } = window;

	if (!soundManager.soundIDs.length) {
		return;
	}

	const currentIndex = soundManager.soundIDs.indexOf(lastSoundID);

	const prevIndex = (currentIndex - 1) % soundManager.soundIDs.length;

	const prevSound = soundManager.getSoundById(soundManager.soundIDs[prevIndex]);

	prevSound.play();
};

document.addEventListener('DOMContentLoaded', function () {
	window.soundManager.setup({'preferFlash': false});
});
