/**
 * Sound input component
 *
 * @module sound-input
 */
'use strict';

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
const Player = require('web-audio-player');
const pad = require('left-pad');
const capfirst = require('capitalize-first-letter');
require('get-float-time-domain-data');

module.exports = AppAudio;


css(fs.readFileSync(__dirname + '/index.css', 'utf-8'));

inherits(AppAudio, Emitter);

//@constructor
function AppAudio (opts) {
	if (!(this instanceof AppAudio)) return new AppAudio(opts);

	this.init(opts);

	this.set(this.source);
}

//Default source
AppAudio.prototype.source = '';

//List of default sources
AppAudio.prototype.sources = [];

//Observe paste event
AppAudio.prototype.paste = true;

//Allow dropping files to browser
AppAudio.prototype.dragAndDrop = !isMobile;

//Show play/payse buttons
AppAudio.prototype.play = true;

//Enable file select
AppAudio.prototype.file = true;

//Enable url input
AppAudio.prototype.url = true;

//Enable signal input
AppAudio.prototype.signal = true;

//Show recent sources list
AppAudio.prototype.recent = true;

//Max number of recent sources
AppAudio.prototype.maxRecent = 5;

//Show next sources list
AppAudio.prototype.next = true;

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
AppAudio.prototype.save = !isMobile;

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
	next: fs.readFileSync(__dirname + '/image/next.svg', 'utf8'),
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
	sawtooth: fs.readFileSync(__dirname + '/image/saw.svg', 'utf8'),
	square: fs.readFileSync(__dirname + '/image/rectangle.svg', 'utf8'),
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
	this.recentTitles = [];

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
		<a href="#playback" class="aa-button aa-button-play" hidden><i class="aa-icon"></i></a>
		<a href="#next" class="aa-button aa-button-next" hidden><i class="aa-icon">${this.icons.next}</i></a>
	`;
	this.iconEl = this.element.querySelector('.aa-icon');
	this.contentEl = this.element.querySelector('.aa-content');
	this.inputEl = this.element.querySelector('.aa-input');
	this.buttonEl = this.element.querySelector('.aa-button-play');
	this.playEl = this.buttonEl.querySelector('.aa-icon');
	this.nextButtonEl = this.element.querySelector('.aa-button-next');

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
			<li class="aa-item aa-item-signal" title="Sine" data-source="sine"><i class="aa-icon">${this.icons.sine}</i></li>
			<li class="aa-item aa-item-signal" title="Sawtooth" data-source="sawtooth"><i class="aa-icon">${this.icons.sawtooth}</i></li>
			<li class="aa-item aa-item-signal" title="Triangle" data-source="triangle"><i class="aa-icon">${this.icons.triangle}</i></li>
			<li class="aa-item aa-item-signal" title="Rectangle" data-source="square"><i class="aa-icon">${this.icons.square}</i></li>
			<li class="aa-item aa-item-signal" title="White noise" data-source="whitenoise"><i class="aa-icon">${this.icons.whitenoise}</i></li>
		</ul>
		<ul class="aa-items aa-next" data-title="Next" hidden></ul>
		<ul class="aa-items aa-recent" data-title="Recent" hidden></ul>
	`;
	this.fileEl = this.dropdownEl.querySelector('.aa-file');
	this.urlEl = this.dropdownEl.querySelector('.aa-url');
	this.soundcloudEl = this.dropdownEl.querySelector('.aa-soundcloud');
	this.micEl = this.dropdownEl.querySelector('.aa-mic');
	this.noiseEl = this.dropdownEl.querySelector('.aa-noise');
	this.signalEl = this.dropdownEl.querySelector('.aa-signal');
	this.recentEl = this.dropdownEl.querySelector('.aa-recent');
	this.nextEl = this.dropdownEl.querySelector('.aa-next');
	this.element.appendChild(this.dropdownEl);

	//init playpayse
	this.buttonEl.addEventListener('click', e => {
		e.preventDefault();

		if (this.isPaused) {
			this.play();
		}
		else {
			this.pause();
		}
	});

	//init next
	this.nextButtonEl.addEventListener('click', e => {
		e.preventDefault();
		this.playNext();
	});

	//init input
	this.inputEl.addEventListener('input', e => {
		this.testEl.innerHTML = this.inputEl.value;
		this.inputEl.style.width = parseInt(getComputedStyle(this.testEl).width) + 5 + 'px';
	});

	//init soundcloud
	this.soundcloudEl.addEventListener('click', e => {
		this.inputEl.focus();
		this.info('https://', this.icons.soundcloud);
		this.inputEl.removeAttribute('readonly');
		this.buttonEl.setAttribute('hidden', true);
		this.inputEl.select();
	});

	//init url
	this.urlEl.addEventListener('click', e => {
		this.inputEl.focus();
		this.info('https://', this.icons.url);
		this.inputEl.removeAttribute('readonly');
		this.buttonEl.setAttribute('hidden', true);
		this.inputEl.select();
	});
	this.inputEl.addEventListener('focus', e => {
		this.saveState();
		this.contentEl.classList.add('aa-focus');
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
			this.set(value);
		});
	});

	//init file
	this.fileInputEl = this.dropdownEl.querySelector('.aa-file-input');
	this.fileInputEl.addEventListener('change', e => {
		this.set(this.fileInputEl.files);
	});

	//init mic
	this.micEl.addEventListener('click', (e) => {
		let that = this;

		e.preventDefault();

		this.reset();

		if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({audio: true, video: false})
			.then(stream => this.set(stream)).catch((e) => this.error(e));
		}
		else {
			try {
				navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
				navigator.getUserMedia({audio: true, video: false}, stream => this.set(stream), (e) => this.error(e));
			} catch (e) {
				this.error(e);
			}
		}
	});

	//init recent
	this.recentEl.addEventListener('click', (e) => {
		let target = e.target.closest('.aa-item');
		if (!target) return;
		let src = target.getAttribute('data-source');
		this.set(src);
	});

	//init next list
	this.nextEl.addEventListener('click', (e) => {
		let target = e.target.closest('.aa-item');
		if (!target) return;
		let src = target.getAttribute('data-source');
		this.set(src);
	});

	//init signal
	this.signalEl.addEventListener('click', e => {
		let target = e.target.closest('.aa-item');
		if (!target) return;
		let src = target.getAttribute('data-source');
		this.set(src);
	});

	//init progress
	this.progressEl = document.createElement('div');
	this.progressEl.className = 'aa-progress';
	this.container.appendChild(this.progressEl);
	this.progressEl.style.width = 0;

	setInterval(() => {
		let currentTime = this.player && this.player.currentTime || this.player && this.player.element && this.player.element.currentTime || 0;

		if (currentTime) {
			this.progressEl.style.width = ((currentTime / this.player.duration * 100) || 0) + '%';
			this.progressEl.setAttribute('title', `${formatTime(currentTime)} / ${formatTime(this.player.duration)} played`);
		}
		else {
			this.progressEl.style.width = 0;
		}
	}, 200);
	function formatTime (time) {
		return pad((time / 60)|0, 2, 0) + ':' + pad((time % 60)|0, 2, 0);
	}

	//create drag n drop
	if (this.dragAndDrop) {
		let count = 0;
		let title;
		let that = this;

		let dragleave = function (e) {
			count--;

			//non-zero count means were still inside
			if (count) return;

			count = 0;
			that.container.removeEventListener('dragleave', dragleave);
			that.container.classList.remove('aa-dragover');
			that.restoreState();
		}

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
			that.set(dt.files);
		}, false);

		this.container.addEventListener('dragenter', e => {
			count++;

			if (count > 1) return;

			that.container.classList.add('aa-dragover');
			that.container.addEventListener('dragleave', dragleave, false);

			e.dataTransfer.dropEffect = 'copy';
			let items = e.dataTransfer.items;

			that.saveState();
			that.info(items.length < 2 ? `Drop audio file` : `Drop audio files`, that.icons.record);
		});
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

	//load last source
	if (this.save) {
		this.loadSources();
	}

	//load predefined source
	else if (this.source) {
		this.set(this.source);
	}

	this.update();

	return this;
};

