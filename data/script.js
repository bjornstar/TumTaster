// TumTaster v0.5.0 -- http://tumtaster.bjornstar.com
//  - By Bjorn Stromberg (@bjornstar)

var settings, started;

function addLink(track) {
	var post = document.getElementById('post_' + track.postId);
	if (!post) {
		return;
	}

	var footer = post.querySelector('.post_footer');
	if (footer) {
		var divDownload = document.createElement('DIV');
		divDownload.className = 'tumtaster';
		var aDownload = document.createElement('A');
		aDownload.href = track.downloadUrl;
		aDownload.textContent = 'Download';
		divDownload.appendChild(aDownload);
		footer.insertBefore(divDownload, footer.children[1]);
	}
}

function messageHandler(message) {
	if (message.hasOwnProperty('settings')) {
		settings = message.settings;
		startTasting();
	}

	if (message.hasOwnProperty('track')) {
		addLink(message.track);
	}
}

var port = chrome.runtime.connect();
port.onMessage.addListener(messageHandler);

function addGlobalStyle(styleID, newRules) {
	var cStyle, elmStyle, elmHead, newRule;

	cStyle = document.getElementById(styleID);
	elmHead = document.getElementsByTagName('head')[0];

	if (elmHead === undefined) {
		return false;
	}

	if (cStyle === undefined || cStyle === null) {
		elmStyle = document.createElement('style');
		elmStyle.type = 'text/css';
		elmStyle.id = styleID;
		while (newRules.length > 0) {
			newRule = newRules.pop();
			if (elmStyle.sheet !== undefined && elmStyle.sheet !== null && elmStyle.sheet.cssRules[0] !== null) {
				elmStyle.sheet.insertRule(newRule, 0);
			} else {
				elmStyle.appendChild(document.createTextNode(newRule));
			}
		}
		elmHead.appendChild(elmStyle);
	} else {
		while (cStyle.sheet.cssRules.length > 0) {
			cStyle.sheet.deleteRule(0);
		}
		while (newRules.length > 0) {
			newRule = newRules.pop();
			if (cStyle.sheet !== undefined && cStyle.sheet.cssRules[0] !== null) {
				cStyle.sheet.insertRule(newRule, 0);
			} else {
				cStyle.appendChild(document.createTextNode(newRule));
			}
		}
	}

	return true;
}

function checkurl(url, filter) {
	for (var f in filter) {
		var filterRegex;
		filterRegex=filter[f].replace(/\x2a/g, "(.*?)");
		var re = new RegExp(filterRegex);
		if (url.match(re)) {
			return true;
		}
	}
	return false;
}

var tracks = {};

function makeTumblrLink(dataset) {
	var postId = dataset.postId;

	tracks[postId] = {
		postId: postId,
		streamUrl: dataset.streamUrl,
		postKey: dataset.postKey,
		artist: dataset.artist,
		track: dataset.track,
		type: 'tumblr'
	};

	port.postMessage({ track: tracks[postId] });
}

function makeSoundCloudLink(dataset, url) {
	var qs = url.split('?')[1];
	var chunks = qs.split('&');

	var url;
	for (var i = 0; i < chunks.length; i += 1) {
		if (chunks[i].indexOf('url=') === 0) {
			url = decodeURIComponent(chunks[i].substring(4));
			break;
		}
	}

	var postId = dataset.postId;

	tracks[postId] = {
		postId: postId,
		streamUrl: url,
		type: 'soundcloud'
	};

	port.postMessage({ track: tracks[postId] });
}

function extractAudioData(post) {
	var postId = post.dataset.postId;
	if (!postId || tracks[postId]) {
		return;
	}

	var soundcloud = post.querySelector('.soundcloud_audio_player');

	if (soundcloud) {
		return makeSoundCloudLink(post.dataset, soundcloud.src);
	}

	var tumblr = post.querySelector('.audio_player_container');

	if (tumblr) {
		return makeTumblrLink(tumblr.dataset);
	}
}

