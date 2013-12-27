if (localStorage["settings"] == undefined) {
  settings = defaultSettings;
} else {
  settings = JSON.parse(localStorage["settings"]);
}

chrome.extension.onRequest.addListener(
  function(message, sender, sendResponse) {
    if (message == 'getSettings') {
      sendResponse({settings: localStorage["settings"]});
    } else {
      addTrack(message);
      sendResponse({});
    }
});

function addTrack(newTrack) {
  var id = newTrack.postId;
  var url = newTrack.streamUrl + '?play_key=' + newTrack.postKey;
  var mySoundObject = soundManager.createSound({
    id: id,
    url: url,
    onloadfailed: function(){playnextsong(newTrack.postId)},
    onfinish: function(){playnextsong(newTrack.postId)}
  });
}

function getJukebox() {
  var jukebox = document.getElementsByTagName('audio');
  return jukebox;
}

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

  if (settings["shuffle"]) {
    var s = Math.floor(Math.random()*soundManager.soundIDs.length+1);
    next_song = soundManager.soundIDs[s];
  }

  if (settings["repeat"] && bad_idea == previous_song) {
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

document.addEventListener("DOMContentLoaded", function () {
  soundManager.setup({"preferFlash": false});
});