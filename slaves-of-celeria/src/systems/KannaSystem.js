import Phaser from 'phaser';

/**
 * Kanna System - Spawns and manages Kanna symbols based on player behavior
 * Symbols appear on walls when certain motivations are expressed
 */
export default class KannaSystem {
    constructor(scene, intentionEngine) {
        this.scene = scene;
        this.intentionEngine = intentionEngine;

        // Active Kanna symbols in the world
        this.activeSymbols = [];

        // Kanna definitions
        this.kannaTypes = {
            aggression: {
                id: 'aggression',
                symbol: '🔥',
                color: 0xff4400,
                threshold: 65,
                description: 'Kanna of Burning Will'
            },
            reverence: {
                id: 'reverence',
                symbol: '🌀',
                color: 0x4488ff,
                threshold: 65,
                description: 'Kanna of Patient Spiral'
            },
            curiosity: {
                id: 'curiosity',
                symbol: '👁',
                color: 0xffcc00,
                threshold: 60,
                description: 'Kanna of Seeking Eye'
            },
            fear: {
                id: 'fear',
                symbol: '🕸',
                color: 0x666666,
                threshold: 65,
                description: 'Kanna of Retreating Web'
            },
            greed: {
                id: 'greed',
                symbol: '💀',
                color: 0xaa00aa,
                threshold: 65,
                description: 'Kanna of Hollow Hunger'
            },
            pride: {
                id: 'pride',
                symbol: '⚜️',
                color: 0xffdd44,
                threshold: 70,
                description: 'Kanna of Unbroken Chain'
            }
        };

        // Spawn locations (walls where symbols can appear)
        this.spawnLocations = [];
        this.nextSpawnCheck = 0;
        this.spawnCheckInterval = 5000; // Check every 5 seconds

        // Player's discovered Kanna
        this.discoveredKanna = new Set();
    }

    // Register a wall location where Kanna can spawn
    registerSpawnLocation(x, y) {
        this.spawnLocations.push({ x, y, occupied: false });
    }

    update(time, delta) {
        // Periodically check if new Kanna should spawn
        if (time > this.nextSpawnCheck) {
            this.checkForNewKanna();
            this.nextSpawnCheck = time + this.spawnCheckInterval;
        }

        // Update existing symbols (pulse animation)
        this.activeSymbols.forEach(symbol => {
            if (symbol.graphics) {
                const pulse = Math.sin(time * 0.003) * 0.2 + 1;
                symbol.graphics.setScale(pulse);
            }
        });
    }

    checkForNewKanna() {
        const activeMotivations = this.intentionEngine.getActiveMotivations(60);

        activeMotivations.forEach(motivation => {
            const kanna = this.kannaTypes[motivation];
            if (!kanna) return;

            // Check if this Kanna type is already spawned
            const alreadySpawned = this.activeSymbols.some(s => s.kannaId === kanna.id);
            if (alreadySpawned) return;

            // Check threshold
            if (this.intentionEngine.motivations[motivation] >= kanna.threshold) {
                this.spawnKanna(kanna);
            }
        });
    }

    spawnKanna(kanna) {
        // Find available spawn location
        const availableLocations = this.spawnLocations.filter(loc => !loc.occupied);
        if (availableLocations.length === 0) {
            // Generate a new location near player
            const player = this.scene.player;
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(200, 400);
            const x = player.sprite.x + Math.cos(angle) * distance;
            const y = player.sprite.y + Math.sin(angle) * distance;
            this.registerSpawnLocation(x, y);
            availableLocations.push(this.spawnLocations[this.spawnLocations.length - 1]);
        }

        const location = Phaser.Utils.Array.GetRandom(availableLocations);
        location.occupied = true;

        // Create visual representation
        const graphics = this.scene.add.graphics();

        // Draw glow
        graphics.fillStyle(kanna.color, 0.2);
        graphics.fillCircle(location.x, location.y, 40);

        // Draw symbol background
        graphics.fillStyle(kanna.color, 0.6);
        graphics.fillCircle(location.x, location.y, 30);

        // Draw border
        graphics.lineStyle(2, kanna.color, 1);
        graphics.strokeCircle(location.x, location.y, 30);

        // Add text symbol
        const text = this.scene.add.text(location.x, location.y, kanna.symbol, {
            fontSize: '32px',
            color: '#ffffff'
        });
        text.setOrigin(0.5, 0.5);

        // Create interaction zone
        const zone = this.scene.add.zone(location.x, location.y, 60, 60);
        this.scene.physics.add.existing(zone);

        const symbol = {
            kannaId: kanna.id,
            graphics,
            text,
            zone,
            location,
            discovered: false
        };

        this.activeSymbols.push(symbol);

        // Setup overlap detection
        this.scene.physics.add.overlap(
            this.scene.player.sprite,
            zone,
            () => this.discoverKanna(symbol, kanna)
        );

        console.log(`[Kanna] Spawned: ${kanna.description} at ${location.x}, ${location.y}`);
    }

    discoverKanna(symbol, kanna) {
        if (symbol.discovered) return;

        symbol.discovered = true;
        this.discoveredKanna.add(kanna.id);

        // Player learns the Kanna
        if (this.scene.player.learnKanna(kanna.id)) {
            // Visual feedback
            this.scene.tweens.add({
                targets: [symbol.graphics, symbol.text],
                scale: 1.5,
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    symbol.graphics.destroy();
                    symbol.text.destroy();
                    symbol.zone.destroy();
                    symbol.location.occupied = false;
                }
            });

            // Show notification
            this.showKannaNotification(kanna);
        }
    }

    showKannaNotification(kanna) {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        const notificationText = this.scene.add.text(
            centerX,
            centerY - 100,
            `KANNA DISCOVERED\n\n${kanna.symbol} ${kanna.description}`,
            {
                fontSize: '20px',
                color: '#' + kanna.color.toString(16).padStart(6, '0'),
                align: 'center',
                backgroundColor: '#000000cc',
                padding: { x: 20, y: 10 }
            }
        );
        notificationText.setOrigin(0.5, 0.5);
        notificationText.setScrollFactor(0);
        notificationText.setDepth(1000);
        notificationText.setAlpha(0);

        // Fade in and out
        this.scene.tweens.add({
            targets: notificationText,
            alpha: 1,
            duration: 300,
            yoyo: true,
            hold: 2000,
            onComplete: () => {
                notificationText.destroy();
            }
        });

        console.log(`[Kanna] Player discovered: ${kanna.description}`);
    }

    getDiscoveredKannaCount() {
        return this.discoveredKanna.size;
    }

    hasDiscoveredKanna(kannaId) {
        return this.discoveredKanna.has(kannaId);
    }

    destroy() {
        this.activeSymbols.forEach(symbol => {
            if (symbol.graphics) symbol.graphics.destroy();
            if (symbol.text) symbol.text.destroy();
            if (symbol.zone) symbol.zone.destroy();
        });
        this.activeSymbols = [];
    }
}
