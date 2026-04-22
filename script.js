/* --- VARIABLES GLOBALES --- */
let nivelMaximoAlcanzado = 1;
let timer, timeLeft, maxTime;

// Lógica Sopa de Letras
let isSelecting = false;
let startCell = null;
let currentCell = null;
let foundWords = [];
const words = ["JUEGOS", "EMPANADAS", "SERIES", "FUSTAS", "LATIGAZOS", "MUJERZUELAS", "FLOJEAR"];
const gridSize = 12;
const cellSize = 30;
let grid = [];

// Lógica Puzzle
let firstPiece = null;
let puzzleOrder = Array.from({ length: 16 }, (_, i) => i + 1); 
const winningOrder = [...puzzleOrder];

// Lógica Ahorcado
const palabraSecreta = "SERDELUZ"; 
let letrasAdivinadas = [];
let letrasFalladas = [];
let vidas = 5;

/* --- INICIALIZACIÓN --- */
document.addEventListener("DOMContentLoaded", () => {
    const btnIniciar = document.getElementById("btn-iniciar");
    if (btnIniciar) {
        btnIniciar.onclick = () => showGame(1);
    }
});

/* --- NAVEGACIÓN Y SEGURIDAD --- */
function showGame(level) {
    if (level > nivelMaximoAlcanzado) {
        console.warn("Nivel bloqueado.");
        return;
    }

    // Ocultar todas las pantallas
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    const currentLevel = document.getElementById(`game${level}`);
    if (currentLevel) {
        currentLevel.classList.add("activa", "active");
    } else if (level === 4) {
        document.getElementById("final").classList.add("activa", "active");
        clearInterval(timer);
        confetti({particleCount: 150, spread: 80});
    }

    // Inicializar lógica según nivel
    if (level === 1) { initWordSearch(); startTimer(120); }
    if (level === 2) { initPuzzle(); startTimer(120); }
    if (level === 3) { iniciarNivel3(); startTimer(90); }

    const timerCont = document.getElementById("timer-container");
    if (timerCont) timerCont.style.display = (level >= 1 && level <= 3) ? "block" : "none";
}

function liberarSiguienteNivel(nivelActual) {
    const contenedor = document.getElementById(`game${nivelActual}`);
    if (contenedor.querySelector(".btn-siguiente")) return;

    const btn = document.createElement("button");
    btn.textContent = "Siguiente Nivel ➡️";
    btn.className = "btn-siguiente"; 
    btn.onclick = () => {
        nivelMaximoAlcanzado = nivelActual + 1;
        showGame(nivelActual + 1);
        btn.remove();
    };
    contenedor.appendChild(btn);
}

/* --- NIVEL 1: SOPA DE LETRAS --- */
function initWordSearch() {
    const canvas = document.getElementById("wordsearch");
    const list = document.getElementById("wordList");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    foundWords = [];
    list.innerHTML = "";
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));

    words.forEach(w => {
        colocarPalabraAleatoria(w);
        let li = document.createElement("li");
        li.textContent = w;
        li.id = `item-${w}`;
        list.appendChild(li);
    });

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (!grid[r][c]) grid[r][c] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        }
    }
    drawGrid();

    canvas.onmousedown = (e) => { isSelecting = true; startCell = getCell(e); };
    canvas.onmousemove = (e) => {
        if (!isSelecting) return;
        currentCell = getCell(e);
        drawGrid();
        highlightSelection(startCell, currentCell, ctx);
    };
    window.onmouseup = () => {
        if (!isSelecting) return;
        isSelecting = false;
        if (startCell && currentCell) checkWord(startCell, currentCell);
        startCell = null; currentCell = null; drawGrid();
    };
}

function colocarPalabraAleatoria(palabra) {
    const direcciones = [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: -1, c: 1 }];
    let colocada = false;
    let intentos = 0;
    while (!colocada && intentos < 150) {
        const dir = direcciones[Math.floor(Math.random() * direcciones.length)];
        const f = Math.floor(Math.random() * gridSize);
        const c = Math.floor(Math.random() * gridSize);
        if (puedeColocarse(palabra, f, c, dir)) {
            for (let i = 0; i < palabra.length; i++) grid[f + (i * dir.r)][c + (i * dir.c)] = palabra[i];
            colocada = true;
        }
        intentos++;
    }
}

function puedeColocarse(p, f, c, d) {
    for (let i = 0; i < p.length; i++) {
        let nF = f + (i * d.r), nC = c + (i * d.c);
        if (nF >= gridSize || nC >= gridSize || nF < 0 || nC < 0) return false;
        if (grid[nF][nC] !== "" && grid[nF][nC] !== p[i]) return false;
    }
    return true;
}

function getCell(e) {
    const canvas = document.getElementById("wordsearch");
    const rect = canvas.getBoundingClientRect();
    return { col: Math.floor((e.clientX - rect.left) / cellSize), row: Math.floor((e.clientY - rect.top) / cellSize) };
}

function drawGrid() {
    const ctx = document.getElementById("wordsearch").getContext("2d");
    ctx.clearRect(0, 0, gridSize * cellSize, gridSize * cellSize);
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            ctx.strokeStyle = "#ddd";
            ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
            ctx.fillStyle = "#333";
            ctx.fillText(grid[r][c], c * cellSize + cellSize/2, r * cellSize + cellSize/2);
        }
    }
}

