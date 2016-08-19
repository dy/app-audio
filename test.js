const Audio = require('./');
const css = require('insert-styles');
const palettes = require('nice-color-palettes');
const Settings = require('settings-panel');


// prepare mobile
var meta = document.createElement('meta')
meta.setAttribute('name', 'viewport')
meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0')
document.head.appendChild(meta);


css(`
	body {
		margin: 0;
		background: #D38312; /* fallback for old browsers */
		background: -webkit-linear-gradient(to left, #D38312 , #A83279); /* Chrome 10-25, Safari 5.1-6 */
		background: linear-gradient(to left, #D38312 , #A83279); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
		overflow: hidden;
	}
	.app-audio {
		font-family: "Roboto", sans-serif;
		font-weight: 400;
	}
`);

let ghIcon = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="784" height="1024" viewBox="0 0 784 1024"><path d="M4.168 480.005q0 107.053 52.114 194.314 52.114 90.085 141.399 141.799t194.314 51.714q105.441 0 195.126-51.714 89.685-52.114 141.199-141.599t51.514-194.514q0-106.652-51.714-195.126-52.114-89.685-141.599-141.199t-194.514-51.514q-107.053 0-194.314 52.114-90.085 52.114-141.799 141.399t-51.714 194.314zM68.802 480.005q0-64.634 25.451-124.832t69.482-103.828q44.031-44.031 103.828-69.282t124.432-25.251 124.832 25.251 104.229 69.282q43.631 43.631 68.882 103.828t25.251 124.832q0 69.482-28.487 132.504t-79.989 108.876-117.76 66.458v-113.924q0-42.419-34.747-66.257 85.238-7.672 124.632-43.23t39.383-112.712q0-59.786-36.759-100.593 7.272-21.815 7.272-42.018 0-29.899-13.732-54.939-27.063 0-48.478 8.884t-52.515 30.699q-37.571-8.484-77.565-8.484-45.654 0-85.238 9.295-30.299-22.216-52.314-31.311t-49.891-9.084q-13.332 25.451-13.332 54.939 0 21.004 6.871 42.419-36.759 39.594-36.759 100.192 0 77.165 39.183 112.312t125.644 43.23q-23.027 15.355-31.911 44.843-19.792 6.871-41.207 6.871-16.156 0-27.875-7.272-3.636-2.024-6.66-4.236t-6.26-5.448-5.248-5.048-5.248-6.26-4.236-5.659-4.848-6.46-4.236-5.659q-18.991-25.051-45.243-25.051-14.143 0-14.143 6.060 0 2.424 6.871 8.083 12.931 11.308 13.732 12.12 9.696 7.672 10.908 9.696 11.719 14.544 17.779 31.911 22.627 50.502 77.565 50.502 8.884 0 34.747-4.036v85.649q-66.257-20.603-117.76-66.458t-79.989-108.876-28.487-132.504z"></path></svg>`;


//create audio
let audio = new Audio({
	color: 'white',
	loop: false
});

//init settings panel
let panel = new Settings({
	// settings: {
	// 	options: ['play', 'autoplay', 'loop', 'icon'],
	// 	value: ['play', 'autoplay', 'loop', 'icon'].filter(name => audio[name]),
	// 	change: v => {
	// 		audio.update({
	// 			loop: v.indexOf('loop') >= 0
	// 		});
	// 	}
	// },
	sources: {
		value: ['file', 'url', 'soundcloud', 'mic', 'signal', 'recent'],
		change: v => {
			audio.update({
				file: v.indexOf('file') >= 0,
				url: v.indexOf('url') >= 0,
				soundcloud: v.indexOf('soundcloud') >= 0,
				mic: v.indexOf('mic') >= 0,
				signal: v.indexOf('signal') >= 0,
				recent: v.indexOf('recent') >= 0,
			});
		}
	},
	color: {
		type: 'color',
		value: audio.color,
		change: v => {
			audio.update({color: v});
		}
	},

	// log: {
	// 	type: 'textarea'
	// },

	hr: {label: false, order: 14, content: '<hr/>'},

	reset: {
		type: 'button',
		order: 17,
		style: 'width: 33.33%;',
		input: () => audio.reset()
	},
	pause: {
		type: 'button',
		order: 15,
		style: 'width: 33.33%;',
		input: () => audio.pause()
	},
	playBtn: {
		label: 'Play',
		type: 'button',
		order: 16,
		style: 'width: 33.33%;',
		input: () => audio.play()
	}
}, {
	title: `<a href="https://github.com/dfcreative/app-audio" title="app-audio in github">app-audio <span style="position: absolute; margin-left: .15em; margin-top: -.25em; width: .75em; height: .75em;">${ghIcon}</span></a>`,
	theme: require('settings-panel/theme/dragon'),
	style: 'width: 240px; position: absolute; top: 0; right: 0;',
	palette: ['#1C0515', 'white']
});
panel.element.addEventListener('click', (e) => {
	e.stopPropagation()
});


// audio.on('play', function () {
// 	panel.set('log', panel.get('log') + 'play\n');
// });
// audio.on('pause', function () {
// 	panel.set('log', panel.get('log') + 'pause\n');
// });
// audio.on('reset', function () {
// 	panel.set('log', panel.get('log') + 'reset\n');
// });