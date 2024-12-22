class User {
    constructor(id, nickname) {
        this.id = id;
        this.nickname = nickname;
        this.x = Math.random() * (800 - 200);
        this.y = Math.random() * (600 - 160);
    }
}

module.exports = User; 