import * as THREE from 'three';
import Detector from './Detector';
import FirstPersonControls from './FirstPersonControls';
import ImprovedNoise from './ImprovedNoise';
import CopyShader from './CopyShader';
import StaticShader from './StaticShader';
import RenderPass from './RenderPass';
import ShaderPass from './ShaderPass';
import EffectComposer from './EffectComposer';
import Stats from './stats.min';
import OBJLoader from './OBJLoader';
import mir from './Station_MIR.obj';
/*
import tr1 from './rs_urss_vapey_badradio.mp3';
import tr2 from './shosta01_funeral_fromspace.mp3';
import tr3 from './shosta_badradio.mp3';
import tr4 from './shosta_elegy_transmit.mp3';
import tr5 from './urss_vapey_forum.mp3';
import tr6 from './urss_vapey_push_button.mp3';
import tr7 from './RE-SET_Audio_Lena_Radio_En_processed01.wav';
import tr8 from './RE-SET_Audio_Lena_Radio_Rus_processed01.wav';
import tr9 from './RE-SET_Audio_Maggie_Radio_Eng_processed01.wav';
import tr10 from './RE-SET_Audio_Serguei_Radio_En_processed01.wav';
import tr11 from './RE-SET_Audio_Volkov_Radio_Rus_processed01.wav';
*/
if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
  document.getElementById('container').innerHTML = '';
}

var container, stats;
var camera, gui, controls, scene, renderer, composer;
var staticPass, params;
var group;
var mesh, texture;
var worldWidth = 256,
  worldDepth = 256,
  worldHalfWidth = worldWidth / 2,
  worldHalfDepth = worldDepth / 2;
var clock = new THREE.Clock();

let soundObjects = [];
let distances = [];
let maxDistance = 100;

let soundSrcs = [];

window.onkeydown = function(event) {
  if (event.keyCode === 32) {
    event.preventDefault();
    document.getElementById('info').style.display = 'none';
    masterVol.gain.linearRampToValueAtTime(1, audioContext.currentTime + 4);
  }
};

let audioContext = new AudioContext();
var bufferSize = 4096;
var pinkNoise = (function() {
  var b0, b1, b2, b3, b4, b5, b6;
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
  var node = audioContext.createScriptProcessor(bufferSize, 1, 1);
  node.onaudioprocess = function(e) {
    var output = e.outputBuffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // (roughly) compensate for gain
      b6 = white * 0.115926;
    }
  };
  return node;
})();

let masterVol = audioContext.createGain();
let noiseVol = audioContext.createGain();
masterVol.connect(audioContext.destination);
masterVol.gain.setValueAtTime(0, audioContext.currentTime);
noiseVol.connect(masterVol);

pinkNoise.connect(noiseVol);

const loadSound = pathArray => {
  console.log(pathArray.length);
  console.log(soundSrcs);
  if (pathArray.length > 0) {
    fetch(pathArray.pop())
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        let sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        let sourceVol = audioContext.createGain();
        sourceVol.connect(masterVol);
        sourceNode.connect(sourceVol);
        sourceNode.loop = true;
        sourceVol.gain.setValueAtTime(0, audioContext.currentTime);
        soundSrcs.push({sourceNode, sourceVol});
        sourceNode.start();
      })
      .then(loadSound(pathArray))
      .catch(e => console.error(e));
  } else {
    init();
    animate();
  }
};

loadSound([
  'https://u5mir.com/sndfiles/RE-SET_Audio_Serguei_Radio_En_processed01.wav',
  'https://u5mir.com/sndfiles/RE-SET_Audio_Lena_Radio_En_processed01.wav',
  'https://u5mir.com/sndfiles/RE-SET_Audio_Lena_Radio_Rus_processed01.wav',
  'https://u5mir.com/sndfiles/RE-SET_Audio_Maggie_Radio_Eng_processed01.wav',
  'https://u5mir.com/sndfiles/RE-SET_Audio_Volkov_Radio_Rus_processed01.wav',
  'https://u5mir.com/sndfiles/rs_urss_vapey_badradio.mp3',
  'https://u5mir.com/sndfiles/shosta01_funeral_fromspace.mp3',
  'https://u5mir.com/sndfiles/shosta_badradio.mp3',
  'https://u5mir.com/sndfiles/shosta_elegy_transmit.mp3',
  'https://u5mir.com/sndfiles/urss_vapey_forum.mp3',
  'https://u5mir.com/sndfiles/urss_vapey_push_button.mp3',
]);

