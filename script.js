let score = 0;
let lives = 3;
let gameInterval;
let isGameRunning = false;
let gameSpeed = 1;
let highScore = localStorage.getItem('highScore') || 0;

const goodEmojis = ['😀', '😎', '🤩', '😍', '🤪', '😜', '🤗', '🥳', '😊', '👻', '🤖', '👽', '🦄', '💫', '✨'];
const dangerEmojis = ['💣'];  // Dangerous emojis
const starEmojis=['⭐'];
const heartEmojis=['❤️'];

const gameArea = document.getElementById('game-area');
const catcher = document.getElementById('catcher');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const highScoreElement = document.getElementById('high-score');
const levelBtns = document.querySelectorAll('.level-btn');

// Update the sound effects with new URLs
const sounds = {
    goodCatch: new Audio('https://audio-previews.elements.envatousercontent.com/files/2441208/preview.mp3'),  // Happy chime
    badCatch: new Audio('https://assets.mixkit.co/active_storage/sfx/1357/1357-preview.mp3'),   // Error sound
    gameStart: new Audio('https://audio-previews.elements.envatousercontent.com/files/267087633/preview.mp3'),  // Game start sound
    gameOver: new Audio('https://audio-previews.elements.envatousercontent.com/files/274750691/preview.mp3'),   // Game over sound
    backgroundMusic: new Audio('https://audio-previews.elements.envatousercontent.com/files/240715624/preview.mp3') // New background music
};

// Configure background music
sounds.backgroundMusic.loop = true;
sounds.backgroundMusic.volume = 0.3;  // Adjust volume as needed

// Instead, get the existing buttons from HTML
const soundControlBtn = document.getElementById('sound-control');
const musicControlBtn = document.getElementById('music-control');

let isSoundOn = true;
let isMusicOn = true;

// Initialize button states
soundControlBtn.innerHTML = '🔊';
musicControlBtn.innerHTML = '🎵';

// Separate toggle functions for sound and music
function toggleSound() {
    isSoundOn = !isSoundOn;
    soundControlBtn.innerHTML = isSoundOn ? '🔊' : '🔇';
    
    // Stop all sound effects if sound is turned off
    if (!isSoundOn) {
        sounds.goodCatch.pause();
        sounds.badCatch.pause();
        sounds.gameStart.pause();
        sounds.gameOver.pause();
        
        // Reset all sound effects to start
        sounds.goodCatch.currentTime = 0;
        sounds.badCatch.currentTime = 0;
        sounds.gameStart.currentTime = 0;
        sounds.gameOver.currentTime = 0;
    }
}

function toggleMusic() {
    isMusicOn = !isMusicOn;
    musicControlBtn.innerHTML = isMusicOn ? '🎵' : '🎵❌';
    
    if (!isMusicOn) {
        sounds.backgroundMusic.pause();
        sounds.backgroundMusic.currentTime = 0;
    } else if (isGameRunning) {
        sounds.backgroundMusic.play();
    }
}

// Update playSound function to check both sound types
function playSound(soundName) {
    if (soundName === 'backgroundMusic') {
        if (isMusicOn) {
            sounds[soundName].play().catch(error => {
                console.log("Audio play failed:", error);
            });
        }
    } else if (isSoundOn) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(error => {
            console.log("Audio play failed:", error);
        });
    }
}

// Add CSS class to show active/inactive state
function updateButtonStyles() {
    soundControlBtn.classList.toggle('inactive', !isSoundOn);
    musicControlBtn.classList.toggle('inactive', !isMusicOn);
}

// Update the event listeners
soundControlBtn.addEventListener('click', () => {
    toggleSound();
    updateButtonStyles();
});

musicControlBtn.addEventListener('click', () => {
    toggleMusic();
    updateButtonStyles();
});

highScoreElement.textContent = highScore;

// Level selection
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameSpeed = parseFloat(btn.dataset.speed);
    });
});

// Move catcher with mouse
gameArea.addEventListener('mousemove', (e) => {
    if (isGameRunning) {
        const gameAreaRect = gameArea.getBoundingClientRect();
        const catcherWidth = catcher.offsetWidth;
        let newX = e.clientX - gameAreaRect.left - catcherWidth / 2;
        
        // Keep catcher within game area bounds
        newX = Math.max(0, Math.min(newX, gameAreaRect.width - catcherWidth));
        catcher.style.left = `${newX}px`;
    }
});

function showScoreEffect(x, y, points, isDanger) {
    const effect = document.createElement('div');
    effect.className = 'catch-effect';
    effect.textContent = points >= 0 ? `+${points}` : points;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    if (isDanger) {
        effect.classList.add('danger-effect');
    }
    
    gameArea.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

function showNotification(text, type, x, y) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = text;
    notification.style.left = `${x}px`;
    notification.style.top = `${y}px`;
    gameArea.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => notification.remove(), 1000);
}

