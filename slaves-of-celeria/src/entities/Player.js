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

        // Combat properties
        this.health = 100;
        this.maxHealth = 100;
        this.attackDamage = 10;
        this.attackRange = 50;
        this.attackCooldown = 0;
        this.attackCooldownMax = 500; // ms
        this.isAttacking = false;

        // Kanna knowledge
        this.knownKanna = new Set();

        // Intention tracking reference (set by GameScene)
        this.intentionEngine = null;

        // Combat visual (attack indicator)
        this.attackIndicator = null;
    }

    update(input, delta) {
        this.attackCooldown = Math.max(0, this.attackCooldown - delta);
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

    attack(enemies) {
        if (this.attackCooldown > 0 || this.isAttacking) {
            return false;
        }

        this.isAttacking = true;
        this.attackCooldown = this.attackCooldownMax;

        // Visual feedback - flash attack indicator
        if (!this.attackIndicator) {
            this.attackIndicator = this.scene.add.graphics();
        }

        this.attackIndicator.clear();
        this.attackIndicator.lineStyle(3, 0xc3a464, 0.8);
        this.attackIndicator.strokeCircle(
            this.sprite.x,
            this.sprite.y,
            this.attackRange
        );

        // Fade out attack indicator
        this.scene.tweens.add({
            targets: this.attackIndicator,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.attackIndicator.alpha = 1;
                this.isAttacking = false;
            }
        });

        // Check for hits
        let hitCount = 0;
        enemies.forEach(enemy => {
            if (enemy.health <= 0) return;

            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                enemy.sprite.x, enemy.sprite.y
            );

            if (dist <= this.attackRange) {
                enemy.takeDamage(this.attackDamage);
                hitCount++;

                // Record attack in Intention Engine
                if (this.intentionEngine) {
                    this.intentionEngine.recordAttack(this.attackDamage);
                }
            }
        });

        return hitCount > 0;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);

        // Flash sprite red
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(150, () => {
            this.sprite.clearTint();
        });

        // Record damage in Intention Engine
        if (this.intentionEngine) {
            this.intentionEngine.recordDamage(amount);
        }

        return this.health <= 0;
    }

    learnKanna(kannaId) {
        if (this.knownKanna.has(kannaId)) {
            return false; // Already known
        }
        this.knownKanna.add(kannaId);
        // TODO: Show notification, update library
        return true;
    }

    hasKanna(kannaId) {
        return this.knownKanna.has(kannaId);
    }

    destroy() {
        if (this.attackIndicator) {
            this.attackIndicator.destroy();
        }
    }
}
