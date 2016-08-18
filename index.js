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
	this.currentSource = null;
	this.nextSources = [];
	this.recentSources = [];

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
			<input class="aa-input" value="" readonly/>
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

	//init input
	this.inputEl.addEventListener('input', e => {
		this.testEl.innerHTML = this.inputEl.value;
		this.inputEl.style.width = getComputedStyle(this.testEl).width;
	});

	//init url
	this.urlEl.addEventListener('click', e => {
		this.inputEl.focus();
	});
	this.inputEl.addEventListener('focus', e => {
		this.saveState();
		this.inputEl.removeAttribute('readonly');
		this.contentEl.classList.add('aa-focus');
		this.playEl.setAttribute('hidden', true);
		this.info('https://', this.icons.url);
		this.inputEl.select();
	});
	this.inputEl.addEventListener('keypress', e => {
		if (e.which === 13) {
			this.inputEl.blur();
			//FIXME: do we need this call? when? when no change happened?
			// this.inputEl.dispatchEvent(new Event('change'));
		}
	});
	this.inputEl.addEventListener('blur', e => {
		this.inputEl.setAttribute('readonly', true);
		this.contentEl.classList.remove('aa-focus');
		this.restoreState();
	});
	this.inputEl.addEventListener('change', (e) => {
		e.preventDefault();
		let value = this.inputEl.value;
		//to be called after blur
		setTimeout(() => {
			this.setSource(value);
		});
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
			.then(stream => this.setSource(stream)).catch((e) => this.error(e));
		}
		else {
			try {
				navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
				navigator.getUserMedia({audio: true, video: false}, stream => this.setSource(stream), (e) => this.error(e));
			} catch (e) {
				this.error(e);
			}
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

	//hack to set input element width
	let style = getComputedStyle(this.inputEl);
	this.testEl = document.createElement('div');
	this.testEl.style.fontFamily = style.fontFamily;
	this.testEl.style.fontSize = style.fontSize;
	this.testEl.style.letterSpacing = style.letterSpacing;
	this.testEl.style.textTransform = style.textTransform;
	this.testEl.style.fontWeight = style.fontWeight;
	this.testEl.style.fontStyle = style.fontStyle;
	this.testEl.style.padding = style.padding;
	this.testEl.style.margin = style.margin;
	this.testEl.style.border = style.border;

	this.testEl.style.whiteSpace = 'pre';
	this.testEl.style.position = 'fixed';
	this.testEl.style.top = '-1000px';
	this.testEl.style.left = '-1000px';

	this.container.appendChild(this.testEl);

	this.reset();
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

	//update width
	this.inputEl.style.width = getComputedStyle(this.testEl).width;

	return this;
};


//set current source to play
AppAudio.prototype.setSource = function (src) {
	//undefined source does not change current state
	if (!src) return this;

	//ignore not changed source
	if (src === this.currentSource) return this;

	//detect mic source, duck typing
	if (src.active != null && src.id && src.addTrack) {
		//ignore active mic already
		if (this.micNode) return this;

		this.reset();

		this.info('Microphone', this.icons.mic);

		//an alternative way to start media stream
		//does not work in chrome, so we just pass url to callback
		this.currentSource = URL.createObjectURL(src);
		// this.audio.src = streamUrl;

		//create media stream source node
		this.micNode = this.context.createMediaStreamSource(src);
		this.micNode.connect(this.gainNode);

		this.autoplay && this.play();

		this.emit('source', this.micNode, this.currentSource);

		return this;
	}

	//list of files enqueues all audio files to play
	if (src instanceof FileList) {
		let list = [];

		for (var i = 0; i < list.length; i++) {
			if (/audio/.test(list[i].type)) {
				list.push(list[i]);
			}
		}

		if (!list.length) {
			src.length === 1 ? this.error('Not an audio') : this.error('No audio source');
			return this;
		}

		this.nextSources = list;

		this.autoplay && this.play();
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
			// buffer: isMobile,
			crossOrigin: 'Anonymous'
		})
		.on('load', e => {
			this.play && this.audioEl.removeAttribute('hidden');

			this.player.node.connect(this.gainNode);

			this.autoplay && this.play();

			this.emit('source', this.player.node, url);
		})
		.on('error', e => this.error(e))
		.on('ended', e => {
			this.next();
		});

	}

	//url
	else if (typeof src === 'string') {
		if (!isUrl(src) && src[0] != '.' && src[0] != '/') {
			this.error('Bad URL');
			return this;
		}


		this.saveState();
		this.info(`Loading ${src}`, this.icons.loading);

		let player = new Player(src, {
			context: this.context,
			loop: this.loop,
			buffer: isMobile, //FIXME: this can be always false here i guess
			crossOrigin: 'Anonymous'
		}).on('load', () => {
			this.reset();

			this.player = player;

			this.source = src;

			this.info(src, this.icons.url);

			this.player.node.connect(this.gainNode);

			this.autoplay && this.play();

			this.emit('source', this.player.node, src);
		}).on('error', (err) => {
			this.restoreState();
			this.error(err);
		});
	}

	return this;
};

//Play/pause
AppAudio.prototype.play = function () {
	this.isPaused = false;
	this.playEl.innerHTML = this.icons.pause;

	this.play && this.playEl.removeAttribute('hidden');

	this.player && this.player.play();
	this.gainNode.gain.value = 1;

	this.emit('play', this.micNode);

	return this;
};
AppAudio.prototype.pause = function () {
	this.isPaused = true;
	this.playEl.innerHTML = this.icons.play;

	this.player && this.player.pause();

	this.play && this.playEl.removeAttribute('hidden');

	this.gainNode.gain.value = 0;

	this.emit('pause', this.micNode);

	return this;
};

//Disconnect all nodes, pause, reset source
AppAudio.prototype.reset = function () {
	//to avoid mixing multiple sources
	this.pause();

	//reset sources list
	this.nextSources = [];
	this.currentSource = null;

	//reset UI
	this.playEl.innerHTML = this.icons.play;
	this.playEl.setAttribute('hidden', true);
	this.info('Select source', this.icons.eject);

	//disconnect audio
	if (this.player) {
		this.player = null;
	}
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
	this.lastPlayVisibility = this.playEl.hasAttribute('hidden');

	return this;
};
AppAudio.prototype.restoreState = function (state) {
	state = state || this;
	this.info(state.lastTitle, state.lastIcon);
	if (state.lastPlayVisibility) this.playEl.setAttribute('hidden', true);
	else this.playEl.removeAttribute('hidden');

	return this;
};

//Duration of error message
AppAudio.prototype.errorDuration = 1600;

//Display error for a moment
AppAudio.prototype.error = function error (msg) {
	this.saveState();
	this.info(msg, this.icons.error);
	this.playEl.setAttribute('hidden', true);
	this.contentEl.classList.add('aa-error');

	//FIXME: emitter shits the bed here
	// this.emit('error', msg);

	setTimeout(() => {
		this.contentEl.classList.remove('aa-error');
		this.restoreState();
	}, this.errorDuration);

	return this;
};
//Display message
AppAudio.prototype.info = function info (msg, icon) {
	this.inputEl.value = msg;
	this.iconEl.innerHTML = icon || this.icons.loading;
	this.inputEl.title = this.inputEl.value;

	this.testEl.innerHTML = this.inputEl.value;
	this.inputEl.style.width = getComputedStyle(this.testEl).width;

	return this;
};