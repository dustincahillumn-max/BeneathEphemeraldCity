export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Create player sprite (placeholder: simple graphics)
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xc3a464, 1); // Gold color for homunculus
        graphics.fillCircle(0, 0, 12);

        // Add directional indicator
        graphics.fillStyle(0x6a3d25, 1);
        graphics.fillTriangle(
            0, -12,
            -6, 0,
            6, 0
        );

        graphics.generateTexture('player_temp', 24, 24);
        graphics.destroy();

        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player_temp');
        this.sprite.setCollideWorldBounds(true);

        // Movement properties
        this.speed = 160;
        this.direction = new Phaser.Math.Vector2(0, -1); // Facing up initially

        // Combat properties (for future)
        this.health = 100;
        this.maxHealth = 100;
        this.chainEquipped = false;

        // Kanna knowledge (for future)
        this.knownKanna = new Set();
    }

    update(input, delta) {
        const velocity = new Phaser.Math.Vector2(0, 0);

        // Movement input
        if (input.left) {
            velocity.x = -1;
        } else if (input.right) {
            velocity.x = 1;
        }

        if (input.up) {
            velocity.y = -1;
        } else if (input.down) {
            velocity.y = 1;
        }

        // Normalize diagonal movement
        if (velocity.length() > 0) {
            velocity.normalize();
            this.direction.copy(velocity);

            // Update sprite rotation to face movement direction
            this.sprite.setRotation(Math.atan2(velocity.y, velocity.x) + Math.PI / 2);
        }

        // Apply velocity
        this.sprite.setVelocity(
            velocity.x * this.speed,
            velocity.y * this.speed
        );
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        // TODO: Flash sprite, play sound
        return this.health <= 0;
    }

    learnKanna(kannaId) {
        this.knownKanna.add(kannaId);
        // TODO: Show notification, update library
    }

    hasKanna(kannaId) {
        return this.knownKanna.has(kannaId);
    }
}
