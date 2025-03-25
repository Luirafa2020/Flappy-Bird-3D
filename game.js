import * as THREE from 'three';

// Basic Scene Setup
const scene = new THREE.Scene();
const normalBackgroundColor = new THREE.Color(0x87CEEB); // Sky blue background
scene.background = normalBackgroundColor;

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Position the camera slightly back

// Renderer
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
renderer.shadowMap.enabled = true; // Enable shadows for better visuals

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Slightly lower ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Stronger directional
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true; // Enable shadow casting
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// --- Absurdly Improved Bird Model ---
// ... (Bird model code remains the same) ...
const birdGroup = new THREE.Group(); birdGroup.castShadow = true; const bodyRadius = 0.2; const bodyGeometry = new THREE.SphereGeometry(bodyRadius, 32, 16); const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.6, metalness: 0.1 }); const body = new THREE.Mesh(bodyGeometry, bodyMaterial); body.castShadow = true; birdGroup.add(body); const beakGeometry = new THREE.ConeGeometry(0.08, 0.2, 16); const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.7 }); const beak = new THREE.Mesh(beakGeometry, beakMaterial); beak.castShadow = true; beak.position.x = bodyRadius * 0.9; beak.rotation.z = -Math.PI / 2; birdGroup.add(beak); const eyeRadius = 0.04; const eyeGeometry = new THREE.SphereGeometry(eyeRadius, 12, 8); const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }); const pupilGeometry = new THREE.SphereGeometry(eyeRadius * 0.4, 8, 8); const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa, emissiveIntensity: 0.5 }); const eyeLeftGroup = new THREE.Group(); const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial); const pupilLeft = new THREE.Mesh(pupilGeometry, pupilMaterial); pupilLeft.position.x = eyeRadius * 0.6; eyeLeftGroup.add(eyeLeft); eyeLeftGroup.add(pupilLeft); eyeLeftGroup.position.set(bodyRadius * 0.5, bodyRadius * 0.3, bodyRadius * 0.6); eyeLeftGroup.rotation.y = -Math.PI / 6; birdGroup.add(eyeLeftGroup); const eyeRightGroup = eyeLeftGroup.clone(); eyeRightGroup.position.z = -eyeLeftGroup.position.z; eyeRightGroup.rotation.y = -eyeLeftGroup.rotation.y; birdGroup.add(eyeRightGroup); const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.bezierCurveTo(0.1, 0.15, 0.25, 0.1, 0.3, 0); wingShape.bezierCurveTo(0.25, -0.05, 0.1, -0.1, 0, 0); const wingExtrudeSettings = { depth: 0.02, bevelEnabled: false }; const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings); const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xffec8b, roughness: 0.8, side: THREE.DoubleSide }); const wingLeft = new THREE.Mesh(wingGeometry, wingMaterial); wingLeft.castShadow = true; wingLeft.position.set(-0.05, 0.05, bodyRadius * 0.7); wingLeft.rotation.x = Math.PI / 8; wingLeft.rotation.y = -Math.PI / 6; birdGroup.add(wingLeft); const wingRight = wingLeft.clone(); wingRight.position.z = -wingLeft.position.z; wingRight.rotation.y = -wingLeft.rotation.y; birdGroup.add(wingRight); const tailGeometry = new THREE.SphereGeometry(bodyRadius * 0.6, 16, 8); tailGeometry.scale(1, 0.5, 1); const tailMaterial = wingMaterial; const tail = new THREE.Mesh(tailGeometry, tailMaterial); tail.castShadow = true; tail.position.set(-bodyRadius * 0.8, -bodyRadius * 0.2, 0); tail.rotation.z = Math.PI / 4; birdGroup.add(tail); const footRadius = 0.05; const footGeometry = new THREE.SphereGeometry(footRadius, 8, 8); const footMaterial = beakMaterial; const footLeft = new THREE.Mesh(footGeometry, footMaterial); footLeft.castShadow = true; footLeft.position.set(bodyRadius * 0.2, -bodyRadius * 0.9, bodyRadius * 0.3); birdGroup.add(footLeft); const footRight = footLeft.clone(); footRight.position.z = -footLeft.position.z; birdGroup.add(footRight); const bird = birdGroup; bird.position.x = -2; scene.add(bird); const birdBoundingBox = new THREE.Box3();
// --- End Absurdly Improved Bird Model ---


