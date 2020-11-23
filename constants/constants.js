const STATES = {
    STANDING: "STANDING",
    WALKING: "WALKING",
    JUMPING: "JUMPING",
    FALLING: "FALLING",
}

const TEXTURE_NAMES = {
    STANDING: "standingTextures",
    WALKING: "walkingTextures",
    JUMPING: "jumpTexture",
    FALLING: "jumpTexture"
}

const MODES = {
    SINGLE_PLAYER: "SINGLE_PLAYER",
    MULTIPLAYER: "MULTIPLAYER",
}

let SCENES = {
	CHAR_CREATION: 'characterCreationMenu',
	MODE_SELECTION: 'modeSelectionMenu',
	STAGE_SELECTION: 'stageSelectionMenu',
	MULTIPLAYER_MENU: 'multiplayerMenu',
    MULTIPLAYER_LOBBY: 'multiplayerLobby',
    JUMP_QUEST_1: 'jumpQuest1',
    JUMP_QUEST_2: 'jumpQuest2',
    JUMP_QUEST_3: 'jumpQuest3',
}

const LOBBY = "LOBBY";
const JUMP_QUEST = "JUMP_QUEST";

const PLAYER_XVELOCITY = 1.7;
const PLAYER_HEIGHT_ADJUSTMENT = 0;
const PLAYER_WIDTH_ADJUSTMENT = 10;

const BACKGROUND_SCALING_FAR = 0.003;
const BACKGROUND_SCALING_NEAR = 0.01;

const TERMINAL_VELOCITY = 10;
const GRAVITY = 0.5;

const NEXT_STEP_X = 80;
const NEXT_STEP_Y = 60;

const FINAL_PLATFORM = "finalPlatform";
const OBSTACLE = "obstacle";
const PLATFORM = "platform";
const WALL = "wall";
const HORIZONTAL = "horizontal";
const VERTICAL = "vertical";

const ANIMATION_SPEEDS = {
    walkingTextures: 0.07,
    standingTextures: 0.025
}

let PLAYABLE_CHARACTERS = [];
for (let a = 1; a <= 12; a++) PLAYABLE_CHARACTERS.push(a.toString());
console.log(PLAYABLE_CHARACTERS);

const SERVER_URL = "https://jq-server-sock-333.herokuapp.com/test";
//const SERVER_URL = "http://localhost:3333/test";

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
    OBSTACLE,
    PLATFORM,
    WALL,
    HORIZONTAL,
    VERTICAL,
    GRAVITY,
    NEXT_STEP_X,
    NEXT_STEP_Y,
    PLAYABLE_CHARACTERS,
    ANIMATION_SPEEDS,
    LOBBY,
    JUMP_QUEST,
    SERVER_URL,
    CONNECTION_STATUS,
    SCENES,
    ASSET_PATH
};