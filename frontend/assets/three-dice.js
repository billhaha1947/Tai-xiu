// three-dice.js (ES module) — uses global THREE from CDN
let scene, camera, renderer, cube, animId;
const canvas = document.getElementById('dice-canvas');

function makeFaceTex(num){
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  // background dark glossy
  const grad = ctx.createLinearGradient(0,0,size,size);
  grad.addColorStop(0,'#111213');
  grad.addColorStop(1,'#0b0b0d');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,size,size);
  // pip/number
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 240px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), size/2, size/2 + 10);
  return new THREE.CanvasTexture(c);
}

function initThree(){
  if(!canvas) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setSize(canvas.width, canvas.height);
  camera.position.set(0,2.6,7);

  const amb = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5,10,7); scene.add(dir);

  const geo = new THREE.BoxGeometry(2.2,2.2,2.2);
  const mats = [1,6,3,4,2,5].map(n => new THREE.MeshStandardMaterial({ map: makeFaceTex(n), metalness:0.35, roughness:0.45 }));
  cube = new THREE.Mesh(geo, mats);
  cube.position.y = 0;
  scene.add(cube);
  cube.rotation.set(-0.4, 0.7, 0.1);

  animate();
}

function animate(){
  animId = requestAnimationFrame(animate);
  // idle slow rotate
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.007;
  renderer.render(scene, camera);
}

function rollToResult(diceArr){
  // spin quickly then settle; diceArr = [d1,d2,d3]
  let start = performance.now();
  const spinDuration = 900;
  function spin(t){
    let elapsed = t - start;
    // strong rotation
    cube.rotation.x += 2.6;
    cube.rotation.y += 3.3;
    renderer.render(scene, camera);
    if(elapsed < spinDuration) requestAnimationFrame(spin);
    else {
      // set final textures based on diceArr
      const faces = [diceArr[0]||1, diceArr[1]||2, diceArr[2]||3, diceArr[0]||1, diceArr[1]||2, diceArr[2]||3];
      faces.forEach((n,i)=>{ cube.material[i].map = makeFaceTex(n); cube.material[i].map.needsUpdate = true; });
      // bounce effect
      let bounceStart = performance.now();
      const bounceDur = 500;
      (function bounce(now){
        let tt = now - bounceStart;
        let p = Math.abs(Math.sin((tt/bounceDur) * Math.PI)) * 0.22;
        cube.position.y = p;
        renderer.render(scene, camera);
        if(tt < bounceDur) requestAnimationFrame(bounce);
        else cube.position.y = 0;
      })(bounceStart);
    }
  }
  requestAnimationFrame(spin);
}

export { initThree, rollToResult };
