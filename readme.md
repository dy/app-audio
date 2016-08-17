# app-audio [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Audio for your application, demo or tests.
It will create an audio source selector able to load an audio file, url, soundcloud stream, microphone input, signal or noise. Also it tackles play/stop/reset controls, drag-n-drop/pasting audio, list of recently played sources, playing queue, progress bar, looping etc.

[![app-audio](https://raw.githubusercontent.com/audio-lab/app-audio/gh-pages/preview.png "app-audio")](http://audio-lab.github.io/app-audio/)


## Usage

[![npm install app-audio](https://nodei.co/npm/app-audio.png?mini=true)](https://npmjs.org/package/app-audio/)

```js
const createAudio = require('app-audio');

let audioSrc = createAudio({
	source: './my-audio.mp3'
}).on('ready', () => {

});

```

<!-- [**`See in action`**](TODO requirebin) -->

## API

<details><summary>**`const createAudio = require('app-audio');`**</summary>

Get app audio component class. It can serve both as a class or constructor function.

</details>
<details><summary>**`let appAudio = createAudio(options);`**</summary>

Create audio source instance based off options:

```js
//container to place UI
container: document.body,


//Observe paste event
paste: true,

//Allow dropping files to browser
dragAndDrop: true,

//Show play/payse buttons
play: true,

//Enable file select
file: true,

//Enable url input
url: true,

//Enable signal input
signal: true,

//Enable noise input
noise: true,

//Enable mic input
mic: true,

//Enable soundcloud input
soundcloud: true,

//Autostart play
autoplay: true,

//Repeat track[s] list after end
loop: true,

//Show progress indicator
progress: true,

//Save/load last track
save: true,

//Display icons
icon: true,

//Default color
color: 'black'
```

</details>
<details><summary>**`appAudio.setSource(list)`**</summary>

Set source to play.

</details>
<details><summary>**`appAudio.play()`**</summary>

Play current source.

</details>
<details><summary>**`appAudio.pause()`**</summary>

Pause current source, for mic mode will mute output.

</details>
<details><summary>**`appAudio.reset()`**</summary>

Stop playing and reset current source.

</details>
<details><summary>**`appAudio.on(event, callback)`**</summary>

Bind event callback. Available events:

```js
//called whenever new source is set, like mic, file, signal etc.
//source audioNode is passed as a first argument, so do connection routine here
appAudio.on('source', (audioNode) => {});

//called whenever user pressed play
appAudio.on('play', (audioNode) => {});

//called whenever user pressed pause
appAudio.on('pause', (audioNode) => {});

//called whenever user invoked reset
appAudio.on('reset', () => {});
```

</details>
<details><summary>**`appAudio.show(data)`**</summary>

Show source menu.

</details>
<details><summary>**`appAudio.hide(data)`**</summary>

Hide source menu.

</details>
<details><summary>**`appAudio.update(options?)`**</summary>

Update options, if required. Like, palette, grid type etc.

</details>

## Credits

## Related

> [web-audio-player](https://github.com/jam3/web-audio-player) — player for audio assets in web-audio.<br/>