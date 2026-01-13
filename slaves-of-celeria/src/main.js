import Phaser from 'phaser';
import ColiseumScene from './scenes/ColiseumScene.js';
import PreloadScene from './scenes/PreloadScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#3d2f1f',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, ColiseumScene]
};

const game = new Phaser.Game(config);