// Bird Physics
let birdVelocityY = 0;
const normalGravity = -0.001; const normalFlapStrength = 0.04;
const redemptionGravity = -0.0015; const redemptionFlapStrength = 0.06;
let currentGravity = normalGravity; let currentFlapStrength = normalFlapStrength;

// Pipe Constants
const pipeRadius = 0.4; const pipeHeight = 5; const pipeGap = 1.5;
const normalPipeColor = 0x228B22; const redemptionPipeColor = 0x8B0000;
const flangeColor = 0x114411; const redemptionFlangeColor = 0x440000;

// Pipe Management
const pipes = []; const pipeSpawnX = 10; const pipeDespawnX = -10; const pipeSpawnTriggerX = 2; const pipeSpacing = 5;
const normalPipeSpeed = 0.025; const redemptionPipeSpeed = 0.04; let currentPipeSpeed = normalPipeSpeed;
const pipeMaterial = new THREE.MeshStandardMaterial({ color: normalPipeColor });
const flangeMaterial = new THREE.MeshStandardMaterial({ color: flangeColor });
const pipeBoundingBox = new THREE.Box3(); const flangeRadius = pipeRadius * 1.2; const flangeThickness = 0.1;

// Ground & Ceiling Plane
const groundLevel = -3; const ceilingLevel = 4;
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const normalGroundColor = 0xcfe2f3; const redemptionGroundColor = 0x440000;
const groundMaterial = new THREE.MeshStandardMaterial({ color: normalGroundColor, side: THREE.DoubleSide, transparent: true, opacity: 0.5, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.y = groundLevel; ground.receiveShadow = true; scene.add(ground);
const groundBoundingBox = new THREE.Box3().setFromObject(ground);
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
const ceiling = new THREE.Mesh(groundGeometry.clone(), ceilingMaterial); ceiling.rotation.x = Math.PI / 2; ceiling.position.y = ceilingLevel;
// scene.add(ceiling);

// --- Blood Rain Particle System ---
// ... (Blood rain code remains the same) ...
const rainCount = 500; const rainGeometry = new THREE.BufferGeometry(); const rainVertices = []; const rainVelocities = []; const rainSpawnHeight = 10; const rainFloor = groundLevel;
for (let i = 0; i < rainCount; i++) { const x = THREE.MathUtils.randFloatSpread(20); const y = THREE.MathUtils.randFloat(rainFloor, rainSpawnHeight); const z = THREE.MathUtils.randFloatSpread(5); rainVertices.push(x, y, z); rainVelocities.push(THREE.MathUtils.randFloat(0.05, 0.15)); }
rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
const rainMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05, transparent: true, opacity: 0.7, sizeAttenuation: true });
const bloodRain = new THREE.Points(rainGeometry, rainMaterial); bloodRain.visible = false; scene.add(bloodRain);
// --- End Blood Rain ---

