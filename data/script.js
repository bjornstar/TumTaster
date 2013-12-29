// TumTaster v0.5.0
//  - By Bjorn Stromberg (@bjornstar)

var settings, started;

function messageHandler(message) {
	if (message.hasOwnProperty('settings')) {
		settings = message.settings;
		startTasting();
	}

	if (message.hasOwnProperty('track')) {
		console.log(message.track);
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
		track: dataset.track
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

	console.log(url + '/download?client_id=0b9cb426e9ffaf2af34e68ae54272549');
}

function extractAudioData(post) {
	var postId = post.dataset.postId;
	if (!postId || tracks[postId]) {
		console.log('no post, or we already have it.')
		return;
	}

	if (!post.dataset.streamUrl) {
		var soundcloud = post.querySelector('.soundcloud_audio_player');

		if (soundcloud) {
			return makeSoundCloudLink(post.dataset, soundcloud.src);
		}

		console.log('no streamUrl')
		return;
	}

	if (!post.dataset.dataPostKey) {
		console.log('no postkey')
		return;
	}

	makeTumblrLink(post.dataset);
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
	var tumblr_ico = 'data:image/gif;base64,R0lGODlhEAAQAOZuAD9cdyA3TT5bdkBdeCA3Tj1adTZSbCI6VEFeeUtphDhVb0VjfiM7UjdTbiE4T0dlgEhmgjxYc0lnglZfajRQazlVcENgezpWcbrAxzxZdDtYcyM6UT5adSQ7UkRhfDNPaUhlgUJgezlWcDdUbsDJ1FBpgSI5UCE5UL3EzlZtgz1ZdOHh5UFfepadpt/i6Ofo7cDI0is8TVljbjtXcj9JVi8/UTZSbbS6w3CHnTdTbThUbkVifTpXckdlgUlmgkdkgEpngzZTbSs6Sr/I0TpXcV9wgkZkf2V6j0JfejRJXjNMYzhPZUBbdDtYckFbc46hsuHm7D1YcWZ/lkRifUZkgCI6UUpogzVJXrvEzkhmgThUb4WZrOHl7EVifqu0v72/xba9xipDYENhfEZjf0lngyg0QkpohDRQajVRax82TUtphd/f4+vu8yg/WP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAG4ALAAAAAAQABAAAAfYgG5tg4SFhYIHZooJao2OjWEdbT4SZJZQbE6KZoxqkg8PPSBbbGxllZZAVgxtCwtjT1ylMjhSIFkQEKxiHh6lv2wwTEZUPxttCCxIQy6lGBgtNVM7XccAAANRKKVlSVdLIRYWVW0FBRwCJGwvZdgDAwgIJm1NGhERWCtrZecC/gAn2lQQceECmDVrJmg4UiJDBhUO2jQYoUOLF4QYixDhMSOigY82UtzA+IWGAgUVCLQ5QwGNSyUxJpQpIyRIjgYqD3z4cKZnz5Yu0Rwg4CaN0aNIAygN4CYQADs=';
	var tumtaster_style = 'background-image:url('+tumblr_ico+'); background-repeat:no-repeat; background-position: 6px 5px; line-height:27px; height:27px; width:207px; vertical-align:middle; font-size:10px; display:block !important; text-align:right; margin-top:1px; font-family:helvetica,arial,sans-serif; text-decoration:none; color:#000000; float:left;';
	var cssRules = [];
	cssRules.push('a.tumtaster: {　' + tumtaster_style + ' }');

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
		console.log('not checking', location.href)
		return;
	}

	console.log('Now tasting', location.href);

	addTumtasterStyle();
	wireupnodes();

	snarfAudioPlayers(document);
}

document.addEventListener("DOMContentLoaded", startTasting);

startTasting();