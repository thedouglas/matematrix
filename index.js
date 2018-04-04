let element = null;
let operadores = ["=", "+", "-", "÷", "x", "="];
let numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
let elementPontos = document.getElementById("pontos");
let board = document.querySelector(".board");
let draggables = document.querySelector(".draggables");

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

    let font_size = 10;
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

    board.innerHTML = "";
    draggables.innerHTML = "";
    for (let y = 0; y < MATRIZ_SIZE; y++) {
        matrix[y] = new Array(MATRIZ_SIZE);
        for (let x = 0; x < MATRIZ_SIZE; x++) {
            let div = document.createElement("div");
            div.className = "board-item";
            div.disable = false;
            div.setAttribute("x", x);
            div.setAttribute("y", y);
            div.setAttribute("id", `${x}_${y}`);
            div.setAttribute("ondrop", "drop(event)");
            div.setAttribute("ondragover", "allowDrop(event)");
            div.addEventListener('dragstart', handleDragStart, false);
            div.addEventListener('dragenter', handleDragEnter, false);
            div.addEventListener('dragleave', handleDragLeave, false);
            board.appendChild(div);
            matrix[y][x] = div;
        }
    }
    for (let i = 0; i < 5; i++) {
        let div = document.createElement("div");
        div.setAttribute("id", "op_" + i);
        div.setAttribute("draggable", "true");
        div.setAttribute("ondragstart", "drag(event)");
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

function handleDragStart(e) {
    this.style.opacity = '0.4';

}
function handleDragEnter(e) {
    if (this.disable === false) {
        this.classList.add('over');
    }
}
function handleDragLeave(e) {
    this.classList.remove('over');
}
function allowDrop(ev) {
    if (ev.target.disable === false) {
        ev.preventDefault();
    }
}

function drag(ev) {
    element = ev.target;

    ev.dataTransfer.effectAllowed = "move";

    ev.dataTransfer.setData("item", ev.target.textContent);
}

function drop(ev) {
    ev.preventDefault();
    let item = ev.dataTransfer.getData("item");
    ev.target.textContent = element.textContent;
    ev.target.classList.add('item');
    ev.target.classList.remove('over');
    ev.target.disable = true;
    let id = element.getAttribute("id");
    if (id == "op_1" || id == "op_3") {
        element.textContent = operadores.random();
    } else {
        element.textContent = numeros.random();
    }

    (async () => {
        let [x, y] = ev.target.id.split("_");
        let [expressaoX, expressaoY] = await verificaMatriz(y, x);

        let pontos = Number(elementPontos.textContent);
        pontos += await verificaExpressao(expressaoX, "x");
        pontos += await verificaExpressao(expressaoY, "y");
        elementPontos.textContent = pontos;
    })();

}

async function verificaExpressao(expressao, eixo) {

    let expr = Array.from(expressao)
        .sort((a, b) => Number(a.getAttribute(eixo)) - Number(b.getAttribute(eixo)))
        .map(it => it.textContent)
        .reduce((a, b) => a + b)

    expr = expr.replace("÷", "/").replace("x", "*").replace("=", "==");

    let pontos = 0;
    try {
        if (expr.length > 2 && expr.includes("==") && eval(expr)) {
            for (const ex of expressao) {
                ex.textContent = "";
                ex.disable = false;
                ex.classList.remove("item")
            }

            pontos = await calculaPontos(expr);

            return pontos
        }
    } catch (e) { } finally {
        console.log(`${eixo} : ${expr} pontos:${pontos}`)
    }
    return 0;
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

    return [expressaoX, expressaoY];
}
window.addEventListener("load", () => {
    Array.prototype.random = function () {
        return this[Math.floor(Math.random() * this.length)];
    };

    // get point for a touch event
    DragDropTouch.DragDropTouch.prototype._getPoint = function (e, page) {
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
