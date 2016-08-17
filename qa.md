# Q: should we autoconnect audioNode to destination?
- web-audio-player does not
+ less hassle for user
+ ready connection allows for additional connections

# Q: what is good UI for audio input?
* There is notning new in examples by quick search
1. start-app case: three choices resolving input, mic or source
	+ fast
	+ ready
	+ not-bad looking
	- have unsolved things, like list
2.  input field case:
	+ simple select
	+ possible to include icons (i guess?)
	+ easily-managed list of last files/tracks
* Considering that we need progress, start/stop/reset, error/loading messages, input replacement - we can’t that easily use select.
3. We can use component/menu for now to avoid delays.
	- 75kb, popoff is less
	- too old and difficult to update
4. Pure own implementation
	+ fast
	+ only features we need
	+ js-less solution for many cases

# Q: what are possible applications of select-menu, if we do it here?
* palette selector
* colormap selector
* any selector where we need a ...

# Q: name?
* select-audio
* input-audio
	- not only input
* get-audio
	+ well, natural phrase
	- expect some function, not UI
* load-audio
	- as if some function
* open-audio
	- like some codec etc
* waa-source-component
* sound-source, soundsource
	- vague, is it input? what is it about?
* web-audio-input
	- has nothing to do with <input>
		+ it is not a big deal if we prefix web-audio
	- it is actually UI
* audio-input
	+ natural
	- has nothing to do with audio- components
	+ well, input, expected UI
	+ well, audio, obviously stream/waa etc etc
	- blocks node audio input
* sound-input
	+ natural
	+ nothing to do with audio- components
	+ sound is more like about UI
	+ sound-things are more like about sound, not technical details in general
	- a bit vague
* get-web-audio
	- some API getter etc
* web-audio-source
	+ as web-audio-player
	+ web-audio is logical
	- source reminds of AudioBufferSource, which is not correct
	- not really expected UI
* waa-input
* ✔ app-audio