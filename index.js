let element = null;
let operadores = ["=", "+", "-", "÷", "x"];
let numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
let elementPontos = document.getElementById("pontos");
let board = document.querySelector(".board");
let draggables = document.querySelector(".draggables");
let numerosEmJogo = []
let operadoresEmJogo = [];

document.getElementById("btnNewgame").addEventListener("click", () => {
    if (confirm("Descartar jogo?")) {
        localStorage.clear();
        start()
    }
});

const MATRIZ_SIZE = 10;
if (MATRIZ_SIZE == 8) {
    board.classList.add("board-8")
}
let matrix = new Array(MATRIZ_SIZE)

function matrixRain() {
    const c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    let chinese = "-04+1*23=45-6/78-90*3/45+6=7/8*";

    chinese = chinese.split("");

    let font_size = 15;
    let columns = c.width / font_size;

    let drops = [];

    for (let x = 0; x < columns; x++) drops[x] = 1;

    let interval = null;
    let teste = 0;
    let limit = 500;
    let time = 64;
    function background() {

        teste++;
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#0F0";
        ctx.font = font_size + "px arial";

        for (let i = 0; i < drops.length; i++) {
            let text = chinese.random();
            ctx.fillText(text, i * font_size, drops[i] * font_size);

            if (drops[i] * font_size > c.height && Math.random() > 0.975) drops[i] = 0;

            drops[i]++;
        }

        if (teste > limit) {
            teste = 0;
            clearInterval(interval)
            interval = setInterval(background, time);
        }
    };
    interval = setInterval(background, time);
}

function start() {
    let pontos = localStorage.getItem("pontos");
    elementPontos.textContent = pontos || 0;
    board.innerHTML = "";
    draggables.innerHTML = "";
    let matrixJSON = localStorage.getItem("matrix");
    if (matrixJSON != undefined) {
        matrixJSON = JSON.parse(matrixJSON);
    }
    for (let y = 0; y < MATRIZ_SIZE; y++) {
        matrix[y] = new Array(MATRIZ_SIZE);
        for (let x = 0; x < MATRIZ_SIZE; x++) {
            let div = document.createElement("div");
            div.className = "board-item animated";
            div.disable = false;
            div.setAttribute("x", x);
            div.setAttribute("y", y);
            div.setAttribute("id", `${x}_${y}`);
            div.addEventListener("drop", handleDrop, false);
            div.addEventListener("dragover", allowDrop, false);
            div.addEventListener('dragenter', handleDragEnter, false);
            div.addEventListener('dragleave', handleDragLeave, false);

            if (matrixJSON != undefined) {
                div.value = matrixJSON[y][x].value;
                div.disable = matrixJSON[y][x].disable;
                div.textContent = div.value;
                if (div.value) {
                    div.classList.add("item")
                }
            }
            board.appendChild(div);
            matrix[y][x] = div;
        }
    }
    for (let i = 0; i < 5; i++) {
        let div = document.createElement("div");
        div.setAttribute("id", "op_" + i);
        div.setAttribute("draggable", "true");
        div.addEventListener("dragstart", handleDragStart, false);
        div.addEventListener('dragend', handleDragEnd, false);
        div.className = "board-item item";
        if (i % 2 == 0) {
            div.textContent = numeros.random();
        }
        else {
            div.textContent = operadores.random();
        }
        draggables.appendChild(div);
    }
}

function save() {
    localStorage.setItem("pontos", elementPontos.textContent);
    localStorage.setItem("matrix", JSON.stringify(matrix));
}

function handleDragStart(e) {
    element = e.target;
    e.target.style.opacity = '0.9';
    e.dataTransfer.effectAllowed = "move";

    e.dataTransfer.setData("item", e.target.textContent);
}

function handleDragEnd(e) {
    if (e.target) {
        e.target.style.opacity = '0.6';
    }
}

function handleDragEnter(e) {
    if (this.disable === false) {
        this.classList.add('over');
        e.target.setAttribute("over-value", element.textContent)
    }
}

function handleDragLeave(e) {
    this.classList.remove('over');
    e.target.setAttribute("over-value", "")
}

function handleDrop(ev) {
    if (ev.target.disable) return;
    ev.preventDefault();
    let item = ev.dataTransfer.getData("item");
    ev.target.textContent = item;
    ev.target.classList.add('item');
    ev.target.classList.remove('over');
    ev.target.value = item;
    ev.target.disable = true;

    calcule(ev);
}

function allowDrop(ev) {
    if (!ev.target.disable) {
        ev.preventDefault();
    }
}

