// Game state
let words = [];
let secretWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
const MAX_TRIES = 6;

// DOM elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const newGameBtn = document.getElementById('new-game');

// Initialize game
async function init() {
    try {
        const response = await fetch('words.txt');
        const text = await response.text();
        words = text.split(/\s+/)
            .map(w => w.toLowerCase().trim())
            .filter(w => w.length === 5);
        
        if (words.length === 0) {
            showMessage('Error loading word list', 'error');
            return;
        }
        
        startNewGame();
    } catch (error) {
        showMessage('Error loading words. Using backup list.', 'error');
        // Fallback word list
        words = ['hello', 'world', 'games', 'apple', 'grape', 'house', 'ocean', 'piano', 'tiger', 'cloud'];
        startNewGame();
    }
}

function startNewGame() {
    // Pick random secret word
    secretWord = words[Math.floor(Math.random() * words.length)];
    console.log('Secret word:', secretWord); // For testing - remove in production
    
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    
    // Clear board
    gameBoard.innerHTML = '';
    
    // Create 6 rows of 5 tiles
    for (let i = 0; i < MAX_TRIES; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-col', j);
            row.appendChild(tile);
        }
        
        gameBoard.appendChild(row);
    }
    
    // Reset keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
    
    messageEl.textContent = '';
    messageEl.className = 'message';
}

function showMessage(msg, type = '') {
    messageEl.textContent = msg;
    messageEl.className = 'message show ' + type;
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 2000);
}

function getCurrentTile(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function getCurrentGuess() {
    let guess = '';
    for (let i = 0; i < 5; i++) {
        const tile = getCurrentTile(currentRow, i);
        guess += tile.textContent;
    }
    return guess.toLowerCase();
}

function addLetter(letter) {
    if (gameOver || currentTile >= 5) return;
    
    const tile = getCurrentTile(currentRow, currentTile);
    tile.textContent = letter;
    tile.classList.add('filled');
    currentTile++;
}

function deleteLetter() {
    if (gameOver || currentTile === 0) return;
    
    currentTile--;
    const tile = getCurrentTile(currentRow, currentTile);
    tile.textContent = '';
    tile.classList.remove('filled');
}

function submitGuess() {
    if (gameOver) return;
    
    if (currentTile < 5) {
        showMessage('Not enough letters', 'error');
        return;
    }
    
    const guess = getCurrentGuess();
    
    // Check if word is in list
    if (!words.includes(guess)) {
        showMessage('Word not in list', 'error');
        // Shake animation
        const row = document.querySelector(`[data-row="${currentRow}"]`);
        row.style.animation = 'shake 0.3s';
        setTimeout(() => row.style.animation = '', 300);
        return;
    }
    
    // Check guess against secret
    checkGuess(guess);
}

function checkGuess(guess) {
    const result = Array(5).fill('absent');
    const secretLetters = secretWord.split('');
    const guessLetters = guess.split('');
    
    // Count available letters (excluding exact matches)
    const letterCount = {};
    for (let i = 0; i < 5; i++) {
        if (secretLetters[i] !== guessLetters[i]) {
            letterCount[secretLetters[i]] = (letterCount[secretLetters[i]] || 0) + 1;
        }
    }
    
    // First pass: mark correct positions (green)
    for (let i = 0; i < 5; i++) {
        if (guessLetters[i] === secretLetters[i]) {
            result[i] = 'correct';
        }
    }
    
    // Second pass: mark present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'correct') continue;
        
        const letter = guessLetters[i];
        if (letterCount[letter] && letterCount[letter] > 0) {
            result[i] = 'present';
            letterCount[letter]--;
        }
    }
    
    // Animate tiles and update keyboard
    animateTiles(guessLetters, result);
    
    // Check win/loss
    setTimeout(() => {
        if (guess === secretWord) {
            gameOver = true;
            showMessage(`🎉 You got it in ${currentRow + 1} tries!`, 'success');
        } else if (currentRow === MAX_TRIES - 1) {
            gameOver = true;
            showMessage(`The word was: ${secretWord.toUpperCase()}`, 'error');
        } else {
            currentRow++;
            currentTile = 0;
        }
    }, 1500);
}

function animateTiles(letters, result) {
    for (let i = 0; i < 5; i++) {
        const tile = getCurrentTile(currentRow, i);
        
        setTimeout(() => {
            tile.classList.add('flip');
            setTimeout(() => {
                tile.classList.add(result[i]);
                updateKeyboard(letters[i], result[i]);
            }, 250);
        }, i * 100);
    }
}

function updateKeyboard(letter, result) {
    const key = document.querySelector(`[data-key="${letter.toUpperCase()}"]`);
    if (!key) return;
    
    // Don't downgrade from correct to present/absent
    if (key.classList.contains('correct')) return;
    if (key.classList.contains('present') && result === 'absent') return;
    
    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(result);
}

// Keyboard event listeners
keyboard.addEventListener('click', (e) => {
    if (!e.target.classList.contains('key')) return;
    
    const key = e.target.getAttribute('data-key');
    handleKey(key);
});

// Physical keyboard
document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    if (key === 'Enter') {
        handleKey('Enter');
    } else if (key === 'Backspace') {
        handleKey('Backspace');
    } else if (/^[a-zA-Z]$/.test(key)) {
        handleKey(key.toUpperCase());
    }
});

function handleKey(key) {
    if (gameOver) return;
    
    if (key === 'Enter') {
        submitGuess();
    } else if (key === 'Backspace') {
        deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

// New game button
newGameBtn.addEventListener('click', startNewGame);

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Start the game
init();
