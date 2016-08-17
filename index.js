/**
 * Sound input component
 *
 * @module sound-input
 */

const extend = require('just-extend');
const inherits = require('inherits');
const Emitter = require('events');
const audioContext = require('audio-context');
const fs = require('fs');
const css = require('insert-styles');
const isMobile = require('is-mobile')();
const xhr = require('xhr');
const isUrl = require('is-url');
const isObject = require('is-plain-obj');
const qs = require('querystring');
const Player = require('web-audio-player');
const alpha = require('color-alpha');
require('get-float-time-domain-data');


module.exports = AppAudio;


css(fs.readFileSync(__dirname + '/index.css', 'utf-8'));


inherits(AppAudio, Emitter);

//@constructor
function AppAudio (opts) {
	if (!(this instanceof AppAudio)) return new AppAudio(opts);

	this.init(opts);

	this.setSource(this.source);
}


//Observe paste event
AppAudio.prototype.paste = true;

//Allow dropping files to browser
AppAudio.prototype.dragAndDrop = true;

//Show play/payse buttons
AppAudio.prototype.play = true;

//Enable file select
AppAudio.prototype.file = true;

//Enable url input
AppAudio.prototype.url = true;

//Enable signal input
AppAudio.prototype.signal = true;

//Show recent files list
AppAudio.prototype.recent = true;

//Enable mic input
AppAudio.prototype.mic = !!(navigator.mediaDevices || navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia);

//Enable soundcloud input
AppAudio.prototype.soundcloud = true;

//Autostart play
AppAudio.prototype.autoplay = !isMobile;

//Repeat track[s] list after end
AppAudio.prototype.loop = true;

//Show progress indicator
AppAudio.prototype.progress = true;

//Save/load last track
AppAudio.prototype.save = true;

//Display icons
AppAudio.prototype.icon = true;

//Default color
AppAudio.prototype.color = 'black';


//Default (my) soundcloud API token
AppAudio.prototype.token = {
	soundcloud: '6b7ae5b9df6a0eb3fcca34cc3bb0ef14',
	youtube: 'AIzaSyBPxsJRzvSSz_LOpejJhOGPyEzlRxU062M'
};

//Default container
AppAudio.prototype.container = document.body || document.documentElement;

//Default audio context
AppAudio.prototype.context = audioContext;

//Icon paths
AppAudio.prototype.icons = {
	record: fs.readFileSync(__dirname + '/image/record.svg', 'utf8'),
	error: fs.readFileSync(__dirname + '/image/error.svg', 'utf8'),
	soundcloud: fs.readFileSync(__dirname + '/image/soundcloud.svg', 'utf8'),
	open: fs.readFileSync(__dirname + '/image/open.svg', 'utf8'),
	loading: fs.readFileSync(__dirname + '/image/loading.svg', 'utf8'),
	url: fs.readFileSync(__dirname + '/image/url.svg', 'utf8'),
	mic: fs.readFileSync(__dirname + '/image/mic.svg', 'utf8'),
	play: fs.readFileSync(__dirname + '/image/play.svg', 'utf8'),
	pause: fs.readFileSync(__dirname + '/image/pause.svg', 'utf8'),
	stop: fs.readFileSync(__dirname + '/image/stop.svg', 'utf8'),
	eject: fs.readFileSync(__dirname + '/image/eject.svg', 'utf8'),
	settings: fs.readFileSync(__dirname + '/image/settings.svg', 'utf8'),
	github: fs.readFileSync(__dirname + '/image/github.svg', 'utf8'),
	sine: fs.readFileSync(__dirname + '/image/sine.svg', 'utf8'),
	saw: fs.readFileSync(__dirname + '/image/saw.svg', 'utf8'),
	rectangle: fs.readFileSync(__dirname + '/image/rectangle.svg', 'utf8'),
	triangle: fs.readFileSync(__dirname + '/image/triangle.svg', 'utf8'),
	noise: fs.readFileSync(__dirname + '/image/noise.svg', 'utf8'),
	whitenoise: fs.readFileSync(__dirname + '/image/whitenoise.svg', 'utf8')
};