async function calcule(ev) {
    let [x, y] = ev.target.id.split("_");
    let [expressaoX, expressaoY] = await verificaMatriz(y, x);

    getNextValue(ev.target.textContent, expressaoX, expressaoY);

    let [px, toRemovex] = await verificaExpressao(expressaoX);
    let [py, toRemovey] = await verificaExpressao(expressaoY);
    let toRemove = [...toRemovex, ...toRemovey];
    elementPontos.textContent = Number(elementPontos.textContent) + px + py;
    for (const div of toRemove) {
        div.textContent = div.value = "";
        div.disable = false;
        div.classList.add("slideOutDown");
        matrix[y][x] = div;
        setTimeout(() => {
            div.classList.remove("item");
            div.classList.remove("verify");
            div.classList.remove("slideOutDown");
        }, 900);
    }
    setTimeout(save, 10);
}

async function getNextValue(item, expressaoX, expressaoY) {
    console.log()
    let expX = expressaoX.map(e => e.value)
    let expY = expressaoY.map(e => e.value)

    if (isDigit(item)) {
        numerosEmJogo.push(parseFloat(item))
        element.textContent = numeros.random();
    } else {
        operadoresEmJogo.push(item)
        element.textContent = operadores.random();
    }
}

async function verificaExpressao(expressao) {

    let pontos = 0;
    let toRemove = new Set();
    let expr = expressao
        .map(it => it.textContent.replace("÷", "/").replace("x", "*").replace("=", "=="))
        .join("")

    try {
        if (expr.length > 2 && expr.includes("==")) {
            let exs = expr.split("==")

            if (eval(expr)) {
                for (const ex of expressao) {
                    toRemove.add(ex);
                }
                pontos = await calculaPontos(expr);
            }
        }

        return [pontos, toRemove];
    } catch (e) { } finally {
        // console.log(`${eixo} : ${expr} pontos:${pontos}`)
    }
    return [0, toRemove];
}

async function calculaPontos(expr) {
    let pontos = 0;
    if (expr.includes('-')) {
        pontos += 10;
    }
    if (expr.includes('+')) {
        pontos += 10;
    }
    if (expr.includes('/')) {
        pontos += 20;
    }
    if (expr.includes('*')) {
        pontos += 20;
    }
    if (expr.includes('==')) {
        pontos += 5;
    }

    return pontos;
}

async function verificaMatriz(yy, xx) {
    let expressaoX = new Set()
    let expressaoY = new Set()
    for (let y = yy; y < 10; y++) {
        matrix[y][xx].classList.add("verify")
        setTimeout(() => matrix[y][xx].classList.remove("verify"), 900)
        if (matrix[y][xx].textContent.length == 0) {
            break;
        }
        expressaoY.add(matrix[y][xx]);
    }
    for (let x = xx; x < 10; x++) {
        matrix[yy][x].classList.add("verify")
        setTimeout(() => matrix[yy][x].classList.remove("verify"), 900)
        if (matrix[yy][x].textContent.length == 0) {
            break;
        }
        expressaoX.add(matrix[yy][x]);
    }
    for (let y = yy; y >= 0; y--) {
        matrix[y][xx].classList.add("verify")
        setTimeout(() => matrix[y][xx].classList.remove("verify"), 900)
        if (matrix[y][xx].textContent.length == 0) {
            break;
        }
        expressaoY.add(matrix[y][xx]);
    }
    for (let x = xx; x >= 0; x--) {
        matrix[yy][x].classList.add("verify")
        setTimeout(() => matrix[yy][x].classList.remove("verify"), 900)
        if (matrix[yy][x].textContent.length == 0) {
            break;
        }
        expressaoX.add(matrix[yy][x]);
    }

    expressaoX = Array.from(expressaoX)
        .sort((a, b) => Number(a.getAttribute("x")) - Number(b.getAttribute("x")))
    expressaoY = Array.from(expressaoY)
        .sort((a, b) => Number(a.getAttribute("y")) - Number(b.getAttribute("y")))

    return [expressaoX, expressaoY];
}
function isDigit(ch) {
    return /\d/.test(ch);
}

function isOperator(ch) {
    ch = ch.replace("÷", "/").replace("x", "*").replace("=", "==");
    return /\+|-|\*|\/|\=/.test(ch);
}

window.addEventListener("load", () => {
    Array.prototype.random = function (length) {
        return this[Math.floor(Math.random() * this.length)];
    };

    // get point for a touch event
    DragDropTouch.DragDropTouch.prototype._getPoint = function (e, page) {
        console.log(e);
        if (e && e.touches) {
            e = e.touches[0];
        }
        if (e.offsetY === undefined) {
            return { x: page ? e.pageX : e.clientX, y: page ? (e.pageY - 40) : (e.clientY - 40) };
        }
        return { x: page ? e.pageX : e.clientX, y: page ? e.pageY : e.clientY };
    };
    matrixRain();
    start();
})
