import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x1d1a16, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#c3a464'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xc3a464, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load sprite sheets (will fallback to procedural if missing)
        // Set error handling to not crash if files missing
        this.load.on('loaderror', (file) => {
            console.log('Asset not found (using placeholder):', file.key);
        });

        // SLAVE → KNIGHT PROTAGONIST (32x32 sprites)
        this.load.spritesheet('slave_spritesheet', 'assets/sprites/slave-knight-sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // ENEMIES (32x32)
        this.load.spritesheet('enemies_guards', 'assets/sprites/enemies-guards.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('enemies_ghosts', 'assets/sprites/enemies-ghosts.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // DUNGEON ENVIRONMENT (32x32 tiles)
        this.load.spritesheet('dungeon_tiles', 'assets/tiles/dungeon-environment.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // NPC INTERACTIONS (32x32)
        this.load.spritesheet('npc_interactions', 'assets/sprites/npc-interactions.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // CHAIN SYSTEM FX
        this.load.spritesheet('chain_fx', 'assets/fx/chain-system.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // KANNA SIGILS (16x16)
        this.load.spritesheet('kanna_sigils', 'assets/fx/kanna-sigils.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // COLLAR & KEYS (16x16)
        this.load.spritesheet('collar_keys', 'assets/ui/collar-keys.png', {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create() {
        this.scene.start('ColiseumScene');
    }
}
