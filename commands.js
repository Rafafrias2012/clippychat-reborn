const config = require('./config.json');

class Commands {
    constructor(socket, user, room) {
        this.socket = socket;
        this.user = user;
        this.room = room;
    }

    handleCommand(message) {
        const args = message.slice(1).split(' ');
        const command = args.shift().toLowerCase();

        switch(command) {
            case 'name':
                return this.changeName(args.join(' '));
            case 'agent':
                return this.changeAgent(args.join(' '));
            default:
                return false;
        }
    }

    changeName(newName) {
        if (!newName) {
            this.socket.emit('error', 'Usage: ' + config.commands.name.usage);
            return true;
        }

        if (newName.length > config.limits.name) {
            this.socket.emit('error', `Name must be ${config.limits.name} characters or less`);
            return true;
        }

        const oldName = this.user.nickname;
        this.user.nickname = newName;
        this.socket.to(this.room.name).emit('user_update', {
            id: this.user.id,
            nickname: newName
        });
        return true;
    }

    changeAgent(newAgent) {
        const availableAgents = config.commands.agent.available;

        if (!newAgent || newAgent.length === 0) {
            return `Available agents: ${availableAgents.join(', ')}`;
        }

        newAgent = newAgent.toLowerCase();

        if (availableAgents.includes(newAgent)) {
            this.socket.emit('agent_change', newAgent);
            return `Changed agent to ${newAgent}`;
        } else {
            return `Invalid agent. Available agents: ${availableAgents.join(', ')}`;
        }
    }
}

module.exports = Commands; 
