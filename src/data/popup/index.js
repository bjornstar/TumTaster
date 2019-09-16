'use strict';

var bg = window.chrome.extension.getBackgroundPage();

var tracks = bg.tracks;
var sm = bg.soundManager;

var divLoading, divPosition, divPosition2, nowplaying, playlist, currentSound, currentTrack;
var buttons = {};

var shuffleMode = bg.settings.shuffle;

function getPlayingSound() {
	if (currentSound && currentSound.playState === 1) {
		return currentSound;
	}

	for (let sound in sm.sounds) {
		if (sm.sounds[sound].playState === 1) {
			currentSound = sm.sounds[sound];
			return currentSound;
		}
	}
}

var shuffleSort = {
	true: function (array) {
		var n = array.length;
		while (n--) {
			var i = Math.floor(n * Math.random());
			var tmp = array[i];
			array[i] = array[n];
			array[n] = tmp;
		}
		return array;
	},
	false: function (array) {
		return array.sort(function (a, b) { return tracks[a].order - tracks[b].order; });
	}
};

function toggleShuffle() {
	shuffleMode = !shuffleMode;

	shuffleSort[shuffleMode](sm.soundIDs);
}

var skipDirections = {
	forward: bg.playnextsong,
	backward: bg.playprevsong
};

function skip(direction) {
	var sound = getPlayingSound();

	var soundId;

	if (sound) {
		sound.stop();
		soundId = sound.sID;
	}

	skipDirections[direction](soundId);
}

function togglePause() {
	var sound = getPlayingSound();

	if (sound) {
		return !!sound.togglePause().paused;
	}

	skip('forward');
}

function toggleDisplay(elm, isVisible) {
	if (isVisible) {
		elm.className = elm.className.replace(' hidden', '');
	} else if (!/hidden/.test(elm.className)) {
		elm.className += ' hidden';
	}
}

function getTrackDisplayName(track) {
	const display = [];

	if (track.artist) {
		display.push(track.artist);
	}

	if (track.title) {
		display.push(track.title);
	}

	if (!display.length) {
		display.push([track.type, track.id]);
	}

	return display.join(' - ');
}

window.remove = (id) => {
	sm.destroySound(id);

	var elmTrack = document.getElementById(id);
	playlist.removeChild(elmTrack);
};

window.play = (soundId) => {
	sm.stopAll();

	var sound = sm.getSoundById(soundId);
	if (sound) {
		sound.play();
	}
};

var updateScheduled, trackSlots = [];

function setIsPlaying(track, isPlaying) {
	for (var i = 0; i < trackSlots.length; i += 1) {
		if (trackSlots[i].track === track) {
			return trackSlots[i].isPlaying(isPlaying);
		}
	}
}

var nowPlayingScheduled;

function updateNowPlaying() {
	nowPlayingScheduled = null;

	var sound = getPlayingSound();

	if (!sound) {
		return scheduleNowPlaying();
	}

	var bytesLoaded = sound.bytesLoaded;
	var bytesTotal = sound.bytesTotal;
	var position = sound.position;
	var durationEstimate = sound.durationEstimate;

	if (bytesTotal) {
		divLoading.style.width = (100 * bytesLoaded / bytesTotal) + '%';
	}

	divPosition.style.left = (100 * position / durationEstimate) + '%';
	divPosition2.style.width = (100 * position / durationEstimate) + '%';

	if (currentTrack !== tracks[sound.sID]) {
		setIsPlaying(currentTrack, false);

		currentTrack = tracks[sound.sID];
		nowplaying.textContent = getTrackDisplayName(currentTrack);

		setIsPlaying(currentTrack, true);
	}

	scheduleNowPlaying();
}

function scheduleNowPlaying() {
	nowPlayingScheduled = nowPlayingScheduled || requestAnimationFrame(updateNowPlaying);
}

var playIcons = {
	true: 'fa-pause',
	false: 'fa-play'
};

var modeIcons = {
	true: 'fa-random',
	false: 'fa-retweet'
};

function scheduleUpdate() {
	updateScheduled = updateScheduled || requestAnimationFrame(updateTracks);
}