function handleNodeInserted(event) {
	snarfAudioPlayers(event.target);
}

function snarfAudioPlayers(t) {
	var audioPosts = t.querySelectorAll('.post.is_audio');

	for (var i = 0; i < audioPosts.length; i += 1) {
		var audioPost = audioPosts[i];
		extractAudioData(audioPost);
	}
}


function addTumtasterStyle() {
	var cssRules = [];
	cssRules.push('.tumtaster { float: left; padding-right: 10px; }');
	cssRules.push('.tumtaster a { text-decoration: none; color: #a7a7a7; }');

	addGlobalStyle('tumtaster', cssRules);
}

function wireupnodes() {
	var cssRules = [];

	document.addEventListener('animationstart', handleNodeInserted, false);
	document.addEventListener('MSAnimationStart', handleNodeInserted, false);
	document.addEventListener('webkitAnimationStart', handleNodeInserted, false);
	document.addEventListener('OAnimationStart', handleNodeInserted, false);

	cssRules[0]  = "@keyframes nodeInserted {";
	cssRules[0] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[0] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[0] += "}";

	cssRules[1]  = "@-moz-keyframes nodeInserted {";
	cssRules[1] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[1] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[1] += "}";

	cssRules[2]  = "@-webkit-keyframes nodeInserted {";
	cssRules[2] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[2] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[2] += "}";

	cssRules[3]  = "@-ms-keyframes nodeInserted {";
	cssRules[3] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[3] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[3] += "}";

	cssRules[4]  = "@-o-keyframes nodeInserted {";
	cssRules[4] += "    from { clip: rect(1px, auto, auto, auto); }";
	cssRules[4] += "    to { clip: rect(0px, auto, auto, auto); }";
	cssRules[4] += "}";

	cssRules[5]  = "ol#posts li {";
	cssRules[5] += "    animation-duration: 1ms;";
	cssRules[5] += "    -o-animation-duration: 1ms;";
	cssRules[5] += "    -ms-animation-duration: 1ms;";
	cssRules[5] += "    -moz-animation-duration: 1ms;";
	cssRules[5] += "    -webkit-animation-duration: 1ms;";
	cssRules[5] += "    animation-name: nodeInserted;";
	cssRules[5] += "    -o-animation-name: nodeInserted;";
	cssRules[5] += "    -ms-animation-name: nodeInserted;";
	cssRules[5] += "    -moz-animation-name: nodeInserted;";
	cssRules[5] += "    -webkit-animation-name: nodeInserted;";
	cssRules[5] += "}";

	addGlobalStyle("wires", cssRules);
}

// 2013-01-31: Today's tumblr audio url
//  - http://assets.tumblr.com/swf/audio_player_black.swf?audio_file=http%3A%2F%2Fwww.tumblr.com%2Faudio_file%2Fdnoeringi%2F41940197205%2Ftumblr_mhhof5DU8p1qbb49b&color=FFFFFF&logo=soundcloud
// audio_file=http://www.tumblr.com/audio_file/dnoeringi/41940197205/tumblr_mhhof5DU8p1qbb49b

// 2013-12-18: Today's tumblr audio url
//  - http://www.tumblr.com/audio_file/no-mosexual/69952464733/tumblr_mxs96tnYi71r721wf?play_key=e6ba8f023e92bbb5aaf06052cd0c6551

// 2013-12-29: Today's soundcloud audio url
// - https://api.soundcloud.com/tracks/89350110/download?client_id=0b9cb426e9ffaf2af34e68ae54272549

function startTasting() {
	if (document.readyState === 'loading' || !settings || started) {
		return;
	}

	started = true;

	if (!checkurl(location.href, settings['listSites'])) {
		port.disconnect();
		return;
	}

	addTumtasterStyle();
	wireupnodes();

	snarfAudioPlayers(document);
}

document.addEventListener("DOMContentLoaded", startTasting);

startTasting();