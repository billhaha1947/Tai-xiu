// three-dice.js (ES module)
// This file uses the global THREE from CDN import in index.html (non-module).
let scene, camera, renderer, cube, animId;
const canvas = document.getElementById('dice-canvas');

function makeFace(num){
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // background
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,size,size);
  // draw big number
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 140px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), size/2, size/2+10);
  return new THREE.CanvasTexture(c);
}

function initThree(){
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setSize(canvas.width, canvas.height);
  camera.position.set(0,2.2,6);

  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5,10,7); scene.add(dir);

  const geo = new THREE.BoxGeometry(2,2,2);
  const mats = [1,6,3,4,2,5].map(n => new THREE.MeshStandardMaterial({ map: makeFace(n), metalness:0.4, roughness:0.6 }));
  cube = new THREE.Mesh(geo, mats);
  scene.add(cube);

  cube.rotation.set(-0.4, 0.7, 0.1);

  animate();
}

function animate(){
  animId = requestAnimationFrame(animate);
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.007;
  renderer.render(scene, camera);
}

function stopAnim(){
  cancelAnimationFrame(animId);
}

function rollToResult(diceArr){
  // Visual: fast spins 900ms then settle showing final faces mapped to diceArr values
  let t0 = performance.now();
  let spinDur = 900;
  let spin = function(ts){
    let t = ts - t0;
    cube.rotation.x += 2.5;
    cube.rotation.y += 3.1;
    renderer.render(scene, camera);
    if(t < spinDur) requestAnimationFrame(spin);
    else {
      // settle: set faces to dice values
      const faces = [diceArr[0]||1, diceArr[1]||2, diceArr[2]||3, diceArr[0]||1, diceArr[1]||2, diceArr[2]||3];
      faces.forEach((n,i)=>{ cube.material[i].map = makeFace(n); cube.material[i].map.needsUpdate = true; });
      // a small bounce
      let bounceT0 = performance.now();
      let bounceDur = 500;
      let bounce = (now)=>{
        let tt = now - bounceT0;
        let p = Math.sin((tt / bounceDur) * Math.PI) * 0.2;
        cube.position.y = p;
        renderer.render(scene, camera);
        if(tt < bounceDur) requestAnimationFrame(bounce);
        else cube.position.y = 0;
      };
      requestAnimationFrame(bounce);
    }
  };
  requestAnimationFrame(spin);
}

export { initThree, rollToResult };
