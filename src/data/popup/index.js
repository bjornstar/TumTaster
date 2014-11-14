var bg = chrome.extension.getBackgroundPage();

var tracks = bg.tracks;
var sm = bg.soundManager;

var divLoading, divPosition, divPosition2, nowplaying, playlist, currentSound, currentTrack;
var buttons = {};

var shuffleMode = bg.settings.shuffle;

function getPlayingSound() {
	if (currentSound && currentSound.playState === 1) {
		return currentSound;
	}

	for (sound in sm.sounds) {
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

function getTrackDisplayName(track) {
	display = [];

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

function remove(id) {
	sm.destroySound(id);

	var elmTrack = document.getElementById(id);
	playlist.removeChild(elmTrack);
}

function play(soundId) {
	sm.stopAll();

	var sound = sm.getSoundById(soundId);
	if (sound) {
		sound.play();
	}
}

var nowPlayingScheduled, scheduleNowPlaying;

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
		currentTrack = tracks[sound.sID];
		nowplaying.textContent = getTrackDisplayName(currentTrack);
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

var updateScheduled, updateTracks, trackSlots = [];

function scheduleUpdate() {
	updateScheduled = updateScheduled || requestAnimationFrame(updateTracks);
}

function TrackSlot(elmParent) {
	var that = this;

	var liTrack = document.createElement('LI');

	var spanTrack = document.createElement('SPAN');
	spanTrack.className = 'clickable';

	var spanRemove = document.createElement('SPAN');
	spanRemove.className = 'remove clickable fa fa-remove';

	this.destroy = function () {
		elmParent.removeChild(liTrack);
	}

	this.play = function () {
		sm.stopAll();

		if (that.sound) {
			that.sound.play();
		}
	};

	this.remove = function () {
		if (that.sound.playState === 1) {
			sm.stopAll();
			skip('forward')
		}

		sm.destroySound(that.sound.sID);

		scheduleUpdate();
	};

	this.update = function (id) {
		that.sound = sm.getSoundById(id);
		that.track = tracks[id];

		liTrack.id = that.id = id;
		spanTrack.textContent = getTrackDisplayName(that.track);
	}

	spanTrack.addEventListener('click', function (e) {
		that.play();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	spanRemove.addEventListener('click', function (e) {
		that.remove()
		e.preventDefault();
		e.stopPropagation();
	}, false);

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
