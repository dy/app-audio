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

//Enable noise input
AppAudio.prototype.noise = true;

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
	noise: fs.readFileSync(__dirname + '/image/noise.svg', 'utf8')
};


//do init routine
AppAudio.prototype.init = function init (opts) {
	//ensure container
	if (!this.container) this.container = document.body || document.documentElement;
	this.container.classList.add('app-audio-container');

	//create element
	this.element = document.createElement('div');
	this.element.className = 'app-audio';
	this.container.appendChild(this.element);

	//create layout
	this.element.innerHTML = `
		<i class="aa-icon">${this.icons.loading}</i>
		<label for="source" class="aa-content">
			<input class="aa-input" value="Select source..." readonly/>
		</label>
		<a href="#playback" class="aa-button"><i class="aa-icon">${this.icons.play}</i></a>
	`;
	this.iconEl = this.element.querySelector('.aa-icon');
	this.contentEl = this.element.querySelector('.aa-content');
	this.inputEl = this.element.querySelector('.aa-input');
	this.buttonEl = this.element.querySelector('.aa-button');

	//create dropdown
	this.dropdownEl = document.createElement('ul');
	this.dropdownEl.className = 'aa-dropdown';
	this.dropdownEl.innerHTML = `
		<li class="aa-item aa-file"><i class="aa-icon">${this.icons.open}</i> File</li>
		<li class="aa-item aa-soundcloud"><i class="aa-icon">${this.icons.soundcloud}</i> Soundcloud</li>
		<li class="aa-item aa-url"><i class="aa-icon">${this.icons.url}</i> Url</li>
		<li class="aa-item aa-mic"><i class="aa-icon">${this.icons.mic}</i> Microphone</li>
		<li class="aa-item aa-signal"><i class="aa-icon">${this.icons.sine}</i> Signal</li>
		<li class="aa-item aa-noise"><i class="aa-icon">${this.icons.noise}</i> Noise</li>
	`;
	this.fileEl = this.dropdownEl.querySelector('.aa-file');
	this.urlEl = this.dropdownEl.querySelector('.aa-url');
	this.soundcloudEl = this.dropdownEl.querySelector('.aa-soundcloud');
	this.micEl = this.dropdownEl.querySelector('.aa-mic');
	this.noiseEl = this.dropdownEl.querySelector('.aa-noise');
	this.signalEl = this.dropdownEl.querySelector('.aa-signal');
	this.element.appendChild(this.dropdownEl);

	//create progress
	this.progressEl = document.createElement('ul');
	this.progressEl.className = 'aa-progress';
	this.container.appendChild(this.progressEl);

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
	this.noise ? this.noiseEl.removeAttribute('hidden') : this.noiseEl.setAttribute('hidden', true);
	this.mic ? this.micEl.removeAttribute('hidden') : this.micEl.setAttribute('hidden', true);
	this.soundcloud ? this.soundcloudEl.removeAttribute('hidden') : this.soundcloudEl.setAttribute('hidden', true);

	//apply color
	this.element.style.color = this.color;
};