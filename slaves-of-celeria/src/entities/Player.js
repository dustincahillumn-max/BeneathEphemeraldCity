export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Create player sprite (SLAVE CLASS: thin, nimble, weak)
        const graphics = scene.add.graphics();

        // Small thin body (vertical oval)
        graphics.fillStyle(0xc3a464, 1); // Gold color for homunculus
        graphics.fillEllipse(0, 0, 10, 16); // Thin width, taller height

        // Head
        graphics.fillStyle(0xd4b574, 1);
        graphics.fillCircle(0, -6, 5);

        // Directional indicator (small arrow)
        graphics.fillStyle(0x6a3d25, 1);
        graphics.fillTriangle(
            0, -10,
            -3, -5,
            3, -5
        );

        graphics.generateTexture('player_slave', 20, 32);
        graphics.destroy();

        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'player_slave');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setSize(10, 16); // Thin collision box for narrow passages

        // Movement properties (SLAVE CLASS: fast and nimble)
        this.speed = 200; // Faster than Knight will be
        this.direction = new Phaser.Math.Vector2(0, -1); // Facing up initially

        // Survival properties
        this.health = 50; // Fragile slave
        this.maxHealth = 50;

        // PUSH mechanic (core Slave ability)
        this.pushForce = 250;
        this.pushRange = 40;
        this.pushCooldown = 0;
        this.pushCooldownMax = 300; // ms - fast push
        this.isPushing = false;

        // Kanna knowledge
        this.knownKanna = new Set();

        // Intention tracking reference (set by GameScene)
        this.intentionEngine = null;

        // Push visual (push wave indicator)
        this.pushIndicator = null;
    }

    update(input, delta) {
        this.pushCooldown = Math.max(0, this.pushCooldown - delta);
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

    push(enemies, pushableObjects) {
        if (this.pushCooldown > 0 || this.isPushing) {
            return false;
        }

        this.isPushing = true;
        this.pushCooldown = this.pushCooldownMax;

        // Visual feedback - push wave
        if (!this.pushIndicator) {
            this.pushIndicator = this.scene.add.graphics();
        }

        // Direction player is facing
        const pushDir = this.direction.clone().normalize();

        // Draw push wave
        this.pushIndicator.clear();
        this.pushIndicator.lineStyle(4, 0xc3a464, 0.9);
        this.pushIndicator.strokeCircle(
            this.sprite.x,
            this.sprite.y,
            this.pushRange
        );

        // Expanding wave animation
        this.scene.tweens.add({
            targets: this.pushIndicator,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.pushIndicator.alpha = 1;
                this.isPushing = false;
            }
        });

        // Push enemies away
        let pushedCount = 0;
        enemies.forEach(enemy => {
            if (enemy.health <= 0) return;

            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                enemy.sprite.x, enemy.sprite.y
            );

            if (dist <= this.pushRange) {
                // Calculate direction FROM player TO enemy
                const angle = Phaser.Math.Angle.Between(
                    this.sprite.x, this.sprite.y,
                    enemy.sprite.x, enemy.sprite.y
                );

                // Push enemy away
                const knockback = new Phaser.Math.Vector2(
                    Math.cos(angle),
                    Math.sin(angle)
                );

                if (enemy.sprite && enemy.sprite.body) {
                    enemy.sprite.setVelocity(
                        knockback.x * this.pushForce * 2,
                        knockback.y * this.pushForce * 2
                    );
                }

                pushedCount++;

                // Record in Intention Engine (shows tactical thinking)
                if (this.intentionEngine) {
                    this.intentionEngine.recordAttack(1); // Still tracks "aggressive" action
                }
            }
        });

        // Push objects
        if (pushableObjects) {
            pushableObjects.forEach(obj => {
                if (!obj.isPushable) return;

                const dist = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    obj.sprite.x, obj.sprite.y
                );

                if (dist <= this.pushRange) {
                    obj.push(pushDir, this.pushForce);
                    pushedCount++;
                }
            });
        }

        return pushedCount > 0;
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
        if (this.pushIndicator) {
            this.pushIndicator.destroy();
        }
    }
}
