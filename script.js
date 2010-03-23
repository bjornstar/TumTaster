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

try {
  document.styleSheets[0].insertRule('a.tumtaster {'+tumtaster_style+'}', 0);
} catch (e) {
  addGlobalStyle('a.tumtaster {'+tumtaster_style+'}');
}

var last_embed = 0;
var song_embed = document.getElementsByTagName('embed');

function taste() {
	for (var i=last_embed;i<song_embed.length;i++) {
		if (song_embed[i].getAttribute('src').indexOf('/swf/audio_player') >= 0) {
			var song_url = song_embed[i].getAttribute('src').substring(song_embed[i].getAttribute('src').indexOf('audio_file=')+11);
			var song_bgcolor = song_url.substring(song_url.length-6);
			var song_color = '777777';
			song_url = song_url.replace('&color='+song_bgcolor,'?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio');

			if (song_embed[i].getAttribute('src').indexOf('audio_player_black') >= 0) {
				song_bgcolor = '000000';
				song_color = 'FFFFFF';
			}

			var dl_a = document.createElement('a');
			dl_a.setAttribute('href', song_url);
			dl_a.setAttribute('style', 'background-color: #'+song_bgcolor+'; color: #'+song_color+'; text-decoration: none;');
			dl_a.setAttribute('class', 'tumtaster');
			dl_a.innerHTML = 'Click to download&nbsp;&nbsp;';

      var dl_span = document.createElement('span');
      var dl_br = document.createElement('br');
      dl_span.appendChild(dl_br);
      dl_span.appendChild(dl_a);

			song_embed[i].parentNode.appendChild(dl_span);
      song_embed[i].parentNode.style.height='54px';

      var post_id = song_url.match(/audio_file\/(\d*)\//)[1];
      
      //Alright, here's the tough part. We gotta find the permalink for post to go with this audio file.
      //There's probably a million ways to do this better.

      var post_url = 'http://www.tumblr.com/';

      if (window.location.href.substring(0,31)=='http://www.tumblr.com/dashboard' || window.location.href.substring(0,36)=='http://www.tumblr.com/show/audio/by/') {
        post_url = document.getElementById('permalink_'+post_id).parentNode.getAttribute('href');
      } else {
        var anchors = document.getElementsByTagName('a');
        for (var a in anchors) {
          if (anchors[a].href) {
            if (anchors[a].href.indexOf('/post/'+post_id+'/')>=0) {
              post_url = anchors[a].href;
            }
          }
        }
      }

      chrome.extension.sendRequest({song_url: song_url, post_id: post_id, post_url: post_url});
		}
	}
	last_embed = song_embed.length;
}

setInterval(taste, 200);

function fixaudiopagination() {
	var nextpagelink = document.getElementById('next_page_link');
	var prevpagelink = document.getElementById('previous_page_link');
	var currentpage = window.location.href;

	if (currentpage.indexOf('dashboard')>=0) {
		return;
	}

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

fixaudiopagination();