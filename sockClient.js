import socketTypes from './constants/socketTypes.js';
import { CONNECTION_STATUS } from './constants/constants.js';
import { 
    handleSuccessfulRoomCreation,
    handleSuccessfulJoinRoom
} from './scenes/menuScenes.js';
import { changeScene } from './main.js';

let sock;
let currentConnectionId = '';

let updatedPlayerProperties = [];
let playersToRemove = [];

let connectionStatus = CONNECTION_STATUS.PENDING;

function createConnection(url, messages) {
    sock = new SockJS(url);
    console.log(sock);
    console.log(url);
    console.log("establishing connection...");
    sock.onopen = function() {
        console.log("Connected to server");
        messages.forEach((message) => sock.send(message));
    }
    addMessageHandlers();
}

function addMessageHandlers() {
    sock.onmessage = function(rawMessage) {
        let message = JSON.parse(rawMessage.data);
        if (message.type !== socketTypes.UPDATE_PLAYER_LIST) {
            console.log(message);
        }
        switch(message.type) {
            case socketTypes.UPDATE_PLAYER_LIST:
                //console.log(message);
                updatedPlayerProperties = message.playerList;
                break;
            case socketTypes.PLAYER_REMOVED:
                playersToRemove.push(message.player);
                break;
            case socketTypes.ROOM_CREATED:
                handleSuccessfulRoomCreation(message.roomId);
                break;
            case socketTypes.JOIN_ROOM_SUCCESS:
                handleSuccessfulJoinRoom(message.roomId);
                break;
            case socketTypes.JOIN_ROOM_ERROR:
                sock.close();
                break;
            case socketTypes.SCENE_UPDATED:
                changeScene(message.scene);
                break;
            case socketTypes.INIT:
                currentConnectionId = message.connectionId;
                connectionStatus = CONNECTION_STATUS.SUCCESS;
                console.log("initialized");
                break;
            case socketTypes.ERROR:
                console.log(rawMessage);
                //connectionStatus = CONNECTION_STATUS.ERROR;
                break;
        }  
    };
}

function playerUpdate(data) {
    otherPlayers = data;
}

export {
    sock,
    currentConnectionId,
    createConnection,
    addMessageHandlers,
    connectionStatus,
    updatedPlayerProperties,
    playersToRemove,
}