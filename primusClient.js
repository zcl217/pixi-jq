import socketTypes from './constants/socketTypes.js';
import { CONNECTION_STATUS } from './constants/constants.js';
import { 
    handleSuccessfulRoomCreation,
    handleSuccessfulJoinRoom
} from './scenes/menuScenes.js';
import { changeScene, initiateTimer, setPlayerReachedGoal } from './main.js';

let primus;
let currentConnectionId = '';

let updatedPlayerProperties = [];
let playersToRemove = [];

let connectionStatus = CONNECTION_STATUS.PENDING;

function createConnection(url, messages) {
    primus = Primus.connect(url, {
        reconnect: {
            max: 3000
          , min: 500
          , retries: 5
        }
      });
      
    console.log("establishing connection...");
    primus.on('open', function() {
        console.log("Connected to server");
        messages.forEach((message) => primus.write(message));
    });
    addMessageHandlers();
}

function addMessageHandlers() {
    primus.on('data', function(message) {
        if (message.type !== socketTypes.UPDATE_PLAYER_LIST) {
            // console.log(message);
        }
        switch(message.type) {
            case socketTypes.UPDATE_PLAYER_LIST:
                updatedPlayerProperties = message.playerList;
                break;
            case socketTypes.PLAYER_REMOVED:
                playersToRemove.push(message.connectionId);
                break;
            case socketTypes.ROOM_CREATED:
                handleSuccessfulRoomCreation(message.roomId);
                break;
            case socketTypes.JOIN_ROOM_SUCCESS:
                handleSuccessfulJoinRoom(message.roomId);
                break;
            case socketTypes.JOIN_ROOM_ERROR:
                primus.end();
                break;
            case socketTypes.SCENE_UPDATED:
                changeScene(message.scene);
                break;
            case socketTypes.REACHED_GOAL:
                initiateTimer();
                setPlayerReachedGoal();
                break;
            case socketTypes.INIT:
                currentConnectionId = message.connectionId;
                connectionStatus = CONNECTION_STATUS.SUCCESS;
                break;
            case socketTypes.ERROR:
                console.log(message);
                break;
        }  
    });
}
export {
    primus,
    currentConnectionId,
    createConnection,
    addMessageHandlers,
    connectionStatus,
    updatedPlayerProperties,
    playersToRemove,
}