//do init routine
AppAudio.prototype.init = function init (opts) {
	extend(this, opts);

	//queue
	this.queue = [];
	this.current = null;

	//audio
	this.gainNode = this.context.createGain();
	this.gainNode.connect(this.context.destination);


	//UI
	//ensure container
	if (!this.container) this.container = document.body || document.documentElement;
	this.container.classList.add('app-audio-container');

	//create element
	this.element = document.createElement('div');
	this.element.className = 'app-audio';
	this.container.appendChild(this.element);

	//create layout
	this.element.innerHTML = `
		<label for="aa-dropdown-toggle" class="aa-content">
			<i class="aa-icon">${this.icons.eject}</i>
			<input class="aa-input" value="Select source" readonly/>
		</label>
		<a href="#playback" class="aa-button"><i class="aa-icon"></i></a>
	`;
	this.iconEl = this.element.querySelector('.aa-icon');
	this.contentEl = this.element.querySelector('.aa-content');
	this.inputEl = this.element.querySelector('.aa-input');
	this.buttonEl = this.element.querySelector('.aa-button');
	this.playEl = this.buttonEl.querySelector('.aa-icon');

	this.contentEl.addEventListener('click', () => {
		if (this.dropdownEl.hasAttribute('hidden')) {
			this.show();
		}
		else {
			this.hide();
		}
	});

	//create dropdown
	this.dropdownEl = document.createElement('div');
	this.dropdownEl.className = 'aa-dropdown';
	this.dropdownEl.setAttribute('hidden', true);
	this.dropdownEl.innerHTML = `
		<ul class="aa-items">
		<li class="aa-item aa-file"><i class="aa-icon">${this.icons.open}</i> File
		<input class="aa-file-input" type="file" multiple/></li>
		<li class="aa-item aa-soundcloud"><i class="aa-icon">${this.icons.soundcloud}</i> Soundcloud</li>
		<li class="aa-item aa-url"><i class="aa-icon">${this.icons.url}</i> URL</li>
		<li class="aa-item aa-mic"><i class="aa-icon">${this.icons.mic}</i> Microphone</li>
		</ul>
		<ul class="aa-items aa-signal" data-title="Signal">
			<li class="aa-item aa-item-short" title="Sine"><i class="aa-icon">${this.icons.sine}</i></li>
			<li class="aa-item aa-item-short" title="Sawtooth"><i class="aa-icon">${this.icons.saw}</i></li>
			<li class="aa-item aa-item-short" title="Triangle"><i class="aa-icon">${this.icons.triangle}</i></li>
			<li class="aa-item aa-item-short" title="Rectangle"><i class="aa-icon">${this.icons.rectangle}</i></li>
			<li class="aa-item aa-item-short" title="White noise"><i class="aa-icon">${this.icons.whitenoise}</i></li>
		</ul>
		<ul class="aa-items aa-recent" data-title="Recent" hidden>
		<li class="aa-item"><i class="aa-icon">${this.icons.record}</i> A.mp4</li>
		</ul>
	`;
	this.fileEl = this.dropdownEl.querySelector('.aa-file');
	this.urlEl = this.dropdownEl.querySelector('.aa-url');
	this.soundcloudEl = this.dropdownEl.querySelector('.aa-soundcloud');
	this.micEl = this.dropdownEl.querySelector('.aa-mic');
	this.noiseEl = this.dropdownEl.querySelector('.aa-noise');
	this.signalEl = this.dropdownEl.querySelector('.aa-signal');
	this.recentEl = this.dropdownEl.querySelector('.aa-recent');
	this.element.appendChild(this.dropdownEl);

	//init playpayse
	this.playEl.addEventListener('click', e => {
		e.preventDefault();

		if (this.isPaused) {
			this.play();
		}
		else {
			this.pause();
		}
	});

	//init file
	this.fileInputEl = this.dropdownEl.querySelector('.aa-file-input');
	this.fileInputEl.addEventListener('change', e => {
		this.setSource(this.fileInputEl.files);
	});

	//init mic
	this.micEl.addEventListener('click', (e) => {
		let that = this;

		e.preventDefault();

		this.reset();

		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({audio: true, video: false})
			.then(enableMic).catch((e) => this.error(e));
		}
		else {
			try {
				navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
				navigator.getUserMedia({audio: true, video: false}, enableMic, (e) => this.error(e));
			} catch (e) {
				this.error(e);
			}
		}

		function enableMic(stream) {
			that.info('Microphone', that.icons.mic);

			//an alternative way to start media stream
			//does not work in chrome, so we just pass url to callback
			let streamUrl = URL.createObjectURL(stream);
			// that.audio.src = streamUrl;

			//create media stream source node
			if (!that.micNode) {
				that.micNode = that.context.createMediaStreamSource(stream);
				that.micNode.connect(that.gainNode);
			}
			that.autoplay && that.play();

			that.emit('source', that.micNode, streamUrl);
		}
	});

	//create progress
	this.progressEl = document.createElement('div');
	this.progressEl.className = 'aa-progress';
	this.container.appendChild(this.progressEl);

	//create drag n drop
	if (this.dragAndDrop) {
		let count = 0;
		let title;
		let that = this;

		this.dropEl = document.createElement('div');
		this.dropEl.className = 'aa-drop';
		this.container.appendChild(this.dropEl);

		// this.container.addEventListener('dragstart', (e) => {
			//ignore dragging the container
			//FIXME: maybe we need a bit more specifics here, by inner elements
		// 	e.preventDefault();
		// 	return false;
		// }, false);
		this.container.addEventListener('dragover', (e) => {
			e.preventDefault();
		}, false);

		this.container.addEventListener('drop', (e) => {
			e.preventDefault();
			dragleave(e);

			var dt = e.dataTransfer;
			// that.setSource(dt.files, () => {
				//that.restoreState();
			// });
		}, false);

		this.container.addEventListener('dragenter', dragenter);


		function dragenter (e) {
			count++;

			if (count > 1) return;

			that.container.classList.add('aa-dragover');
			that.container.addEventListener('dragleave', dragleave, false);

			e.dataTransfer.dropEffect = 'copy';
			let items = e.dataTransfer.items;

			that.saveState();
			console.log(items.length)
			that.info(items.length < 2 ? `Drop audio file` : `Drop audio files`, that.icons.record);
		}
		function dragleave (e) {
			count--;

			//non-zero count means were still inside
			if (count) return;

			count = 0;
			that.container.removeEventListener('dragleave', dragleave);
			that.container.classList.remove('aa-dragover');
			that.restoreState();
		}
	}

	this.update(opts);
};

