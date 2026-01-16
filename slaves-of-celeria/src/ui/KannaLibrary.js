import Phaser from 'phaser';

/**
 * Kanna Library - UI for combining discovered Kanna to unlock knowledge
 * Inspired by the "Archivist's Aperture" concept
 */
export default class KannaLibrary {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;

        // Container for all UI elements
        this.container = null;

        // Kanna slots (for combining)
        this.slots = [];
        this.maxSlots = 3;
        this.selectedKanna = []; // Currently selected Kanna in slots

        // Known combinations and their outputs
        this.knownCombinations = this.initializeCombinations();

        // Visual elements
        this.background = null;
        this.titleText = null;
        this.inventoryPanel = null;
        this.slotPanel = null;
        this.outputText = null;
    }

    initializeCombinations() {
        // Define Kanna combinations and their outputs
        return {
            // Single Kanna observations
            'aggression': {
                output: 'FIRE speaks of direct action. The path of the blade.',
                type: 'observation'
            },
            'reverence': {
                output: 'SPIRAL teaches patience. All things return.',
                type: 'observation'
            },
            'curiosity': {
                output: 'EYE seeks truth. Look closer.',
                type: 'observation'
            },

            // Two Kanna combinations
            'aggression+reverence': {
                output: 'Fire tempered by spiral. Controlled destruction. Strike when the moment arrives.',
                type: 'wisdom'
            },
            'curiosity+fear': {
                output: 'To seek while afraid is courage. The web protects those who understand it.',
                type: 'wisdom'
            },
            'greed+pride': {
                output: 'Hollow hunger meets unbroken chain. The spider lords fell to this.',
                type: 'warning'
            },

            // Three Kanna sequences (puzzles)
            'curiosity+reverence+aggression': {
                output: 'TRUTH DESCENDS EMPTY. Observe the pattern. Wait. Then strike the core.',
                type: 'puzzle_solution',
                unlocks: 'archivist_weakness'
            },
            'fear+reverence+curiosity': {
                output: 'The web catches those who flee. Stand still. Watch. Learn its rhythm.',
                type: 'puzzle_solution',
                unlocks: 'web_navigation'
            },
            'aggression+aggression+aggression': {
                output: 'Reckless. The flames will consume you. There is no wisdom here.',
                type: 'warning'
            },
            'reverence+reverence+reverence': {
                output: 'Stillness becomes stagnation. Even spirals must move forward.',
                type: 'warning'
            }
        };
    }

    create() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // Create container (hidden by default)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(500);
        this.container.setVisible(false);

        // Dark overlay background
        this.background = this.scene.add.rectangle(
            width / 2, height / 2,
            width, height,
            0x000000, 0.9
        );
        this.container.add(this.background);

        // Title
        this.titleText = this.scene.add.text(
            width / 2, 40,
            'KANNA LIBRARY',
            {
                fontSize: '28px',
                fontFamily: 'monospace',
                color: '#c3a464',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        this.titleText.setOrigin(0.5, 0);
        this.container.add(this.titleText);

        // Instructions
        const instructions = this.scene.add.text(
            width / 2, 80,
            'Select up to 3 Kanna to combine. Press L to close.',
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffffff',
                alpha: 0.8
            }
        );
        instructions.setOrigin(0.5, 0);
        this.container.add(instructions);

        // Create inventory display (discovered Kanna)
        this.createInventoryPanel(width, height);

        // Create combination slots
        this.createSlotPanel(width, height);

        // Create output display
        this.createOutputPanel(width, height);

        // Add close instruction at bottom
        const closeText = this.scene.add.text(
            width / 2, height - 30,
            'Press ESC or L to close',
            {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#888888'
            }
        );
        closeText.setOrigin(0.5, 0);
        this.container.add(closeText);
    }

    createInventoryPanel(width, height) {
        const panelX = width / 2;
        const panelY = 140;
        const panelWidth = width - 100;
        const panelHeight = 180;

        // Panel background
        const panel = this.scene.add.rectangle(
            panelX, panelY,
            panelWidth, panelHeight,
            0x1d1a16, 0.8
        );
        panel.setStrokeStyle(2, 0xc3a464);
        this.container.add(panel);

        // Label
        const label = this.scene.add.text(
            panelX, panelY - panelHeight / 2 + 15,
            'DISCOVERED KANNA',
            {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#c3a464'
            }
        );
        label.setOrigin(0.5, 0);
        this.container.add(label);

        this.inventoryPanel = { panel, x: panelX, y: panelY + 30, width: panelWidth };
    }

    createSlotPanel(width, height) {
        const panelX = width / 2;
        const panelY = 360;

        // Label
        const label = this.scene.add.text(
            panelX, panelY - 30,
            'COMBINATION SEQUENCE',
            {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#c3a464'
            }
        );
        label.setOrigin(0.5, 0);
        this.container.add(label);

        // Create slots
        const slotSpacing = 100;
        const startX = panelX - (slotSpacing * (this.maxSlots - 1)) / 2;

        for (let i = 0; i < this.maxSlots; i++) {
            const x = startX + i * slotSpacing;
            const y = panelY;

            // Slot background
            const slot = this.scene.add.rectangle(x, y, 80, 80, 0x2e3b2f);
            slot.setStrokeStyle(2, 0x6a3d25);
            this.container.add(slot);

            // Slot number
            const num = this.scene.add.text(x, y + 50, (i + 1).toString(), {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#666666'
            });
            num.setOrigin(0.5, 0);
            this.container.add(num);

            // Arrow between slots
            if (i < this.maxSlots - 1) {
                const arrow = this.scene.add.text(
                    x + slotSpacing / 2, y,
                    '→',
                    {
                        fontSize: '24px',
                        color: '#c3a464'
                    }
                );
                arrow.setOrigin(0.5, 0.5);
                this.container.add(arrow);
            }

            this.slots.push({ x, y, kannaId: null, sprite: null, slot });
        }

        // Clear button
        const clearBtn = this.createButton(
            panelX, panelY + 70,
            'CLEAR',
            () => this.clearSlots()
        );
        this.container.add(clearBtn);

        // Submit button
        const submitBtn = this.createButton(
            panelX + 100, panelY + 70,
            'COMBINE',
            () => this.submitCombination()
        );
        this.container.add(submitBtn);
    }

    createOutputPanel(width, height) {
        const panelX = width / 2;
        const panelY = 480;
        const panelWidth = width - 100;
        const panelHeight = 100;

        // Panel background
        const panel = this.scene.add.rectangle(
            panelX, panelY,
            panelWidth, panelHeight,
            0x1d1a16, 0.8
        );
        panel.setStrokeStyle(2, 0xc3a464);
        this.container.add(panel);

        // Output text
        this.outputText = this.scene.add.text(
            panelX, panelY,
            'Select Kanna to begin...',
            {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: panelWidth - 40 }
            }
        );
        this.outputText.setOrigin(0.5, 0.5);
        this.container.add(this.outputText);
    }

    createButton(x, y, text, callback) {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.rectangle(0, 0, 80, 30, 0x6a3d25);
        bg.setStrokeStyle(2, 0xc3a464);
        bg.setInteractive({ useHandCursor: true });

        const label = this.scene.add.text(0, 0, text, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        label.setOrigin(0.5, 0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x8a5d35));
        bg.on('pointerout', () => bg.setFillStyle(0x6a3d25));
        bg.on('pointerdown', callback);

        container.add([bg, label]);
        return container;
    }

    open(player) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.container.setVisible(true);

        // Refresh inventory display
        this.refreshInventory(player);

        // Clear previous combination
        this.clearSlots();
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.container.setVisible(false);
    }

    toggle(player) {
        if (this.isOpen) {
            this.close();
        } else {
            this.open(player);
        }
    }

    refreshInventory(player) {
        // Clear existing inventory display
        this.container.each(child => {
            if (child.getData && child.getData('inventory_item')) {
                child.destroy();
            }
        });

        // Display discovered Kanna
        const discovered = Array.from(player.knownKanna);
        const startX = this.inventoryPanel.x - (discovered.length * 70) / 2 + 35;
        const y = this.inventoryPanel.y;

        discovered.forEach((kannaId, index) => {
            const x = startX + index * 70;
            this.createInventoryKanna(x, y, kannaId);
        });

        if (discovered.length === 0) {
            const emptyText = this.scene.add.text(
                this.inventoryPanel.x, y,
                'No Kanna discovered yet.\nExplore and observe to find them.',
                {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#666666',
                    align: 'center'
                }
            );
            emptyText.setOrigin(0.5, 0.5);
            emptyText.setData('inventory_item', true);
            this.container.add(emptyText);
        }
    }

    createInventoryKanna(x, y, kannaId) {
        const kanna = this.scene.kannaSystem.kannaTypes[kannaId];
        if (!kanna) return;

        // Background
        const bg = this.scene.add.rectangle(x, y, 60, 60, kanna.color, 0.3);
        bg.setStrokeStyle(2, kanna.color);
        bg.setInteractive({ useHandCursor: true });
        bg.setData('inventory_item', true);

        // Symbol
        const symbol = this.scene.add.text(x, y - 5, kanna.symbol, {
            fontSize: '28px'
        });
        symbol.setOrigin(0.5, 0.5);
        symbol.setData('inventory_item', true);

        // Label
        const label = this.scene.add.text(x, y + 30, kannaId.toUpperCase().substring(0, 4), {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        label.setOrigin(0.5, 0);
        label.setData('inventory_item', true);

        // Click to add to slot
        bg.on('pointerdown', () => this.addKannaToSlot(kannaId, kanna));
        bg.on('pointerover', () => bg.setFillStyle(kanna.color, 0.6));
        bg.on('pointerout', () => bg.setFillStyle(kanna.color, 0.3));

        this.container.add([bg, symbol, label]);
    }

    addKannaToSlot(kannaId, kanna) {
        // Find first empty slot
        const emptySlot = this.slots.find(s => s.kannaId === null);
        if (!emptySlot) {
            this.outputText.setText('All slots filled. Clear or submit combination.');
            return;
        }

        emptySlot.kannaId = kannaId;

        // Visual representation in slot
        const symbol = this.scene.add.text(emptySlot.x, emptySlot.y, kanna.symbol, {
            fontSize: '32px'
        });
        symbol.setOrigin(0.5, 0.5);
        emptySlot.sprite = symbol;
        emptySlot.slot.setFillStyle(kanna.color, 0.3);
        this.container.add(symbol);

        this.outputText.setText(`Added ${kanna.description}`);
    }

    clearSlots() {
        this.slots.forEach(slot => {
            if (slot.sprite) {
                slot.sprite.destroy();
                slot.sprite = null;
            }
            slot.kannaId = null;
            slot.slot.setFillStyle(0x2e3b2f);
        });

        this.selectedKanna = [];
        this.outputText.setText('Slots cleared. Select Kanna to begin...');
    }

    submitCombination() {
        const sequence = this.slots
            .filter(s => s.kannaId !== null)
            .map(s => s.kannaId);

        if (sequence.length === 0) {
            this.outputText.setText('No Kanna selected.');
            return;
        }

        // Check for matching combination
        const key = sequence.join('+');
        const result = this.knownCombinations[key];

        if (result) {
            this.outputText.setText(result.output);
            this.outputText.setColor(this.getColorForType(result.type));

            // Handle unlocks
            if (result.unlocks) {
                console.log(`[Kanna Library] Unlocked: ${result.unlocks}`);
                // TODO: Trigger unlock in game world
            }
        } else {
            this.outputText.setText('These Kanna do not resonate together. Try a different combination.');
            this.outputText.setColor('#888888');
        }
    }

    getColorForType(type) {
        switch (type) {
            case 'observation': return '#ffffff';
            case 'wisdom': return '#c3a464';
            case 'puzzle_solution': return '#00ff00';
            case 'warning': return '#ff4444';
            default: return '#ffffff';
        }
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
