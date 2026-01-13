import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import IntentionEngine from '../systems/IntentionEngine.js';
import KannaSystem from '../systems/KannaSystem.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 1600, 1200);

        // Create a simple test environment
        this.createEnvironment();

        // Initialize Intention Engine
        this.intentionEngine = new IntentionEngine(this);

        // Create player
        this.player = new Player(this, 400, 300);
        this.player.intentionEngine = this.intentionEngine;

        // Initialize Kanna System
        this.kannaSystem = new KannaSystem(this, this.intentionEngine);

        // Register Kanna spawn locations on walls
        this.registerKannaSpawnLocations();

        // Create enemies
        this.enemies = [];
        this.spawnEnemy(700, 400);
        this.spawnEnemy(1000, 600);
        this.spawnEnemy(300, 800);

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

        // Attack input (Spacebar)
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Debug toggle (D key)
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.showDebug = true;

        // Debug text
        this.debugText = this.add.text(10, 10, '', {
            font: '11px monospace',
            fill: '#c3a464',
            backgroundColor: '#000000dd',
            padding: { x: 8, y: 6 }
        }).setScrollFactor(0).setDepth(100);

        // UI text (health, Kanna count)
        this.uiText = this.add.text(10, this.cameras.main.height - 60, '', {
            font: '14px monospace',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
    }

    spawnEnemy(x, y) {
        const enemy = new Enemy(this, x, y);
        this.enemies.push(enemy);
        this.physics.add.collider(enemy.sprite, this.walls);
    }

    registerKannaSpawnLocations() {
        // Register locations near walls where Kanna can appear
        this.kannaSystem.registerSpawnLocation(200, 250);
        this.kannaSystem.registerSpawnLocation(500, 350);
        this.kannaSystem.registerSpawnLocation(900, 450);
        this.kannaSystem.registerSpawnLocation(700, 700);
        this.kannaSystem.registerSpawnLocation(1300, 400);
        this.kannaSystem.registerSpawnLocation(400, 950);
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

        // Toggle debug display
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.showDebug = !this.showDebug;
            this.debugText.setVisible(this.showDebug);
        }

        // Get input
        const input = {
            left: this.cursors.left.isDown || this.wasd.left.isDown,
            right: this.cursors.right.isDown || this.wasd.right.isDown,
            up: this.cursors.up.isDown || this.wasd.up.isDown,
            down: this.cursors.down.isDown || this.wasd.down.isDown
        };

        // Attack input
        if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.player.attack(this.enemies);
        }

        // Update player
        this.player.update(input, delta);

        // Update Intention Engine
        this.intentionEngine.update(delta);

        // Update Kanna System
        this.kannaSystem.update(time, delta);

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health > 0) {
                enemy.update(this.player, delta);
                return true;
            }
            return false;
        });

        // Collision with walls
        this.physics.collide(this.player.sprite, this.walls);

        // UI display
        const healthBar = '█'.repeat(Math.floor(this.player.health / 10)) +
                         '░'.repeat(Math.floor((this.player.maxHealth - this.player.health) / 10));
        this.uiText.setText([
            `HP: ${healthBar} ${this.player.health}/${this.player.maxHealth}`,
            `Kanna Discovered: ${this.kannaSystem.getDiscoveredKannaCount()}`,
            `Press SPACE to attack | D to toggle debug`
        ]);

        // Debug info
        if (this.showDebug) {
            const dominant = this.intentionEngine.getDominantMotivation();
            this.debugText.setText([
                `=== DEBUG ===`,
                `Position: ${Math.floor(this.player.sprite.x)}, ${Math.floor(this.player.sprite.y)}`,
                `Enemies: ${this.enemies.length}`,
                '',
                `INTENTION: ${dominant.motivation.toUpperCase()} (${Math.floor(dominant.strength)})`,
                `Aggression: ${Math.floor(this.intentionEngine.motivations.aggression)}`,
                `Reverence: ${Math.floor(this.intentionEngine.motivations.reverence)}`,
                `Curiosity: ${Math.floor(this.intentionEngine.motivations.curiosity)}`,
                `Fear: ${Math.floor(this.intentionEngine.motivations.fear)}`,
                `Greed: ${Math.floor(this.intentionEngine.motivations.greed)}`,
                `Pride: ${Math.floor(this.intentionEngine.motivations.pride)}`,
                '',
                `Attacks: ${this.intentionEngine.metrics.attackCount}`,
                `Retreats: ${this.intentionEngine.metrics.retreatCount}`
            ]);
        }
    }
}
