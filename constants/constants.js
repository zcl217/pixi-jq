const STATES = {
    ALERT: "ALERT",
    STANDING: "STANDING",
    WALKING: "WALKING",
    JUMPING: "JUMPING",
    FALLING: "FALLING",
    PRONE: "PRONE",
    DISABLED: "DISABLED",
}

const TEXTURE_NAMES = {
    ALERT: "alertTextures",
    STANDING: "standingTextures",
    WALKING: "walkingTextures",
    JUMPING: "jumpTexture",
    FALLING: "jumpTexture",
    PRONE: "proneTexture",
}

const MODES = {
    SINGLE_PLAYER: "SINGLE_PLAYER",
    MULTIPLAYER: "MULTIPLAYER",
}

let SCENES = {
    START: 'startMenu',
	CHAR_CREATION: 'characterCreationMenu',
	MODE_SELECTION: 'modeSelectionMenu',
	STAGE_SELECTION: 'stageSelectionMenu',
	MULTIPLAYER_MENU: 'multiplayerMenu',
    MULTIPLAYER_LOBBY: 'multiplayerLobby',
    JUMP_QUEST_1: 'jumpQuest1',
    JUMP_QUEST_2: 'jumpQuest2',
    JUMP_QUEST_3: 'jumpQuest3',
    JUMP_QUEST_4: 'jumpQuest4',
}

const LOBBY = "LOBBY";
const JUMP_QUEST = "JUMP_QUEST";

const PLAYER_XVELOCITY = 1.7;
// const PLAYER_XVELOCITY = 5;
const PLAYER_HEIGHT_ADJUSTMENT = 0;
const PLAYER_WIDTH_ADJUSTMENT = 10;

const BACKGROUND_SCALING_FAR = 0.003;
const BACKGROUND_SCALING_NEAR = 0.01;

const TERMINAL_VELOCITY = 10;
const GRAVITY = 0.5;

const NEXT_STEP_X = 85;
const NEXT_STEP_Y = 60;



const FINAL_PLATFORM = "finalPlatform";
const OBSTACLE = "obstacle";
const TELEPORT_PLATFORM = "teleportPlatform";
const PLATFORM = "platform";
const WALL = "wall";
const HORIZONTAL = "horizontal";
const VERTICAL = "vertical";
const INVISIBLE = "invisible";

const ANIMATION_SPEEDS = {
    walkingTextures: 0.07,
    alertTextures: 0.07,
    standingTextures: 0.025
}

let PLAYABLE_CHARACTERS = [];
for (let a = 1; a <= 13; a++) PLAYABLE_CHARACTERS.push(a.toString());

const LOBBY_START_POSITION_X = 550;
const LOBBY_START_POSITION_Y = -50;

let local = false;

let SERVER_URL;
let LUDI_START_POSITION_X;
let LUDI_START_POSITION_Y;
let MUSH_START_POSITION_X;
let MUSH_START_POSITION_Y;
if (local) {
    SERVER_URL = "http://localhost:3333/test";

    // LUDI_START_POSITION_X = 610;
    // LUDI_START_POSITION_Y = -1730;
        LUDI_START_POSITION_X = 610;
    LUDI_START_POSITION_Y = -1330;

    MUSH_START_POSITION_X = 2710;
    //MUSH_START_POSITION_X = 1175;
    MUSH_START_POSITION_Y = -600;
} else {
    SERVER_URL = "https://jq-server-sock-333.herokuapp.com/test";
    LUDI_START_POSITION_X = 760;
    LUDI_START_POSITION_Y = -400;
    MUSH_START_POSITION_X = 1070;
    MUSH_START_POSITION_Y = -150;
}

const TIME_REMAINING = 60;


const CONNECTION_STATUS = {
    PENDING: "PENDING",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR"
}

const ASSET_PATH = './';
// const ASSET_PATH =  "https://cors-anywhere.herokuapp.com/https://zcl217.github.io/jq-assets/";


export {
    STATES,
    TEXTURE_NAMES,
    MODES,
    PLAYER_XVELOCITY,
    PLAYER_HEIGHT_ADJUSTMENT,
    PLAYER_WIDTH_ADJUSTMENT,
    BACKGROUND_SCALING_FAR,
    BACKGROUND_SCALING_NEAR,
    TERMINAL_VELOCITY,
    FINAL_PLATFORM,
    TELEPORT_PLATFORM,
    OBSTACLE,
    PLATFORM,
    WALL,
    HORIZONTAL,
    VERTICAL,
    INVISIBLE,
    GRAVITY,
    NEXT_STEP_X,
    NEXT_STEP_Y,
    PLAYABLE_CHARACTERS,
    ANIMATION_SPEEDS,
    LOBBY,
    JUMP_QUEST,
    SERVER_URL,
    TIME_REMAINING,
    CONNECTION_STATUS,
    SCENES,
    ASSET_PATH,
    LUDI_START_POSITION_Y,
    LUDI_START_POSITION_X,
    MUSH_START_POSITION_Y,
    MUSH_START_POSITION_X,
    LOBBY_START_POSITION_X,
    LOBBY_START_POSITION_Y,
};