// --- Redemption Cross Item ---
// ... (Cross item code remains the same) ...
let activeCrossItem = null; const crossSpawnChance = 0.2; const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xcccccc, roughness: 0.2, metalness: 0.1 }); const crossBoundingBox = new THREE.Box3();
function createCrossModel() { const crossGroup = new THREE.Group(); const barWidth = 0.08; const barHeight = 0.4; const crossDepth = 0.08; const verticalGeo = new THREE.BoxGeometry(barWidth, barHeight, crossDepth); const verticalBar = new THREE.Mesh(verticalGeo, crossMaterial); verticalBar.castShadow = true; crossGroup.add(verticalBar); const horizontalGeo = new THREE.BoxGeometry(barHeight * 0.6, barWidth, crossDepth); const horizontalBar = new THREE.Mesh(horizontalGeo, crossMaterial); horizontalBar.castShadow = true; horizontalBar.position.y = barHeight * 0.15; crossGroup.add(horizontalBar); return crossGroup; }
function spawnCross(pipeXPosition, gapCenterY) { if (activeCrossItem || hasRedemptionCross) return; const crossX = pipeXPosition - pipeSpacing / 2; activeCrossItem = createCrossModel(); activeCrossItem.position.set(crossX, gapCenterY, 0); scene.add(activeCrossItem); console.log("Cross spawned at", crossX, gapCenterY); }
function removeActiveCross() { if (activeCrossItem) { scene.remove(activeCrossItem); activeCrossItem = null; console.log("Cross collected/removed"); } }
// --- End Redemption Cross Item ---

// --- Web Audio API Setup ---
let audioCtx = null;
let musicGain = null;
let musicPlaying = false;
let musicTimeoutId = null;
// Music Parameters
const normalMusicScale = [60, 64, 67, 72]; // C4, E4, G4, C5 (Major feel)
const redemptionMusicScale = [55, 58, 62, 67]; // G3, Bb3, D4, G4 (Minor feel)
let currentMusicScale = normalMusicScale;
let currentMusicInterval = 600; // milliseconds
const normalMusicInterval = 600;
const redemptionMusicInterval = 450; // Faster tempo
let currentMusicWave = 'triangle';
const normalMusicWave = 'triangle';
const redemptionMusicWave = 'sawtooth';

function initAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); console.log("AudioContext initialized."); } catch (e) { console.error("Web Audio API is not supported in this browser", e); } } return audioCtx; }
function playSound(type, freq, duration = 0.1, vol = 0.3, detune = 0) { if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); osc.detune.setValueAtTime(detune, audioCtx.currentTime); gainNode.gain.setValueAtTime(vol, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + duration); }
function playNoise(duration = 0.1, vol = 0.2) { if (!audioCtx) return; const bufferSize = audioCtx.sampleRate * duration; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } const noise = audioCtx.createBufferSource(); noise.buffer = buffer; const gainNode = audioCtx.createGain(); gainNode.gain.setValueAtTime(vol, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); noise.connect(gainNode); gainNode.connect(audioCtx.destination); noise.start(audioCtx.currentTime); noise.stop(audioCtx.currentTime + duration); }
function midiToFreq(midiNote) { return Math.pow(2, (midiNote - 69) / 12) * 440; }

// *** Refactored Music Loop ***
function playMusicNote() {
    if (!audioCtx || !musicPlaying) return;
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    // Choose note from current scale
    const noteIndex = Math.floor(Math.random() * currentMusicScale.length);
    const note = currentMusicScale[noteIndex];
    // Randomly drop octave for bass note feel
    const finalNote = (Math.random() < 0.3) ? note - 12 : note;

    osc.frequency.setValueAtTime(midiToFreq(finalNote), time);
    osc.type = currentMusicWave;

    noteGain.gain.setValueAtTime(0.15, time); // Slightly lower music volume
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + currentMusicInterval * 0.0008); // Decay based on interval

    osc.connect(noteGain);
    noteGain.connect(musicGain);
    osc.start(time);
    osc.stop(time + currentMusicInterval * 0.001);

    musicTimeoutId = setTimeout(playMusicNote, currentMusicInterval);
}

function startMusic(mode = 'normal') {
    if (!audioCtx || musicPlaying) return;
    musicPlaying = true;

    // Set parameters based on mode
    if (mode === 'redemption') {
        currentMusicScale = redemptionMusicScale;
        currentMusicInterval = redemptionMusicInterval;
        currentMusicWave = redemptionMusicWave;
    } else {
        currentMusicScale = normalMusicScale;
        currentMusicInterval = normalMusicInterval;
        currentMusicWave = normalMusicWave;
    }

    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.6, audioCtx.currentTime); // *** Further Increased Master music volume ***
    musicGain.connect(audioCtx.destination);
    playMusicNote(); // Start the loop
    console.log(`Music started (${mode} mode).`);
}

