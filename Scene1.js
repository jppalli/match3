class Match3 extends Phaser.Scene {
    constructor() {
        super();
        this.gridSize = 8;
        this.cellSize = 60;
        this.grid = [];
        this.colors = [0xFF4136, 0x2ECC40, 0x0074D9, 0xFF851B, 0xB10DC9, 0xFFDC00];
        this.selectedCircle = null;
        this.isSwapping = false;
        this.score = 0;
        this.scoreText = null;
        this.comboCount = 0;
        this.comboText = null;
        this.swipeStartPosition = null;
        this.level = 1;
        this.levelText = null;
        this.moves = 5;
        this.movesText = null;
        this.goals = [];
        this.goalTexts = [];
        this.goalIcons = [];
        this.levelUpText = null;
        this.isRearranging = false;
        this.matchSound = null;
        this.levelUpSound = null;
        this.gameOverText = null;
        this.restartButton = null;
        this.gameOverTimer = null;
        this.lastMoveTime = 0;
        this.noMovementTimer = null;
        this.selectedMark = null;
    }

    preload() {
        this.load.image('bubble', "assets/bubble.png");
        this.load.audio('match', "assets/match.wav");
        this.load.audio('levelUp', "assets/levelup.wav");
    }

    create() {
        const { width, height } = this.scale;

        const startX = (width - this.gridSize * this.cellSize) / 2;
        const startY = (height - this.gridSize * this.cellSize) / 2;

        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.createCircle(x, y, startX, startY);
            }
        }

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointerup', this.onPointerUp, this);

        const textStyle = {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { blur: 0, stroke: false, fill: false }
        };

        const scoreTextStyle = {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { blur: 0, stroke: false, fill: false }
        };

        const levelUpTextStyle = {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { blur: 0, stroke: false, fill: false }
        };

        const uiContainer = this.add.container(0, 0);
        uiContainer.setDepth(1);

        const levelTextStyle = {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { blur: 0, stroke: false, fill: false }
        };
        this.levelText = this.add.text(10, 10, 'Level: 1', levelTextStyle);
        uiContainer.add(this.levelText);

        const movesTextStyle = {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: { blur: 0, stroke: false, fill: false }
        };
        this.movesText = this.add.text(10, 50, 'Moves: 5', movesTextStyle);
        uiContainer.add(this.movesText);

        for (let i = 0; i < 3; i++) {
            const goalText = this.add.text(width - 10, 10 + i * 30, '0', textStyle);
            goalText.setOrigin(1, 0);
            uiContainer.add(goalText);
            this.goalTexts.push(goalText);

            const goalIcon = this.add.image(0, 0, 'bubble');
            goalIcon.setScale(0.05);
            uiContainer.add(goalIcon);
            this.goalIcons.push(goalIcon);
        }

        this.scoreText = this.add.text(width / 2, height - 10, 'Score: 0', scoreTextStyle);
        this.scoreText.setOrigin(0.5, 1);
        uiContainer.add(this.scoreText);

        this.comboText = this.add.text(width / 2, height / 2, '', textStyle);
        this.comboText.setOrigin(0.5);
        this.comboText.setAlpha(0);
        this.comboText.setDepth(2);

        this.levelUpText = this.add.text(width / 2, height / 2, 'LEVEL UP!', levelUpTextStyle);
        this.levelUpText.setOrigin(0.5);
        this.levelUpText.setAlpha(0);
        this.levelUpText.setDepth(2);

        this.gameOverText = this.add.text(width / 2, height / 2, 'GAME OVER', levelUpTextStyle);
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setAlpha(0);
        this.gameOverText.setDepth(2);

        const restartButtonStyle = {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: {
                left: 10,
                right: 10,
                top: 5,
                bottom: 5
            }
        };
        this.restartButton = this.add.text(width / 2, height / 2 + 50, 'Restart', restartButtonStyle);
        this.restartButton.setOrigin(0.5);
        this.restartButton.setInteractive({ useHandCursor: true });
        this.restartButton.on('pointerdown', this.restartGame, this);
        this.restartButton.setAlpha(0);
        this.restartButton.setDepth(2);

        this.setLevelGoals();

        this.matchSound = this.sound.add('match');
        this.levelUpSound = this.sound.add('levelUp');

        this.lastMoveTime = this.time.now;

        // Create the selected mark
        this.selectedMark = this.add.circle(0, 0, this.cellSize / 2, 0xffffff, 0.3);
        this.selectedMark.setVisible(false);
        this.selectedMark.setDepth(1);
    }

    setLevelGoals() {
        this.goals = [];
        const goalCount = Math.min(3, Math.floor(this.level / 2) + 1);
        const availableColors = [...this.colors];
        for (let i = 0; i < goalCount; i++) {
            if (availableColors.length === 0) {
                console.warn("Ran out of unique colors for goals");
                break;
            }
            const colorIndex = Math.floor(Math.random() * availableColors.length);
            const color = availableColors.splice(colorIndex, 1)[0];
            const count = 5 + this.level * 3;
            this.goals.push({ color, count });
        }
        this.moves = Math.max(5, 15 - this.level);
        this.updateGoalTexts();
        this.updateMovesText();
    }

    updateGoalTexts() {
        for (let i = 0; i < this.goalTexts.length; i++) {
            if (i < this.goals.length) {
                const { color, count } = this.goals[i];
                this.goalTexts[i].setText(`${count}`);
                this.goalIcons[i].setTint(color);
                this.goalTexts[i].setVisible(true);
                this.goalIcons[i].setVisible(true);

                const iconSize = this.goalIcons[i].displayWidth;
                const textHeight = this.goalTexts[i].height;
                this.goalIcons[i].x = this.goalTexts[i].x - this.goalTexts[i].width - iconSize / 2 - 5;
                this.goalIcons[i].y = this.goalTexts[i].y + textHeight / 2;
            } else {
                this.goalTexts[i].setVisible(false);
                this.goalIcons[i].setVisible(false);
            }
        }
    }

    onPointerDown(pointer) {
        if (this.isSwapping || this.moves <= 0 || this.isRearranging) return;
        
        const startX = (this.scale.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.scale.height - this.gridSize * this.cellSize) / 2;
        
        const gridX = Math.floor((pointer.x - startX) / this.cellSize);
        const gridY = Math.floor((pointer.y - startY) / this.cellSize);
        
        if (gridX >= 0 && gridX < this.gridSize && gridY >= 0 && gridY < this.gridSize) {
            this.selectedCircle = this.grid[gridY][gridX];
            this.swipeStartPosition = { x: pointer.x, y: pointer.y };
            
            // Show the selected mark
            this.selectedMark.setPosition(this.selectedCircle.x, this.selectedCircle.y);
            this.selectedMark.setVisible(true);
        }
    }

    onPointerUp(pointer) {
        if (this.isSwapping || !this.selectedCircle || !this.swipeStartPosition || this.moves <= 0 || this.isRearranging) return;
        
        const dx = pointer.x - this.swipeStartPosition.x;
        const dy = pointer.y - this.swipeStartPosition.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (Math.max(absDx, absDy) > this.cellSize / 4) {
            let direction;
            if (absDx > absDy) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }
            
            this.swapWithDirection(this.selectedCircle, direction);
            this.moves--;
            this.updateMovesText();
            this.lastMoveTime = this.time.now;
        }
        
        this.selectedCircle = null;
        this.swipeStartPosition = null;
        
        // Hide the selected mark
        this.selectedMark.setVisible(false);
    }

    swapWithDirection(circle, direction) {
        let targetX = circle.gridX;
        let targetY = circle.gridY;
        
        switch (direction) {
            case 'left': targetX--; break;
            case 'right': targetX++; break;
            case 'up': targetY--; break;
            case 'down': targetY++; break;
        }
        
        if (targetX >= 0 && targetX < this.gridSize && targetY >= 0 && targetY < this.gridSize) {
            const targetCircle = this.grid[targetY][targetX];
            this.swapCircles(circle, targetCircle);
        }
    }

    createCircle(x, y, startX, startY) {
        const cellX = startX + x * this.cellSize + this.cellSize / 2;
        const cellY = startY + y * this.cellSize + this.cellSize / 2;
        
        let color;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            color = Phaser.Utils.Array.GetRandom(this.colors);
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn(`Could not find a suitable color for position (${x}, ${y}) after ${maxAttempts} attempts.`);
                break;
            }
        } while (this.checkInitialMatch(x, y, color));
        
        const bubble = this.add.image(cellX, cellY, 'bubble');
        bubble.setScale(this.cellSize / bubble.width * 0.9);
        bubble.setTint(color);
        bubble.setInteractive();
        bubble.gridX = x;
        bubble.gridY = y;
        bubble.fillColor = color;
        
        bubble.setDepth(0);
        
        this.grid[y][x] = bubble;
        return bubble;
    }

    checkInitialMatch(x, y, color) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let [dx, dy] of directions) {
            let count = 1;
            for (let i = 1; i <= 2; i++) {
                const newX = x + dx * i;
                const newY = y + dy * i;
                if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                    if (this.grid[newY] && this.grid[newY][newX] && this.grid[newY][newX].fillColor === color) {
                        count++;
                    } else {
                        break;
                    }
                }
            }
            if (count >= 3) return true;
        }

        return false;
    }

    swapCircles(circle1, circle2) {
        this.isSwapping = true;
        this.comboCount = 0;

        const tempGridX = circle1.gridX;
        const tempGridY = circle1.gridY;

        circle1.gridX = circle2.gridX;
        circle1.gridY = circle2.gridY;
        circle2.gridX = tempGridX;
        circle2.gridY = tempGridY;

        this.grid[circle1.gridY][circle1.gridX] = circle1;
        this.grid[circle2.gridY][circle2.gridX] = circle2;

        this.tweens.add({
            targets: circle1,
            x: circle2.x,
            y: circle2.y,
            duration: 200,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: circle2,
            x: circle1.x,
            y: circle1.y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.isSwapping = false;
                this.checkAndDestroyMatches();
            }
        });

        this.lastMoveTime = this.time.now;
    }

    checkAndDestroyMatches() {
        let matched = new Set();

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y] && this.grid[y][x]) {
                    const horizontalMatch = this.findMatchLine(x, y, 1,0);
                    const verticalMatch = this.findMatchLine(x, y, 0, 1);
                    
                    if (horizontalMatch.size >= 3) {
                        horizontalMatch.forEach(circle => matched.add(circle));
                    }
                    if (verticalMatch.size >= 3) {
                        verticalMatch.forEach(circle => matched.add(circle));
                    }
                }
            }
        }

        if (matched.size > 0) {
            this.comboCount++;
            this.updateScore(matched.size);
            this.updateGoalProgress(matched);
            this.destroyMatches(matched);
            this.matchSound.play();
            this.lastMoveTime = this.time.now;
        } else {
            this.isSwapping = false;
            this.comboCount = 0;
            this.comboText.setText('');
            this.checkLevelCompletion();
            this.checkNoMovement();
        }
    }

    findMatchLine(x, y, dx, dy) {
        const color = this.grid[y][x].fillColor;
        let matchLine = new Set();
        
        for (let i = 0; i < this.gridSize; i++) {
            const newX = x + dx * i;
            const newY = y + dy * i;
            
            if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
                const circle = this.grid[newY][newX];
                if (circle && circle.fillColor === color) {
                    matchLine.add(circle);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        return matchLine;
    }

    destroyMatches(matched) {
        this.isRearranging = true;
        let destroyedCount = 0;
        matched.forEach(circle => {
            this.tweens.add({
                targets: circle,
                scale: 1.2,
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    circle.destroy();
                    if (this.grid[circle.gridY] && this.grid[circle.gridY][circle.gridX]) {
                        this.grid[circle.gridY][circle.gridX] = null;
                    }
                    destroyedCount++;
                    if (destroyedCount === matched.size) {
                        this.rearrangeGrid();
                    }
                }
            });
        });
    }

    rearrangeGrid() {
        const startY = (this.scale.height - this.gridSize * this.cellSize) / 2;
        let fallingCircles = [];

        for (let x = 0; x < this.gridSize; x++) {
            let nullCount = 0;
            for (let y = this.gridSize - 1; y >= 0; y--) {
                if (!this.grid[y] || this.grid[y][x] === null) {
                    nullCount++;
                } else if (nullCount > 0) {
                    const circle = this.grid[y][x];
                    circle.gridY += nullCount;
                    this.grid[circle.gridY] = this.grid[circle.gridY] || [];
                    this.grid[circle.gridY][x] = circle;
                    this.grid[y][x] = null;
                    fallingCircles.push(circle);
                }
            }
        }

        if (fallingCircles.length > 0) {
            this.animateFallingCircles(fallingCircles, startY);
        } else {
            this.spawnNewCircles();
        }
    }

    animateFallingCircles(fallingCircles, startY) {
        let animationsCompleted = 0;
        fallingCircles.forEach((circle, index) => {
            this.tweens.add({
                targets: circle,
                y: startY + circle.gridY * this.cellSize + this.cellSize / 2,
                duration: 200,
                ease: 'Power2',
                delay: index * 20,
                onComplete: () => {
                    animationsCompleted++;
                    if (animationsCompleted === fallingCircles.length) {
                        this.spawnNewCircles();
                    }
                }
            });
        });
        this.lastMoveTime = this.time.now;
    }

    spawnNewCircles() {
        const startX = (this.scale.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.scale.height - this.gridSize * this.cellSize) / 2;
        let newCircles = [];

        for (let x = 0; x < this.gridSize; x++) {
            let nullCount = 0;
            for (let y = this.gridSize - 1; y >= 0; y--) {
                if (!this.grid[y] || this.grid[y][x] === null) {
                    nullCount++;
                    const newCircle = this.createCircle(x, y, startX, startY - nullCount * this.cellSize);
                    newCircles.push(newCircle);
                    this.grid[y] = this.grid[y] || [];
                    this.grid[y][x] = newCircle;
                }
            }
        }

        if (newCircles.length > 0) {
            this.animateNewCircles(newCircles, startY);
        } else {
            this.checkAfterRefill();
        }
    }

    animateNewCircles(newCircles, startY) {
        let animationsCompleted = 0;
        newCircles.forEach((circle, index) => {
            this.tweens.add({
                targets: circle,
                y: startY + circle.gridY * this.cellSize + this.cellSize / 2,
                duration: 200,
                ease: 'Power2',
                delay: index * 20,
                onComplete: () => {
                    animationsCompleted++;
                    if (animationsCompleted === newCircles.length) {
                        this.checkAfterRefill();
                    }
                }
            });
        });
        this.lastMoveTime = this.time.now;
    }

    checkAfterRefill() {
        this.time.delayedCall(300, () => {
            this.isRearranging = false;
            this.checkAndDestroyMatches();
        });
    }

    updateScore(matchedCount) {
        const basePoints = matchedCount * 10;
        const comboMultiplier = this.comboCount;
        const points = basePoints * comboMultiplier;
        
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);

        if (this.comboCount > 1) {
            this.comboText.setText(`Combo x${this.comboCount}! +${points} points`);
            this.comboText.setAlpha(0);
            this.comboText.y = this.scale.height / 2;
            this.tweens.add({
                targets: this.comboText,
                alpha: 1,
                y: this.scale.height / 2 - 50,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.tweens.add({
                        targets: this.comboText,
                        alpha: 0,
                        y: this.scale.height / 2 - 100,
                        duration: 2000,
                        ease: 'Power2',
                        onComplete: () => {
                            this.comboText.y = this.scale.height / 2;
                        }
                    });
                }
            });
        }
    }

    updateMovesText() {
        this.movesText.setText(`Moves: ${this.moves}`);
        this.checkNoMovement();
    }

    updateGoalProgress(matched) {
        matched.forEach(circle => {
            for (let goal of this.goals) {
                if (circle.fillColor === goal.color) {
                    goal.count = Math.max(0, goal.count - 1);
                }
            }
        });
        this.updateGoalTexts();
    }

    checkLevelCompletion() {
        const allGoalsCompleted = this.goals.every(goal => goal.count === 0);
        if (allGoalsCompleted) {
            if (this.noMovementTimer) {
                this.noMovementTimer.remove();
            }
            this.level++;
            this.levelText.setText(`Level: ${this.level}`);
            this.setLevelGoals();
            this.showLevelUpMessage();
            this.levelUpSound.play();
            this.lastMoveTime = this.time.now;
        }
    }

    checkNoMovement() {
        if (this.moves <= 0) {
            if (this.noMovementTimer) {
                this.noMovementTimer.remove();
            }
            this.noMovementTimer = this.time.delayedCall(2000, () => {
                if (this.time.now - this.lastMoveTime >= 2000) {
                    this.gameOver();
                }
            });
        }
    }

    showLevelUpMessage() {
        this.levelUpText.setAlpha(1);
        this.levelUpText.setScale(0.5);
        this.levelUpText.y = this.scale.height / 2;

        this.tweens.add({
            targets: this.levelUpText,
            alpha: 1,
            scale: 1,
            y: this.scale.height / 2 - 50,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: this.levelUpText,
                    alpha: 0,
                    y: this.scale.height / 2 - 100,
                    scale: 1.5,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        this.levelUpText.y = this.scale.height / 2;
                        this.levelUpText.setScale(1);
                    }
                });
            }
        });
    }

    gameOver() {
        this.isRearranging = true;
        this.gameOverText.setAlpha(1);
        this.gameOverText.setScale(0.5);
        this.gameOverText.y = this.scale.height / 2;

        this.tweens.add({
            targets: this.gameOverText,
            alpha: 1,
            scale: 1,
            y: this.scale.height / 2 - 50,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.restartButton.setAlpha(1);
                this.input.off('pointerdown', this.onPointerDown, this);
                this.input.off('pointerup', this.onPointerUp, this);
            }
        });
    }

    restartGame() {
        this.level = 1;
        this.score = 0;
        this.comboCount = 0;
        this.isRearranging = false;
        this.isSwapping = false;

        if (this.noMovementTimer) {
            this.noMovementTimer.remove();
        }

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x]) {
                    this.grid[y][x].destroy();
                }
            }
        }
        this.grid = [];

        const startX = (this.scale.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.scale.height - this.gridSize * this.cellSize) / 2;
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.createCircle(x, y, startX, startY);
            }
        }

        this.levelText.setText('Level: 1');
        this.scoreText.setText('Score: 0');
        this.setLevelGoals();

        this.gameOverText.setAlpha(0);
        this.restartButton.setAlpha(0);

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointerup', this.onPointerUp, this);

        this.lastMoveTime = this.time.now;
    }
}

const container = document.getElementById('renderDiv');
const config = {
    type: Phaser.AUTO,
    parent: 'renderDiv',
    pixelArt: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 360,
        height: 640
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200
            }
        }
    },
    scene: Match3
};

window.phaserGame = new Phaser.Game(config);