//keep app state updated
AppAudio.prototype.update = function update (opts) {
	extend(this, opts);

	//hide/unhide proper elements
	this.icon ? this.iconEl.removeAttribute('hidden') : this.iconEl.setAttribute('hidden', true);
	this.progress ? this.progressEl.removeAttribute('hidden') : this.progressEl.setAttribute('hidden', true);
	this.file ? this.fileEl.removeAttribute('hidden') : this.fileEl.setAttribute('hidden', true);
	this.url ? this.urlEl.removeAttribute('hidden') : this.urlEl.setAttribute('hidden', true);
	this.signal ? this.signalEl.removeAttribute('hidden') : this.signalEl.setAttribute('hidden', true);
	this.mic ? this.micEl.removeAttribute('hidden') : this.micEl.setAttribute('hidden', true);
	this.soundcloud ? this.soundcloudEl.removeAttribute('hidden') : this.soundcloudEl.setAttribute('hidden', true);
	this.recent && this.recentSources.length ? this.recentEl.removeAttribute('hidden') : this.recentEl.setAttribute('hidden', true);
	if (this.next) {
		if (this.nextSources.length) {
			this.nextEl.removeAttribute('hidden');
			this.nextButtonEl.removeAttribute('hidden');
		} else {
			this.nextEl.setAttribute('hidden', true);
			this.nextButtonEl.setAttribute('hidden', true);
		}
	}

	//apply color
	this.element.style.color = this.color;
	this.progressEl.style.color = this.color;
	if (this.dragAndDrop) this.dropEl.style.color = this.color;

	//update width
	this.inputEl.style.width = parseInt(getComputedStyle(this.testEl).width) + 5 + 'px';

	//update recent list
	this.recentEl.innerHTML = '';
	if (this.recent) {
		let html = ``;
		this.recentSources.forEach((src, i) => {
			html += `<li class="aa-item aa-recent-item" title="${this.recentTitles[i]}" data-source="${src}">${this.recentTitles[i]}</li>`
		});
		this.recentEl.innerHTML = html;
	}

	//update next list
	this.nextEl.innerHTML = '';
	if (this.next) {
		let html = ``;
		this.nextSources.forEach((src) => {
			html += `<li class="aa-item aa-next-item" title="${src.name || src}" data-source="${src}">${src.name || src}</li>`
		});
		this.nextEl.innerHTML = html;
	}

	return this;
};


