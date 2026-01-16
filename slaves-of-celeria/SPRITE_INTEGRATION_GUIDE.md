# Sprite Sheet Integration Guide

## What's Been Done

I've integrated your **amazing pixel art sprites** into the game code! The system now:

✅ Loads sprite sheets automatically when you add them
✅ Falls back to placeholder graphics if sprites not found (so game always works)
✅ Plays proper animations (idle, walk, push) when real sprites loaded
✅ Supports all your sprite systems: player, enemies, dungeon tiles, FX, Kanna sigils

## How to Add Your Sprite Sheets

### Step 1: Save Individual Sprite Sheets

From the images you shared, save these as PNG files:

#### **Save to: `/public/assets/sprites/`**
1. **slave-knight-sheet.png** - The protagonist progression (Slave → Knight)
   - Contains: Idle, Walking, Beating, Feinting, Rotunities, Phannes, Controlling, Fkx, Possessed, Kickup sprites
   - 32x32 per sprite

2. **npc-interactions.png** - All the NPC sprites
   - Contains: Lynx, Owl, Doitens, Spectrol, Pick-Him, Feared, Lyne, Benon, Redun, Falis, Patack, Caged creatures, Demons, Guards, Captured familiars
   - 32x32 per sprite

3. **enemies-guards.png** - Banished Guards enemy types
   - Contains: Idle, Stagger Walk, Defeated, Unlit, Benayer Ghost, Attack, Flame, Bats, Flames
   - 32x32 per sprite

4. **enemies-ghosts.png** - Ethereal Ghost enemies
   - Contains: Idle, Chase, Faded ghost sprites
   - 32x32 per sprite

#### **Save to: `/public/assets/tiles/`**
5. **dungeon-environment.png** - All dungeon tiles
   - Contains: Stone walls, center tiles, arches, corners, engraved flake, platform edge, secret passages, unlv litup, stone patterns, fiery croce, chains on walls
   - 32x32 per tile

6. **secret-passages.png** - Hidden door overlays
   - Finron yer Door, Unlv litup, Stone Crater
   - 32x32

#### **Save to: `/public/assets/fx/`**
7. **chain-system.png** - Chain visual effects
   - Contains: Chain segments, whirl, floor, broom, attf, broken, archet
   - Various sizes (8x8, 16x16, 32x32)

8. **kanna-sigils.png** - Kanna wall sigils and symbols
   - Contains: Okau, Active, Sfentl, Spenv (chain symbols), Bind, acho, Feas, Ucimn
   - 16x16 per sigil

#### **Save to: `/public/assets/ui/`**
9. **collar-keys.png** - Collar system UI
   - Contains: Bomen Colar, Fonn Key, Fesh Kek, Fress Key, Bomen, Fairey, Brass log (collar status icons: Intact, Loosened, Broken)
   - 16x16 per icon

### Step 2: Extract from Your Images

Since you shared composite images, you'll need to extract individual sheets:

**Option A: Use Image Editor (Recommended)**
1. Open the composite image in **Paint.NET**, **GIMP**, or **Photoshop**
2. Use the **Rectangle Select Tool** to select each sprite sheet section
3. Copy and paste into a new image
4. Save as PNG with the filenames above

**Option B: I Can Help**
If you share the original separate sprite sheet files, I can help you organize them!

### Step 3: Test the Game

Once sprite sheets are in place:

```cmd
cd "C:\Users\dusti\OneDrive\Desktop\BeneathEphemeraldCity-main\slaves-of-celeria"
npm run dev
```

Open **http://localhost:5173/**

## What You'll See

### With Sprite Sheets:
- ✨ **Thin brown-wrapped Slave protagonist** from your sprite sheet
- 🏃 **Smooth walk animation** (4 frames)
- 💥 **Push animation** when you press SPACE
- 🕷️ **Proper spider enemies** from your sheets
- 🏰 **Dungeon tiles** instead of colored rectangles
- ⛓️ **Chain visual effects** on PUSH mechanic

### Without Sprite Sheets (Fallback):
- 🟡 **Gold procedural shapes** (current placeholder)
- ⚪ **Colored circles for enemies**
- 🟫 **Brown rectangles for walls**
- Still **fully playable**, just not pretty yet!

## Current Sprite Mapping

The code expects these frames from your sprite sheets:

### **Slave Player (slave_spritesheet)**
- **Frame 0**: Idle (standing still)
- **Frames 1-4**: Walk cycle (left, right, up, down)
- **Frame 10**: Push action (when pressing SPACE)

### **Spider Enemies (enemies_guards)**
- Will auto-select spider sprites from your guard sheet

### **Dungeon Tiles (dungeon_tiles)**
- Auto-loads stone walls, floors, cages from your environment sheet

## Next Steps After Sprites Loaded

Once your sprites are in the game, I can add:

1. **Chain Tool Visual** - Animate chains during PUSH
2. **Kanna Sigils on Walls** - Glowing symbols appear as you explore
3. **Caged Familiars** - Lynx, Owl, Demon in cages you can free
4. **Collar System** - Visual collar on player showing slave status
5. **Secret Passages** - Hidden doors with glow effects
6. **Lever Puzzles** - Push/pull mechanics with your lever sprites
7. **Ghost Enemies** - Ethereal spirits that phase through walls
8. **Knight Transformation** - Visual upgrade when progressing to Knight class

## Troubleshooting

**Problem**: Game shows placeholders even with sprites added
**Solution**: Check that PNG filenames match exactly (case-sensitive on some systems)

**Problem**: Sprites look wrong or cut off
**Solution**: Verify sprite sheets are saved at exactly 32x32 per frame (or 16x16 for Kanna/UI)

**Problem**: Browser cache showing old graphics
**Solution**: Hard refresh with **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## Technical Details

The asset loader in `/src/scenes/PreloadScene.js` automatically:
- Attempts to load all sprite sheets
- Handles missing files gracefully (no crash)
- Logs which assets loaded vs which fell back to placeholders
- Cuts sprite sheets into frames based on your sprite dimensions

Check browser console (F12 → Console tab) to see which assets loaded successfully!
