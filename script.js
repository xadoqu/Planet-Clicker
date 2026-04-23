
// TASK 3: MEMOIZATION 
const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        if (cache.size > 50) cache.delete(cache.keys().next().value);
        cache.set(key, result);
        return result;
    };
};
const calcCost = memoize((base, rate, count) => Math.floor(base * Math.pow(rate, count)));

// TASK 4: PRIORITY QUEUE
class PriorityQueue {
    constructor() { this.heap = []; }
    enqueue(message, priority) {
        this.heap.push({ message, priority });
        this.heap.sort((a, b) => b.priority - a.priority);
    }
    dequeue() { return this.heap.shift(); }
    isEmpty() { return this.heap.length === 0; }
}
const systemLog = new PriorityQueue();

let state = {
    res: 0, level: 1,
    buildings: [
        { id: 0, name: "Vapor Collector", base: 15, rate: 1.15, inc: 1, count: 0 },
        { id: 1, name: "Ocean Pump", base: 100, rate: 1.25, inc: 5, count: 0 },
        { id: 2, name: "Bio-Generator", base: 1000, rate: 1.3, inc: 20, count: 0 }
    ]
};

let devMode = false;

const EPOCHS = {
    1: { name: "Barren Rock", next: 100, res: "Water", icon: "💧" },
    2: { name: "Ocean World", next: 500, res: "Minerals", icon: "💎" },
    3: { name: "Green Islands", next: 2000, res: "Plants", icon: "🌿" },
    4: { name: "Wildlife Era", next: null, res: "Bio-Matter", icon: "🐾" }
};

window.onload = () => {
    document.getElementById('planet-click-zone').onclick = doClick;
    document.getElementById('evolve-btn').onclick = evolve;
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyP') {
            devMode = !devMode;
            document.getElementById('dev-mode-status').style.display = devMode ? "block" : "none";
        }
    });

    setInterval(tick, 1000);
    render();
};

function doClick() {
    state.res += devMode ? 500 : 1;
    const p = document.getElementById('planet');
    p.classList.remove('clicked');
    void p.offsetWidth;
    p.classList.add('clicked');
    render();
}

function tick() {
    let income = state.buildings.reduce((sum, b) => sum + (b.count * b.inc), 0);
    state.res += income;
    render();
}

function render() {
    const ep = EPOCHS[state.level];
    document.getElementById('resource-display').innerText = `${Math.floor(state.res)} ${ep.icon}`;
    document.getElementById('epoch-name').innerText = ep.name;
    document.getElementById('epoch-display').innerText = state.level;
    document.getElementById('pps-display').innerText = state.buildings.reduce((s, b) => s + (b.count * b.inc), 0);

    if (ep.next) {
        let pct = (state.res / ep.next) * 100;
        document.getElementById('progress-bar-fill').style.width = Math.min(pct, 100) + "%";
        document.getElementById('evolve-btn').style.display = state.res >= ep.next ? "block" : "none";
        document.getElementById('next-stage-info').innerText = `Goal: ${ep.next} ${ep.icon}`;
    } else {
        document.getElementById('progress-bar-fill').style.width = "100%";
        document.getElementById('next-stage-info').innerText = "Evolution Peak Reached";
    }

    const list = document.getElementById('buildings-list');
    list.innerHTML = '';
    state.buildings.forEach(b => {
        const cost = calcCost(b.base, b.rate, b.count);
        let div = document.createElement('div');
        div.className = `shop-item ${state.res < cost ? 'disabled' : ''}`;
        div.innerHTML = `<b>${b.name} (${b.count})</b><br>Cost: ${cost} | +${b.inc}/s`;
        div.onclick = () => {
            if (state.res >= cost) {
                state.res -= cost;
                b.count++;
                // TASK 4: PRIORITY QUEUE
                systemLog.enqueue(`Bought ${b.name}`, 1);
                render();
            }
        };
        list.appendChild(div);
    });

    // ДОБАВЛЕНО: Task 4
    const logBox = document.getElementById('event-display');
    if (!systemLog.isEmpty()) {
        const ev = systemLog.dequeue();
        const entry = document.createElement('div');
        entry.innerText = `> ${ev.message}`;
        logBox.prepend(entry);
        if (logBox.children.length > 5) logBox.lastChild.remove();
    }
}

function evolve() {
    const ep = EPOCHS[state.level];
    if (ep.next && state.res >= ep.next) {
        state.res -= ep.next;
        state.level++;
        document.getElementById('planet').className = `planet level-${state.level}`;
        // ДОБАВЛЕНО: Task 4 
        systemLog.enqueue(`EVOLVED TO ${EPOCHS[state.level].name}!`, 10);
        render();
    }
}