//set current source to play
AppAudio.prototype.set = function (src) {
	let that = this;

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

		this.autoplay ? this.play() : this.pause();

		this.emit('ready', this.micNode, this.currentSource);

		return this;
	}

	//list of sources should all be added to next
	if (Array.isArray(src)) {
		this.nextSources = src.slice(1);
		this.set(src[0]);
		return this;
	}

	//list of files enqueues all audio files to play
	if (src instanceof FileList) {
		let list = [];

		for (var i = 0; i < src.length; i++) {
			if (/audio/.test(src[i].type)) {
				list.push(src[i]);
			}
		}

		if (!list.length) {
			src.length === 1 ? this.error('Not an audio') : this.error('No audio source');
			return this;
		}

		this.nextSources = list.slice(1);

		return this.set(list[0]);
	}

	//single file instance
	if (src instanceof File) {
		let url = URL.createObjectURL(src);
		this.saveState();

		this.currentSource = src;

		let player = new Player(url, {
			context: this.context,
			loop: this.loop,
			crossOrigin: 'Anonymous'
		}).on('load', e => {
			this.reset();

			this.info(src.name, this.icons.record);
			this.player = player;

			this.update();

			this.player.node.connect(this.gainNode);

			this.autoplay ? this.play() : this.pause();

			this.emit('ready', this.player.node, src);
		}).on('error', (err) => {
			this.restoreState();
			this.error(err);
		}).on('end', () => {
			this.playNext();
		});

	}

	//soundcloud
	//FIXME: recognize straight stream API url
	else if (/soundcloud/.test(src)) {
		this.saveState();

		this.info('Connecting to soundcloud', this.icons.loading);
		let token = this.token.soundcloud || this.token;

		that.currentSource = src;

		if (!isMobile) {
			xhr({
				uri: `https://api.soundcloud.com/resolve.json?client_id=${token}&url=${src}`,
				method: 'GET'
			}, (err, response) => {
				if (err) {
					this.restoreState();
					return this.error(err);
				}

				let json = JSON.parse(response.body);

				setSoundcloud(json, token);
			});
			return this;
		}

		//mobile soundcloud has a bit more specific routine
		else {
			xhr({
				uri: `https://api.soundcloud.com/resolve.json?client_id=${token}&url=${src}&format=json`,
				method: 'GET'
			}, () => {
				xhr({
					uri: `https://api.soundcloud.com/resolve.json?client_id=${token}&url=${src}&_status_code_map[302]=200&format=json`,
					method: 'GET'
				}, function (err, response) {
					if (err) {
						this.restoreState();
						return this.error(err, cb);
					}

					let obj = JSON.parse(response.body);
					xhr({
						uri: obj.location,
						method: 'GET'
					}, function (err, response) {
						if (err) {
							this.restoreState();
							return this.error(err, cb);
						}

						let json = JSON.parse(response.body);

						setSoundcloud(json, token);
					});
				});
			});
		}

		return this;
	}

	//signal nodes
	else if (/sin|tri|saw|rect|squ/.test(src)) {
		this.reset();

		this.oscNode = this.context.createOscillator();
		this.oscNode.type = /sin/.test(src) ? 'sine' : /tri/.test(src) ? 'triangle' : /rect|squ/.test(src) ? 'square' : 'sawtooth';
		this.oscNode.frequency.value = 440;
		this.oscNode.start();

		this.currentSource = src;
		this.save && this.saveSources();
		this.info(capfirst(this.oscNode.type), this.icons[this.oscNode.type]);
		this.oscNode.connect(this.gainNode);
		this.autoplay ? this.play() : this.pause();
		this.emit('ready', this.oscNode, src);

	}
	else if (/noise/.test(src)) {
		this.reset();
		let buffer = this.context.createBuffer(2, 44100*2, this.context.sampleRate);
		for (let channel = 0; channel < 2; channel++){
			let data = buffer.getChannelData(channel);
			for (let i = 0; i < 44100*2; i++) {
				data[i] = Math.random() * 2 - 1;
			}
		}
		this.bufNode = this.context.createBufferSource();
		this.bufNode.buffer = buffer;
		this.bufNode.loop = true;
		this.bufNode.start();

		this.currentSource = src;
		this.save && this.saveSources();
		this.info('Noise', this.icons.whitenoise);
		this.bufNode.connect(this.gainNode);
		this.autoplay ? this.play() : this.pause();
		this.emit('ready', this.bufNode, src);
	}

	//url
	else if (typeof src === 'string') {
		if (!isUrl(src) && src[0] != '.' && src[0] != '/') {
			this.error('Bad URL');
			return this;
		}

		this.saveState();
		this.info(`Loading ${src}`, this.icons.loading);
		this.currentSource = src;

		let player = new Player(src, {
			context: this.context,
			loop: this.loop,
			buffer: isMobile, //FIXME: this can be always false here i guess
			crossOrigin: 'Anonymous'
		}).on('load', () => {
			this.reset();

			this.player = player;
			this.addRecent(src, src);
			this.save && this.saveSources();
			this.update();

			this.info(src, this.icons.url);
			this.player.node.connect(this.gainNode);
			this.autoplay ? this.play() : this.pause();
			this.emit('ready', this.player.node, src);
		}).on('error', (err) => {
			this.restoreState();
			this.error(err);
		}).on('end', () => {
			this.playNext();
		});
	}

	function setSoundcloud (json) {
		let token = that.token.soundcloud || that.token;

		let streamUrl = json.stream_url + '?client_id=' + token;

		//if list of tracks - setup first, save others for next
		if (json.tracks) {
			that.nextSources = json.tracks.slice(1).map(t => t.permalink_url);
			// that.addRecent(json.title, json.permalink_url);
			return that.set(json.tracks[0].permalink_url);
		}

		let titleHtml = json.title;
		if (json.user) {
			titleHtml += ` by ${json.user.username}`;
		}

		let player = new Player(streamUrl, {
			context: that.context,
			loop: that.loop,
			buffer: false,
			crossOrigin: 'Anonymous'
		}).on('decoding', () => {
			that.info(`Decoding ${titleHtml}`, that.icons.loading);
		}).on('progress', (e) => {
			if (e === 0) return;
			that.info(`Loading ${titleHtml}`, that.icons.loading)
		}).on('load', () => {
			that.reset();

			that.player = player;


			that.addRecent(titleHtml, src);
			that.save && that.saveSources();
			that.update();

			that.info(titleHtml, that.icons.soundcloud);

			that.player.node.connect(that.gainNode);

			that.autoplay ? that.play() : that.pause();

			that.emit('ready', that.player.node, streamUrl);
		}).on('error', (err) => {
			that.restoreState();
			that.error(err);
		}).on('end', () => {
			that.playNext();
		});
	}

	return this;
};