function highlightSelection(a, b, ctx) {
    let dr = Math.sign(b.row - a.row), dc = Math.sign(b.col - a.col);
    let r = a.row, c = a.col;
    ctx.fillStyle = "rgba(138, 43, 226, 0.4)";
    while (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        if (r === b.row && c === b.col) break;
        r += dr; c += dc;
    }
}

function checkWord(a, b) {
    let word = "", dr = Math.sign(b.row - a.row), dc = Math.sign(b.col - a.col);
    let r = a.row, c = a.col;
    while (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        word += grid[r][c];
        if (r === b.row && c === b.col) break;
        r += dr; c += dc;
    }
    let rev = word.split("").reverse().join("");
    let found = words.includes(word) ? word : (words.includes(rev) ? rev : null);
    if (found && !foundWords.includes(found)) {
        foundWords.push(found);
        document.getElementById(`item-${found}`).classList.add("found");
        if (foundWords.length === words.length) {
            setTimeout(() => { alert("¡Sopa de letras completada!"); liberarSiguienteNivel(1); }, 500);
        }
    }
}

/* --- NIVEL 2: PUZZLE --- */
function initPuzzle() {
    const cont = document.getElementById("puzzle");
    if (!cont) return;
    for (let i = puzzleOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [puzzleOrder[i], puzzleOrder[j]] = [puzzleOrder[j], puzzleOrder[i]];
    }
    firstPiece = null; renderPuzzle();
}

function renderPuzzle() {
    const cont = document.getElementById("puzzle");
    cont.innerHTML = "";
    puzzleOrder.forEach((num, index) => {
        let d = document.createElement("div");
        d.className = "pieza";
        const origIdx = num - 1;
        const row = Math.floor(origIdx / 4), col = origIdx % 4;
        d.style.backgroundImage = "url('assets/img/puzzle.png')";
        d.style.backgroundSize = "340px 340px";
        d.style.backgroundPosition = `-${col * 85}px -${row * 85}px`;
        if (firstPiece === index) d.style.border = "3px solid gold";
        d.onclick = () => {
            if (firstPiece === null) { firstPiece = index; renderPuzzle(); }
            else {
                [puzzleOrder[firstPiece], puzzleOrder[index]] = [puzzleOrder[index], puzzleOrder[firstPiece]];
                firstPiece = null; renderPuzzle(); checkPuzzleWin();
            }
        };
        cont.appendChild(d);
    });
}

function checkPuzzleWin() {
    if (puzzleOrder.every((v, i) => v === winningOrder[i])) {
        setTimeout(() => { alert("¡Puzzle resuelto!"); liberarSiguienteNivel(2); }, 300);
    }
}

/* --- NIVEL 3: AHORCADO --- */
function iniciarNivel3() {
    letrasAdivinadas = Array(palabraSecreta.length).fill("_");
    letrasFalladas = []; vidas = 5;
    actualizarInterfazNivel3();
}

function actualizarInterfazNivel3() {
    document.getElementById("vidas-count").textContent = vidas;
    document.getElementById("palabra-secreta-display").textContent = letrasAdivinadas.join(" ");
    const spanFalladas = document.querySelector("#letras-usadas span");
    if (spanFalladas) spanFalladas.textContent = letrasFalladas.join(", ");
    const input = document.getElementById("letra-input");
    if (input) { input.value = ""; input.focus(); }
}

function intentarLetra() {
    let input = document.getElementById("letra-input");
    let letra = input.value.toUpperCase().trim();
    if (!letra || !/^[A-ZÑ]$/.test(letra)) return;
    if (letrasAdivinadas.includes(letra) || letrasFalladas.includes(letra)) return;

    if (palabraSecreta.includes(letra)) {
        for (let i = 0; i < palabraSecreta.length; i++) if (palabraSecreta[i] === letra) letrasAdivinadas[i] = letra;
    } else {
        vidas--; letrasFalladas.push(letra);
        document.getElementById("game3").classList.add("shake");
        setTimeout(() => document.getElementById("game3").classList.remove("shake"), 300);
    }
    actualizarInterfazNivel3();
    verificarEstadoJuego();
}

function verificarEstadoJuego() {
    if (!letrasAdivinadas.includes("_")) {
        clearInterval(timer);
        setTimeout(() => { alert("¡CÓDIGO DESCIFRADO!"); liberarSiguienteNivel(3); }, 400);
    } else if (vidas <= 0) {
        clearInterval(timer);
        setTimeout(() => { alert("¡GAME OVER!"); location.reload(); }, 300);
    }
}

/* --- TIMER --- */
function startTimer(s) {
    clearInterval(timer);
    timeLeft = s; maxTime = s;
    updateTimer();
    timer = setInterval(() => {
        timeLeft--; updateTimer();
        if (timeLeft <= 0) { clearInterval(timer); alert("⏰ ¡Tiempo!"); location.reload(); }
    }, 1000);
}

function updateTimer() {
    document.getElementById("timer-text").textContent = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
    document.getElementById("timer-bar").style.width = (timeLeft / maxTime * 100) + "%";
}