export default class Enemy {
    constructor(scene, x, y, type = 'spider_minion') {
        this.scene = scene;
        this.type = type;

        // Create enemy sprite (Zelda-scale spider)
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x6a3d25, 1); // Brown for spider body
        graphics.fillCircle(0, 0, 20);

        // Add legs indicator (8 spider legs)
        graphics.lineStyle(3, 0x4a2d15);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            graphics.lineBetween(
                Math.cos(angle) * 12,
                Math.sin(angle) * 12,
                Math.cos(angle) * 26,
                Math.sin(angle) * 26
            );
        }

        graphics.generateTexture('enemy_' + type, 56, 56);
        graphics.destroy();

        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'enemy_' + type);
        this.sprite.setCollideWorldBounds(true);

        // Properties
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 80;
        this.attackDamage = 5;
        this.detectionRadius = 200;
        this.attackRadius = 40;
        this.attackCooldown = 0;
        this.attackCooldownMax = 1000; // ms

        // AI state
        this.state = 'idle'; // idle, chase, attack, retreat
        this.target = null;
        this.patrolDirection = new Phaser.Math.Vector2(
            Phaser.Math.Between(-1, 1),
            Phaser.Math.Between(-1, 1)
        ).normalize();
        this.patrolTimer = 0;
        this.patrolDuration = 2000;

        // Visual feedback
        this.flashTween = null;
    }

    update(player, delta) {
        if (this.health <= 0) return;

        this.attackCooldown = Math.max(0, this.attackCooldown - delta);

        const distToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );

        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle(player, distToPlayer, delta);
                break;
            case 'chase':
                this.updateChase(player, distToPlayer);
                break;
            case 'attack':
                this.updateAttack(player, distToPlayer, delta);
                break;
            case 'retreat':
                this.updateRetreat(player, distToPlayer, delta);
                break;
        }

        // Patrol behavior when idle
        if (this.state === 'idle') {
            this.patrolTimer += delta;
            if (this.patrolTimer > this.patrolDuration) {
                this.patrolDirection.setAngle(Phaser.Math.FloatBetween(0, Math.PI * 2));
                this.patrolTimer = 0;
            }
            this.sprite.setVelocity(
                this.patrolDirection.x * this.speed * 0.3,
                this.patrolDirection.y * this.speed * 0.3
            );
        }
    }

    updateIdle(player, distToPlayer, delta) {
        if (distToPlayer < this.detectionRadius) {
            this.state = 'chase';
            this.target = player;
        }
    }

    updateChase(player, distToPlayer) {
        if (distToPlayer > this.detectionRadius * 1.5) {
            this.state = 'idle';
            this.sprite.setVelocity(0, 0);
            return;
        }

        if (distToPlayer < this.attackRadius) {
            this.state = 'attack';
            return;
        }

        // Move toward player
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        this.sprite.setVelocity(
            Math.cos(angle) * this.speed,
            Math.sin(angle) * this.speed
        );
    }

    updateAttack(player, distToPlayer, delta) {
        if (distToPlayer > this.attackRadius * 1.2) {
            this.state = 'chase';
            return;
        }

        // Stop and attack
        this.sprite.setVelocity(0, 0);

        if (this.attackCooldown === 0) {
            this.performAttack(player);
            this.attackCooldown = this.attackCooldownMax;
        }

        // Low health = retreat
        if (this.health < this.maxHealth * 0.3) {
            this.state = 'retreat';
        }
    }

    updateRetreat(player, distToPlayer, delta) {
        // Run away from player
        const angle = Phaser.Math.Angle.Between(
            player.sprite.x, player.sprite.y,
            this.sprite.x, this.sprite.y
        );
        this.sprite.setVelocity(
            Math.cos(angle) * this.speed * 1.2,
            Math.sin(angle) * this.speed * 1.2
        );

        if (distToPlayer > this.detectionRadius) {
            this.state = 'idle';
        }
    }

    performAttack(player) {
        // Deal damage to player
        const killed = player.takeDamage(this.attackDamage);

        // Visual feedback
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        if (killed) {
            this.state = 'idle';
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);

        // Flash white
        this.sprite.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        // Die
        if (this.health <= 0) {
            this.die();
            return true;
        }

        // Interrupt idle state
        if (this.state === 'idle') {
            this.state = 'chase';
        }

        return false;
    }

    die() {
        this.state = 'dead';

        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            angle: 360,
            duration: 500,
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
