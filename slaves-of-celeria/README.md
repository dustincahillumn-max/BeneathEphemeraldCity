# Uncasted 2: Slaves of Celeria

**Action Adventure** | Zelda meets Pikmin meets Lemmings meets Vagrant Story
_Rise from lowly homunculus to Lord of Chains in the golden age of the spider civilization_

## Current Status: Alpha v0.1

This is the HTML5/Phaser 3 implementation of the first playable game in the Twisekelion trilogy.

### What's Implemented

- ✅ Basic Phaser 3 scaffold with Vite build system
- ✅ Player character with 8-directional movement
- ✅ Simple dungeon environment with walls and collision
- ✅ Camera following system
- ✅ Spider web decorative motifs
- ✅ Placeholder player entity class (ready for expansion)

### What's Next

- [ ] Kanna Library System (symbol discovery and combination)
- [ ] Chain weapon mechanics (grappling, binding, swinging)
- [ ] Homunculus command system (Pikmin-like unit control)
- [ ] Enemy AI and combat
- [ ] Room/dungeon generation
- [ ] Limb-targeting combat (Vagrant Story influence)
- [ ] Tile-based map system with Tiled integration
- [ ] Sprite art and animations
- [ ] Audio system

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Controls

- **WASD** or **Arrow Keys**: Move
- More controls coming as features are implemented

### Build for Production

```bash
npm run build
npm run preview
```

## Architecture

```
slaves-of-celeria/
├── src/
│   ├── main.js              # Game config and initialization
│   ├── scenes/
│   │   ├── PreloadScene.js  # Asset loading
│   │   └── GameScene.js     # Main gameplay scene
│   ├── entities/
│   │   └── Player.js        # Player character logic
│   └── systems/             # (future: Kanna, combat, AI)
├── assets/
│   ├── sprites/             # Character and object graphics
│   ├── tilemaps/            # Tiled map files
│   └── audio/               # Music and SFX
└── public/                  # Static assets
```

## Design Philosophy

- **Subtlety over exposition**: Discover the spider empire through play, not text dumps
- **Ritual as interface**: Tools aren't usable until you understand their Kanna
- **Emergent oppression**: Beauty through systematic cruelty
- **Economic trade-offs**: Every choice has weight

## Lore Context

Set during the apex of Celeria, the spider civilization that will eventually become myth by the time of _Beneath the Ephemerald City_. You are a homunculus—expendable, instrumental, and strangely sacred—navigating the Great Web of fate, chain, and Kanna.

---

_Part of the Chained Assemblage: Twisekelion project_
