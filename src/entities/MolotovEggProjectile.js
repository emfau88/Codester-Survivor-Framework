import Phaser from 'phaser';

const PROJECTILE_SIZE = { 1: 28, 2: 32, 3: 36, 4: 40 };
const FLIGHT_DURATION_MS = Object.freeze({
  1: 760,
  2: 720,
  3: 680,
  4: 640,
  evolved: 600
});

export function getMolotovFlightDuration(rank, evolved = false) {
  return evolved ? FLIGHT_DURATION_MS.evolved : (FLIGHT_DURATION_MS[rank] ?? FLIGHT_DURATION_MS[1]);
}

export class MolotovEggProjectile {
  constructor(scene, startX, startY, targetX, targetY, rank, evolved = false) {
    this.scene = scene;
    this.start = new Phaser.Math.Vector2(startX, startY);
    this.target = new Phaser.Math.Vector2(targetX, targetY);
    this.rank = rank;
    this.evolved = evolved;
    this.duration = getMolotovFlightDuration(rank, evolved);
    this.age = 0;
    this.active = true;
    this.textureKey = evolved ? 'molotov-egg-evo' : `molotov-egg-r${rank}`;
    this.projectileSize = evolved ? 44 : PROJECTILE_SIZE[rank] ?? PROJECTILE_SIZE[1];
    this.previousPosition = new Phaser.Math.Vector2(startX, startY);

    this.sprite = scene.add.image(startX, startY, this.textureKey)
      .setDisplaySize(this.projectileSize, this.projectileSize)
      .setDepth(12);
    this.trail = scene.add.image(startX, startY, 'molotov-embers')
      .setDisplaySize(evolved ? 34 : 24 + rank * 2, evolved ? 25 : 17 + rank)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(evolved ? 0.34 : 0.22)
      .setDepth(11);
    this.shadow = scene.add.ellipse(startX, startY + 8, 28, 10, 0x24130c, 1)
      .setAlpha(0.22)
      .setDepth(2);
  }

  update(delta) {
    if (!this.active) return;
    this.age += delta;
    const progress = Phaser.Math.Clamp(this.age / this.duration, 0, 1);
    // A ballistic throw has a constant horizontal component and a quadratic
    // vertical arc. It reads as a real lob without changing the fixed impact.
    const x = Phaser.Math.Linear(this.start.x, this.target.x, progress);
    const groundY = Phaser.Math.Linear(this.start.y, this.target.y, progress);
    const arc = 4 * progress * (1 - progress) * (94 + this.rank * 13);
    const y = groundY - arc;
    const travelAngle = Phaser.Math.Angle.Between(
      this.previousPosition.x,
      this.previousPosition.y,
      x,
      y
    );
    const tailDistance = this.projectileSize * 0.34;
    this.sprite
      .setPosition(x, y)
      .setRotation(travelAngle + Math.PI * 0.25);
    this.trail
      .setPosition(
        x - Math.cos(travelAngle) * tailDistance,
        y - Math.sin(travelAngle) * tailDistance
      )
      .setRotation(travelAngle)
      .setAlpha((this.evolved ? 0.34 : 0.22) * Math.sin(progress * Math.PI));
    this.shadow
      .setPosition(x, groundY + 10)
      .setScale(0.72 + progress * 0.3)
      .setAlpha(0.12 + progress * 0.1);
    this.previousPosition.set(x, y);

    if (progress >= 1) {
      this.destroy();
      this.scene.createMolotovImpact(this.target.x, this.target.y, this.rank, this.evolved);
    }
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    this.sprite.destroy();
    this.trail.destroy();
    this.shadow.destroy();
  }
}