//keep app state updated
AppAudio.prototype.update = function update (opts) {
	extend(this, opts);

	//hide/unhide proper elements
	this.icon ? this.iconEl.removeAttribute('hidden') : this.iconEl.setAttribute('hidden', true);
	this.play ? this.buttonEl.removeAttribute('hidden') : this.buttonEl.setAttribute('hidden', true);
	this.file ? this.fileEl.removeAttribute('hidden') : this.fileEl.setAttribute('hidden', true);
	this.url ? this.urlEl.removeAttribute('hidden') : this.urlEl.setAttribute('hidden', true);
	this.signal ? this.signalEl.removeAttribute('hidden') : this.signalEl.setAttribute('hidden', true);
	this.mic ? this.micEl.removeAttribute('hidden') : this.micEl.setAttribute('hidden', true);
	this.soundcloud ? this.soundcloudEl.removeAttribute('hidden') : this.soundcloudEl.setAttribute('hidden', true);
	this.recent ? this.recentEl.removeAttribute('hidden') : this.recentEl.setAttribute('hidden', true);

	//apply color
	this.element.style.color = this.color;
	this.progressEl.style.color = this.color;
	this.dropEl.style.color = this.color;

	return this;
};


//set current source to play
AppAudio.prototype.setSource = function (src) {
	//undefined source does not change current state
	if (!src) return this;

	//list of sources to enqueue
	let list = [];

	//list of files enqueues all audio files to play
	if (src instanceof FileList) {
		let list = src;

		for (var i = 0; i < list.length; i++) {
			if (/audio/.test(list[i].type)) {
				list.push(list[i]);
			}
		}

		if (!list.length) {
			src.length === 1 ? this.error('Not an audio') : this.error('No audio within selected files');
			return this;
		}
	}

	//single file instance
	if (src instanceof File) {
		let url = URL.createObjectURL(src);

		this.info(src.name, this.icons.record);
		this.playQueue = [url];

		this.reset();
		this.player = new Player(url, {
			context: this.context,
			loop: this.loop,
			buffer: isMobile,
			crossOrigin: 'Anonymous'
		})
		.on('load', e => {
			this.play && this.audioEl.removeAttribute('hidden');
			this.emit('source', this.player.node, url);
			this.autoplay && this.play();
		})
		.on('error', e => this.error(e))
		.on('ended', e => {
			this.next();
		});

	}

	//FIXME: url

	return this;
};

