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

        // COMPOSITE SPRITE SHEETS (use your images as-is!)
        // Just save your composite images directly - no need to split them up

        // Sheet 1: Characters & NPCs (Slave, Knight, NPCs, Collar system, Familiars)
        this.load.image('sheet_characters', 'assets/sprites/sheet1-characters-npcs.png');

        // Sheet 2: Dungeon & Enemies (Environment tiles, Guards, Ghosts, Levers)
        this.load.image('sheet_dungeon', 'assets/sprites/sheet2-dungeon-enemies.png');

        // Sheet 3: Systems & FX (Kanna sigils, Chains, Cultists, Demons)
        this.load.image('sheet_systems', 'assets/sprites/sheet3-systems-fx.png');
    }

    create() {
        // Extract sprite regions from composite sheets
        this.extractSpriteRegions();

        this.scene.start('ColiseumScene');
    }

    extractSpriteRegions() {
        // Only extract if the composite sheets loaded
        if (!this.textures.exists('sheet_characters')) {
            console.log('Composite sheets not found - using procedural graphics');
            return;
        }

        // SHEET 1: CHARACTERS & NPCs
        // Extract Slave protagonist sprites (top-left, 32x32 each)
        // Based on your sprite sheet: Idle, Walking, Beating, Feinting, Rotunities
        if (this.textures.exists('sheet_characters')) {
            const charSheet = this.textures.get('sheet_characters');

            // Slave Idle (first frame at 0,0)
            charSheet.add('slave_idle', 0, 0, 0, 32, 32);

            // Slave Walk frames (frames 1-4)
            charSheet.add('slave_walk_0', 0, 32, 0, 32, 32);  // frame 1
            charSheet.add('slave_walk_1', 0, 64, 0, 32, 32);  // frame 2
            charSheet.add('slave_walk_2', 0, 96, 0, 32, 32);  // frame 3
            charSheet.add('slave_walk_3', 0, 128, 0, 32, 32); // frame 4

            // Slave Push (row 2, first frame)
            charSheet.add('slave_push', 0, 0, 32, 32, 32);

            // Create a sprite sheet texture for easier animation
            this.textures.addSpriteSheet('slave_spritesheet',
                charSheet.source[0].image,
                { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 14 }
            );
        }

        // SHEET 2: DUNGEON & ENEMIES
        if (this.textures.exists('sheet_dungeon')) {
            const dungeonSheet = this.textures.get('sheet_dungeon');

            // Dungeon tiles (32x32 grid)
            // We'll extract these as needed for walls, floors, doors
            this.textures.addSpriteSheet('dungeon_tiles',
                dungeonSheet.source[0].image,
                { frameWidth: 32, frameHeight: 32 }
            );

            // Enemy sprites (will extract specific ones later)
            this.textures.addSpriteSheet('enemies_guards',
                dungeonSheet.source[0].image,
                { frameWidth: 32, frameHeight: 32 }
            );
        }

        // SHEET 3: SYSTEMS & FX
        if (this.textures.exists('sheet_systems')) {
            const systemsSheet = this.textures.get('sheet_systems');

            // Kanna sigils (16x16)
            // Will extract specific sigil positions as needed

            // Chain system (various sizes)
            // Will extract chain segments dynamically
        }

        console.log('Sprite regions extracted from composite sheets!');
    }
}
