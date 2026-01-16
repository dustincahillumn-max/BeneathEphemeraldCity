# Asset Setup Instructions

## How to Add Your Sprite Sheets

### Step 1: Save Your Sprite Sheet Images

Save these images from your sprite sheets to the appropriate folders:

#### `/public/assets/sprites/`
- `slave-knight-sheet.png` - The full sprite sheet with Slave → Knight progression
- `npc-interactions.png` - Caged creatures, demons, guards, familiars
- `enemies-ghosts.png` - Ethereal ghost enemies
- `enemies-guards.png` - Banished guard enemies

#### `/public/assets/tiles/`
- `dungeon-environment.png` - 32x32 dungeon tiles (walls, floors, doors)
- `secret-passages.png` - Hidden door overlays

#### `/public/assets/fx/`
- `chain-system.png` - Chain visual effects for PUSH mechanic
- `kanna-sigils.png` - Wall sigils and Kanna symbols (16x16)
- `fx-sparks.png` - Particle effects

#### `/public/assets/ui/`
- `collar-keys.png` - Collar system UI elements (16x16)

### Step 2: Run the Game

Once you've added the images:
```cmd
npm run dev
```

The game will automatically load the real sprites instead of placeholder shapes!

### Current Sprite Mapping

The code expects these sprite locations in your sheets:

**Slave Player (32x32):**
- Idle: Row 1, Frame 0
- Walk: Row 1, Frames 1-4
- Push (SPACE): Row 2, Frame 0

**Spider Enemies (32x32):**
- Will use the spider sprites from your enemy sheets

**Dungeon Tiles (32x32):**
- Stone walls, floors, cages, doors from environment sheet
