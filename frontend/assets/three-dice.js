// three-dice.js (ES module)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';

let scene, camera, renderer, cube, animReq;
const canvasEl = document.getElementById('dice-canvas');

function makeFaceTexture(num){
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // background
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,size,size);
  // draw number big
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), size/2, size/2+10);
  return new THREE.CanvasTexture(c);
}

function setup(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, canvasEl.width / canvasEl.height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha:true, antialias: true });
  renderer.setSize(canvasEl.width, canvasEl.height);
  camera.position.set(0,2.5,6);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5,10,7);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040, 0.8));

  // cube geometry
  const geometry = new THREE.BoxGeometry(2,2,2);
  const materials = [
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(1) }),
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(6) }),
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(3) }),
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(4) }),
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(2) }),
    new THREE.MeshStandardMaterial({ map: makeFaceTexture(5) }),
  ];
  cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);

  animate();
}

let rolling = false;
function animate(){
  animReq = requestAnimationFrame(animate);
  if(!rolling){
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}

function rollToResult(diceArray){
  // diceArray: [d1,d2,d3] -- we display the first die face on cube for simplicity as demo
  // animate aggressive rotation then settle
  rolling = true;
  let t = 0;
  const duration = 1000; // ms
  const start = performance.now();
  const startRx = cube.rotation.x;
  const startRy = cube.rotation.y;

  function step(now){
    t = now - start;
    // run fast spin
    cube.rotation.x += 1.2;
    cube.rotation.y += 1.6;
    if(t < duration){
      requestAnimationFrame(step);
    } else {
      // settle: map sum to face orientation — for demo set rotation to represent first dice
      rolling = false;
      // overlay final numbers on canvas: draw numbers
      drawFinalNumbers(diceArray);
    }
  }
  requestAnimationFrame(step);
}

function drawFinalNumbers(arr){
  // simply show numbers on cube by updating textures
  const faces = [arr[0], arr[1], arr[2], arr[0], arr[1], arr[2]];
  faces.forEach((n,i)=>{
    cube.material[i].map = makeFaceTexture(n);
    cube.material[i].map.needsUpdate = true;
  });
}

export { setup, rollToResult };
