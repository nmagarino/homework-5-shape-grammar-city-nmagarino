import {vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import LongCube from './geometry/LongCube';
import Plane from './geometry/Plane'
import LSystemMesh from './geometry/LSystemMesh';
import CityMesh from './geometry/CityMesh'
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  angle: 0.436332,
  iterations: 1,
  tesselations: 5,
  axiom: "FFFX",
  'Reload City': loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: LongCube;
let lsystem: LSystemMesh;
let plane: Plane;
let city: CityMesh;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new LongCube(vec3.fromValues(0, 0, 0));
  square.create();
  lsystem = new LSystemMesh(vec3.fromValues(0.0,0.0,0.0), controls.iterations, controls.angle, controls.axiom);
  lsystem.create();
  plane = new Plane(vec3.fromValues(0.0,0.0,0.0));
  plane.create();
  city = new CityMesh(vec3.create(), controls.iterations, controls.axiom);
  city.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Reload City');
  //gui.add(controls, 'angle', 0, .6);
  gui.add(controls, 'iterations', 0, 5).step(1);
  //gui.add(controls, 'axiom');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(119/255, 195/255, 252/255, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, lambert, [
      plane, 
    ], vec4.fromValues(0, 1, 0, 1));
    renderer.render(camera, lambert, [
      city, 
    ], vec4.fromValues(.7, .7, .7, 1));
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
