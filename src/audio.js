var context;
var audioBuffer;

window.addEventListener('load', init);

function init() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch (e) {
    alert("Your browser doesn't support Web Audio API");
  }

  loadSound();
  // playSound();  // comment here
}

//loading sound into the created audio context
function loadSound() {
  // set the audio file's URL
  var audioURL = 'AllofMe.mp3';

  //creating a new request
  var request = new XMLHttpRequest();
  request.open('GET', audioURL, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    //take the audio from http request and decode it in an audio buffer
    context.decodeAudioData(request.response, function(buffer) {
      audioBuffer = buffer;
      console.log(audioBuffer);
      if (audioBuffer) {
        // check here
        playSound();
      }
    });
  };

  request.send();
}

//playing the audio file
function playSound() {
  //creating source node
  var source = context.createBufferSource();
  //passing in file
  source.buffer = audioBuffer;

  //start playing
  source.connect(context.destination); // added
  source.start(0);
  console.log('playing');
}

var audio = new Audio();
audio.src = 'audio files/song.mp3';
audio.controls = true;
audio.autoplay = true;
document.body.appendChild(audio);

var context = new webkitAudioContext();
var analyser = context.createAnalyser();

window.addEventListener(
  'load',
  function(e) {
    // Our <audio> element will be the audio source.
    var source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
  },
  false,
);