//Play/pause
AppAudio.prototype.play = function () {
	this.isPaused = false;
	this.playEl.innerHTML = this.icons.pause;

	this.play && this.playEl.removeAttribute('hidden');

	if (this.micNode) {
		this.gainNode.gain.value = 1;
	}

	this.emit('play', this.micNode);

	return this;
};
AppAudio.prototype.pause = function () {
	this.isPaused = true;
	this.playEl.innerHTML = this.icons.play;

	this.play && this.playEl.removeAttribute('hidden');

	if (this.micNode) {
		this.gainNode.gain.value = 0;
	}

	this.emit('pause', this.micNode);

	return this;
};

//Disconnect all nodes, pause, reset source
AppAudio.prototype.reset = function () {
	this.isPaused = true;
	this.playEl.innerHTML = this.icons.play;
	this.playEl.setAttribute('hidden', true);
	this.info('Select source', this.icons.eject);

	if (this.micNode) {
		this.micNode.disconnect();
		this.micNode = null;
	}

	this.emit('reset', this.micNode);

	return this;
};

//Show/hide menu
AppAudio.prototype.show = function (src) {
	this.dropdownEl.removeAttribute('hidden');
	this.contentEl.classList.add('aa-active');

	let that = this;
	setTimeout(() => {
		document.addEventListener('click', function _(e) {
			that.hide();
			document.removeEventListener('click', _);
		});
	});

	return this;
};
AppAudio.prototype.hide = function (src) {
	this.contentEl.classList.remove('aa-active');
	this.dropdownEl.setAttribute('hidden', true);

	return this;
};

//Save/restore state technical methods
AppAudio.prototype.saveState = function () {
	this.lastTitle = this.inputEl.value;
	this.lastIcon = this.iconEl.innerHTML;

	return this;
};
AppAudio.prototype.restoreState = function () {
	this.info(this.lastTitle, this.lastIcon);

	return this;
};

//Duration of error message
AppAudio.prototype.errorDuration = 1600;

//Display error for a moment
AppAudio.prototype.error = function error (msg) {
	this.saveState();
	this.info(msg, this.icons.error);

	setTimeout(() => {
		this.restoreState();
	}, this.errorDuration);

	return this;
};
//Display message
AppAudio.prototype.info = function info (msg, icon) {
	this.inputEl.value = msg;
	this.iconEl.innerHTML = icon || this.icons.loading;
	this.inputEl.title = this.inputEl.value;

	return this;
};