function createEmoji() {
    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    
    // Adjust probability: 10% for star, 5% for heart, 20% for danger, rest for normal
    const random = Math.random();
    if (random < 0.10) {
        emoji.textContent = starEmojis[0];
        emoji.dataset.type = 'star';
    } else if (random < 0.15) {
        emoji.textContent = heartEmojis[0];
        emoji.dataset.type = 'heart';
    } else if (random < 0.35) {
        emoji.textContent = dangerEmojis[0];
        emoji.classList.add('danger');
    } else {
        emoji.textContent = goodEmojis[Math.floor(Math.random() * goodEmojis.length)];
    }
    
    const gameAreaRect = gameArea.getBoundingClientRect();
    const randomX = Math.random() * (gameAreaRect.width - 30);
    
    emoji.style.left = `${randomX}px`;
    emoji.style.top = '0px';
    gameArea.appendChild(emoji);
    
    let posY = 0;
    const fallInterval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(fallInterval);
            if (emoji.parentNode) {
                emoji.remove();
            }
            return;
        }

        posY += 3 * gameSpeed;
        emoji.style.top = `${posY}px`;
        
        const catcherRect = catcher.getBoundingClientRect();
        const emojiRect = emoji.getBoundingClientRect();
        
        if (
            emojiRect.bottom >= catcherRect.top &&
            emojiRect.left < catcherRect.right &&
            emojiRect.right > catcherRect.left
        ) {
            if (emoji.classList.contains('danger')) {
                // Caught dangerous emoji - end game
                score = Math.max(0, score - 20);
                scoreElement.textContent = score;
                showScoreEffect(emojiRect.left, emojiRect.top, -20, true);
                playSound('badCatch');
                catcher.classList.add('shake');
                setTimeout(() => catcher.classList.remove('shake'), 200);
                emoji.remove();
                clearInterval(fallInterval);
                endGame(); // End game when catching dangerous emoji
            } else {
                let points = 10;
                let notificationText = '';
                let notificationType = '';
                
                if (emoji.dataset.type === 'star') {
                    points = 20;
                    notificationText = 'Awesome!';
                    notificationType = 'awesome';
                } else if (emoji.dataset.type === 'heart') {
                    points = 50;
                    notificationText = 'You nailed it!';
                    notificationType = 'nailed-it';
                }
                
                score += points;
                scoreElement.textContent = score;
                
                if (notificationText) {
                    showNotification(notificationText, notificationType, emojiRect.left, emojiRect.top);
                }
                showScoreEffect(emojiRect.left, emojiRect.top, points, false);
                playSound('goodCatch');
                emoji.remove();
                clearInterval(fallInterval);
            }
            
            // Add catch animation to basket
            catcher.querySelector('.basket').style.transform = 'scale(1.2)';
            setTimeout(() => {
                catcher.querySelector('.basket').style.transform = 'scale(1)';
            }, 100);
        }
        
        // End game only if a good emoji is missed
        if (posY > gameAreaRect.height) {
            if (!emoji.classList.contains('danger')) {
                emoji.remove();
                clearInterval(fallInterval);
                endGame();  // End game only when missing good emoji
            } else {
                // Just remove the dangerous emoji if missed
                emoji.remove();
                clearInterval(fallInterval);
            }
        }
    }, 20);
}

function startGame() {
    score = 0;
    scoreElement.textContent = score;
    isGameRunning = true;
    startBtn.parentElement.style.display = 'none';
    gameOverScreen.classList.add('hidden');
    // Hide instructions when game starts
    document.querySelector('.instructions').classList.add('hidden');
    
    playSound('gameStart');
    if (isMusicOn) {
        sounds.backgroundMusic.currentTime = 0;
        playSound('backgroundMusic');
    }
    
    gameInterval = setInterval(() => {
        if (isGameRunning) {
            createEmoji();
        }
    }, 2000 / gameSpeed);
}

function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    
    if (isMusicOn) {
        sounds.backgroundMusic.pause();
    }
    playSound('gameOver');
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Update game over message based on last action
    const gameOverMessage = document.querySelector('#game-over p');
    if (document.querySelector('.danger.caught')) {
        gameOverMessage.textContent = "You caught a bomb! 💣";
    } else {
        gameOverMessage.textContent = "You missed a good emoji! 😢";
    }
    
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
    document.querySelector('.instructions').classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', function() {
    // Hide game over screen
    gameOverScreen.classList.add('hidden');
    
    // Show menu with start game button and difficulty options
    document.querySelector('.menu').style.display = 'block';
    
    // Reset game state
    score = 0;
    document.getElementById('score').textContent = '0';
    
    // Show instructions
    document.querySelector('.instructions').classList.remove('hidden');
    
    // Stop any ongoing game loops
    if(gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // Reset any game elements if needed
    const gameArea = document.getElementById('game-area');
    const emojis = gameArea.getElementsByClassName('emoji');
    while(emojis.length > 0) {
        emojis[0].remove();
    }
});

// Add keyboard controls
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    
    const catcherRect = catcher.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();
    const step = 20;
    
    if (e.key === 'ArrowLeft') {
        let newX = catcherRect.left - gameAreaRect.left - step;
        newX = Math.max(0, newX);
        catcher.style.left = `${newX}px`;
    } else if (e.key === 'ArrowRight') {
        let newX = catcherRect.left - gameAreaRect.left + step;
        newX = Math.min(newX, gameAreaRect.width - catcherRect.width);
        catcher.style.left = `${newX}px`;
    }
});

// Update the quit button event listener
document.getElementById('quit-btn').addEventListener('click', function() {
    // Ask for confirmation before quitting
    const confirmQuit = confirm("Are you sure you want to quit the game?");
    
    if (confirmQuit) {
        // Try to go back if there's history
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // If no history, close the window
            window.close();
            
            // Some browsers block window.close(), so provide a message
            alert("Please close the browser tab to exit the game");
        }
    }
}); 