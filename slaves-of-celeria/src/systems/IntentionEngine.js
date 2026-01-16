/**
 * Intention Engine - Tracks player behavioral patterns and motivations
 * Influences dungeon generation and Kanna revelation
 */
export default class IntentionEngine {
    constructor(scene) {
        this.scene = scene;

        // Motivation scores (0-100, 50 is neutral)
        this.motivations = {
            aggression: 50,      // 🔥 Attacking frequently, taking damage
            reverence: 50,       // 🌀 Observing, waiting, respecting space
            curiosity: 50,       // 👁 Exploring, examining objects
            fear: 50,            // 🕸 Hesitating, fleeing, avoiding combat
            greed: 50,           // 💀 Hoarding items, opening every chest
            pride: 50            // ⚜️ Taking unnecessary risks, showing off
        };

        // Behavior tracking
        this.metrics = {
            timeSinceLastAttack: 0,
            attackCount: 0,
            damageDealt: 0,
            damageTaken: 0,
            itemsCollected: 0,
            timeSpentObserving: 0,
            retreatCount: 0,
            roomsExplored: 0,
            chestsOpened: 0,
            recklessActions: 0
        };

        // Thresholds for triggering responses
        this.thresholds = {
            aggressive: 70,
            submissive: 30,
            extreme: 85
        };

        // Recent behavior window (last N seconds matter most)
        this.recentWindow = 30000; // 30 seconds
        this.behaviorHistory = [];
    }

    update(delta) {
        this.metrics.timeSinceLastAttack += delta;

        // Decay extreme motivations slowly toward neutral
        for (let motivation in this.motivations) {
            if (this.motivations[motivation] > 50) {
                this.motivations[motivation] -= 0.01 * (delta / 16);
            } else if (this.motivations[motivation] < 50) {
                this.motivations[motivation] += 0.01 * (delta / 16);
            }
            // Clamp values
            this.motivations[motivation] = Phaser.Math.Clamp(
                this.motivations[motivation],
                0,
                100
            );
        }

        // Increase reverence when observing (not moving/attacking)
        if (this.metrics.timeSinceLastAttack > 3000) {
            this.adjustMotivation('reverence', 0.1 * (delta / 16));
            this.adjustMotivation('aggression', -0.05 * (delta / 16));
        }
    }

    // Record player attacked something
    recordAttack(damage) {
        this.metrics.attackCount++;
        this.metrics.damageDealt += damage;
        this.metrics.timeSinceLastAttack = 0;

        // Quick successive attacks = aggression
        if (this.metrics.timeSinceLastAttack < 500) {
            this.adjustMotivation('aggression', 5);
            this.adjustMotivation('reverence', -3);
        } else {
            this.adjustMotivation('aggression', 2);
        }

        this.logBehavior('attack', damage);
    }

    // Record player took damage
    recordDamage(amount) {
        this.metrics.damageTaken += amount;

        // Taking lots of damage = either fear or reckless pride
        if (this.motivations.aggression > 60) {
            this.adjustMotivation('pride', 3); // Reckless
        } else {
            this.adjustMotivation('fear', 2);
        }

        this.logBehavior('damaged', amount);
    }

    // Record player retreated from combat
    recordRetreat() {
        this.metrics.retreatCount++;
        this.adjustMotivation('fear', 5);
        this.adjustMotivation('aggression', -4);
        this.adjustMotivation('pride', -3);

        this.logBehavior('retreat');
    }

    // Record player collected an item
    recordItemCollection() {
        this.metrics.itemsCollected++;
        this.adjustMotivation('greed', 1.5);
        this.adjustMotivation('curiosity', 1);

        this.logBehavior('collect_item');
    }

    // Record player opened a chest
    recordChestOpened() {
        this.metrics.chestsOpened++;
        this.adjustMotivation('greed', 3);
        this.adjustMotivation('curiosity', 2);

        this.logBehavior('open_chest');
    }

    // Record player examined something (didn't take it)
    recordExamination() {
        this.adjustMotivation('curiosity', 3);
        this.adjustMotivation('reverence', 2);
        this.adjustMotivation('greed', -1);

        this.logBehavior('examine');
    }

    // Record reckless action (jumping into danger)
    recordRecklessAction() {
        this.metrics.recklessActions++;
        this.adjustMotivation('pride', 4);
        this.adjustMotivation('fear', -3);

        this.logBehavior('reckless');
    }

    // Helper: adjust a motivation score
    adjustMotivation(motivation, amount) {
        this.motivations[motivation] = Phaser.Math.Clamp(
            this.motivations[motivation] + amount,
            0,
            100
        );
    }

    // Log behavior for time-windowed analysis
    logBehavior(type, value = 1) {
        this.behaviorHistory.push({
            type,
            value,
            timestamp: Date.now()
        });

        // Clean old history
        const cutoff = Date.now() - this.recentWindow;
        this.behaviorHistory = this.behaviorHistory.filter(
            b => b.timestamp > cutoff
        );
    }

    // Get dominant motivation
    getDominantMotivation() {
        let max = -1;
        let dominant = null;

        for (let motivation in this.motivations) {
            if (this.motivations[motivation] > max) {
                max = this.motivations[motivation];
                dominant = motivation;
            }
        }

        return { motivation: dominant, strength: max };
    }

    // Check if player leans toward a motivation
    isMotivationActive(motivation, threshold = 60) {
        return this.motivations[motivation] >= threshold;
    }

    // Get motivations that exceed threshold
    getActiveMotivations(threshold = 65) {
        return Object.keys(this.motivations).filter(
            m => this.motivations[m] >= threshold
        );
    }

    // Debug display
    getDebugText() {
        const dominant = this.getDominantMotivation();
        return [
            '=== INTENTION ENGINE ===',
            `Dominant: ${dominant.motivation.toUpperCase()} (${Math.floor(dominant.strength)})`,
            '',
            ...Object.keys(this.motivations).map(m =>
                `${m}: ${Math.floor(this.motivations[m])}`
            ),
            '',
            `Attacks: ${this.metrics.attackCount} | Retreats: ${this.metrics.retreatCount}`,
            `Items: ${this.metrics.itemsCollected} | Chests: ${this.metrics.chestsOpened}`
        ];
    }
}