function TrackSlot(elmParent) {
	var that = this;

	var liTrack = document.createElement('LI');

	var spanTrack = document.createElement('SPAN');
	spanTrack.className = 'clickable trackname';

	var spanRemove = document.createElement('SPAN');
	spanRemove.className = 'remove clickable fa fa-remove fa-2x';

	var aTumblr = document.createElement('A');
	aTumblr.className = 'clickable fa fa-tumblr fa-2x';
	aTumblr.target = '_new';

	var aSoundCloud = document.createElement('A');
	aSoundCloud.className = 'clickable fa fa-soundcloud fa-2x';
	aSoundCloud.target = '_new';

	var aDownload = document.createElement('A');
	aDownload.className = 'clickable fa fa-download fa-2x';
	aDownload.target = '_new';

	this.destroy = function () {
		elmParent.removeChild(liTrack);
	};

	this.isPlaying = function (isPlaying) {
		if (!isPlaying) {
			liTrack.className = liTrack.className.replace(' isplaying', '');
		} else if (!/isplaying/.test(liTrack.className)) {
			liTrack.className += ' isplaying';
		}
	};

	this.play = function () {
		sm.stopAll();

		if (that.sound) {
			that.sound.play();
		}
	};

	this.remove = function () {
		if (that.sound.playState === 1) {
			sm.stopAll();
			skip('forward');
		}

		sm.destroySound(that.sound.sID);

		scheduleUpdate();
	};

	this.update = function (id) {
		that.sound = sm.getSoundById(id);
		that.track = tracks[id];

		liTrack.id = that.id = id;
		spanTrack.textContent = getTrackDisplayName(that.track);

		aTumblr.href = that.track.postUrl;
		aSoundCloud.href = that.track.permalinkUrl;
		aDownload.href = that.track.downloadUrl;

		toggleDisplay(aSoundCloud, that.track.permalinkUrl);
		toggleDisplay(aDownload, that.track.downloadable);
	};

	spanTrack.addEventListener('click', function (e) {
		that.play();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	spanRemove.addEventListener('click', function (e) {
		that.remove();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	liTrack.appendChild(aTumblr);
	liTrack.appendChild(aSoundCloud);
	liTrack.appendChild(aDownload);
	liTrack.appendChild(spanTrack);
	liTrack.appendChild(spanRemove);

	elmParent.appendChild(liTrack);
}

function updateTracks() {
	updateScheduled = null;

	while (trackSlots.length < sm.soundIDs.length) {
		trackSlots.push(new TrackSlot(playlist));
	}

	while (trackSlots.length > sm.soundIDs.length) {
		trackSlots.pop().destroy();
	}

	for (var i = 0; i < sm.soundIDs.length; i += 1) {
		var id = sm.soundIDs[i];

		trackSlots[i].update(id);
	}
}

function onOpen() {
	divLoading = document.getElementById('loading');
	divPosition = document.getElementById('position');
	divPosition2 = document.getElementById('position2');

	nowplaying = document.getElementById('nowplaying');
	playlist = document.getElementById('playlist');

	buttons.prev = document.getElementById('prev');
	buttons.play = document.getElementById('play');
	buttons.next = document.getElementById('next');
	buttons.mode = document.getElementById('mode');

	buttons.prev.addEventListener('click', function (e) {
		skip('backward');

		e.preventDefault();
		e.stopPropagation();
	}, false);

	function updatePlayButton(playing) {
		buttons.play.className = buttons.play.className.replace(playIcons[playing], playIcons[!playing]);
	}

	buttons.play.addEventListener('click', function (e) {
		var playing = togglePause();

		updatePlayButton(playing);

		e.preventDefault();
		e.stopPropagation();
	}, false);

	buttons.next.addEventListener('click', function (e) {
		skip('forward');

		e.preventDefault();
		e.stopPropagation();
	}, false);

	function updateModeButton() {
		buttons.mode.className = buttons.mode.className.replace(modeIcons[!shuffleMode], modeIcons[shuffleMode]);
	}

	buttons.mode.addEventListener('click', function (e) {
		toggleShuffle();
		updateModeButton();
		scheduleUpdate();

		e.preventDefault();
		e.stopPropagation();
	}, false);

	var sound = getPlayingSound();
	if (sound && sound.playState === 1) {
		updatePlayButton(false);
	}

	updateModeButton();

	scheduleUpdate();
	scheduleNowPlaying();
}

document.addEventListener('DOMContentLoaded', onOpen);
