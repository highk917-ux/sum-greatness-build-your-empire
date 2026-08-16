import * as THREE from 'three';

const SHIRT_COLORS = [0x8b2f56, 0x225b7c, 0xc4772b, 0x315f45, 0x4a3f72, 0xb6a174];
const SKIN_TONES = [0x4c2d20, 0x70422f, 0x8f5d45, 0xb77958, 0xd29a72];

function isLikelyLand(x, z) {
  // Keep pedestrians out of the Pacific and the broad Mission/San Diego bay water areas.
  if (x < -505) return false;
  const inBay = x > -455 && x < -145 && z > -250 && z < 475;
  const onCoronado = x > -455 && x < -325 && z > -75 && z < 565;
  return !inBay || onCoronado;
}

export function createPedestrianSystem({ scene, player, makePerson, positionIsClear, mobileDevice }) {
  const pedestrians = [];
  const desiredCount = mobileDevice ? 6 : 12;
  const forward = new THREE.Vector3();
  const clock = new THREE.Clock();
  let elapsed = 0;

  function findSpawn(pedestrian, minDistance = 20) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistance + Math.random() * 55;
      const x = player.position.x + Math.sin(angle) * distance;
      const z = player.position.z + Math.cos(angle) * distance;
      if (isLikelyLand(x, z) && positionIsClear(x, z, 0.75)) {
        pedestrian.position.set(x, 0, z);
        pedestrian.userData.heading = Math.random() * Math.PI * 2;
        pedestrian.userData.turnIn = 1.5 + Math.random() * 4;
        pedestrian.userData.stuck = 0;
        return;
      }
    }
    pedestrian.visible = false;
  }

  for (let index = 0; index < desiredCount; index += 1) {
    const pedestrian = makePerson(
      SHIRT_COLORS[index % SHIRT_COLORS.length],
      SKIN_TONES[index % SKIN_TONES.length],
    );
    pedestrian.scale.setScalar(0.88 + (index % 4) * 0.035);
    pedestrian.userData.walkSpeed = 1.05 + (index % 3) * 0.16;
    pedestrian.userData.phase = index * 1.37;
    pedestrian.userData.heading = 0;
    pedestrian.userData.turnIn = 0;
    pedestrian.userData.stuck = 0;
    scene.add(pedestrian);
    pedestrians.push(pedestrian);
    findSpawn(pedestrian, 18 + index * 2);
  }

  function update() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    for (const pedestrian of pedestrians) {
      const distanceToPlayer = pedestrian.position.distanceTo(player.position);
      if (!pedestrian.visible || distanceToPlayer > 105) {
        pedestrian.visible = true;
        findSpawn(pedestrian, 35);
        continue;
      }

      const data = pedestrian.userData;
      data.turnIn -= dt;
      if (data.turnIn <= 0 || distanceToPlayer < 2.2) {
        data.heading += (Math.random() - 0.5) * 1.65 + (distanceToPlayer < 2.2 ? Math.PI : 0);
        data.turnIn = 1.8 + Math.random() * 4.5;
      }

      forward.set(Math.sin(data.heading), 0, Math.cos(data.heading));
      const nextX = pedestrian.position.x + forward.x * data.walkSpeed * dt;
      const nextZ = pedestrian.position.z + forward.z * data.walkSpeed * dt;
      if (isLikelyLand(nextX, nextZ) && positionIsClear(nextX, nextZ, 0.68)) {
        pedestrian.position.x = nextX;
        pedestrian.position.z = nextZ;
        data.stuck = 0;
      } else {
        data.heading += Math.PI * (0.55 + Math.random() * 0.45);
        data.turnIn = 0.8 + Math.random();
        data.stuck += 1;
        if (data.stuck > 8) findSpawn(pedestrian, 30);
      }

      pedestrian.rotation.y = data.heading;
      const stride = elapsed * 6.2 * data.walkSpeed + data.phase;
      data.leftLeg.rotation.x = Math.sin(stride) * 0.34;
      data.rightLeg.rotation.x = -Math.sin(stride) * 0.34;
      data.leftArm.rotation.x = -Math.sin(stride) * 0.27;
      data.rightArm.rotation.x = Math.sin(stride) * 0.27;
      pedestrian.position.y = Math.abs(Math.sin(stride)) * 0.025;
    }
  }

  return { pedestrians, update };
}
