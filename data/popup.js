var bg = chrome.extension.getBackgroundPage();
var tracks = bg.tracks;
var sm = bg.soundManager;

var div_loading, div_position, div_position2, nowplaying;

document.addEventListener('DOMContentLoaded', function () {
	var stopLink = document.getElementById('stop');
	var pauseLink = document.getElementById('pause');
	var playLink = document.getElementById('play');
	var nextLink = document.getElementById('next');
	var randomLink = document.getElementById('random');

	stopLink.addEventListener('click', function(e) {
		sm.stopAll();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	pauseLink.addEventListener('click', function(e) {
		pause();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	playLink.addEventListener('click', function(e) {
		sm.resumeAll();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	nextLink.addEventListener('click', function(e) {
		playnextsong();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	randomLink.addEventListener('click', function(e) {
		playrandomsong();
		e.preventDefault();
		e.stopPropagation();
	}, false);

	div_loading = document.getElementById('loading');
	div_position = document.getElementById('position');
	div_position2 = document.getElementById('position2');
	nowplaying = document.getElementById('nowplaying');

	var playlist = document.getElementById('playlist');

	var PNGremove = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGFJREFUeNpiXLVmfTwDA8MEIHYICwm8COTrA9kHgLiAEch5D2QIAPEHkABUIZjPBNIBlQAJLEBS6MAEMgqqAxkUgMQZkewQQJKE6ESSAAkkIFlxgAlq5AeoaxciuaEAIMAAiDAi7M96B5wAAAAASUVORK5CYII=';

	setInterval(updateStatus, 200);

	for (var id in tracks) {
		var track = tracks[id];

		var liSong = document.createElement('li');
		var aSong = document.createElement('a');

		aSong.id = id;
		aSong.addEventListener('click', function(e) {
			play(null, e.target.id);
				e.preventDefault();
				e.stopPropagation();
			}, false);
		aSong.href = '#';

		var trackDisplay = id;
		if (track.artist && track.track) {
			trackDisplay = track.artist + ' - ' + track.track;
		}

		aSong.textContent = trackDisplay;

		var aRemove = document.createElement('a');
		aRemove.className = 'remove';
		aRemove.href = '#';
		aRemove.addEventListener('click', function(e) {
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
	}
});

function remove(song_id) {
	sm.destroySound(song_id);

	var song_li = document.getElementById(song_id);
	song_li.parentNode.parentNode.removeChild(song_li.parentNode);
}

function pause() {
	track = getPlaying();
	track.pause();
}

function play(song_url,post_url) {
	sm.stopAll();

	var sound = sm.getSoundById(post_url);
	sound.play();
}

function getPlaying() {
	for (sound in sm.sounds) {
		if (sm.sounds[sound].playState == 1) {
			return sm.sounds[sound];
		}
	}
}

function playnextsong() {
	var track = getPlaying();

	var track_sID;

	if (track) {
		track.stop();
		track_sID = track.sID;
	}

	bg.playnextsong(track_sID);
}

function playrandomsong() {
	var current_song = getPlaying();
	var current_song_sID;
	if (current_song) {
		current_song.stop();
		current_song_sID = current_song.sID;
	}
	bg.playrandomsong(current_song_sID);
}

function updateStatus() {
	var track = getPlaying();

	if (track) {
		var bytesLoaded = track.bytesLoaded;
		var bytesTotal = track.bytesTotal;
		var position = track.position;
		var durationEstimate = track.durationEstimate;

		if (bytesTotal) {
			div_loading.style.width = (100 * bytesLoaded / bytesTotal) + '%';
		}

		div_position.style.left = (100 * position / durationEstimate) + '%';
		div_position2.style.width = (100 * position / durationEstimate) + '%';
	}

	if (track && nowplaying.textContent !== track.id) {
		var trackDisplay = track.id;
		if (tracks[track.id].artist && tracks[track.id].track) {
			trackDisplay = tracks[track.id].artist + ' - ' + tracks[track.id].track;
		}
		nowplaying.textContent = trackDisplay;
	}
}