import { Weapon, Shield, Headgear, Particle, FloatingText, Projectile } from '../types';

export interface StickFigurePose {
  x: number;
  y: number;
  facing: number; // 1 = right, -1 = left
  action: string;
  actionTime: number;
  color: string;
  isGrounded: boolean;
  isBlocking: boolean;
  isParrying: boolean;
  isDashing: boolean;
  isChilled?: boolean;
  weapon: Weapon;
  shield: Shield;
  headgear: Headgear;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
}

export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  pose: StickFigurePose,
  now: number
) {
  const {
    x,
    y,
    facing,
    action,
    actionTime,
    color,
    isGrounded,
    isBlocking,
    isParrying,
    isDashing,
    isChilled,
    weapon,
    shield,
    headgear,
  } = pose;

  ctx.save();
  ctx.translate(x, y);

  // Chilled or Dashing tint
  if (isChilled) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
  } else if (isDashing) {
    ctx.shadowColor = weapon.visual.glowColor;
    ctx.shadowBlur = 16;
  } else {
    ctx.shadowBlur = 0;
  }

  const strokeColor = isChilled ? '#7dd3fc' : color;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Animation phase calculation
  let legCycle = 0;
  let bodyTilt = 0;
  let swordAngle = 0.4;
  let shieldAngle = -0.3;

  if (action === 'run') {
    legCycle = Math.sin(now * 0.015);
    bodyTilt = 0.2 * facing;
  } else if (action === 'jump') {
    legCycle = 0.5;
    bodyTilt = 0.1 * facing;
  } else if (action === 'fall') {
    legCycle = -0.3;
    bodyTilt = -0.05 * facing;
  } else if (action === 'dash') {
    bodyTilt = 0.45 * facing;
  } else if (action === 'hit') {
    bodyTilt = -0.35 * facing;
  }

  // Attack animation calculations
  let attackProgress = 0;
  if (action === 'attack' || action === 'special') {
    attackProgress = Math.min(1, actionTime / 0.22);
    if (weapon.category === 'Rapier') {
      // Thrust forward
      swordAngle = 0.1;
    } else if (weapon.category === 'Hammer') {
      // High overhead to heavy down slam
      swordAngle = -1.8 + attackProgress * 3.2;
    } else if (weapon.category === 'Daggers') {
      swordAngle = -1.2 + Math.sin(attackProgress * Math.PI * 2) * 1.5;
    } else if (weapon.isRanged) {
      // Aim horizontal
      swordAngle = 0.05;
    } else {
      // Katana / Sword slash
      swordAngle = -1.6 + attackProgress * 2.8;
    }
  }

  // Hip / Root
  const hipX = 0;
  const hipY = -28;

  // Head and Neck
  const neckX = hipX + bodyTilt * 15;
  const neckY = hipY - 26;
  const headRadius = 11;
  const headCenterX = neckX + bodyTilt * 8;
  const headCenterY = neckY - headRadius - 2;

  // 1. Draw Legs
  const leftKneeY = hipY + 16 + legCycle * 6;
  const leftFootX = hipX - 8 * facing - legCycle * 14 * facing;
  const leftFootY = hipY + 32 - Math.max(0, legCycle) * 8;

  const rightKneeY = hipY + 16 - legCycle * 6;
  const rightFootX = hipX + 8 * facing + legCycle * 14 * facing;
  const rightFootY = hipY + 32 - Math.max(0, -legCycle) * 8;

  // Left Leg (back)
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(hipX - 4 * facing - legCycle * 6 * facing, leftKneeY);
  ctx.lineTo(leftFootX, isGrounded ? Math.min(0, leftFootY) : leftFootY);
  ctx.stroke();

  // Right Leg (front)
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(hipX + 4 * facing + legCycle * 6 * facing, rightKneeY);
  ctx.lineTo(rightFootX, isGrounded ? Math.min(0, rightFootY) : rightFootY);
  ctx.stroke();

  // 2. Torso (Spine)
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(neckX, neckY);
  ctx.stroke();

  // 3. Head & Eyes
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Eyes
  const eyeOffsetX = headCenterX + facing * 4;
  const eyeOffsetY = headCenterY - 1;
  ctx.fillStyle = action === 'hit' ? '#ef4444' : isParrying ? '#eab308' : '#ffffff';

  if (action === 'hit') {
    // X X eyes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(eyeOffsetX - 2, eyeOffsetY - 2);
    ctx.lineTo(eyeOffsetX + 2, eyeOffsetY + 2);
    ctx.moveTo(eyeOffsetX + 2, eyeOffsetY - 2);
    ctx.lineTo(eyeOffsetX - 2, eyeOffsetY + 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeOffsetY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Headgear
  if (headgear && headgear.type !== 'none') {
    drawHeadgearItem(ctx, headgear, headCenterX, headCenterY, headRadius, facing);
  }

  // 4. Arms & Shield (Left hand, back or forward depending on block)
  const shoulderX = neckX;
  const shoulderY = neckY + 4;

  let shieldHandX = shoulderX + (isBlocking ? 18 * facing : -10 * facing);
  let shieldHandY = shoulderY + (isBlocking ? 2 : 12);

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  const elbowLX = shoulderX + (isBlocking ? 8 * facing : -6 * facing);
  const elbowLY = shoulderY + 8;
  ctx.lineTo(elbowLX, elbowLY);
  ctx.lineTo(shieldHandX, shieldHandY);
  ctx.stroke();

  // Draw Shield
  drawEquippedShield(ctx, shield, shieldHandX, shieldHandY, facing, isBlocking, isParrying);

  // 5. Weapon Arm (Right hand)
  let weaponHandX = shoulderX + (facing * 14);
  let weaponHandY = shoulderY + 6;

  if (action === 'attack' || action === 'special') {
    const thrustDist = weapon.category === 'Rapier' ? attackProgress * 30 : 0;
    weaponHandX = shoulderX + facing * (16 + thrustDist);
    weaponHandY = shoulderY - 2 + Math.sin(swordAngle) * 12;
  } else if (isBlocking) {
    weaponHandX = shoulderX + facing * 8;
    weaponHandY = shoulderY + 14;
    swordAngle = 0.8;
  }

  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  const elbowRX = shoulderX + facing * 6;
  const elbowRY = shoulderY + 8;
  ctx.lineTo(elbowRX, elbowRY);
  ctx.lineTo(weaponHandX, weaponHandY);
  ctx.stroke();

  // Draw Weapon
  drawEquippedWeapon(
    ctx,
    weapon,
    weaponHandX,
    weaponHandY,
    facing,
    swordAngle,
    action === 'attack' || action === 'special',
    attackProgress
  );

  ctx.restore();
}

function drawHeadgearItem(
  ctx: CanvasRenderingContext2D,
  headgear: Headgear,
  hx: number,
  hy: number,
  hr: number,
  facing: number
) {
  ctx.save();
  ctx.fillStyle = headgear.color;
  ctx.strokeStyle = headgear.color;

  if (headgear.type === 'headband') {
    // Red ninja bandana
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hx, hy - 3, hr + 1, -0.4 * Math.PI, 0.4 * Math.PI);
    ctx.stroke();
    // Tails fluttering behind
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx - facing * hr, hy - 3);
    ctx.lineTo(hx - facing * (hr + 14), hy - 5);
    ctx.moveTo(hx - facing * hr, hy - 2);
    ctx.lineTo(hx - facing * (hr + 12), hy + 2);
    ctx.stroke();
  } else if (headgear.type === 'spartan') {
    // Spartan golden crest
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(hx, hy, hr + 4, -0.75 * Math.PI, -0.25 * Math.PI);
    ctx.stroke();
    // Red plume on top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(hx, hy - hr - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (headgear.type === 'cyber_visor') {
    // Glowing neon visor line
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.4, hy - 2);
    ctx.lineTo(hx + facing * hr * 1.1, hy - 2);
    ctx.stroke();
  } else if (headgear.type === 'horns') {
    // Crimson demon horns
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy - hr);
    ctx.quadraticCurveTo(hx - 8, hy - hr - 10, hx - 12 * facing, hy - hr - 14);
    ctx.moveTo(hx + 4, hy - hr);
    ctx.quadraticCurveTo(hx + 8, hy - hr - 10, hx + 12 * facing, hy - hr - 14);
    ctx.stroke();
  } else if (headgear.type === 'crown') {
    // Imperial Golden Crown
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    const cy = hy - hr - 2;
    ctx.moveTo(hx - 8, cy);
    ctx.lineTo(hx - 10, cy - 8);
    ctx.lineTo(hx - 4, cy - 4);
    ctx.lineTo(hx, cy - 10);
    ctx.lineTo(hx + 4, cy - 4);
    ctx.lineTo(hx + 10, cy - 8);
    ctx.lineTo(hx + 8, cy);
    ctx.closePath();
    ctx.fill();
  } else if (headgear.type === 'samurai') {
    // Samurai Kabuto
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.arc(hx, hy - 2, hr + 3, -0.8 * Math.PI, -0.2 * Math.PI);
    ctx.stroke();
    // Golden crest horns
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx, hy - hr - 2);
    ctx.lineTo(hx - 8, hy - hr - 8);
    ctx.moveTo(hx, hy - hr - 2);
    ctx.lineTo(hx + 8, hy - hr - 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEquippedShield(
  ctx: CanvasRenderingContext2D,
  shield: Shield,
  x: number,
  y: number,
  facing: number,
  isBlocking: boolean,
  isParrying: boolean
) {
  ctx.save();
  ctx.translate(x, y);

  const { visual } = shield;
  const sz = visual.size;

  if (isParrying) {
    // Radiant golden shockwave flash
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (isBlocking) {
    // Shield glow aura
    ctx.shadowColor = visual.glowColor;
    ctx.shadowBlur = 14;
  }

  ctx.fillStyle = visual.shieldColor;
  ctx.strokeStyle = visual.borderColor;
  ctx.lineWidth = 3;

  if (visual.shape === 'round') {
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Center boss
    ctx.fillStyle = visual.borderColor;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (visual.shape === 'hex') {
    // Hexagonal forcefield
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = Math.cos(angle) * (sz * 0.75);
      const hy = Math.sin(angle) * (sz * 0.75);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (visual.shape === 'spiked') {
    // Spiked dread shield
    ctx.beginPath();
    ctx.rect(-sz * 0.4, -sz * 0.7, sz * 0.8, sz * 1.4);
    ctx.fill();
    ctx.stroke();
    // Spikes protruding front
    ctx.fillStyle = visual.borderColor;
    [-sz * 0.4, 0, sz * 0.4].forEach((sy) => {
      ctx.beginPath();
      ctx.moveTo(facing * sz * 0.4, sy - 3);
      ctx.lineTo(facing * (sz * 0.4 + 9), sy);
      ctx.lineTo(facing * sz * 0.4, sy + 3);
      ctx.closePath();
      ctx.fill();
    });
  } else if (visual.shape === 'tower') {
    // Heavy obsidian tower
    ctx.beginPath();
    ctx.rect(-sz * 0.35, -sz * 0.9, sz * 0.7, sz * 1.8);
    ctx.fill();
    ctx.stroke();
  } else if (visual.shape === 'phoenix') {
    // Wings shape
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.8);
    ctx.quadraticCurveTo(facing * sz * 0.8, -sz * 0.4, facing * sz * 0.5, sz * 0.7);
    ctx.lineTo(0, sz * 0.5);
    ctx.quadraticCurveTo(-facing * sz * 0.5, sz * 0.4, 0, -sz * 0.8);
    ctx.fill();
    ctx.stroke();
  } else if (visual.shape === 'conduit') {
    // Round conduit targe with copper coils
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Concentric coil ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    // Center lightning core
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (visual.shape === 'carapace') {
    // Void chitinous carapace
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.85);
    ctx.lineTo(facing * sz * 0.55, -sz * 0.45);
    ctx.lineTo(facing * sz * 0.4, sz * 0.4);
    ctx.lineTo(0, sz * 0.8);
    ctx.lineTo(-facing * sz * 0.4, sz * 0.4);
    ctx.lineTo(-facing * sz * 0.55, -sz * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner void rune
    ctx.fillStyle = visual.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, sz * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Kite / Heater
    ctx.beginPath();
    ctx.moveTo(-sz * 0.4, -sz * 0.6);
    ctx.lineTo(sz * 0.4, -sz * 0.6);
    ctx.lineTo(sz * 0.4, 0);
    ctx.lineTo(0, sz * 0.8);
    ctx.lineTo(-sz * 0.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawEquippedWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: Weapon,
  x: number,
  y: number,
  facing: number,
  angle: number,
  isAttacking: boolean,
  progress: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * facing);

  const { visual, category } = weapon;
  const len = visual.length;
  const wid = visual.width;

  // Weapon glow
  ctx.shadowColor = visual.glowColor;
  ctx.shadowBlur = isAttacking ? 16 : 8;

  // Attack slash trail
  if (isAttacking && !weapon.isRanged && visual.spriteType !== 'blaster') {
    ctx.save();
    ctx.strokeStyle = visual.trailColor;
    ctx.lineWidth = wid * 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, len * 0.9, -0.6 * facing, 0.6 * facing);
    ctx.stroke();
    ctx.restore();
  }

  if (category === 'Blaster') {
    // Gun body
    ctx.fillStyle = visual.bladeColor;
    ctx.strokeStyle = visual.glowColor;
    ctx.lineWidth = 2;
    ctx.fillRect(0, -wid / 2, len * 0.75 * facing, wid);
    ctx.strokeRect(0, -wid / 2, len * 0.75 * facing, wid);
    // Barrel tip
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(facing * len * 0.75, -wid / 2 + 1, facing * 4, wid - 2);
  } else if (category === 'Bow') {
    // Bow arc
    ctx.strokeStyle = visual.bladeColor;
    ctx.lineWidth = wid;
    ctx.beginPath();
    ctx.arc(0, 0, len * 0.6, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-Math.PI / 2.5) * len * 0.6, Math.sin(-Math.PI / 2.5) * len * 0.6);
    ctx.lineTo(isAttacking ? -facing * 10 : 0, 0);
    ctx.lineTo(Math.cos(Math.PI / 2.5) * len * 0.6, Math.sin(Math.PI / 2.5) * len * 0.6);
    ctx.stroke();
  } else if (category === 'Hammer') {
    // Shaft
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * len, 0);
    ctx.stroke();
    // Giant hammer head
    ctx.fillStyle = visual.bladeColor;
    ctx.strokeStyle = visual.glowColor;
    ctx.lineWidth = 3;
    const headX = facing * (len - 6);
    ctx.fillRect(headX - (facing === 1 ? 0 : wid), -wid * 1.2, wid * 1.5 * facing, wid * 2.4);
    ctx.strokeRect(headX - (facing === 1 ? 0 : wid), -wid * 1.2, wid * 1.5 * facing, wid * 2.4);
  } else if (category === 'Scythe') {
    // Staff
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(facing * len, 0);
    ctx.stroke();
    // Curved scythe blade
    ctx.fillStyle = visual.bladeColor;
    ctx.strokeStyle = visual.glowColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const tipX = facing * len;
    ctx.moveTo(tipX, 0);
    ctx.quadraticCurveTo(tipX + facing * 24, -30, tipX - facing * 6, -42);
    ctx.quadraticCurveTo(tipX + facing * 12, -22, tipX, 0);
    ctx.fill();
    ctx.stroke();
  } else if (category === 'Saber') {
    // Neon Laser Saber blade
    // Hilt
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, -3, facing * 12, 6);
    // Glowing beam
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = visual.glowColor;
    ctx.lineWidth = 3;
    ctx.fillRect(facing * 12, -wid / 2, facing * (len - 12), wid);
    ctx.strokeRect(facing * 12, -wid / 2, facing * (len - 12), wid);
  } else if (category === 'Crossbow') {
    // Crossbow stock
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, -wid / 4, facing * len * 0.8, wid / 2);
    // Crossbow prod / limbs
    ctx.strokeStyle = visual.bladeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const bowX = facing * len * 0.65;
    ctx.moveTo(bowX, -14);
    ctx.quadraticCurveTo(bowX + facing * 8, 0, bowX, 14);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bowX, -14);
    ctx.lineTo(facing * len * 0.35, 0);
    ctx.lineTo(bowX, 14);
    ctx.stroke();
    // Loaded bolt
    ctx.fillStyle = visual.glowColor;
    ctx.fillRect(facing * len * 0.35, -1.5, facing * len * 0.45, 3);
  } else {
    // Sword / Katana / Rapier / Daggers
    // Hilt / Grip
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -2, facing * 8, 4);
    // Crossguard
    ctx.fillStyle = visual.glowColor;
    ctx.fillRect(facing * 8, -6, facing * 3, 12);
    // Blade
    ctx.fillStyle = visual.bladeColor;
    ctx.strokeStyle = visual.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(facing * 11, -wid / 2);
    ctx.lineTo(facing * len, 0);
    ctx.lineTo(facing * 11, wid / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// Particle system renderer
export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    if (p.shape === 'ring') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'spark') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

// Floating Combat Text renderer
export function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach((t) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, t.alpha);
    ctx.font = t.isCrit ? '900 20px system-ui, sans-serif' : 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = t.color;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  });
}

// Projectiles renderer (plasma shots, arrows, spinning sabers)
export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  projectiles.forEach((proj) => {
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.fillStyle = proj.color;
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 12;

    if (proj.type === 'plasma') {
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      // Glow trail
      ctx.strokeStyle = proj.trailColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-proj.vx * 2, -proj.vy * 2);
      ctx.stroke();
    } else if (proj.type === 'arrow') {
      const angle = Math.atan2(proj.vy, proj.vx);
      ctx.rotate(angle);
      ctx.fillStyle = proj.color;
      ctx.fillRect(-14, -2, 28, 4);
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(14, -5);
      ctx.lineTo(20, 0);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();
    } else if (proj.type === 'saber') {
      // Spinning saber boomerang
      ctx.rotate(Date.now() * 0.02);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 3;
      ctx.fillRect(-22, -3, 44, 6);
      ctx.strokeRect(-22, -3, 44, 6);
    }
    ctx.restore();
  });
}