function stopMusic() {
    if (!musicPlaying || !audioCtx) return;
    clearTimeout(musicTimeoutId);
    if (musicGain) {
        musicGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        setTimeout(() => { if (musicGain) musicGain.disconnect(); musicGain = null; }, 500);
    }
    musicPlaying = false;
    console.log("Music stopped.");
}

// --- Sound Effect Triggers ---
function playFlapSound() { playNoise(0.05, 0.1); }
function playScoreSound() { playSound('sine', 880, 0.05, 0.2); }
function playCollisionSound() { playNoise(0.2, 0.4); playSound('square', 110, 0.2, 0.3); }
function playCrossSound() { playSound('sine', 1046.5, 0.2, 0.3); playSound('sine', 1318.5, 0.2, 0.3, 5); }
function playRedemptionEntrySound() { playSound('sawtooth', 440, 0.5, 0.2); setTimeout(() => playSound('sawtooth', 330, 0.5, 0.2), 150); }
function playRedemptionSuccessSound() { playSound('triangle', 523.25, 0.3, 0.3); setTimeout(() => playSound('triangle', 659.25, 0.3, 0.3), 100); setTimeout(() => playSound('triangle', 783.99, 0.4, 0.3), 200); }
// --- End Web Audio API Setup ---


// DOM Elements
const scoreDisplay = document.getElementById('scoreDisplay'); const gameOverMessage = document.getElementById('gameOverMessage'); const redemptionEntryMessage = document.getElementById('redemptionEntryMessage'); const redemptionSuccessMessage = document.getElementById('redemptionSuccessMessage'); const startMenu = document.getElementById('startMenu');

// Game States Enum
const GameState = { MENU: 'MENU', LOADING: 'LOADING', PLAYING: 'PLAYING', REDEMPTION_ENTRY: 'REDEMPTION_ENTRY', REDEMPTION_ACTIVE: 'REDEMPTION_ACTIVE', REDEMPTION_SUCCESS_DISPLAY: 'REDEMPTION_SUCCESS_DISPLAY', GAME_OVER_FINAL: 'GAME_OVER_FINAL' };

// Game State Variables
let gameState = GameState.MENU; let hasRedemptionCross = false; let score = 0; const redemptionDuration = 5000; let redemptionStartTime = 0; let stateTransitionTimeoutId = null;
const HIGH_SCORE_KEY = 'flappy3DHighScore'; // High Score

