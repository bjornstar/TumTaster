document.addEventListener("DOMContentLoaded", function () {
  var save_btn = document.getElementById("save_btn");
  var reset_btn = document.getElementById("reset_btn");
  var listWhiteAdd = document.getElementById("listWhiteAdd");
  var listBlackAdd = document.getElementById("listBlackAdd");
  var listSitesAdd = document.getElementById("listSitesAdd");

  save_btn.addEventListener("click", saveOptions);
  reset_btn.addEventListener("click", function() { if (confirm("Are you sure you want to restore defaults?")) {eraseOptions()} });

  listWhiteAdd.addEventListener("click", function(e) {
      addInput("White");
      e.preventDefault();
      e.stopPropagation();
  }, false);

  listBlackAdd.addEventListener("click", function(e) {
      addInput("Black");
      e.preventDefault();
      e.stopPropagation();
  }, false);

  listSitesAdd.addEventListener("click", function(e) {
      addInput("Sites");
      e.preventDefault();
      e.stopPropagation();
  }, false);

  loadOptions();
});

function loadOptions() {
  var settings = localStorage['settings'];

  if (settings == undefined) {
    settings = defaultSettings;
  } else {
    settings = JSON.parse(settings);
  }

  var cbShuffle = document.getElementById("optionShuffle");
  cbShuffle.checked = settings['shuffle'];

  var cbRepeat = document.getElementById("optionRepeat");
  cbRepeat.checked = settings['repeat'];

  for (var itemBlack in settings['listBlack']) {
    addInput("Black", settings['listBlack'][itemBlack]);
  }

  for (var itemWhite in settings['listWhite']) {
    addInput("White", settings['listWhite'][itemWhite]);
  }

  for (var itemSites in settings['listSites']) {
    addInput("Sites", settings['listSites'][itemSites]);
  }

  addInput("Black"); //prepare a blank input box.
  addInput("White"); //prepare a blank input box.
  addInput("Sites"); //prepare a blank input box.

  var version_div = document.getElementById('version_div');
  version_div.innerHTML = 'v'+defaultSettings['version']; //use default so we're always showing current version regardless of what people have saved.

  if (typeof opera != 'undefined') {
    var browser_span = document.getElementById('browser_span');
    browser_span.innerHTML = "for Opera&trade;";
  }

  if (typeof chrome != 'undefined') {
    var browser_span = document.getElementById('browser_span');
    browser_span.innerHTML = "for Chrome&trade;";
  }

  if (typeof safari != 'undefined') {
    var browser_span = document.getElementById('browser_span');
    browser_span.innerHTML = "for Safari&trade;";
  }
}

function addInput(whichList, itemValue) {
  if (itemValue == undefined) {
    itemValue = "";
  }

  var PNGremove = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGFJREFUeNpiXLVmfTwDA8MEIHYICwm8COTrA9kHgLiAEch5D2QIAPEHkABUIZjPBNIBlQAJLEBS6MAEMgqqAxkUgMQZkewQQJKE6ESSAAkkIFlxgAlq5AeoaxciuaEAIMAAiDAi7M96B5wAAAAASUVORK5CYII=';
  var listDiv = document.getElementById('list'+whichList);
  var listAdd = document.getElementById('list'+whichList+'Add');

  garbageInput = document.createElement('input');
  garbageInput.value = itemValue;
  garbageInput.name = 'option'+whichList;
  garbageInput.id = 'option'+whichList+document.getElementsByTagName('input').length;
  garbageAdd = document.createElement('a');
  garbageAdd.href = "#";
  garbageAdd.setAttribute('onclick', 'removeInput(\'option'+whichList+document.getElementsByTagName('input').length+'\'); return false;');
  garbageAdd.innerHTML = '<img src="'+PNGremove+'" />&nbsp;';
  garbageLinebreak = document.createElement('br');
  listDiv.insertBefore(garbageAdd,listAdd);
  listDiv.insertBefore(garbageInput,listAdd);
  listDiv.insertBefore(garbageLinebreak,listAdd);
}

function removeInput(garbageWhich) {
  var garbageInput = document.getElementById(garbageWhich);
  garbageInput.parentNode.removeChild(garbageInput.previousSibling);
  garbageInput.parentNode.removeChild(garbageInput.nextSibling);
  garbageInput.parentNode.removeChild(garbageInput);
}

function saveOptions() {
  var settings = {};

  var cbShuffle = document.getElementById('optionShuffle');
  settings['shuffle'] = cbShuffle.checked;

  var cbRepeat = document.getElementById('optionRepeat');
  settings['repeat'] = cbRepeat.checked;

  settings['listWhite'] = [];
  settings['listBlack'] = [];
  settings['listSites'] = [];

  var garbages = document.getElementsByTagName('input');
  for (var i = 0; i< garbages.length; i++) {
    if (garbages[i].value != "") {
      if (garbages[i].name.substring(0,11) == "optionWhite") {
        settings['listWhite'].push(garbages[i].value);
      } else if (garbages[i].name.substring(0,11) == "optionBlack") {
        settings['listBlack'].push(garbages[i].value);
      } else if (garbages[i].name.substring(0,11) == "optionSites") {
        settings['listSites'].push(garbages[i].value);
      }
    }
  }
  localStorage['settings'] = JSON.stringify(settings);
  location.reload();
}

function eraseOptions() {
  localStorage.removeItem('settings');
  location.reload();
}
