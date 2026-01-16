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
 *
 * LEVEL DESIGN PRINCIPLES APPLIED (from leveldesignbook.com):
 * 1. LANDMARKS - Giant egg monument (spawn), Spider throne (goal), Egg pile corners
 * 2. PACING ZONES - Safe spawn (calm), Chase corridors (action), Puzzle chambers (thinking)
 * 3. SIGHT LINES - Framed view of throne, torch lights guide paths
 * 4. VISUAL HIERARCHY - Color zones (bright=safe, dark=puzzle), animated guides
 * 5. SPATIAL FLOW - Clear primary path with narrow slave-only shortcuts
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

        // Create walls group
        this.walls = this.physics.add.staticGroup();

        // LEVEL DESIGN PRINCIPLE: Pacing Zones with Visual Hierarchy
        this.createPacingZones();

        // LEVEL DESIGN PRINCIPLE: Landmarks for Orientation
        this.createLandmarks();

        // LEVEL DESIGN PRINCIPLE: Spatial Flow with Clear Paths
        this.createSpatialFlow();

        // Decorative elements (egg shells, debris)
        this.createEggShells();
    }

    createPacingZones() {
        // ZONE 1: SAFE SPAWN (Bright, calm - 1000x1000 center)
        const safeZone = this.add.rectangle(1200, 900, 400, 400, 0x4d3f2f, 0.3);
        safeZone.setDepth(0);

        // ZONE 2: CHASE CORRIDORS (Medium, action - 600px wide corridors)
        const chaseZone1 = this.add.rectangle(500, 600, 600, 400, 0x3d2f1f, 0.5);
        const chaseZone2 = this.add.rectangle(1900, 600, 600, 400, 0x3d2f1f, 0.5);
        chaseZone1.setDepth(0);
        chaseZone2.setDepth(0);

        // ZONE 3: PUZZLE CHAMBERS (Dark, thinking)
        const puzzleZone1 = this.add.rectangle(500, 1400, 600, 300, 0x2d1f0f, 0.7);
        const puzzleZone2 = this.add.rectangle(1900, 1400, 600, 300, 0x2d1f0f, 0.7);
        puzzleZone1.setDepth(0);
        puzzleZone2.setDepth(0);

        // Add subtle grid pattern to floor
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0x2d1f0f, 0.2);
        for (let x = 0; x < 2400; x += 32) {
            gridGraphics.lineBetween(x, 0, x, 1800);
        }
        for (let y = 0; y < 1800; y += 32) {
            gridGraphics.lineBetween(0, y, 2400, y);
        }
    }

    createLandmarks() {
        // LANDMARK 1: Giant Egg Monument (spawn point) - MASSIVE and visible
        const eggX = 1200;
        const eggY = 900;

        // Outer egg shell (cracked, massive)
        const outerShell = this.add.ellipse(eggX, eggY, 140, 180, 0xf0e6d0, 0.8);
        outerShell.setStrokeStyle(6, 0xc0b6a0);
        outerShell.setDepth(1);

        // Crack pattern
        const crackGraphics = this.add.graphics();
        crackGraphics.lineStyle(4, 0xa09080, 1);
        crackGraphics.beginPath();
        crackGraphics.moveTo(eggX - 40, eggY - 60);
        crackGraphics.lineTo(eggX - 20, eggY);
        crackGraphics.lineTo(eggX - 50, eggY + 40);
        crackGraphics.moveTo(eggX + 40, eggY - 40);
        crackGraphics.lineTo(eggX + 30, eggY + 20);
        crackGraphics.strokePath();
        crackGraphics.setDepth(2);

        // Glowing interior (life energy)
        const glow = this.add.circle(eggX, eggY, 50, 0xffd700, 0.3);
        glow.setDepth(0);
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.2, to: 0.4 },
            scale: { from: 1, to: 1.1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // LANDMARK 2: Spider Throne (North - distant goal)
        const throneX = 1200;
        const throneY = 200;

        // Throne base
        const throne = this.add.rectangle(throneX, throneY, 120, 80, 0x4a2d15);
        throne.setDepth(1);

        // Spider statue on throne
        const spiderStatue = this.add.circle(throneX, throneY - 30, 35, 0x6a3d25);
        spiderStatue.setDepth(1);

        // Spider legs (decorative)
        const legGraphics = this.add.graphics();
        legGraphics.lineStyle(4, 0x4a2d15, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            legGraphics.lineBetween(
                throneX + Math.cos(angle) * 20,
                throneY - 30 + Math.sin(angle) * 20,
                throneX + Math.cos(angle) * 45,
                throneY - 30 + Math.sin(angle) * 45
            );
        }
        legGraphics.setDepth(1);

        // LANDMARK 3: Broken Egg Piles (corners - exploration rewards)
        this.createEggPileLandmark(300, 300);
        this.createEggPileLandmark(2100, 300);
        this.createEggPileLandmark(300, 1500);
        this.createEggPileLandmark(2100, 1500);

        // VISUAL GUIDES: Torches lighting the way
        this.createTorchLight(800, 900);  // Guide west
        this.createTorchLight(1600, 900); // Guide east
        this.createTorchLight(1200, 500); // Guide north to throne
    }

    createEggPileLandmark(x, y) {
        // Pile of broken eggs
        for (let i = 0; i < 5; i++) {
            const offsetX = Phaser.Math.Between(-30, 30);
            const offsetY = Phaser.Math.Between(-30, 30);
            const eggPiece = this.add.ellipse(
                x + offsetX,
                y + offsetY,
                30 + i * 5,
                40 + i * 5,
                0xf0e6d0,
                0.5
            );
            eggPiece.setStrokeStyle(2, 0xd0c6b0);
            eggPiece.setDepth(1);
        }
    }

    createTorchLight(x, y) {
        // Torch base
        const torch = this.add.rectangle(x, y, 12, 40, 0x4a2d15);
        torch.setDepth(1);

        // Flame
        const flame = this.add.circle(x, y - 25, 15, 0xff6600, 0.6);
        flame.setDepth(2);

        // Glow effect
        const torchGlow = this.add.circle(x, y - 25, 60, 0xff8800, 0.15);
        torchGlow.setDepth(0);

        // Animate flame
        this.tweens.add({
            targets: [flame, torchGlow],
            alpha: { from: 0.4, to: 0.7 },
            scaleX: { from: 0.9, to: 1.1 },
            scaleY: { from: 1.1, to: 0.9 },
            duration: 800 + Math.random() * 400,
            yoyo: true,
            repeat: -1
        });
    }

    createSpatialFlow() {
        // OPEN COLISEUM ARENA - Not a cramped maze!

        // Outer arena walls only (create open space)
        this.createWall(0, 0, 2400, 20); // top
        this.createWall(0, 1780, 2400, 20); // bottom
        this.createWall(0, 0, 20, 1800); // left
        this.createWall(2380, 0, 20, 1800); // right

        // Just a FEW strategic obstacles (not full mazes)
        // Broken pillars scattered around (provide cover, not walls)
        this.createPillar(400, 400);
        this.createPillar(2000, 400);
        this.createPillar(400, 1400);
        this.createPillar(2000, 1400);
        this.createPillar(600, 900);
        this.createPillar(1800, 900);

        // Central raised platform (where egg is)
        this.createWall(1000, 800, 400, 20); // top
        this.createWall(1000, 1000, 400, 20); // bottom
        this.createWall(1000, 800, 20, 200); // left
        this.createWall(1380, 800, 20, 200); // right

        // 4 narrow passages through central platform (slave can squeeze, knight cannot)
        this.createNarrowPassage(1190, 800, 18, 40, 'vertical'); // North
        this.createNarrowPassage(1190, 980, 18, 40, 'vertical'); // South
        this.createNarrowPassage(1000, 890, 40, 18, 'horizontal'); // West
        this.createNarrowPassage(1360, 890, 40, 18, 'horizontal'); // East

        // That's it! Rest is OPEN ARENA for push mechanics
    }

    createPillar(x, y) {
        // Broken circular pillar (provides cover but doesn't block)
        const pillar = this.add.circle(x, y, 40, 0x8a6d4a);
        pillar.setStrokeStyle(4, 0x6a4d2a);
        this.physics.add.existing(pillar, true);
        this.walls.add(pillar);
        pillar.setDepth(1);
    }

    createWall(x, y, width, height, color = 0x6a3d25) {
        const wall = this.add.rectangle(x, y, width, height, color);
        wall.setOrigin(0, 0);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
    }

    createNarrowPassage(x, y, width, height, orientation) {
        // VISUAL GUIDE: Highlight narrow passages with color
        const passage = this.add.rectangle(x, y, width, height, 0x8a5d35, 0.6);
        passage.setOrigin(0, 0);
        passage.setDepth(1);

        // Glowing border effect (guides player attention)
        const borderColor = 0xc3a464;
        if (orientation === 'vertical') {
            this.add.rectangle(x - 2, y, 2, height, borderColor, 0.8).setOrigin(0, 0).setDepth(1);
            this.add.rectangle(x + width, y, 2, height, borderColor, 0.8).setOrigin(0, 0).setDepth(1);
        } else {
            this.add.rectangle(x, y - 2, width, 2, borderColor, 0.8).setOrigin(0, 0).setDepth(1);
            this.add.rectangle(x, y + height, width, 2, borderColor, 0.8).setOrigin(0, 0).setDepth(1);
        }

        // Animated arrow hint
        const arrowX = x + (orientation === 'vertical' ? width / 2 : width / 2);
        const arrowY = y + (orientation === 'vertical' ? height / 2 : height / 2);
        const arrow = this.add.text(arrowX, arrowY, '→', {
            fontSize: '16px',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2
        });
        arrow.setOrigin(0.5, 0.5);
        arrow.setDepth(2);
        if (orientation === 'vertical') {
            arrow.setRotation(Math.PI / 2);
        }

        // Pulse animation to draw attention
        this.tweens.add({
            targets: arrow,
            alpha: { from: 0.5, to: 1 },
            scale: { from: 0.9, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
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
        // Player spawns from the giant egg landmark (already created in createLandmarks)
        const eggX = 1200;
        const eggY = 900;

        // Player spawns here
        this.player = new Player(this, eggX, eggY);
        this.player.intentionEngine = this.intentionEngine;

        // Collision with walls
        this.physics.add.collider(this.player.sprite, this.walls);
    }

    createPuzzleObjects() {
        // PUZZLE ZONE: South chambers have pushable blocks
        // West puzzle chamber
        this.addPushableBlock(400, 1400);
        this.addPushableBlock(600, 1450);

        // East puzzle chamber
        this.addPushableBlock(1800, 1400);
        this.addPushableBlock(2000, 1450);

        // Chase corridors have fewer pushables (obstacles during chase)
        this.addPushableBlock(500, 700);
        this.addPushableBlock(1900, 700);

        // Egg shells (pushable debris) scattered in spawn zone
        this.addPushableObject(1100, 950, 'egg_shell');
        this.addPushableObject(1300, 950, 'egg_shell');
        this.addPushableObject(1200, 1050, 'egg_shell');
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
        // PACING: No enemies in safe spawn zone!
        // Enemies concentrate in CHASE CORRIDORS and near throne

        // West chase corridor (3 spiders)
        this.spawnChaser(500, 600);
        this.spawnChaser(500, 900);
        this.spawnChaser(500, 1100);

        // East chase corridor (3 spiders)
        this.spawnChaser(1900, 600);
        this.spawnChaser(1900, 900);
        this.spawnChaser(1900, 1100);

        // North path to throne (2 guards)
        this.spawnChaser(1050, 450);
        this.spawnChaser(1350, 450);

        // Puzzle chambers (1 each - lower threat)
        this.spawnChaser(500, 1400);
        this.spawnChaser(1900, 1400);
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
        // Kanna spawns at landmarks (rewards exploration)
        this.kannaSystem.registerSpawnLocation(300, 300);   // NW egg pile
        this.kannaSystem.registerSpawnLocation(2100, 300);  // NE egg pile
        this.kannaSystem.registerSpawnLocation(300, 1500);  // SW egg pile
        this.kannaSystem.registerSpawnLocation(2100, 1500); // SE egg pile
        this.kannaSystem.registerSpawnLocation(1200, 200);  // Spider throne
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
            const zone = this.getCurrentZone();
            this.debugText.setText([
                `=== COLISEUM (SLAVE CLASS) ===`,
                `Position: ${Math.floor(this.player.sprite.x)}, ${Math.floor(this.player.sprite.y)}`,
                `Zone: ${zone}`,
                `Enemies: ${this.enemies.length}`,
                `Pushables: ${this.pushableObjects.length}`,
                '',
                `Intention: ${dominant.motivation.toUpperCase()}`,
                `Aggression: ${Math.floor(this.intentionEngine.motivations.aggression)}`
            ]);
        }
    }

    getCurrentZone() {
        const x = this.player.sprite.x;
        const y = this.player.sprite.y;

        // Determine which pacing zone player is in
        if (x > 1000 && x < 1400 && y > 700 && y < 1100) {
            return 'SAFE SPAWN';
        } else if ((x > 200 && x < 800 && y > 400 && y < 1200) ||
                   (x > 1600 && x < 2200 && y > 400 && y < 1200)) {
            return 'CHASE CORRIDOR';
        } else if ((x > 200 && x < 800 && y > 1200 && y < 1600) ||
                   (x > 1600 && x < 2200 && y > 1200 && y < 1600)) {
            return 'PUZZLE CHAMBER';
        } else if (y < 400) {
            return 'THRONE APPROACH';
        } else {
            return 'TRANSITION';
        }
    }
    }
}
