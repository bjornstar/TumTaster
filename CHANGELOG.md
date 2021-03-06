#@bjornstar/TumTaster Changelog

## v1.0.2 - 2019-09-17
* Add `build.sh` to generate zip file

## v1.0.1 - 2019-09-17
* Do not create or check in `package-lock.json`

## v1.0.0 - 2019-09-16
* Only request track and playlist details from soundcloud once per session per id
* Rename HISTORY.md to CHANGELOG.md
* Add scope to title in README and CHANGELOG
* Start linting using `eslint`

## v0.7.1 - 2017-09-13
* Tumblr changed audio player from `audio_player_container` to `native-audio-container`
* Tumblr removed postId from audio container dataset
* Removed unused `package.json` & `Info.plist`
* Fixed markdown in the changelog and readme
* Added paypal link to the readme
* Added dates and older releases to changelog

## v0.7.0 - 2015-06-21
* Made links to Tumblr, SoundCloud and Download for each track in the popup.
* The track that is playing is highlighted in the popup.
* Fixed an issue where posts wouldn't get their download links.

## v0.6.1 - 2014-11-18
* Fixed an issue where posts that reappeared would not get their download links reapplied
* Added this HISTORY file

## v0.6.0 - 2014-11-14
* Updated to work with https.
* Also makes a download link for each track in a soundcloud playlist.
* The audio player has had some love given to it, it should be friendlier to use now.
* Updates soundmanager2 version
* Added icons from fontawesome

## v0.4.8 - 2013-02-01
* Removed swf files and background.html

## v0.4.7 - 2012-08-01
* Tumblr changed their URL scheme for audio files so I fixed that, and began preparations for safari and opera versions ^^
