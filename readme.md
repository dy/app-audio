# app-audio [![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

Audio for your application, demo or tests.
It will create an audio source selector for an audio file, url, soundcloud stream, microphone input, signal or noise. Also it tackles play/stop/reset controls, drag-n-drop, pasting audio, list of recently opened sources, progress bar, looping tracks etc.

[![app-audio](https://raw.githubusercontent.com/audio-lab/app-audio/gh-pages/preview.png "app-audio")](http://audio-lab.github.io/app-audio/)


## Usage

[![npm install app-audio](https://nodei.co/npm/app-audio.png?mini=true)](https://npmjs.org/package/app-audio/)

```js
const SoundInput = require('app-audio');

let wf = SoundInput({
	source: ''
});
```

<!-- [**`See in action`**](TODO requirebin) -->

## API

<details><summary>**`const SoundInput = require('app-audio');`**</summary>

Get waveform component class. `require('app-audio/2d')` for canvas-2d version.

</details>
<details><summary>**`let soundInput = new SoundInput(options);`**</summary>

Create sound input component based off options:

```js
//container to place waveform element
container: document.body,

dragAndDrop: true,


```

</details>
<details><summary>**`waveform.push(data)`**</summary>

Add new data for the waveform. Data is whether single sample or array/float array with float values from `0..1` range. The visible slice will be automatically rerendered in next frame. So safely call push as many times as you need.

</details>
<details><summary>**`waveform.set(data)`**</summary>

Similar to push, but discards old data.

</details>
<details><summary>**`waveform.update(options?)`**</summary>

Update options, if required. Like, palette, grid type etc.

</details>

## Credits

> [Drawing waveforms](http://www.supermegaultragroovy.com/2009/10/06/drawing-waveforms/) — some insights on the way to draw waveforms.<br/>

## Related

> [web-audio-player](https://github.com/jam3/web-audio-player) — player for audio assets in web-audio.<br/>