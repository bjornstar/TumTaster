// TumTaster -- http://tumtaster.bjornstar.com
//  - By Bjorn Stromberg (@bjornstar)

var settings, started;

function addLink(track) {
	var elmPost = document.getElementById('post_' + track.postId);
	if (!elmPost) {
		console.error('couldn\'t find post:', track.postId);
		return;
	}

	var elmFooter = elmPost.querySelector('.post_footer');
	if (!elmFooter) {
		console.error('couldn\'t find footer:', track.postId);
		return;
	}

	var divDownload = elmFooter.querySelector('.tumtaster');
	if (divDownload) {
		return;
	}

	divDownload = document.createElement('DIV');
	divDownload.className = 'tumtaster';

	var aDownload = document.createElement('A');
	aDownload.href = track.downloadUrl;
	aDownload.textContent = 'Download';

	if (!track.downloadable) {
		aDownload.style.setProperty('text-decoration', 'line-through');
	}

	divDownload.appendChild(aDownload);

	elmFooter.insertBefore(divDownload, elmFooter.children[1]);
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
		filterRegex=filter[f].replace(/\x2a/g, '(.*?)');
		var re = new RegExp(filterRegex);
		if (url.match(re)) {
			return true;
		}
	}
	return false;
}

var posts = {};

function makeTumblrLink(dataset, postId) {
	var post = {
		artist: dataset.artist,
		baseUrl: dataset.streamUrl,
		dataset: dataset,
		postId: postId,
		postKey: dataset.postKey,
		seen: Date.now(),
		title: dataset.track,
		type: 'tumblr'
	};

	if (!posts[postId]) {
		posts[postId] = post;
	}

	port.postMessage({ post: post });
}

function makeSoundCloudLink(dataset, url) {
	var postId = dataset.postId;

	var qs = url.split('?')[1];
	var chunks = qs.split('&');

	var url;
	for (var i = 0; i < chunks.length; i += 1) {
		if (chunks[i].indexOf('url=') === 0) {
			url = decodeURIComponent(chunks[i].substring(4));
			break;
		}
	}

	var post = {
		baseUrl: url,
		dataset: dataset,
		postId: postId,
		seen: Date.now(),
		type: 'soundcloud'
	};

	if (!posts[postId]) {
		posts[postId] = post;
	}

	port.postMessage({ post: post });
}

function extractPermalink(post) {
	permalink = post.querySelector('.post_permalink') || {};
	return permalink.href;
}

function extractAudioData(post) {
	var postId = post.dataset.postId;

	if (!postId) {
		return;
	}

	post.dataset.postUrl = extractPermalink(post);

	var soundcloud = post.querySelector('.soundcloud_audio_player');

	if (soundcloud) {
		return makeSoundCloudLink(post.dataset, soundcloud.src);
	}

	var tumblr = post.querySelector('.audio_player_container, .native-audio-container');

	if (tumblr) {
		tumblr.dataset.postUrl = post.dataset.postUrl;
		return makeTumblrLink(tumblr.dataset, postId);
	}
}

function handleNodeInserted(event) {
	snarfAudioPlayers(event.target.parentNode);
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

	cssRules.push(
		'@keyframes nodeInserted {' +
		'    from { clip: rect(1px, auto, auto, auto); }' +
		'    to { clip: rect(0px, auto, auto, auto); }' +
		'}'
	);

	cssRules.push(
		'.post_container .post {' +
		'    animation-duration: 1ms;' +
		'    animation-name: nodeInserted;' +
		'}'
	);

	addGlobalStyle('tastyWires', cssRules);
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

	if (!checkurl(location.href, settings['listSites'])) {
		port.disconnect();
		return;
	}

	started = true;

	addTumtasterStyle();
	wireupnodes();

	snarfAudioPlayers(document);
}

document.onreadystatechange = startTasting;
document.addEventListener('DOMContentLoaded', startTasting);

startTasting();
