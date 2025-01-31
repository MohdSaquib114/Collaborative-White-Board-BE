"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const room_1 = require("./room");
const uuid_1 = require("uuid");
const rooms = {};
const socketServer = new ws_1.WebSocketServer({ port: 8080 });
socketServer.on("connection", (socket) => {
    socket.on("message", (data) => {
        var _a, _b, _c, _d, _e;
        const message = JSON.parse(data.toString());
        const roomId = message === null || message === void 0 ? void 0 : message.roomId;
        switch (message.type) {
            case "createRoom":
                try {
                    const room = new room_1.Room();
                    const newRoomId = (0, uuid_1.v4)();
                    room.addUser(message.payload.username, socket, true);
                    rooms[newRoomId] = room;
                    const response = {
                        type: "createRoom",
                        success: true,
                        payload: {
                            roomId: newRoomId,
                            username: (_a = message.payload) === null || _a === void 0 ? void 0 : _a.username,
                            isHost: true,
                        },
                    };
                    socket.send(JSON.stringify(response));
                }
                catch (error) {
                    socket.send(JSON.stringify({
                        success: false,
                        type: "createRoom",
                    }));
                }
                break;
            case "addUser":
                const currentRoom = rooms[roomId];
                if (!roomId || !((_b = message.payload) === null || _b === void 0 ? void 0 : _b.username)) {
                    socket.send(JSON.stringify({
                        type: "addUser",
                        success: false,
                        payload: {
                            message: "Room id or username is not provided",
                        },
                    }));
                }
                else if (!currentRoom) {
                    socket.send(JSON.stringify({
                        type: "addUser",
                        success: false,
                        payload: {
                            message: "No room exists",
                        },
                    }));
                }
                else if (currentRoom.users.has(message.payload.username)) {
                    socket.send(JSON.stringify({
                        type: "addUser",
                        success: false,
                        payload: {
                            message: "User already in the room",
                        },
                    }));
                }
                else {
                    currentRoom.users.set(message.payload.username, { socket: socket, isHost: false });
                    currentRoom.users.forEach((user, username) => {
                        if (username !== message.payload.username) {
                            user.socket.send(JSON.stringify({
                                type: "addUser",
                                success: true,
                                payload: {
                                    message: `${message.payload.username} joined the room`,
                                    username: message.payload.username,
                                },
                            }));
                        }
                    });
                    socket.send(JSON.stringify({
                        success: true,
                        type: "addUser",
                        payload: {
                            roomId: message.roomId,
                            username: message.payload.username,
                            isHost: false,
                        },
                    }));
                }
                break;
            case "room":
                const insideRoom = rooms[roomId];
                if (!insideRoom) {
                    socket.send(JSON.stringify({
                        type: "room",
                        success: false,
                        payload: {
                            message: "Room does not exist",
                        },
                    }));
                    return;
                }
                if (!insideRoom.users.has(message.payload.username)) {
                    insideRoom.addUser(message.payload.username, socket, message.payload.isHost);
                }
                const users = Array.from((_c = insideRoom === null || insideRoom === void 0 ? void 0 : insideRoom.users) === null || _c === void 0 ? void 0 : _c.keys()) || [];
                socket.send(JSON.stringify({
                    type: "room",
                    success: true,
                    payload: {
                        users: users,
                        messages: insideRoom.messages,
                    },
                }));
                break;
            case "message":
                const { username, message: newMessage } = message.payload;
                if (!roomId) {
                    socket.send(JSON.stringify({
                        type: "addUser",
                        success: false,
                        payload: {
                            message: "Room id is not provided",
                        },
                    }));
                    return;
                }
                const currentRoomM = rooms[roomId];
                console.log(newMessage, username);
                currentRoomM.addMessage(username, newMessage);
                currentRoomM.users.forEach((user) => {
                    user.socket.send(JSON.stringify({
                        type: "message",
                        success: true,
                        payload: {
                            message: newMessage,
                            username: message.payload.username,
                        },
                    }));
                });
                break;
            case "canvasUpdate":
                if (!roomId) {
                    socket.send(JSON.stringify({
                        type: "canvasUpdate",
                        success: false,
                        payload: {
                            message: "Room id is not provided",
                        },
                    }));
                    return;
                }
                const roomForCanvas = rooms[roomId];
                roomForCanvas.users.forEach((user) => {
                    if (socket !== user.socket) {
                        user.socket.send(JSON.stringify({
                            type: "canvasUpdate",
                            success: true,
                            payload: {
                                canvasData: message.payload,
                            },
                        }));
                    }
                });
                break;
            case "removeUser":
                const roomRemove = rooms[roomId];
                if (!roomRemove) {
                    socket.send(JSON.stringify({
                        type: "remove",
                        success: false,
                        payload: {
                            message: "Room id is not provided",
                        },
                    }));
                }
                else if (!((_d = message.payload) === null || _d === void 0 ? void 0 : _d.username)) {
                    socket.send(JSON.stringify({
                        type: "remove",
                        success: false,
                        payload: {
                            message: "Username is not provided",
                        },
                    }));
                }
                else {
                    roomRemove === null || roomRemove === void 0 ? void 0 : roomRemove.users.delete((_e = message.payload) === null || _e === void 0 ? void 0 : _e.username);
                    roomRemove === null || roomRemove === void 0 ? void 0 : roomRemove.users.forEach((userSocket, user) => {
                        userSocket.socket.send(JSON.stringify({
                            type: "remove",
                            success: true,
                            payload: {
                                username: message.payload.username,
                            },
                        }));
                    });
                }
                break;
        }
    });
    socket.on("close", () => {
        console.log("User disconnected");
    });
});
