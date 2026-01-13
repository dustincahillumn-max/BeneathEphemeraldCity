import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import PreloadScene from './scenes/PreloadScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2e3b2f',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, GameScene]
};

const game = new Phaser.Game(config);
