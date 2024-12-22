let socket;
let stage;
let agents = new Map();
let currentUser;

function makeDraggable(element) {
    const titleBar = element.querySelector('.title-bar');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    titleBar.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function showError(message) {
    const errorBox = document.getElementById('error-box') || createErrorBox();
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    setTimeout(() => {
        errorBox.style.display = 'none';
    }, 3000);
}

function createErrorBox() {
    const errorBox = document.createElement('div');
    errorBox.id = 'error-box';
    document.body.appendChild(errorBox);
    return errorBox;
}

function setupChatInput() {
    const chatbar = document.getElementById("chatbar");
    chatbar.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}

function init() {
    socket = io();
    setupSocketListeners();

    const canvas = document.getElementById("mainCanvas");
    stage = new createjs.Stage(canvas);

    // Enable touch support
    createjs.Touch.enable(stage);

    // Enable mouse over events
    stage.enableMouseOver(20);

    // Set up ticker
    createjs.Ticker.framerate = 30;
    createjs.Ticker.addEventListener("tick", () => {
        stage.update();
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    makeDraggable(document.getElementById('login-screen'));
    setupChatInput();

    socket.on('error', showError);
    socket.on('enter_complete', () => {
        const agent = agents.get(currentUser.id);
        if (agent) {
            agent.sprite.gotoAndPlay("enter");
        }
    });
}

function resizeCanvas() {
    const canvas = document.getElementById("mainCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 50;
    stage.update();
}

function login() {
    const nickname = document.getElementById("nickname").value;
    const room = document.getElementById("room").value;
    const selectedAgent = document.getElementById("agent").value;

    if (nickname && room) {
        const loginData = {
            nickname: nickname,
            agentType: selectedAgent === "random" ? null : selectedAgent
        };

        socket.emit("login", loginData);
        socket.emit("join_room", room);

        document.getElementById("login-screen").style.display = "none";
        document.getElementById("chat-screen").style.display = "block";
    }
}

function sendMessage() {
    const message = document.getElementById("chatbar").value;
    if (message) {
        socket.emit("chat_message", message);
        document.getElementById("chatbar").value = "";
    }
}

function setupSocketListeners() {
    socket.on("login_success", (user) => {
        currentUser = user;
    });

    socket.on("user_joined", ({user, users}) => {
        users.forEach(u => {
            if (!agents.has(u.id)) {
                const agent = new MSAgent(stage, u.x, u.y, u.nickname, u.agentType);
                agents.set(u.id, agent);
            }
        });
    });

    socket.on("user_update", (update) => {
        const agent = agents.get(update.id);
        if (agent) {
            if (update.nickname) {
                agent.nickname = update.nickname;
                agent.updateNameTagPosition();
            }
            if (update.agentType) {
                agent.changeAgent(update.agentType);
            }
        }
    });

    socket.on("chat_message", ({user, message}) => {
        const agent = agents.get(user.id);
        if (agent) {
            agent.speak(message);
        }
    });

    socket.on("user_left", (data) => {
        const agent = agents.get(data.id);
        if (agent) {
            // Play leave animation
            agent.sprite.gotoAndPlay("leave");

            // Remove agent elements after animation
            setTimeout(() => {
                // Remove sprite from stage
                stage.removeChild(agent.sprite);

                // Remove speech bubble if exists
                if (agent.speechBubble) {
                    agent.speechBubble.remove();
                }

                // Remove nametag if exists
                if (agent.nameTag) {
                    agent.nameTag.remove();
                }

                // Remove from agents map
                agents.delete(data.id);

                // Update stage
                stage.update();
            }, 1000); // Match this with your leave animation duration
        }
    });
}

window.onload = init; 
