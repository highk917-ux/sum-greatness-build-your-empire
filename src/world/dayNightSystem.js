import * as THREE from 'three';

const NIGHT_SKY = new THREE.Color(0x071321);
const TWILIGHT_SKY = new THREE.Color(0xc7765b);
const DAY_SKY = new THREE.Color(0x7aa1bd);
const NIGHT_FOG = new THREE.Color(0x0c1b28);
const DAY_FOG = new THREE.Color(0x9bb2bd);
const WARM_SUN = new THREE.Color(0xff9b62);
const DAY_SUN = new THREE.Color(0xffe1b0);

function formatTime(hour) {
  const totalMinutes = Math.floor(hour * 60) % 1440;
  const hour24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function createDayNightSystem({ scene, sun, hemisphere, fog, timeElement, initialHour = 16.5, onTimeChange }) {
  let hour = Number.isFinite(initialHour) ? initialHour % 24 : 16.5;
  let displayedMinute = -1;
  const skyColor = new THREE.Color();
  const fogColor = new THREE.Color();
  const sunColor = new THREE.Color();

  function update(deltaSeconds) {
    // One full in-game day lasts about 40 real minutes.
    hour = (hour + deltaSeconds * 0.01) % 24;
    const solarAngle = ((hour - 6) / 24) * Math.PI * 2;
    const solarHeight = Math.sin(solarAngle);
    const daylight = THREE.MathUtils.smoothstep(solarHeight, -0.16, 0.35);
    const horizonGlow = Math.max(0, 1 - Math.abs(solarHeight) * 3.4) * (1 - daylight * 0.35);

    skyColor.copy(NIGHT_SKY).lerp(DAY_SKY, daylight).lerp(TWILIGHT_SKY, horizonGlow * 0.55);
    fogColor.copy(NIGHT_FOG).lerp(DAY_FOG, daylight).lerp(TWILIGHT_SKY, horizonGlow * 0.18);
    scene.background.copy(skyColor);
    fog.color.copy(fogColor);

    sun.position.set(Math.cos(solarAngle) * 90, Math.max(-12, solarHeight * 90), Math.sin(solarAngle) * 65);
    sun.intensity = 0.08 + daylight * 2.52;
    sunColor.copy(WARM_SUN).lerp(DAY_SUN, daylight);
    sun.color.copy(sunColor);
    hemisphere.intensity = 0.52 + daylight * 2.18;

    const minute = Math.floor(hour * 60);
    if (minute !== displayedMinute) {
      displayedMinute = minute;
      if (timeElement) timeElement.textContent = formatTime(hour);
      onTimeChange?.(hour);
    }
  }

  update(0);
  return { update, getHour: () => hour };
}
