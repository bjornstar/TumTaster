var inputLast = 0;

document.addEventListener('DOMContentLoaded', function () {
	var save_btn = document.getElementById('save_btn');
	var reset_btn = document.getElementById('reset_btn');
	var listWhiteAdd = document.getElementById('listWhiteAdd');
	var listBlackAdd = document.getElementById('listBlackAdd');
	var listSitesAdd = document.getElementById('listSitesAdd');

	save_btn.addEventListener('click', saveOptions);
	reset_btn.addEventListener('click', function() { if (confirm('Are you sure you want to restore defaults?')) {eraseOptions()} });

	listWhiteAdd.addEventListener('click', function(e) {
		addInput('listWhite');
		e.preventDefault();
		e.stopPropagation();
	}, false);

	listBlackAdd.addEventListener('click', function(e) {
		addInput('listBlack');
		e.preventDefault();
		e.stopPropagation();
	}, false);

	listSitesAdd.addEventListener('click', function(e) {
		addInput('listSites');
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

	var cbShuffle = document.getElementById('optionShuffle');
	cbShuffle.checked = settings['shuffle'];

	var cbRepeat = document.getElementById('optionRepeat');
	cbRepeat.checked = settings['repeat'];

	for (var itemBlack in settings['listBlack']) {
		addInput('listBlack', settings['listBlack'][itemBlack]);
	}

	for (var itemWhite in settings['listWhite']) {
		addInput('listWhite', settings['listWhite'][itemWhite]);
	}

	for (var itemSites in settings['listSites']) {
		addInput('listSites', settings['listSites'][itemSites]);
	}

	addInput('listBlack'); //prepare a blank input box.
	addInput('listWhite'); //prepare a blank input box.
	addInput('listSites'); //prepare a blank input box.

	var version_div = document.getElementById('version_div');
	version_div.innerHTML = 'v'+defaultSettings['version']; //use default so we're always showing current version regardless of what people have saved.

	if (typeof opera != 'undefined') {
		var browser_span = document.getElementById('browser_span');
		browser_span.innerHTML = 'for Opera&trade;';
	}

	if (typeof chrome != 'undefined') {
		var browser_span = document.getElementById('browser_span');
		browser_span.innerHTML = 'for Chrome&trade;';
	}

	if (typeof safari != 'undefined') {
		var browser_span = document.getElementById('browser_span');
		browser_span.innerHTML = 'for Safari&trade;';
	}
}

function removeInput(optionWhich) {
	var optionInput = document.getElementById(optionWhich);
	if (!optionInput) {
		return;
	}
	optionInput.parentNode.removeChild(optionInput);
}

function addInput(whichList, itemValue) {
	var listDiv, listAdd, optionInput, currentLength, removeThis, optionAdd, optionImage, optionLinebreak, optionDiv;

	if (itemValue === undefined) { //if we don't pass an itemValue, make it blank.
		itemValue = '';
	}

	currentLength = inputLast++; //have unique DOM id's

	listDiv = document.getElementById(whichList);
	listAdd = document.getElementById(whichList + 'Add');

	optionInput = document.createElement('input');
	optionInput.value = itemValue;
	optionInput.name = 'option' + whichList;
	optionInput.id = 'option' + whichList + currentLength;

	optionAdd = document.createElement('a');
	optionAdd.href = '#';
	optionAdd.addEventListener('click', function (e) {
		removeThis = e.target;
		while (removeThis.tagName !== 'DIV') {
			removeThis = removeThis.parentNode;
		}
		if (removeThis.id.indexOf('_div') >= 0) {
			removeInput(removeThis.id);
		}
		e.preventDefault();
		e.stopPropagation();
	}, false);

	optionAdd.appendChild(document.createTextNode('\u00A0'));

	optionImage = document.createElement('img');
	optionImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGFJREFUeNpiXLVmfTwDA8MEIHYICwm8COTrA9kHgLiAEch5D2QIAPEHkABUIZjPBNIBlQAJLEBS6MAEMgqqAxkUgMQZkewQQJKE6ESSAAkkIFlxgAlq5AeoaxciuaEAIMAAiDAi7M96B5wAAAAASUVORK5CYII=';
	optionAdd.appendChild(optionImage);

	optionAdd.appendChild(document.createTextNode('\u00A0'));

	optionLinebreak = document.createElement('br');
	optionDiv = document.createElement('div');
	optionDiv.id = 'option' + whichList + currentLength + '_div';
	optionDiv.appendChild(optionAdd);
	optionDiv.appendChild(optionInput);
	optionDiv.appendChild(optionLinebreak);

	listDiv.insertBefore(optionDiv, listAdd);
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
		if (garbages[i].value != '') {
			if (garbages[i].name.indexOf('listWhite') !== -1) {
				settings['listWhite'].push(garbages[i].value);
			} else if (garbages[i].name.indexOf('listBlack') !== -1) {
				settings['listBlack'].push(garbages[i].value);
			} else if (garbages[i].name.indexOf('listSites') !== -1) {
				settings['listSites'].push(garbages[i].value);
			}
		}
	}
	localStorage['settings'] = JSON.stringify(settings);
	//location.reload();
}

function eraseOptions() {
	localStorage.removeItem('settings');
	location.reload();
}
