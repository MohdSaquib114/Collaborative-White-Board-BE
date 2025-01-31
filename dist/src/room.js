"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
class Room {
    constructor() {
        this.users = new Map();
        this.messages = [];
    }
    addUser(username, socket, isHost) {
        const existingUser = this.users.get(username);
        if (existingUser) {
            return false;
        }
        this.users.set(username, { socket, isHost });
        return true;
    }
    removeUser(name) {
        const existingUser = this.users.get(name);
        if (existingUser) {
            this.users.delete(name);
            return true;
        }
        return false;
    }
    //   assignNewHost():string | undefined {
    //     const [username,userSocket] = this.users.entries().next().value || []
    //     if(username && userSocket){
    //         this.host = userSocket
    //         this.hostName = username
    //         this.users.delete(username)
    //     }
    //     return username 
    //   }
    addMessage(username, message) {
        this.messages.push({ username, message });
    }
    getMessage() {
        return this.messages;
    }
}
exports.Room = Room;
