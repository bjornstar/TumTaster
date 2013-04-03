// Tumtaster
//  - By Bjorn Stromberg

var defaultSettings = {
	shuffle: false,
	repeat: true,
	mp3player: 'flash',
	listBlack: [
		'beatles'
	],
	listWhite: [
		'bjorn',
		'beck'
	],
	listSites: [
		'http://*.tumblr.com/*',
		'http://bjornstar.com/*'
	],
	version: '0.4.8'
}; //initialize default values.

function addGlobalStyle(css) {
	var elmHead, elmStyle;
	elmHead = document.getElementsByTagName('head')[0];
	elmStyle = document.createElement('style');
	elmStyle.type = 'text/css';
	elmHead.appendChild(elmStyle);
	elmStyle.innerHTML = css;
}

var tumblr_ico = 'data:image/gif;base64,R0lGODlhEAAQAOZuAD9cdyA3TT5bdkBdeCA3Tj1adTZSbCI6VEFeeUtphDhVb0VjfiM7UjdTbiE4T0dlgEhmgjxYc0lnglZfajRQazlVcENgezpWcbrAxzxZdDtYcyM6UT5adSQ7UkRhfDNPaUhlgUJgezlWcDdUbsDJ1FBpgSI5UCE5UL3EzlZtgz1ZdOHh5UFfepadpt/i6Ofo7cDI0is8TVljbjtXcj9JVi8/UTZSbbS6w3CHnTdTbThUbkVifTpXckdlgUlmgkdkgEpngzZTbSs6Sr/I0TpXcV9wgkZkf2V6j0JfejRJXjNMYzhPZUBbdDtYckFbc46hsuHm7D1YcWZ/lkRifUZkgCI6UUpogzVJXrvEzkhmgThUb4WZrOHl7EVifqu0v72/xba9xipDYENhfEZjf0lngyg0QkpohDRQajVRax82TUtphd/f4+vu8yg/WP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAG4ALAAAAAAQABAAAAfYgG5tg4SFhYIHZooJao2OjWEdbT4SZJZQbE6KZoxqkg8PPSBbbGxllZZAVgxtCwtjT1ylMjhSIFkQEKxiHh6lv2wwTEZUPxttCCxIQy6lGBgtNVM7XccAAANRKKVlSVdLIRYWVW0FBRwCJGwvZdgDAwgIJm1NGhERWCtrZecC/gAn2lQQceECmDVrJmg4UiJDBhUO2jQYoUOLF4QYixDhMSOigY82UtzA+IWGAgUVCLQ5QwGNSyUxJpQpIyRIjgYqD3z4cKZnz5Yu0Rwg4CaN0aNIAygN4CYQADs=';
var tumtaster_style = 'background-image:url('+tumblr_ico+'); background-repeat:no-repeat; background-position: 6px 5px; line-height:27px; height:27px; width:207px; vertical-align:middle; font-size:10px; display:block !important; text-align:right; margin-top:1px; font-family:helvetica,arial,sans-serif; text-decoration:none; color:#000000; float:left;';

var library = {};
var settings;