function init() {
  container = document.getElementById('container');
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    10000,
  );
  controls = new FirstPersonControls(camera);
  controls.movementSpeed = 50;
  controls.lookSpeed = 0.1;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.0025);
  var light = new THREE.PointLight();
  light.position.set(100, 100, 100);
  scene.add(light);

  // instantiate a loader
  var loader = new OBJLoader();

  // load a resource
  loader.load(
    // resource URL
    mir, // called when resource is loaded
    function(object) {
      scene.add(object);
    },
    // called when loading is in progresses
    function(xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    // called when loading has errors
    function(error) {
      console.log('An error happened');
    },
  );

  //var data = generateHeight(worldWidth, worldDepth); // What's going on here?
  /*
  camera.position.y =
    data[worldHalfWidth + worldHalfDepth * worldWidth] * 10 + 500;
    */
  //camera.position.y = worldHalfWidth + worldHalfDepth * worldWidth * 10 + 500;
  /*
  var geometry = new THREE.PlaneBufferGeometry(
    7500,
    7500,
    worldWidth - 1,
    worldDepth - 1,
  );
  geometry.rotateX(-Math.PI / 2);
  var vertices = geometry.attributes.position.array;
  for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i] * 10;
  }
  texture = new THREE.CanvasTexture(
    generateTexture(data, worldWidth, worldDepth),
  );
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: texture}));
  scene.add(mesh);
  */

  for (let i = 0; i < 11; i++) {
    let baseSize = 0.5 + Math.random() * 4;
    let geometry1 = new THREE.SphereGeometry(baseSize, 32, 32);
    let geometry2 = new THREE.SphereGeometry(2 * baseSize, 32, 32);
    let geometry3 = new THREE.SphereGeometry(3 * baseSize, 32, 32);
    let material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.65,
      transparent: true,
    });
    let sphere1 = new THREE.Mesh(geometry1, material);
    let sphere2 = new THREE.Mesh(geometry2, material);
    let sphere3 = new THREE.Mesh(geometry3, material);
    scene.add(sphere1);
    scene.add(sphere2);
    scene.add(sphere3);
    let position =
      i > 5
        ? new THREE.Vector3(
            -worldWidth * 1.5 + Math.random() * 4 * worldWidth,
            -200 + Math.random() * 200,
            -worldDepth * 1.5 + Math.random() * 4 * worldDepth,
          )
        : new THREE.Vector3(
            -worldWidth * 0.5 + Math.random() * worldWidth,
            -200 + Math.random() * 200,
            -worldDepth * 0.5 + Math.random() * worldDepth,
          );
    sphere1.position.set(position.x, position.y, position.z);
    sphere2.position.set(position.x, position.y, position.z);
    sphere3.position.set(position.x, position.y, position.z);
    sphere3.material.color.set(0x0000ff);
    soundObjects.push({position, material});
  }
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  stats = new Stats();
  container.appendChild(stats.dom);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  /*
  pixelPass = new ShaderPass(StaticShader);
  pixelPass.uniforms.resolution.value = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight,
  );
  pixelPass.uniforms.resolution.value.multiplyScalar(window.devicePixelRatio);
  pixelPass.renderToScreen = true;
  composer.addPass(pixelPass);
  pixelPass.uniforms.pixelSize.value = 10;
  */
  staticPass = new ShaderPass(StaticShader);
  staticPass.uniforms.resolution.value = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight,
  );
  staticPass.uniforms.time = {type: 'f', value: 1.0};
  staticPass.uniforms.resolution.value.multiplyScalar(window.devicePixelRatio);
  staticPass.renderToScreen = true;
  composer.addPass(staticPass);
  window.addEventListener('resize', onWindowResize, false);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.handleResize();
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}
function render() {
  if (soundSrcs.length > 0 && soundObjects.length > 0) {
    controls.update(clock.getDelta());
    let maxRedVal = 0;
    for (let i = 0; i < soundSrcs.length; i++) {
      distances[i] = camera.position.distanceTo(soundObjects[i].position);
      let distanceVal = distances[i] > maxDistance ? maxDistance : distances[i];
      let blueVal = distanceVal / maxDistance;
      let redVal = 1 - blueVal;
      let greenVal = (1 - blueVal) / 3;
      if (redVal > maxRedVal) maxRedVal = redVal;
      soundObjects[i].material.color.setRGB(redVal, greenVal, blueVal);
      soundSrcs[i].sourceVol.gain.setValueAtTime(
        redVal * 0.8,
        audioContext.currentTime,
      );
      staticPass.uniforms.time.value += 0.05;
    }
    noiseVol.gain.setValueAtTime(
      (1 - maxRedVal) * 0.8,
      audioContext.currentTime,
    );
    //renderer.render(scene, camera);
    composer.render();
  }
}