// --- Helper Functions ---
function getHighScore() { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0'); }
function saveHighScore(newScore) { const currentHighScore = getHighScore(); if (newScore > currentHighScore) { localStorage.setItem(HIGH_SCORE_KEY, newScore.toString()); return true; } return false; }

function setWorldVisuals(mode) {
    // ... (remains the same) ...
    if (mode === 'redemption') { scene.background = new THREE.Color(0x660000); groundMaterial.color.setHex(redemptionGroundColor); pipeMaterial.color.setHex(redemptionPipeColor); flangeMaterial.color.setHex(redemptionFlangeColor); bloodRain.visible = true; }
    else { scene.background = normalBackgroundColor; groundMaterial.color.setHex(normalGroundColor); pipeMaterial.color.setHex(normalPipeColor); flangeMaterial.color.setHex(flangeColor); bloodRain.visible = false; }
}

function createPipePair(xPosition) {
    // ... (Pipe creation remains the same) ...
    const totalHeight = pipeHeight * 2 + pipeGap; const gapCenterY = THREE.MathUtils.randFloat(-1.5, 1.5); const topPipeGroup = new THREE.Group(); topPipeGroup.position.x = xPosition; const topPipeHeight = (totalHeight / 2) - (gapCenterY + pipeGap / 2); const topPipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, topPipeHeight, 16); const topPipe = new THREE.Mesh(topPipeGeometry, pipeMaterial); topPipe.castShadow = true; topPipe.receiveShadow = true; topPipe.position.y = gapCenterY + pipeGap / 2 + topPipeHeight / 2; topPipeGroup.add(topPipe); const topFlangeGeometry = new THREE.TorusGeometry(flangeRadius, flangeThickness, 8, 16); const topFlange = new THREE.Mesh(topFlangeGeometry, flangeMaterial); topFlange.castShadow = true; topFlange.rotation.x = Math.PI / 2; topFlange.position.y = gapCenterY + pipeGap / 2 + flangeThickness / 2; topPipeGroup.add(topFlange); scene.add(topPipeGroup); const bottomPipeGroup = new THREE.Group(); bottomPipeGroup.position.x = xPosition; const bottomPipeHeight = totalHeight - topPipeHeight - pipeGap; const bottomPipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, bottomPipeHeight, 16); const bottomPipe = new THREE.Mesh(bottomPipeGeometry, pipeMaterial); bottomPipe.castShadow = true; bottomPipe.receiveShadow = true; bottomPipe.position.y = gapCenterY - pipeGap / 2 - bottomPipeHeight / 2; bottomPipeGroup.add(bottomPipe); const bottomFlangeGeometry = new THREE.TorusGeometry(flangeRadius, flangeThickness, 8, 16); const bottomFlange = new THREE.Mesh(bottomFlangeGeometry, flangeMaterial); bottomFlange.castShadow = true; bottomFlange.rotation.x = Math.PI / 2; bottomFlange.position.y = gapCenterY - pipeGap / 2 - flangeThickness / 2; bottomPipeGroup.add(bottomFlange); scene.add(bottomPipeGroup); const pipePair = { top: topPipeGroup, bottom: bottomPipeGroup, passed: false }; pipes.push(pipePair);
    if (gameState === GameState.PLAYING && Math.random() < crossSpawnChance) { spawnCross(xPosition, gapCenterY); }
    return pipePair;
}

function resetGame() {
    // ... (remains the same) ...
    clearTimeout(stateTransitionTimeoutId); stopMusic(); bird.position.set(-2, 0, 0); birdVelocityY = 0;
    for (let i = pipes.length - 1; i >= 0; i--) { const pipePair = pipes[i]; scene.remove(pipePair.top); scene.remove(pipePair.bottom); } pipes.length = 0; removeActiveCross();
    score = 0; scoreDisplay.innerText = `Score: ${score}`; hasRedemptionCross = false;
    gameOverMessage.style.display = 'none'; redemptionEntryMessage.style.display = 'none'; redemptionSuccessMessage.style.display = 'none';
    startMenu.style.display = 'block'; scoreDisplay.style.display = 'none'; gameState = GameState.MENU; setWorldVisuals('normal');
    console.log("Game Reset - Showing Menu");
}

// Called after 3 sec entry message delay
function startRedemptionActive() {
    // ... (remains the same) ...
    console.log("Starting Redemption Active Phase"); redemptionEntryMessage.style.display = 'none'; bird.position.set(-2, 0, 0); birdVelocityY = 0;
    for (let i = pipes.length - 1; i >= 0; i--) { const pipePair = pipes[i]; scene.remove(pipePair.top); scene.remove(pipePair.bottom); } pipes.length = 0; removeActiveCross();
    setWorldVisuals('redemption'); pipeMaterial.color.setHex(redemptionPipeColor);
    currentPipeSpeed = redemptionPipeSpeed; currentGravity = redemptionGravity; currentFlapStrength = redemptionFlapStrength;
    redemptionStartTime = Date.now(); createPipePair(pipeSpawnX); gameState = GameState.REDEMPTION_ACTIVE; console.log("Redemption Mode Active!");
    startMusic('redemption'); // *** Start redemption music ***
}