function loadSettings() {
	chrome.extension.sendRequest('getSettings', function(response) {
		savedSettings = response.settings;
		if (savedSettings == undefined) {
			settings = defaultSettings;
		} else {
			settings = JSON.parse(savedSettings);
		}
		if (window.location.href.indexOf('show/audio')>0) {
			fixaudiopagination();
		}
		if (checkurl(location.href, settings['listSites'])) {
			addGlobalStyle('a.tumtaster {'+tumtaster_style+'}');
			wireupnodes();
			waitForEmbeds();
		}
	});
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

// 2013-01-31: Today's tumblr audio url
//  - http://assets.tumblr.com/swf/audio_player_black.swf?audio_file=http%3A%2F%2Fwww.tumblr.com%2Faudio_file%2Fdnoeringi%2F41940197205%2Ftumblr_mhhof5DU8p1qbb49b&color=FFFFFF&logo=soundcloud
// audio_file=http://www.tumblr.com/audio_file/dnoeringi/41940197205/tumblr_mhhof5DU8p1qbb49b


function tasty(embed) {
	var embedSrc = embed.getAttribute('src');

	var a = document.createElement('a');
	a.href = embedSrc;

	var encodedSongURI = a.search.match(/audio_file=([^&]*)/)[1];

	var songURL = decodeURIComponent(encodedSongURI).concat('?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio');

	var songColor = a.search.match(/color=([^&]*)/)[1];
	var songBGColor = '000000';

	if (embedSrc.match(/\/audio_player\.swf/)) {
		songBGColor = 'FFFFFF';
		songColor = '5A5A5A';
	}

	var post_id = songURL.match(/audio_file\/([^\/]*)\/(\d+)\//)[2];
	var post_url = 'http://www.tumblr.com/';

	if (library.hasOwnProperty(post_id)) {
		return;
	}

	library[post_id] = songURL;

	var dl_a = document.createElement('a');
	dl_a.setAttribute('href', songURL);
	dl_a.setAttribute('style', 'background-color: #'+songBGColor+'; color: #'+songColor+'; text-decoration: none;');
	dl_a.setAttribute('class', 'tumtaster');
	dl_a.innerHTML = 'Click to download&nbsp;&nbsp;';

	var dl_span = document.createElement('span');
	var dl_br = document.createElement('br');
	dl_span.appendChild(dl_br);
	dl_span.appendChild(dl_a);

	embed.parentNode.appendChild(dl_span);
	guaranteesize(embed,54,0);

	// Find the post's URL.
	var anchors = document.getElementsByTagName('a');
	for (var a in anchors) {
		if (anchors[a].href) {
			if (anchors[a].href.indexOf('/post/'+post_id)>=0) {
				post_url = anchors[a].href;
			}
		}
	}

//Remove # anchors...
	if (post_url.indexOf('#')>=0) {
		post_url = post_url.substring(0,post_url.indexOf('#'));
	}

	if (window.location.href.substring(0,28)!='http://www.tumblr.com/reblog') { //If you're reblogging it don't add it to the playlist, it's already there.

		//We check our white list to see if we should add it to the playlist.
		var whitelisted = false;
		var blacklisted = false;

		//Only do contextual white list and black list on the dashboard, maybe I can come up with a universal way to do it in a later revision.

		if (window.location.href.substring(0,31)=='http://www.tumblr.com/dashboard' || window.location.href.substring(0,36)=='http://www.tumblr.com/show/audio/by/') {
			var post = document.getElementById('post_'+post_id);

			for (itemWhite in settings['listWhite']) {
				if (post.innerHTML.toLowerCase().indexOf(settings['listWhite'][itemWhite].toLowerCase()) >= 0) {
					whitelisted = true;
					break;
				}
			}

			// If it's not on the white list, we check our black list to see if we shouldn't add it to the playlist.
			if (!whitelisted) {
				for (itemBlack in settings['listBlack']) {
					if (post.innerHTML.toLowerCase().indexOf(settings['listBlack'][itemBlack].toLowerCase()) >= 0) {
						blacklisted = true;
						break;
					}
				}
			}
		}
		if (!blacklisted) {
		  console.log("sending "+songURL);
			chrome.extension.sendRequest({song_url: songURL, post_id: post_id, post_url: post_url});
		}
	}
}

function guaranteesize(start_here,at_least_height,at_least_width) {
	while (start_here.parentNode !== null || start_here.parentNode !== start_here.parentNode) {
		if (start_here.parentNode === null || start_here.parentNode === undefined) {
			return;
		}
		if (start_here.parentNode.offsetHeight < at_least_height && start_here.parentNode.className !== "post_content" && start_here.parentNode.style.getPropertyValue('display') !== 'none') {
			start_here.parentNode.style.height = at_least_height + 'px';
		}
		if (start_here.parentNode.offsetWidth < at_least_width && start_here.parentNode.className !== "post_content" && start_here.parentNode.style.getPropertyValue('display') !== 'none') {
			start_here.parentNode.style.width = at_least_width + 'px';
		}
		start_here = start_here.parentNode;
	}
}

function fixaudiopagination() {
	var nextpagelink = document.getElementById('next_page_link');
	var prevpagelink = document.getElementById('previous_page_link');
	var currentpage = window.location.href;

	var pagenumber = parseInt(currentpage.substring(currentpage.lastIndexOf('/')+1));

	if (isNaN(pagenumber)) {
		nextpagelink.href = currentpage+'/2';
	} else {
		nextpagelink.href = currentpage.substring(0,currentpage.lastIndexOf('/')+1)+(pagenumber+1);
	}

	if (prevpagelink) {
		prevpagelink.href = currentpage.substring(0,currentpage.lastIndexOf('/')+1)+(pagenumber-1);
	}

	var dashboard_controls = document.getElementById('dashboard_controls');

	if (dashboard_controls) {
		dashboard_controls.children[0].href = currentpage.substring(0,currentpage.lastIndexOf('/')+1)+1;
		dashboard_controls.children[1].children[0].href = currentpage.substring(0,currentpage.lastIndexOf('/')+1)+(pagenumber-1);
		dashboard_controls.children[1].children[2].href = currentpage.substring(0,currentpage.lastIndexOf('/')+1)+(pagenumber+1);
	}
}

function handleNodeInserted(event) {
	var newEmbeds = event.target.getElementsByTagName('EMBED');

	if (!newEmbeds.length) {
		return;
	}

	for (var i = 0, len = newEmbeds.length; i < len; i += 1) {
		var newEmbed = newEmbeds[i];
		if (hasSong(newEmbed)) {
			tasty(newEmbed);
		}
	}
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

var embeds;

function hasSong(embed) {
	return embed.getAttribute('src').indexOf('/swf/audio_player') >= 0;
}

function waitForEmbeds() {
	var embeds = document.getElementsByTagName('EMBED');
	if (!embeds.length) {
		setTimeout(waitForEmbeds, 10);
	} else {
		for (var i = 0, len = embeds.length; i < len; i += 1) {
			var embed = embeds[i];
			if (hasSong(embed)) {
				tasty(embed);
			}
		}
	}
}

loadSettings();

var s = document.createElement('script');
s.src = chrome.extension.getURL("includes/injected.js");
(document.head||document.documentElement).appendChild(s);
s.parentNode.removeChild(s);