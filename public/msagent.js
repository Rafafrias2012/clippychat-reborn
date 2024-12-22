class MSAgent {
    static AGENTS = {
        bonzi: {
            image: "./img/purple.png",
            spritew: 200,
            spriteh: 160,
            anims: {
                idle: 0,
                enter: {
                    frames: [277, 302],
                    next: "idle",
                    speed: 0.25
                },
                leave: {
                    frames: [16, 39, 40],
                    speed: 0.25
                }
            }
        },
        clippy: {
            image: "./img/clippy.png",
            spritew: 124,
            spriteh: 93,
            toppad: 40,
            anims: {
                idle: 0,
                enter: {
                    frames: [410, 416],
                    next: "idle",
                    speed: 0.25
                },
                leave: {
                    frames: [0].concat([...Array(48)].map((_, i) => i + 364)),
                    speed: 0.25
                }
            }
        },
        peedy: {
            image: "./img/peedy.png",
            spritew: 160,
            spriteh: 128,
            toppad: 12,
            anims: {
                idle: 0,
                enter: {
                    frames: [659, 681],
                    next: "idle",
                    speed: 0.25
                },
                leave: {
                    frames: [23, 47, 47],
                    speed: 0.25
                }
            }
        }
    };

    constructor(stage, x, y, nickname, agentType = null) {
        this.stage = stage;
        this.agentType = agentType || this.getRandomAgent();
        this.init(x, y, nickname);
    }

    getRandomAgent() {
        const agents = Object.keys(MSAgent.AGENTS);
        return agents[Math.floor(Math.random() * agents.length)];
    }

    async createSpriteSheet() {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "Anonymous";
            const agentConfig = MSAgent.AGENTS[this.agentType];

            image.onload = () => {
                const spriteSheet = new createjs.SpriteSheet({
                    images: [image],
                    frames: {
                        width: agentConfig.spritew,
                        height: agentConfig.spriteh,
                        regX: agentConfig.spritew / 2,
                        regY: agentConfig.spriteh / 2
                    },
                    animations: agentConfig.anims
                });
                resolve(spriteSheet);
            };

            image.onerror = reject;
            image.src = agentConfig.image;
        });
    }

    changeAgent(newAgent) {
        if (MSAgent.AGENTS[newAgent]) {
            this.agentType = newAgent;
            this.createSpriteSheet().then(spriteSheet => {
                this.sprite.spriteSheet = spriteSheet;
                this.sprite.gotoAndPlay("idle");
            });
        }
    }

    async init(x, y, nickname) {
        // Get random position if x and y are not provided
        const position = (x === undefined || y === undefined) ? 
            WindowManager.getRandomPosition() : { x, y };

        // Create and wait for sprite sheet to load
        const spriteSheet = await this.createSpriteSheet();
        this.sprite = new createjs.Sprite(spriteSheet);
        this.sprite.x = position.x;
        this.sprite.y = position.y;
        this.nickname = nickname;

        // Enable mouse interaction
        this.sprite.cursor = "pointer";
        this.sprite.mouseEnabled = true;
        this.stage.enableMouseOver(20);

        this.setupDragging();
        this.createNameTag();
        this.createSpeechBubble();

        this.sprite.gotoAndPlay("idle");
        this.stage.addChild(this.sprite);
        this.stage.update();
    }

    setupDragging() {
        let isDragging = false;
        let offset = {x: 0, y: 0};

        this.sprite.addEventListener("mousedown", (evt) => {
            isDragging = true;
            offset = {
                x: this.sprite.x - evt.stageX,
                y: this.sprite.y - evt.stageY
            };
            this.sprite.alpha = 0.8;
        });

        this.stage.addEventListener("pressmove", (evt) => {
            if (isDragging) {
                this.sprite.x = evt.stageX + offset.x;
                this.sprite.y = evt.stageY + offset.y;

                // Keep sprite within window bounds
                const boundedPosition = WindowManager.keepInBounds(this.sprite);
                this.sprite.x = boundedPosition.x;
                this.sprite.y = boundedPosition.y;

                this.updateBubblePosition();
                this.updateNameTagPosition();
                this.stage.update();
            }
        });

        this.stage.addEventListener("pressup", () => {
            isDragging = false;
            this.sprite.alpha = 1;
            this.stage.update();
        });
    }

    createNameTag() {
        this.nameTag = document.createElement("div");
        this.nameTag.className = "nametag";
        this.nameTag.textContent = this.nickname;
        document.body.appendChild(this.nameTag);
        this.updateNameTagPosition();
    }

    createSpeechBubble() {
        this.speechBubble = document.createElement("div");
        this.speechBubble.className = "speech-bubble";
        this.speechBubble.style.display = "none";
        document.body.appendChild(this.speechBubble);
    }

    speak(message) {
        if (message.startsWith("/")) {
            const [command, ...args] = message.slice(1).split(" ");
            if (COMMANDS[command]) {
                const response = COMMANDS[command].execute(this, args);
                if (response) {
                    this.showMessage(response);
                }
                return;
            }
        }

        this.showMessage(message);
    }

    showMessage(message) {
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }

        this.speechBubble.textContent = message;
        this.speechBubble.style.display = "block";
        this.updateBubblePosition();

        const url = "https://www.tetyys.com/SAPI4/SAPI4?text=" + 
            encodeURIComponent(message) + 
            "&voice=" + encodeURIComponent("Adult Male #2, American English (TruVoice)") + 
            "&pitch=140&speed=157";
        const audio = new Audio(url);
        audio.play();

        this.messageTimeout = setTimeout(() => {
            this.speechBubble.style.display = "none";
            this.messageTimeout = null;
        }, 5000);
    }

    updateBubblePosition() {
        if (this.speechBubble) {
            const agentConfig = MSAgent.AGENTS[this.agentType];
            const bubbleWidth = this.speechBubble.offsetWidth;
            const topPadding = agentConfig.toppad || 0;

            this.speechBubble.style.left = (this.sprite.x - bubbleWidth/2) + "px";
            this.speechBubble.style.top = (this.sprite.y - agentConfig.spriteh - topPadding - 40) + "px";
        }
    }

    updateNameTagPosition() {
        if (this.nameTag) {
            const tagWidth = this.nameTag.offsetWidth;
            this.nameTag.style.left = (this.sprite.x - tagWidth/2) + "px";
            this.nameTag.style.top = (this.sprite.y + 40) + "px";
        }
    }

    cleanup() {
        // Remove speech bubble
        if (this.speechBubble) {
            this.speechBubble.remove();
            this.speechBubble = null;
        }

        // Remove nametag
        if (this.nameTag) {
            this.nameTag.remove();
            this.nameTag = null;
        }

        // Stop any ongoing animations
        if (this.sprite) {
            this.sprite.stop();
        }
    }
} 