// Begins the redemption sequence
function enterRedemptionMode() {
    // ... (remains the same) ...
    console.log("Entering Redemption Sequence!"); playRedemptionEntrySound(); stopMusic(); // Stop normal music
    gameState = GameState.REDEMPTION_ENTRY; hasRedemptionCross = false;
    redemptionEntryMessage.style.display = 'block'; clearTimeout(stateTransitionTimeoutId); stateTransitionTimeoutId = setTimeout(startRedemptionActive, 3000);
}

// Called after 2 sec success message delay
function returnToPlaying() {
    // ... (remains the same) ...
    console.log("Returning to Normal Play"); redemptionSuccessMessage.style.display = 'none'; gameState = GameState.PLAYING;
    setWorldVisuals('normal'); currentPipeSpeed = normalPipeSpeed; currentGravity = normalGravity; currentFlapStrength = normalFlapStrength;
    startMusic('normal'); // *** Restart normal music ***
}

// Called when redemption timer succeeds
function handleRedemptionSuccess() {
    // ... (remains the same) ...
    console.log("Redemption Successful!"); playRedemptionSuccessSound(); gameState = GameState.REDEMPTION_SUCCESS_DISPLAY;
    redemptionSuccessMessage.style.display = 'block'; bloodRain.visible = false; stopMusic(); // Stop redemption music
    clearTimeout(stateTransitionTimeoutId); stateTransitionTimeoutId = setTimeout(returnToPlaying, 2000);
}

function handleCollision() {
    // ... (remains the same, including high score logic) ...
    console.log("Collision detected in state:", gameState); if (gameState !== GameState.PLAYING && gameState !== GameState.REDEMPTION_ACTIVE) return;
    playCollisionSound(); stopMusic(); clearTimeout(stateTransitionTimeoutId);
    if (gameState === GameState.PLAYING) {
        if (hasRedemptionCross) { enterRedemptionMode(); }
        else { gameState = GameState.GAME_OVER_FINAL; const highScore = getHighScore(); const newHighScore = saveHighScore(score); gameOverMessage.innerText = `Game Over!\nScore: ${score}\nHigh Score: ${newHighScore ? score : highScore}\nClick to Restart`; gameOverMessage.style.display = 'block'; setWorldVisuals('normal'); }
    } else if (gameState === GameState.REDEMPTION_ACTIVE) {
        gameState = GameState.GAME_OVER_FINAL; const highScore = getHighScore(); gameOverMessage.innerText = `Redemption Failed!\nScore: ${score}\nHigh Score: ${highScore}\nClick to Restart`; gameOverMessage.style.display = 'block'; setWorldVisuals('normal');
    }
}
// --- End Helper Functions ---

// Handle Window Resize
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(window.devicePixelRatio); });

// Input Handling
function handleInput() {
    if (!audioCtx) { if (!initAudio()) { console.warn("AudioContext could not be initialized."); } }
    if (gameState === GameState.MENU) {
        gameState = GameState.PLAYING; startMenu.style.display = 'none'; scoreDisplay.style.display = 'block';
        currentGravity = normalGravity; currentFlapStrength = normalFlapStrength; currentPipeSpeed = normalPipeSpeed;
        setWorldVisuals('normal'); if (pipes.length === 0) createPipePair(pipeSpawnX);
        startMusic('normal'); console.log("Game Started!"); birdVelocityY = currentFlapStrength; playFlapSound();
    }
    else if (gameState === GameState.PLAYING || gameState === GameState.REDEMPTION_ACTIVE) { birdVelocityY = currentFlapStrength; playFlapSound(); }
    else if (gameState === GameState.GAME_OVER_FINAL) { resetGame(); }
}
window.addEventListener('mousedown', handleInput);
window.addEventListener('keydown', (event) => { if (event.code === 'Space') { handleInput(); } });

