# app-audio [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Get audio for your application, demo or tests.

It will create a component with every possible audio source for Web Audio API - an audio file, url, soundcloud, microphone or primitive signal. Also it tackles play/stop/reset controls, drag-n-drop, recent tracks, soundcloud tracklists, queuing multiple tracks, saving to session storage, progress bar, looping etc.

[![app-audio](https://raw.githubusercontent.com/audio-lab/app-audio/gh-pages/preview.png "app-audio")](http://audio-lab.github.io/app-audio/)


## Usage

[![npm install app-audio](https://nodei.co/npm/app-audio.png?mini=true)](https://npmjs.org/package/app-audio/)

```js
const createAudio = require('app-audio');

let audioSrc = createAudio({
	source: './my-audio.mp3'
}).on('ready', (node, url) => {
	node.connect(myAnalyzer);
});
```

<!-- [**`See in action`**](TODO requirebin) -->

## API

<details><summary>**`const createAudio = require('app-audio');`**</summary>

Get app-audio constructor. It can also serve as a class.

</details>
<details><summary>**`let appAudio = createAudio(options);`**</summary>

Create app-audio instance based off options:

```js
//initial source
source: null,

//container to place UI
container: document.body,

//audio context to use
context: require('audio-context'),

//Enable file select
file: true,

//Enable url input
url: true,

//Enable soundcloud input
soundcloud: true,

//Enable primitive signal input
signal: true,

//Enable mic input
mic: true,

//Show play/payse buttons
play: true,

//Start playing whenever source is selected
autoplay: true,

//Repeat track list after end
loop: true,

//Show progress indicator at the top of container
progress: true,

//Save/load tracks to sessionStorage
save: true,

//Show list of recent tracks
recent: true,

//Enable drag and drop files
dragAndDrop: true,

//Default color
color: 'black'
```

</details>
<details><summary>**`appAudio.on(event, callback);`**</summary>

Bind event callback. Available events:

```js
//called whenever new source is set and loaded, like mic, file, signal etc.
//source audioNode is passed as a first argument, so do connection routine here
appAudio.on('ready', (audioNode, sourceUrl) => {
	audioNode.connect(myAnalyzer);
});

//whenever play is pressed or called
appAudio.on('play', (audioNode) => {});

//whenever pause is pressed or called
appAudio.on('pause', (audioNode) => {});

//whenever reset is called
appAudio.on('reset', () => {});
```

</details>
<details><summary>**`appAudio.set(source);`**</summary>

Set source to play. Source can be whether `File`, `FileList`, URL, soundcloud URL, list of URLs, `MediaStream` etc.

</details>
<details><summary>**`appAudio.play();`**</summary>

Play selected source. Other playback methods:

```js
//pause current source, for mic - mute output
appAudio.pause();

//reset current source, stop playback
appAudio.reset();

//play next track, if there are multiple tracks
appAudio.playNext();
```

</details>
<details><summary>**`appAudio.show();`**</summary>

Open menu. To hide menu, call `appAudio.hide()`

</details>
<details><summary>**`appAudio.update(options?);`**</summary>

Update view or options, if required. Possible options are all the same as in the constructor.

</details>

## In the wild

> [gl-waveform](https://dfcreative.github.io/gl-waveform)<br/>
> [gl-spectrogram](https://dfcreative.github.io/gl-spectrogram)<br/>
> [gl-spectrum](https://audio-lab.github.io/gl-spectrum)<br/>

## Credits

**[@mattdesl](https://github.com/mattdesl)** for [web-audio-player](https://github.com/jam3/web-audio-player) covering gotchas of playing web-audio.

Beautiful myself, who spent like a week on that, and another week before on [start-app](https://github.com/dfcreative/start-app).
