export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Check if real sprite sheet loaded
        const hasRealSprites = scene.textures.exists('slave_spritesheet');

        if (!hasRealSprites) {
            // FALLBACK: Create procedural player sprite (SLAVE CLASS: thin, nimble, weak)
            // Zelda-like scale - visible but thin
            const graphics = scene.add.graphics();

            // Thin body (vertical oval) - thinner than Link
            graphics.fillStyle(0xc3a464, 1); // Gold color for homunculus
            graphics.fillEllipse(0, 0, 16, 28); // Thin width, taller height

            // Head
            graphics.fillStyle(0xd4b574, 1);
            graphics.fillCircle(0, -10, 8);

            // Directional indicator (small arrow)
            graphics.fillStyle(0x6a3d25, 1);
            graphics.fillTriangle(
                0, -16,
                -5, -10,
                5, -10
            );

            graphics.generateTexture('player_slave', 32, 48);
            graphics.destroy();
        }

        // Create sprite (use real sprites if available, otherwise procedural)
        const spriteKey = hasRealSprites ? 'slave_spritesheet' : 'player_slave';
        this.sprite = scene.physics.add.sprite(x, y, spriteKey, 0);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setSize(16, 28); // Thin collision box for narrow passages

        // Create animations if using real sprites
        if (hasRealSprites) {
            this.createSlaveAnimations(scene);
            this.hasAnimations = true;
        } else {
            this.hasAnimations = false;
        }

        // Movement properties (SLAVE CLASS: fast and nimble)
        this.speed = 200; // Faster than Knight will be
        this.direction = new Phaser.Math.Vector2(0, -1); // Facing up initially

        // Survival properties
        this.health = 50; // Fragile slave
        this.maxHealth = 50;

        // PUSH mechanic (core Slave ability) - POWERFUL IMPACT
        this.pushForce = 500; // DOUBLED - much stronger
        this.pushRange = 80; // DOUBLED - wider area
        this.pushCooldown = 0;
        this.pushCooldownMax = 500; // ms - slightly longer cooldown for balance
        this.isPushing = false;

        // Kanna knowledge
        this.knownKanna = new Set();

        // Intention tracking reference (set by GameScene)
        this.intentionEngine = null;

        // Push visual (push wave indicator)
        this.pushIndicator = null;
    }

    createSlaveAnimations(scene) {
        // SLAVE CLASS animations from sprite sheet
        // Based on your sprite sheet layout:
        // Row 0: Idle frames
        // Row 1: Walking frames
        // Row 2: Push action frame

        // Idle animation (frame 0)
        if (!scene.anims.exists('slave_idle')) {
            scene.anims.create({
                key: 'slave_idle',
                frames: [{ key: 'slave_spritesheet', frame: 0 }],
                frameRate: 1
            });
        }

        // Walk animation (frames 1-4 in row 1)
        if (!scene.anims.exists('slave_walk')) {
            scene.anims.create({
                key: 'slave_walk',
                frames: scene.anims.generateFrameNumbers('slave_spritesheet', { start: 1, end: 4 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Push animation (frame in row 2)
        if (!scene.anims.exists('slave_push')) {
            scene.anims.create({
                key: 'slave_push',
                frames: [{ key: 'slave_spritesheet', frame: 10 }],
                frameRate: 1
            });
        }

        this.sprite.play('slave_idle');
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

            // Play walk animation if available
            if (this.hasAnimations && !this.isPushing) {
                this.sprite.play('slave_walk', true);
            } else if (!this.hasAnimations) {
                // Update sprite rotation to face movement direction (fallback only)
                this.sprite.setRotation(Math.atan2(velocity.y, velocity.x) + Math.PI / 2);
            }
        } else {
            // Stopped moving - play idle animation if available
            if (this.hasAnimations && !this.isPushing) {
                this.sprite.play('slave_idle', true);
            }
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

        // Play push animation if available
        if (this.hasAnimations) {
            this.sprite.play('slave_push');
        }

        // Visual feedback - push wave
        if (!this.pushIndicator) {
            this.pushIndicator = this.scene.add.graphics();
        }

        // Direction player is facing
        const pushDir = this.direction.clone().normalize();

        // Draw POWERFUL push wave (thicker, brighter)
        this.pushIndicator.clear();
        this.pushIndicator.lineStyle(8, 0xffd700, 1); // Thicker, gold
        this.pushIndicator.strokeCircle(
            this.sprite.x,
            this.sprite.y,
            this.pushRange
        );

        // Add inner ring for extra impact
        this.pushIndicator.lineStyle(4, 0xffffff, 0.8);
        this.pushIndicator.strokeCircle(
            this.sprite.x,
            this.sprite.y,
            this.pushRange * 0.7
        );

        // SCREEN SHAKE for impact feel
        this.scene.cameras.main.shake(150, 0.005);

        // Expanding wave animation (faster, more impactful)
        this.scene.tweens.add({
            targets: this.pushIndicator,
            alpha: 0,
            duration: 200, // Faster
            onComplete: () => {
                this.pushIndicator.alpha = 1;
                this.isPushing = false;
                // Return to idle after push
                if (this.hasAnimations) {
                    this.sprite.play('slave_idle');
                }
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
                    // POWERFUL knockback
                    enemy.sprite.setVelocity(
                        knockback.x * this.pushForce * 3, // Triple force!
                        knockback.y * this.pushForce * 3
                    );

                    // Visual feedback: Flash enemy white
                    enemy.sprite.setTint(0xffffff);
                    this.scene.time.delayedCall(100, () => {
                        enemy.sprite.clearTint();
                    });

                    // Stun enemy briefly
                    if (enemy.stun) {
                        enemy.stun(800); // 0.8 second stun
                    }
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