//Add recent track
AppAudio.prototype.addRecent = function (title, src) {
	if (!src) return this;

	if (this.recentSources.indexOf(src) < 0) {
		this.recentSources.push(src);
		this.recentTitles.push(title);
	}

	this.recentSources = this.recentSources.slice(-this.maxRecent);
	this.recentTitles = this.recentTitles.slice(-this.maxRecent);

	return this;
}

//Save/load recent tracks to list
AppAudio.prototype.storageKey = 'app-audio';
AppAudio.prototype.storage = sessionStorage || localStorage;
AppAudio.prototype.saveSources = function () {
	if (!this.storage) return this;

	this.storage.setItem(this.storageKey, JSON.stringify({
		recentSources: this.recentSources,
		recentTitles: this.recentTitles,
		current: this.currentSource
	}));

	return this;
}
AppAudio.prototype.loadSources = function () {
	if (!this.storage) return this;

	let obj = this.storage.getItem(this.storageKey);
	if (!obj) return this;

	let {recentSources, recentTitles, current} = JSON.parse(obj);
	if (recentSources && recentSources.length) {
		this.recentSources = recentSources;
		this.recentTitles = recentTitles;
	}
	this.set(current);

	return this;
}

//Play/pause
AppAudio.prototype.play = function () {
	this.isPaused = false;
	this.playEl.innerHTML = this.icons.pause;

	this.play && this.buttonEl.removeAttribute('hidden');

	this.player && this.player.play();
	this.gainNode.gain.value = 1;

	this.emit('play', this.micNode);

	return this;
};
AppAudio.prototype.pause = function () {
	this.isPaused = true;
	this.playEl.innerHTML = this.icons.play;

	this.player && this.player.pause();

	this.play && this.buttonEl.removeAttribute('hidden');

	this.gainNode.gain.value = 0;

	this.emit('pause', this.micNode);

	return this;
};

