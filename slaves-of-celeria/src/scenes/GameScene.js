import Phaser from 'phaser';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Create a simple test environment
        this.createEnvironment();

        // Create player
        this.player = new Player(this, 400, 300);

        // Camera follows player
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 1600, 1200);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Debug text
        this.debugText = this.add.text(10, 10, '', {
            font: '12px monospace',
            fill: '#c3a464',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 5 }
        }).setScrollFactor(0).setDepth(100);
    }

    createEnvironment() {
        // Create floor tiles (placeholder grid)
        const tileSize = 32;
        const graphics = this.add.graphics();

        // Dark floor
        graphics.fillStyle(0x2e3b2f, 1);
        graphics.fillRect(0, 0, 1600, 1200);

        // Grid pattern
        graphics.lineStyle(1, 0x1d1a16, 0.3);
        for (let x = 0; x < 1600; x += tileSize) {
            graphics.lineBetween(x, 0, x, 1200);
        }
        for (let y = 0; y < 1200; y += tileSize) {
            graphics.lineBetween(0, y, 1600, y);
        }

        // Create some test walls
        this.walls = this.physics.add.staticGroup();

        // Border walls
        this.createWall(0, 0, 1600, 16); // top
        this.createWall(0, 1184, 1600, 16); // bottom
        this.createWall(0, 0, 16, 1200); // left
        this.createWall(1584, 0, 16, 1200); // right

        // Interior test walls (creating simple rooms)
        this.createWall(400, 200, 16, 200);
        this.createWall(800, 400, 200, 16);
        this.createWall(600, 600, 16, 300);

        // Add decorative spider web motif
        this.createWebDecoration(200, 150);
        this.createWebDecoration(1200, 800);
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(x, y, width, height, 0x6a3d25);
        wall.setOrigin(0, 0);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
    }

    createWebDecoration(x, y) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x8a8a8a, 0.3);

        // Draw simple spider web pattern
        const radius = 40;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            graphics.lineBetween(
                x, y,
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius
            );
        }

        // Concentric circles
        for (let r = 10; r <= radius; r += 10) {
            graphics.strokeCircle(x, y, r);
        }
    }

    update(time, delta) {
        if (!this.player) return;

        // Get input
        const input = {
            left: this.cursors.left.isDown || this.wasd.left.isDown,
            right: this.cursors.right.isDown || this.wasd.right.isDown,
            up: this.cursors.up.isDown || this.wasd.up.isDown,
            down: this.cursors.down.isDown || this.wasd.down.isDown
        };

        // Update player
        this.player.update(input, delta);

        // Collision with walls
        this.physics.collide(this.player.sprite, this.walls);

        // Debug info
        this.debugText.setText([
            `Position: ${Math.floor(this.player.sprite.x)}, ${Math.floor(this.player.sprite.y)}`,
            `Velocity: ${Math.floor(this.player.sprite.body.velocity.x)}, ${Math.floor(this.player.sprite.body.velocity.y)}`,
            'Controls: WASD or Arrow Keys'
        ]);
    }
}
