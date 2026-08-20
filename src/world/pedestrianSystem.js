import * as THREE from 'three';

const SHIRT_COLORS = [0x8b2f56, 0x225b7c, 0xc4772b, 0x315f45, 0x4a3f72, 0xb6a174];
const SKIN_TONES = [0x4c2d20, 0x70422f, 0x8f5d45, 0xb77958, 0xd29a72];
const BUSINESS_CONTACTS = [
  { id: 'nina', name: 'Nina', role: 'Coffee Shop Owner', question: 'What should you test before signing a long lease?', correct: 'Customer demand with a small pop-up', wrong: 'The most expensive storefront', takeaway: 'Validate demand cheaply before accepting a large fixed cost.' },
  { id: 'marcus', name: 'Marcus', role: 'Delivery Operator', question: 'Which number helps protect daily operations?', correct: 'Available cash flow', wrong: 'Social media followers alone', takeaway: 'Cash flow keeps inventory, payroll, and bills moving.' },
  { id: 'elena', name: 'Elena', role: 'Market Vendor', question: 'What makes customer interviews useful?', correct: 'Ask about real problems and buying habits', wrong: 'Only ask if they like your logo', takeaway: 'Good research focuses on customer behavior, not compliments.' },
  { id: 'darius', name: 'Darius', role: 'Streetwear Founder', question: 'What reduces the risk of excess inventory?', correct: 'Start with a small production run', wrong: 'Order the maximum quantity immediately', takeaway: 'Small batches let demand guide the next investment.' },
  { id: 'mei', name: 'Mei', role: 'Bookkeeper', question: 'Which money should stay separate?', correct: 'Business and personal funds', wrong: 'There is no reason to separate money', takeaway: 'Separate accounts make records, taxes, and decisions clearer.' },
  { id: 'carlos', name: 'Carlos', role: 'Property Manager', question: 'What belongs in a rental budget?', correct: 'Repairs, vacancies, taxes, and insurance', wrong: 'Only the monthly mortgage', takeaway: 'Real profit includes every operating cost and a repair reserve.' },
];

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
  const recycleDistanceSq = 105 * 105;
  const nearAvoidDistanceSq = 2.2 * 2.2;
  const farDistanceSq = (mobileDevice ? 40 : 55) ** 2;
  const farUpdateInterval = mobileDevice ? 0.12 : 0.08;
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
        pedestrian.userData.updateAccumulator = 0;
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
    pedestrian.userData.updateAccumulator = 0;
    pedestrian.userData.profile = BUSINESS_CONTACTS[index % BUSINESS_CONTACTS.length];
    scene.add(pedestrian);
    pedestrians.push(pedestrian);
    findSpawn(pedestrian, 18 + index * 2);
  }

  function update() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    for (const pedestrian of pedestrians) {
      const distanceSq = pedestrian.position.distanceToSquared(player.position);
      if (!pedestrian.visible || distanceSq > recycleDistanceSq) {
        pedestrian.visible = true;
        findSpawn(pedestrian, 35);
        continue;
      }

      const data = pedestrian.userData;
      data.updateAccumulator += dt;
      const farFromPlayer = distanceSq > farDistanceSq;
      if (farFromPlayer && data.updateAccumulator < farUpdateInterval) continue;
      const stepDt = farFromPlayer ? Math.min(data.updateAccumulator, 0.2) : dt;
      data.updateAccumulator = 0;

      data.turnIn -= stepDt;
      const avoidingPlayer = distanceSq < nearAvoidDistanceSq;
      if (data.turnIn <= 0 || avoidingPlayer) {
        data.heading += (Math.random() - 0.5) * 1.65 + (avoidingPlayer ? Math.PI : 0);
        data.turnIn = 1.8 + Math.random() * 4.5;
      }

      forward.set(Math.sin(data.heading), 0, Math.cos(data.heading));
      const nextX = pedestrian.position.x + forward.x * data.walkSpeed * stepDt;
      const nextZ = pedestrian.position.z + forward.z * data.walkSpeed * stepDt;
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

  function getNearest(position, maxDistance = 6) {
    let nearest = null;
    let nearestDistanceSq = maxDistance * maxDistance;
    for (const pedestrian of pedestrians) {
      if (!pedestrian.visible) continue;
      const distanceSq = pedestrian.position.distanceToSquared(position);
      if (distanceSq < nearestDistanceSq) {
        nearest = pedestrian;
        nearestDistanceSq = distanceSq;
      }
    }
    return nearest;
  }

  return { pedestrians, update, getNearest };
}