//play next track if any
AppAudio.prototype.playNext = function () {
	this.pause();

	let src = this.nextSources.shift();

	if (src) {
		this.set(src);
	}

	return this;
};

//Disconnect all nodes, pause, reset source
AppAudio.prototype.reset = function () {
	//to avoid mixing multiple sources
	this.pause();

	//reset sources list
	this.currentSource = null;

	//reset UI
	this.playEl.innerHTML = this.icons.play;
	this.buttonEl.setAttribute('hidden', true);
	this.nextButtonEl.setAttribute('hidden', true);
	this.info('', this.icons.eject);

	//disconnect audio
	if (this.player) {
		this.player = null;
	}
	if (this.micNode) {
		this.micNode.disconnect();
		this.micNode = null;
	}
	if (this.bufNode) {
		this.bufNode.disconnect();
		this.bufNode = null;
	}
	if (this.oscNode) {
		this.oscNode.disconnect();
		this.oscNode = null;
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
	this.lastPlayVisibility = this.buttonEl.hasAttribute('hidden');

	return this;
};
AppAudio.prototype.restoreState = function (state) {
	state = state || this;

	this.info(state.lastTitle, state.lastIcon);
	if (state.lastPlayVisibility) this.buttonEl.setAttribute('hidden', true);
	else {
		this.buttonEl.removeAttribute('hidden');
	}

	return this;
};

//Duration of error message
AppAudio.prototype.errorDuration = 2000;

//Display error for a moment
AppAudio.prototype.error = function error (msg) {
	this.saveState();
	this.info(msg, this.icons.error);
	this.buttonEl.setAttribute('hidden', true);
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
	this.inputEl.value = msg || 'Select source ▾';
	this.iconEl.innerHTML = icon || this.icons.loading;
	this.contentEl.title = this.inputEl.value;

	this.testEl.innerHTML = this.inputEl.value;
	this.inputEl.style.width = parseInt(getComputedStyle(this.testEl).width) + 5 + 'px';

	return this;
};