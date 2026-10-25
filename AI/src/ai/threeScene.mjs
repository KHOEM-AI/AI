import * as THREE from "three";

export function createThreeScene({
  orbitRadius = 6,
  orbitHeight = 1.5,
  orbitSpeed = 0.5
} = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101827);

  const camera = new THREE.PerspectiveCamera(
    45, 16 / 9, 0.1, 100
  );

  const target = new THREE.Vector3(0, 0, 0);
  let currentAngle = 0;
  let currentSpeed = orbitSpeed;

  function setOrbitAngle(degrees) {
    currentAngle = THREE.MathUtils.degToRad(degrees);
    updateCamera();
  }

  function setOrbitSpeed(speed) {
    if (!Number.isFinite(speed)) {
      throw new TypeError("Orbit speed must be a finite number");
    }
    currentSpeed = speed;
  }

  function updateCamera() {
    camera.position.set(
      Math.sin(currentAngle) * orbitRadius,
      orbitHeight,
      Math.cos(currentAngle) * orbitRadius
    );
    camera.lookAt(target);
  }

  const ambient = new THREE.HemisphereLight(
    0xffffff, 0x26334d, 2
  );
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 5, 4);
  scene.add(light);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.25,
      roughness: 0.3
    })
  );
  scene.add(cube);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x182235,
      roughness: 0.9
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.4;
  scene.add(floor);

  function update(timeSeconds = 0) {
    currentAngle = timeSeconds * currentSpeed;
    updateCamera();

    cube.rotation.x = timeSeconds * 0.5;
    cube.rotation.y = timeSeconds * 0.8;
    cube.position.y = Math.sin(timeSeconds * 1.5) * 0.2;
  }

  updateCamera();

  return {
    scene,
    camera,
    cube,
    update,
    setOrbitAngle,
    setOrbitSpeed
  };
}
