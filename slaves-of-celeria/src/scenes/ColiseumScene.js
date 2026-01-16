import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import PushableObject from '../entities/PushableObject.js';
import IntentionEngine from '../systems/IntentionEngine.js';
import KannaSystem from '../systems/KannaSystem.js';
import KannaLibrary from '../ui/KannaLibrary.js';

/**
 * Coliseum Scene - Starting arena where homunculi hatch from eggs
 * SLAVE CLASS gameplay: avoid, push, escape through narrow passages
 */
export default class ColiseumScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ColiseumScene' });
    }

    create() {
        // Set world bounds (large arena)
        this.physics.world.setBounds(0, 0, 2400, 1800);

        // Create coliseum environment
        this.createColiseumArena();

        // Initialize systems
        this.intentionEngine = new IntentionEngine(this);
        this.kannaSystem = new KannaSystem(this, this.intentionEngine);
        this.kannaLibrary = new KannaLibrary(this);
        this.kannaLibrary.create();

        // Create player (spawns from egg)
        this.createPlayerSpawn();

        // Create pushable objects
        this.pushableObjects = [];
        this.createPuzzleObjects();

        // Create enemies (chasers, not fighters for Slave class)
        this.enemies = [];
        this.spawnChaserEnemies();

        // Camera - Zelda-like close zoom
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 2400, 1800);
        this.cameras.main.setZoom(2.5); // Zelda-style close-up view

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Push input (Spacebar)
        this.pushKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Library (L key)
        this.libraryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

        // Debug (D key)
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.showDebug = true;

        // UI
        this.createUI();

        // Register Kanna spawn points
        this.registerKannaLocations();
    }

    createColiseumArena() {
        const graphics = this.add.graphics();

        // Arena floor (sandy coliseum)
        graphics.fillStyle(0x3d2f1f, 1);
        graphics.fillRect(0, 0, 2400, 1800);

        // Grid pattern
        graphics.lineStyle(1, 0x2d1f0f, 0.4);
        for (let x = 0; x < 2400; x += 32) {
            graphics.lineBetween(x, 0, x, 1800);
        }
        for (let y = 0; y < 1800; y += 32) {
            graphics.lineBetween(0, y, 2400, y);
        }

        // Create walls and passages
        this.walls = this.physics.add.staticGroup();

        // Outer arena walls
        this.createWall(0, 0, 2400, 20); // top
        this.createWall(0, 1780, 2400, 20); // bottom
        this.createWall(0, 0, 20, 1800); // left
        this.createWall(2380, 0, 20, 1800); // right

        // Interior maze-like structure
        // Central egg chamber
        this.createWall(1000, 700, 400, 20); // top wall
        this.createWall(1000, 1100, 400, 20); // bottom wall
        this.createWall(1000, 700, 20, 400); // left wall
        this.createWall(1380, 700, 20, 400); // right wall

        // NARROW PASSAGES (only Slave class fits through - 18px wide, player is 16px)
        // Escape routes from central chamber
        this.createNarrowPassage(1190, 700, 18, 80, 'vertical'); // North escape
        this.createNarrowPassage(1190, 1020, 18, 80, 'vertical'); // South escape

        // Maze sections with narrow shortcuts
        this.createWall(400, 400, 600, 20);
        this.createWall(400, 800, 600, 20);
        this.createNarrowPassage(700, 400, 18, 80, 'vertical'); // Shortcut

        this.createWall(1600, 400, 600, 20);
        this.createWall(1600, 800, 600, 20);
        this.createNarrowPassage(1900, 400, 18, 80, 'vertical'); // Shortcut

        // Decorative elements (egg shells, debris)
        this.createEggShells();
    }

    createWall(x, y, width, height, color = 0x6a3d25) {
        const wall = this.add.rectangle(x, y, width, height, color);
        wall.setOrigin(0, 0);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
    }

    createNarrowPassage(x, y, width, height, orientation) {
        // Visual indicator that this is a narrow passage
        const passage = this.add.rectangle(x, y, width, height, 0x8a5d35, 0.5);
        passage.setOrigin(0, 0);

        // Add text hint
        const hint = this.add.text(
            x + (orientation === 'vertical' ? -10 : width / 2),
            y + (orientation === 'vertical' ? height / 2 : -15),
            '→',
            {
                fontSize: '12px',
                color: '#c3a464',
                rotation: orientation === 'vertical' ? Math.PI / 2 : 0
            }
        );
        hint.setOrigin(0.5, 0.5);
    }

    createEggShells() {
        // Scattered egg shell debris
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(1050, 1350);
            const y = Phaser.Math.Between(750, 1050);

            const shell = this.add.ellipse(x, y, 20, 25, 0xf0e6d0, 0.6);
            shell.setStrokeStyle(2, 0xd0c6b0);
        }
    }

    createPlayerSpawn() {
        // Central egg spawn point
        const eggX = 1200;
        const eggY = 900;

        // Giant egg (cracked open)
        const egg = this.add.ellipse(eggX, eggY + 20, 60, 80, 0xf0e6d0);
        egg.setStrokeStyle(4, 0xd0c6b0);
        egg.setAlpha(0.7);

        // Player spawns here
        this.player = new Player(this, eggX, eggY);
        this.player.intentionEngine = this.intentionEngine;

        // Collision with walls
        this.physics.add.collider(this.player.sprite, this.walls);
    }

    createPuzzleObjects() {
        // Pushable blocks for puzzle solving
        this.addPushableBlock(700, 600);
        this.addPushableBlock(1700, 600);
        this.addPushableBlock(600, 1200);
        this.addPushableBlock(1800, 1200);

        // Egg shells (pushable debris)
        this.addPushableObject(1100, 800, 'egg_shell');
        this.addPushableObject(1300, 950, 'egg_shell');
    }

    addPushableBlock(x, y, type = 'block') {
        const obj = new PushableObject(this, x, y, type);
        this.pushableObjects.push(obj);
        this.physics.add.collider(obj.sprite, this.walls);
        this.physics.add.collider(this.player.sprite, obj.sprite);
    }

    addPushableObject(x, y, type) {
        this.addPushableBlock(x, y, type);
    }

    spawnChaserEnemies() {
        // Enemies that CHASE but don't kill instantly - you must avoid
        this.spawnChaser(500, 500);
        this.spawnChaser(1900, 500);
        this.spawnChaser(500, 1300);
        this.spawnChaser(1900, 1300);
        this.spawnChaser(1200, 600);
    }

    spawnChaser(x, y) {
        const enemy = new Enemy(this, x, y, 'chaser');
        this.enemies.push(enemy);
        this.physics.add.collider(enemy.sprite, this.walls);

        // Enemies push pushable objects too
        this.pushableObjects.forEach(obj => {
            this.physics.add.collider(enemy.sprite, obj.sprite);
        });
    }

    registerKannaLocations() {
        this.kannaSystem.registerSpawnLocation(300, 300);
        this.kannaSystem.registerSpawnLocation(2100, 300);
        this.kannaSystem.registerSpawnLocation(300, 1500);
        this.kannaSystem.registerSpawnLocation(2100, 1500);
    }

    createUI() {
        // Fixed UI positioning for 1280x720 screen
        const screenWidth = 1280;
        const screenHeight = 720;

        // Debug text (top left)
        this.debugText = this.add.text(10, 10, '', {
            font: '14px monospace',
            fill: '#c3a464',
            backgroundColor: '#000000dd',
            padding: { x: 8, y: 6 }
        }).setScrollFactor(0).setDepth(100);

        // UI text (bottom left)
        this.uiText = this.add.text(10, screenHeight - 90, '', {
            font: '14px monospace',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setDepth(100);
    }

    update(time, delta) {
        if (!this.player) return;

        // Toggle debug
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.showDebug = !this.showDebug;
            this.debugText.setVisible(this.showDebug);
        }

        // Library toggle
        if (Phaser.Input.Keyboard.JustDown(this.libraryKey)) {
            this.kannaLibrary.toggle(this.player);
        }

        // Pause gameplay when library open
        if (this.kannaLibrary.isOpen) {
            return;
        }

        // Get input
        const input = {
            left: this.cursors.left.isDown || this.wasd.left.isDown,
            right: this.cursors.right.isDown || this.wasd.right.isDown,
            up: this.cursors.up.isDown || this.wasd.up.isDown,
            down: this.cursors.down.isDown || this.wasd.down.isDown
        };

        // PUSH input (replaces attack)
        if (Phaser.Input.Keyboard.JustDown(this.pushKey)) {
            this.player.push(this.enemies, this.pushableObjects);
        }

        // Update player
        this.player.update(input, delta);

        // Update systems
        this.intentionEngine.update(delta);
        this.kannaSystem.update(time, delta);

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health > 0) {
                enemy.update(this.player, delta);
                return true;
            }
            return false;
        });

        // UI
        const healthBar = '█'.repeat(Math.floor(this.player.health / 5)) +
                         '░'.repeat(Math.floor((this.player.maxHealth - this.player.health) / 5));
        this.uiText.setText([
            `HP: ${healthBar} ${this.player.health}/${this.player.maxHealth}`,
            `Kanna: ${this.kannaSystem.getDiscoveredKannaCount()}`,
            `SPACE: PUSH | L: Library | D: Debug`,
            `SLAVE CLASS: Fast & Nimble`
        ]);

        // Debug
        if (this.showDebug) {
            const dominant = this.intentionEngine.getDominantMotivation();
            this.debugText.setText([
                `=== COLISEUM (SLAVE CLASS) ===`,
                `Position: ${Math.floor(this.player.sprite.x)}, ${Math.floor(this.player.sprite.y)}`,
                `Enemies: ${this.enemies.length}`,
                `Pushables: ${this.pushableObjects.length}`,
                '',
                `Intention: ${dominant.motivation.toUpperCase()}`,
                `Aggression: ${Math.floor(this.intentionEngine.motivations.aggression)}`
            ]);
        }
    }
}
