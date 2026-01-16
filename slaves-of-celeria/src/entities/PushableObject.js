import Phaser from 'phaser';

/**
 * PushableObject - Objects that can be pushed by the player
 * Used for puzzles, blocking enemies, and environmental manipulation
 */
export default class PushableObject {
    constructor(scene, x, y, type = 'block') {
        this.scene = scene;
        this.type = type;

        // Visual style based on type
        const styles = {
            block: { color: 0x6a3d25, width: 48, height: 48 },
            crate: { color: 0x8a5d35, width: 40, height: 40 },
            egg_shell: { color: 0xf0e6d0, width: 32, height: 32 }
        };

        const style = styles[type] || styles.block;

        // Create sprite
        const graphics = scene.add.graphics();
        graphics.fillStyle(style.color, 1);
        graphics.fillRect(-style.width / 2, -style.height / 2, style.width, style.height);

        // Add texture detail
        graphics.lineStyle(2, 0x000000, 0.3);
        graphics.strokeRect(-style.width / 2, -style.height / 2, style.width, style.height);

        graphics.generateTexture(`pushable_${type}`, style.width, style.height);
        graphics.destroy();

        this.sprite = scene.physics.add.sprite(x, y, `pushable_${type}`);
        this.sprite.setImmovable(false);
        this.sprite.setMass(2); // Heavy but pushable

        // Friction and drag
        this.sprite.setDrag(400);
        this.sprite.setMaxVelocity(100);

        // Can be pushed
        this.isPushable = true;
        this.originalPosition = { x, y };
    }

    push(direction, force = 150) {
        if (!this.isPushable) return false;

        // Apply force in direction
        this.sprite.setVelocity(
            direction.x * force,
            direction.y * force
        );

        return true;
    }

    reset() {
        // Return to original position (for puzzles that reset)
        this.sprite.setPosition(this.originalPosition.x, this.originalPosition.y);
        this.sprite.setVelocity(0, 0);
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