// --- Main Animation Loop ---
let animationFrameId = null;
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const now = Date.now();
    if (gameState !== GameState.MENU && gameState !== GameState.LOADING && gameState !== GameState.REDEMPTION_ENTRY && gameState !== GameState.REDEMPTION_SUCCESS_DISPLAY && gameState !== GameState.GAME_OVER_FINAL) {
        // Physics & Ceiling Check
        birdVelocityY += currentGravity; bird.position.y += birdVelocityY;
        birdBoundingBox.setFromObject(bird);
        if (birdBoundingBox.max.y > ceilingLevel) { bird.position.y -= (birdBoundingBox.max.y - ceilingLevel); birdVelocityY = 0; }

        // Animate Wings
        const flapSpeed = 0.2; wingLeft.rotation.z = Math.sin(now * flapSpeed * 0.01) * (Math.PI / 6); wingRight.rotation.z = -wingLeft.rotation.z;

        // Collision Detection
        if (birdBoundingBox.min.y < groundBoundingBox.max.y) { handleCollision(); }
        if (gameState === GameState.PLAYING || gameState === GameState.REDEMPTION_ACTIVE) {
            for (const pipePair of pipes) { pipeBoundingBox.setFromObject(pipePair.top); if (birdBoundingBox.intersectsBox(pipeBoundingBox)) { handleCollision(); break; } pipeBoundingBox.setFromObject(pipePair.bottom); if (birdBoundingBox.intersectsBox(pipeBoundingBox)) { handleCollision(); break; } }
            if (activeCrossItem && (gameState === GameState.PLAYING || gameState === GameState.REDEMPTION_ACTIVE)) { crossBoundingBox.setFromObject(activeCrossItem); if (birdBoundingBox.intersectsBox(crossBoundingBox)) { console.log("Collected Cross!"); playCrossSound(); hasRedemptionCross = true; removeActiveCross(); } }
        }

        // Pipe Movement & Spawning/Despawning
        if (gameState === GameState.PLAYING || gameState === GameState.REDEMPTION_ACTIVE) {
            let spawnNewPipe = false; if (pipes.length > 0) { const lastPipe = pipes[pipes.length - 1]; if (lastPipe.top.position.x < pipeSpawnTriggerX) spawnNewPipe = true; } else { spawnNewPipe = true; } if (spawnNewPipe) createPipePair(pipeSpawnX);
            for (let i = pipes.length - 1; i >= 0; i--) {
                const pipePair = pipes[i]; pipePair.top.position.x -= currentPipeSpeed; pipePair.bottom.position.x -= currentPipeSpeed;
                if (activeCrossItem && activeCrossItem.position.x > bird.position.x) { activeCrossItem.position.x -= currentPipeSpeed; }
                if (pipePair.top.position.x < pipeDespawnX) { scene.remove(pipePair.top); scene.remove(pipePair.bottom); if (activeCrossItem && Math.abs(activeCrossItem.position.x - pipePair.top.position.x) < 0.1) { removeActiveCross(); } pipes.splice(i, 1); }
                else { if (gameState === GameState.PLAYING && !pipePair.passed && pipePair.top.position.x < bird.position.x) { pipePair.passed = true; score++; scoreDisplay.innerText = `Score: ${score}`; playScoreSound(); } }
            }
        }

        // Redemption Timer Check & Rain
        if (gameState === GameState.REDEMPTION_ACTIVE) {
            if (now - redemptionStartTime > redemptionDuration) { handleRedemptionSuccess(); }
            const positions = rainGeometry.attributes.position.array;
            for (let i = 0; i < rainCount; i++) { positions[i * 3 + 1] -= rainVelocities[i]; if (positions[i * 3 + 1] < rainFloor) { positions[i * 3 + 1] = rainSpawnHeight; positions[i * 3 + 0] = THREE.MathUtils.randFloatSpread(20); positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(5); } }
            rainGeometry.attributes.position.needsUpdate = true;
        }
    }
    renderer.render(scene, camera);
}
// Start
animate();
startMenu.style.display = 'block'; scoreDisplay.style.display = 'none';
console.log("3D Flappy Bird initialized! Waiting for player to start.");
