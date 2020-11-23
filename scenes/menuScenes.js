// @ts-check
import {
	PLAYABLE_CHARACTERS,
	ANIMATION_SPEEDS,
	MODES,
	LOBBY,
	JUMP_QUEST,
    WALL,
	SERVER_URL,
	TEXTURE_NAMES,
	SCENES,
	ASSET_PATH,
} from '../constants/constants.js';

import SContainer from '../scripts/SContainer.js';

import socketTypes from '../constants/socketTypes.js';
import { createConnection, sock, currentConnectionId } from '../sockClient.js';

import { audioContext } from '../helpers/audio.js';
import createCharacter from '../helpers/playerCreator.js';
import createJumpQuest from '../helpers/jumpQuestCreator.js';

// import { valueStore } from '../';


// also create a player store? or object or w/e
// make an entity class and extend player from it

// import characterCreationMenu from './characterCreation.js';
// import createModeSelectionMenu from './modeSelection.js';
// import createStageSelection from './stageSelection.js';
// import createMultiplayerMenu from './multiplayerMenu.js';
let BACKGROUNDS = {
	MENU_BG: 'menuBg',
	LOBBY_BG: 'lobbyBg',
	STAGE1_BG: 'stage1Bg',
	STAGE2_BG: 'stage2Bg',
	STAGE3_BG: 'stage3Bg',
}

const {
	Sprite,
	AnimatedSprite,
	Container,
	Graphics,
	Texture,
	Text,
	TextInput,
	TilingSprite
} = PIXI;

export default createAllMenuScenes;

let MAIN_CONTAINER_WIDTH, MAIN_CONTAINER_HEIGHT;
let selectedPlayerMode;

let menuScenes;
let playerName;
let playerContainer;
let mainContainer;

let viewportSorter;

let entityGrid, statusText, loadingAnimation;

let menuSheet;
function createAllMenuScenes(
	app,
	loader,
	characterTextures, 
	tempObject,
) {

	// let {
	// 	player,
	// 	mainContainer,
	// 	viewportContainer,
	// 	viewportSorter,
	// 	entityGrid
	// } = tempObject;
	// let bg;
    //playerContainer = new Container();
    mainContainer = tempObject.mainContainer;
	let viewportContainer = tempObject.viewportContainer;
	viewportSorter = tempObject.viewportSorter;
	entityGrid = tempObject.entityGrid;
	//app = app;
//	loader = loader;

	menuSheet = loader.resources[ASSET_PATH + "sprites/menuSheet.json"].spritesheet;

	menuScenes = new SContainer();
	generateBackgrounds(menuScenes);

	MAIN_CONTAINER_HEIGHT = menuScenes.height;
    MAIN_CONTAINER_WIDTH = menuScenes.width;
    console.log(MAIN_CONTAINER_HEIGHT + " " + MAIN_CONTAINER_WIDTH);

	// const stage2Bg = new Sprite(menuSheet.textures['mediumStage.png']);
	// menuScenes.addChild(stage2Bg, 0);
	// menuScenes.stage2Bg = stage2Bg;
console.log(characterTextures);
	const characterCreationMenu = createCharacterCreationMenu(characterTextures);
	const modeSelectionMenu = createModeSelectionMenu();
	const stageSelectionMenu = createStageSelection(
								app,
								viewportContainer,
								viewportSorter,
								entityGrid,
								loader
							);

	const multiplayerMenu = createMultiplayerMenu();
	const multiplayerLobby = createMultiplayerLobby(loader);

	//add all the menus
	menuScenes.addChild(characterCreationMenu, 1);
	menuScenes.addChild(modeSelectionMenu, 1);
	menuScenes.addChild(stageSelectionMenu, 1);
	menuScenes.addChild(multiplayerMenu, 1);
	menuScenes.addChild(multiplayerLobby, 1)
	menuScenes[SCENES.CHAR_CREATION] = characterCreationMenu;
	menuScenes[SCENES.MODE_SELECTION] = modeSelectionMenu;
	menuScenes[SCENES.STAGE_SELECTION] = stageSelectionMenu;
	menuScenes[SCENES.MULTIPLAYER_MENU] = multiplayerMenu;
	menuScenes[SCENES.MULTIPLAYER_LOBBY] = multiplayerLobby;

	//menuScenes.characterCreationMenu.visible = false;
	menuScenes[SCENES.MODE_SELECTION].visible = false;
	menuScenes[SCENES.STAGE_SELECTION].visible = false;
	menuScenes[SCENES.MULTIPLAYER_MENU].visible = false;
    menuScenes[SCENES.MULTIPLAYER_LOBBY].visible = false;
	return menuScenes;
}

function generateBackgrounds(menuScenes) {
	const menuBg = new Sprite(menuSheet.textures['menuBackground.png']);
	menuScenes.addChild(menuBg, 0);
	menuScenes[BACKGROUNDS.MENU_BG] = menuBg;
	const stage1Bg = new Sprite(menuSheet.textures['easyStage.png']);
	menuScenes.addChild(stage1Bg, 0);
	menuScenes[BACKGROUNDS.STAGE1_BG] = stage1Bg;
	stage1Bg.visible = false;
	const lobbyBg = new Sprite(menuSheet.textures['lobby.png']);
	menuScenes.addChild(lobbyBg, 0);
	menuScenes[BACKGROUNDS.LOBBY_BG] = lobbyBg;
	lobbyBg.visible = false;
}

function createCharacterCreationMenu(characterTextures) {
    console.log(characterTextures);
	const characterCreation = new SContainer();
	const selectedCharacter = createSelectedCharacterContainer(characterTextures);
    console.log("YOU WAT");
    console.log(selectedCharacter.character);
	const characterSelection = createCharacterSelectionContainer(
								selectedCharacter.character,
								characterTextures
							   );
	// https://fontfaceobserver.com/ use this to display char name with font
	let nameField = new TextInput({
		input: {
			fontSize: '25pt',
			padding: '14px',
			width: '250px',
			color: '#26272E',
		},
		box: {
			default: { fill: 0xE8E9F3, rounded: 16, stroke: { color: 0xCBCEE0, width: 4 } },
			focused: { fill: 0xE1E3EE, rounded: 16, stroke: { color: 0xABAFC6, width: 4 } },
			disabled: { fill: 0xDBDBDB, rounded: 16 }
		}
	});
	nameField.x = MAIN_CONTAINER_WIDTH / 2 - nameField.width;
	nameField.y = MAIN_CONTAINER_HEIGHT - 100;
	nameField.maxLength = 12;
	nameField.placeholder = 'Your Name';

	let OKButton = new Sprite(menuSheet.textures['OKButton.png']);
	console.log(OKButton);
	OKButton
		.on('pointerdown', OKButtonClick)
		.on('pointerup', () => { 
			onCharCreation(nameField, characterSelection.charId) 
		})
		.on('pointerout', OKButtonOut);
	OKButton.x = MAIN_CONTAINER_WIDTH - (OKButton.width * 1.5);
	OKButton.y = nameField.y - (OKButton.height/2 - nameField.height/2);
	OKButton.interactive = true;

	characterCreation.addChild(characterSelection);
	characterSelection.y = 30;
	characterCreation.addChild(selectedCharacter);
	characterCreation.addChild(nameField, 1);
	characterCreation.addChild(OKButton, 1);
	return characterCreation;

	function onCharCreation(nameField, charId) {
		toggleMenuVisibility(SCENES.CHAR_CREATION, false);
		toggleMenuVisibility(SCENES.MODE_SELECTION, true);
		playerName = nameField.text ? nameField.text : 'Player';
		// subtract 1 from charId to account for 0 indexing in arrays
		playerContainer = createCharacter(playerName, charId - 1, characterTextures);
		menuScenes.playerContainer = playerContainer;
	}
}

function createSelectedCharacterContainer(characterTextures) {
	const selectedCharacter = new Container();

	const selectedCharFrame = new Graphics();
	selectedCharFrame.lineStyle(2, 0xFEEB77, 1);
	selectedCharFrame.beginFill(0x000000);
	selectedCharFrame.drawRect(0, 0, 200, 200);
	selectedCharFrame.endFill();
	selectedCharFrame.x -= 130;
	selectedCharFrame.y -= 150;
	selectedCharFrame.alpha = 0.7;
	selectedCharacter.addChild(selectedCharFrame);

	let currentCharacter = new AnimatedSprite(characterTextures[0].walkingTextures);
	currentCharacter.anchor.set(1);
	currentCharacter.animationSpeed = ANIMATION_SPEEDS.walkingTextures;
	currentCharacter.play();
	// currentCharacter.x = menuScenes.width - 100;
	// currentCharacter.y = menuScenes.height/2 + 50;
	currentCharacter.scale.x = 2;
	currentCharacter.scale.y = 2;
	currentCharacter.roundPixels = true;
	selectedCharacter.addChild(currentCharacter);
	selectedCharacter.character = currentCharacter;

	selectedCharacter.x = MAIN_CONTAINER_WIDTH - 100;
	selectedCharacter.y = MAIN_CONTAINER_HEIGHT / 2 + 50;

	return selectedCharacter;
}

function createCharacterSelectionContainer(characterInFrame, characterTextures) {
	const characterSelection = new Container();

	const characterSelectionBg = new Sprite(createGradTexture());
	characterSelectionBg.alpha = 0.8;
	characterSelectionBg.width = 500;
	characterSelectionBg.height = 350;
	characterSelectionBg.x = 20;
    characterSelectionBg.y = 50;
    characterSelection.charId = 1;
	console.log(characterSelectionBg);
	characterSelection.addChild(characterSelectionBg);

	const characterFrame = new Graphics()
		.beginFill(0x000000)
		.drawRect(0, 0, 100, 100)
		.endFill();
	characterFrame.alpha = 0.5;

	/* OR
	characterFrame
		.beginTextureFill({
			'texture': gradient('#ccbbaa', '#aa9977')
		})
		.drawRect(200, 50, 100, 100);
	characterFrame
		.lineStyle(2, 0xFEEB77, 1)
		.drawRect(200, 50, 100, 100)
		.endFill();
	*/
	let characterContainers = [], selectedCharId = 1;
	characterSelection.addChild(characterFrame);
	for (let a = 0; a < PLAYABLE_CHARACTERS.length; a++) {
		let characterContainer = new Container();
		let character;
		// let the first character be the default selected one
		if (a === 0) {
			character = new AnimatedSprite(characterTextures[a].alertTextures);
			character.animationSpeed = ANIMATION_SPEEDS.walkingTextures;
		} else {
			character = new AnimatedSprite(characterTextures[a].standingTextures);
			character.animationSpeed = ANIMATION_SPEEDS.standingTextures;
		}

		//character.anchor.set(Math.floor(character.width / 2) / character.width, Math.floor(character.height / 2) / character.height);
		character.roundPixels = true;
		character.anchor.set(1);
		//character.updateAnchor = true;
		character.play();


		characterContainer.addChild(character);
		characterContainer.character = character;
		characterContainer.characterId = PLAYABLE_CHARACTERS[a];

		characterContainer.x = 80 + character.width / 2 + 110 * (a % 4);
		characterContainer.y = 150 + 115 * Math.floor((a / 4));
		//characterContainer.y = 150 + 115 * Math.floor((a / 3)) - character.height/2;

		// character.onFrameChange = (a) => {
		// 	let character = characterContainers[a].character;
		// 	character.anchor.set( Math.floor(character.width / 2) / character.width, Math.floor(character.height / 2) / character.height);
		//  }

		characterContainer.interactive = true;

		characterContainer
			.on('pointerdown', characterClick)
			.on('pointerup', () => { onCharacterSelection(characterContainer) });
		characterSelection.addChild(characterContainer);
		characterContainers.push(characterContainer);
	}
	//characterFrame.x = characterContainers[0].x - characterContainers[0].character.width*1.28;
	//characterFrame.y = characterContainers[0].y - characterContainers[0].character.height*1.28;
	characterFrame.x = characterContainers[0].x - 75;
	characterFrame.y = characterContainers[0].y - 90;
	return characterSelection;

	// this function is in this closure to access the 'selectedCharId' variable
	function onCharacterSelection(characterContainer) {
		console.log("we have clicked!");
		audioContext.clickRelease.play();
		let currentCharId = characterContainer.characterId;
		if (selectedCharId === currentCharId) return;
		// change previously selected char from walking to standing
		let previousCharacter = characterContainers[selectedCharId - 1].character;
		let standingTextures = characterTextures[selectedCharId - 1].standingTextures;
		changeCharacterTextures(previousCharacter, standingTextures, TEXTURE_NAMES.STANDING);
		// change currently selected char from standing to walking
		let currentCharacter = characterContainers[currentCharId - 1].character;
		let walkingTextures = characterTextures[currentCharId - 1].walkingTextures;
		changeCharacterTextures(currentCharacter, walkingTextures, TEXTURE_NAMES.WALKING);
		// change framed character's walking textures
		changeCharacterTextures(characterInFrame, walkingTextures, TEXTURE_NAMES.WALKING);
		// characterFrame.x = container.x - container.character.width;
		// characterFrame.y = container.y - container.character.height/2 - 10;
		characterFrame.x = characterContainer.x - 75;
		characterFrame.y = characterContainer.y - 90;
		selectedCharId = currentCharId;
		characterSelection.charId = currentCharId;
	}
}

function createGradTexture() {
	// adjust it if somehow you need better quality for very very big images
	const quality = 256;
	const canvas = document.createElement('canvas');
	canvas.width = quality;
	canvas.height = 1;
	const ctx = canvas.getContext('2d');
	// use canvas2d API to create gradient
	const grd = ctx.createLinearGradient(0, 0, quality, 0);
	grd.addColorStop(0, '#606970');
	grd.addColorStop(1, '#1f2322');
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, quality, 1);
	return Texture.from(canvas);
}

function characterClick() {
	audioContext.click.play();
}

function changeCharacterTextures(character, textures, textureName) {
	character.textures = textures;
	character.animationSpeed = ANIMATION_SPEEDS[textureName];
	character.play();
}

function OKButtonClick() {
	this.texture = menuSheet.textures['OKButtonDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

function OKButtonOut() {
	this.texture = menuSheet.textures['OKButton.png'];
	this.cursor = 'default';
}

function createModeSelectionMenu() {
	const modeSelectionMenu = new Container();
	modeSelectionMenu.addChild(createSinglePlayerButton());
	modeSelectionMenu.addChild(createMultiplayerButton());
	return modeSelectionMenu;
}

function createSinglePlayerButton() {
	let singlePlayerButton = new Sprite(menuSheet.textures['singlePlayerButton.png']);

	// singlePlayerButton.anchor.set(0, 5);
	singlePlayerButton.interactive = true;
	singlePlayerButton.x = 223;
	singlePlayerButton.y = 100;

	singlePlayerButton
		.on('pointerover', onSinglePlayerButtonHover)
		.on('pointerdown', onSinglePlayerClick)
		.on('pointerup', onSinglePlayerSelection)
		.on('pointerout', onSinglePlayerOut);

	return singlePlayerButton;
}

function onSinglePlayerButtonHover() {
	this.cursor = 'hover';
}

function onSinglePlayerClick() {
	this.texture = menuSheet.textures['singlePlayerButtonDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

function onSinglePlayerSelection() {
	toggleMenuVisibility(SCENES.MODE_SELECTION, false);
	toggleMenuVisibility(SCENES.STAGE_SELECTION, true);
	selectedPlayerMode = MODES.SINGLE_PLAYER;
	audioContext.clickRelease.play();
}

function onSinglePlayerOut() {
	this.texture = menuSheet.textures['singlePlayerButton.png'];
	this.cursor = 'default';
}

function createMultiplayerButton() {
	let multiplayerButton = new Sprite(menuSheet.textures['multiplayerButton.png']);

	//multiplayerButton.anchor.set(0, 0.5);
	multiplayerButton.interactive = true;
	multiplayerButton.x = 223;
	multiplayerButton.y = 300;

	multiplayerButton
		.on('pointerdown', onMultiplayerClick)
		.on('pointerup', onMultiplayerSelection)
		.on('pointerout', onMultiplayerOut);

	return multiplayerButton;
}

function onMultiplayerClick() {
	this.texture = menuSheet.textures['multiplayerButtonDown.png'];
	audioContext.click.play();
}

function onMultiplayerSelection() {
	toggleMenuVisibility(SCENES.MODE_SELECTION, false);
	toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, true);
	selectedPlayerMode = MODES.MULTIPLAYER;
	audioContext.clickRelease.play();
}

function onMultiplayerOut() {
	this.texture = menuSheet.textures['multiplayerButton.png'];
}

function createStageSelection(
	app,
	viewportContainer,
	viewportSorter,
	entityGrid,
	loader
) {
	const stageMenu = new Container();
	let OKButton = new Sprite(menuSheet.textures['OKButton.png']);

	let stage1Button = new Sprite(menuSheet.textures['superEasyMode.png']);
	stageMenu.addChild(stage1Button);

	stage1Button.scale.x = 0.8;
	stage1Button.scale.y = 0.8;
	stage1Button.x = 50;
	stage1Button.y = MAIN_CONTAINER_HEIGHT / 3 - stage1Button.height;
	stage1Button.interactive = true;
	console.log(stage1Button.x + " " + stage1Button.y);

	let stage2Button = new Sprite(menuSheet.textures['easyMode.png']);
	stageMenu.addChild(stage2Button);

	stage2Button.scale.x = 0.8;
	stage2Button.scale.y = 0.8;
	stage2Button.x = MAIN_CONTAINER_WIDTH - stage2Button.width - 50;
	stage2Button.y = MAIN_CONTAINER_HEIGHT / 3 - stage2Button.height;
	stage2Button.interactive = true;

	let stageButtons = [stage1Button, stage2Button];
	let selectedStage = 1;
	stage1Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(1, stage1Button, stageButtons) })
		.on('pointerout', onStageButtonOut);

	stage2Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(2, stage2Button, stageButtons) })
		.on('pointerout', onStageButtonOut);

	OKButton
		.on('pointerdown', OKButtonClick)
		.on('pointerup', onStageConfirm)
		.on('pointerout', OKButtonOut);

	OKButton.interactive = true;
	OKButton.x = 350;
	OKButton.y = 350;
	stageMenu.addChild(OKButton);

	return stageMenu;

	// these functions are in this closure so they can access the 
	// 'selectedStage' variable
	function onStageSelect(stage, stage1Button, stageButtons) {
		stageButtons.forEach((button) => button.alpha = 1);
		stage1Button.alpha = 0.5;
		selectedStage = stage;
		audioContext.clickRelease.play();
		hideAllBackgrounds();
		switch (stage) {
			case 1:
				toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, true);
				break;
			case 2:
				//menuScenes.stage2Bg.visible = true;
				break;
			case 3:
				toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, true);
				break;
			default:
				toggleMenuVisibility(BACKGROUNDS.STAGE3_BG, true);
				break;
		}
	}

	function onStageConfirm() {
		let args = [
			mainContainer,
			viewportContainer,
			loader,
			viewportSorter,
			entityGrid,
			app,
			audioContext,
			playerContainer
		];
		switch (selectedPlayerMode) {
			case MODES.SINGLE_PLAYER:
				createJumpQuest(...args, selectedStage);
				break;
			case MODES.MULTIPLAYER:
				handleMultiplayerStageConfirm();
				createJumpQuest(...args, selectedStage);
				break;
			default:
				break;
		}
		toggleMenuVisibility(SCENES.STAGE_SELECTION, false);
	}

	function handleMultiplayerStageConfirm() {
		let currentScene;
		switch (selectedStage) {
			case 1:
				currentScene = SCENES.JUMP_QUEST_1;
				break;
			case 2:
				currentScene = SCENES.JUMP_QUEST_2;
				break;
			case 3:
				currentScene = SCENES.JUMP_QUEST_3;
				break;
			default:
				currentScene = SCENES.JUMP_QUEST_1;
				break;
		}
		sock.send(JSON.stringify({
			type: socketTypes.UPDATE_SCENE,
			scene: currentScene
		}));
	}
    
}

function stageButtonClick() {
	audioContext.click.play();
	this.cursor = 'click';

}

function hideAllBackgrounds() {
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, false);
	// toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, false);
	// toggleMenuVisibility(BACKGROUNDS.STAGE3_BG, false);
}

function onStageButtonOut() {
	this.cursor = 'default';
}

function spawnPlayer(mode, playerContainer) {
	switch (mode) {
		case LOBBY:
			addChildToScene(SCENES.MULTIPLAYER_LOBBY, playerContainer);
			playerContainer.y = -50;
			playerContainer.x = 550;
			break;
		case JUMP_QUEST:
			playerContainer.y = -50;
			playerContainer.x = 100;
			break;
		default:
			break;
	}
	// changeCharacterState(player, STATES.FALLING);
}

function generateLobbyBoundaries() {
	let floor = new Sprite();
	floor.x = 0;
	floor.y = 455;
	floor.width = 1000;
	floor.height = 1000;

	let leftWall = new Sprite();
	leftWall.x = -10;
	leftWall.width = 10;
	leftWall.height = 1000;
	leftWall.type = WALL;

	let rightWall = new Sprite();
	rightWall.x = MAIN_CONTAINER_WIDTH - 10;
	rightWall.width = 10;
	rightWall.height = 1000;
	rightWall.type = WALL;

	return [floor, leftWall, rightWall];
}

function createMultiplayerMenu() {
	const multiplayerMenu = new Container();
	// const createRoom = new Container();
	// const joinRoom = new Container();

	statusText = new Text('', {
        fontFamily: 'Times New Roman',
        fontSize: 40,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	statusText.visible = false;

	let createRoom = new Sprite(menuSheet.textures['createRoom.png']);
	createRoom
		.on('pointerdown', createRoomClick)
		.on('pointerup', () => { onRoomCreation() })
		.on('pointerout', createRoomOut);

	createRoom.interactive = true;
	createRoom.x = 100;
	createRoom.y = MAIN_CONTAINER_HEIGHT / 2 - createRoom.height / 2;

	let roomField = new TextInput({
		input: {
			fontSize: '25pt',
			padding: '14px',
			width: '250px',
			color: '#000000',
		},
		box: {
			default: { fill: 0xE8E9F3, rounded: 16, stroke: { color: 0xCBCEE0, width: 4 } },
			focused: { fill: 0xE1E3EE, rounded: 16, stroke: { color: 0xABAFC6, width: 4 } },
			disabled: { fill: 0xDBDBDB, rounded: 16 }
		}
	});

	roomField.maxLength = 4;
	roomField.placeholder = 'Room number';

	let joinRoom = new Sprite(menuSheet.textures['joinRoom.png']);
	joinRoom
		.on('pointerdown', joinRoomClick)
		.on('pointerup', () => { onJoinRoom(roomField) } )
		.on('pointerout', joinRoomOut);

	joinRoom.interactive = true;
	joinRoom.x = MAIN_CONTAINER_WIDTH - joinRoom.width/2 - 200;
	joinRoom.y = MAIN_CONTAINER_HEIGHT / 2;

	roomField.x = MAIN_CONTAINER_WIDTH - roomField.width/2 - 200;
	roomField.y = joinRoom.y - roomField.height;

	multiplayerMenu.addChild(createRoom);
	multiplayerMenu.addChild(joinRoom);
	multiplayerMenu.addChild(roomField);
	multiplayerMenu.addChild(statusText);
	return multiplayerMenu;
}

function createRoomClick() {

}

function onRoomCreation() {
	handleStatusText();
	loadingAnimation = createLoadingAnimationInterval();

	let createRoom = JSON.stringify({
		type: socketTypes.CREATE_ROOM,
		player: {
			playerName,
			charId: playerContainer.charId,
			currentTextures: TEXTURE_NAMES.JUMPING,
			previousTextures: '',
			x: playerContainer.x,
			y: playerContainer.y
		}
	});
	// the sock client calls the handleSuccessfulRoomCreation function
	// TODO: figure out a way to decouple this
	createConnection(SERVER_URL, [createRoom]);

	sock.onclose = function() {
		console.log("connection closed");
		clearInterval(loadingAnimation);
		statusText.text = "Error: failed to connect to server";
		statusText.x = MAIN_CONTAINER_WIDTH/2 - statusText.width/2;
		statusText.style.fill = 0xF00909;
    }
}

function handleStatusText() {
	statusText.text = 'Loading';
	statusText.style.fill = 0x000000;
	statusText.visible = true;
	statusText.x = MAIN_CONTAINER_WIDTH/2 - statusText.width/2;
	statusText.y = MAIN_CONTAINER_HEIGHT/4 - statusText.height;
}

function createLoadingAnimationInterval() {
	let loadingText = statusText.text;
	let finalLoadingText = 'Loading....';
	return setInterval(() => {
		statusText.text = loadingText;
		loadingText += '.';
		if (loadingText === finalLoadingText) loadingText = 'Loading';
		
	}, 300);
}

function handleSuccessfulRoomCreation(roomId) {
	statusText.visible = false;
	clearInterval(loadingAnimation);
	toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, false);
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
	spawnPlayer(LOBBY, playerContainer);
	entityGrid[0] = generateLobbyBoundaries();

	let startButton = new Sprite(menuSheet.textures['start.png']);
	startButton
		.on('pointerdown', startClick)
		.on('pointerup', onMultiplayerStart)
		.on('pointerout', startOut);
	startButton.interactive = true;
	startButton.x = MAIN_CONTAINER_WIDTH - startButton.width - 50;
	startButton.y = startButton.height / 2;
	addChildToScene(SCENES.MULTIPLAYER_LOBBY, startButton);

	setRoomIdNumber(roomId);
}

function setRoomIdNumber(roomId) {
	menuScenes.multiplayerLobby.roomIdNumber.text = roomId;
}

function startClick() {
	this.texture = menuSheet.textures['startDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

function onMultiplayerStart() {
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, false);
	toggleMenuVisibility(SCENES.STAGE_SELECTION, true);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, false);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, true);
	selectedPlayerMode = MODES.MULTIPLAYER;
	audioContext.clickRelease.play();
}

function startOut() {
	this.texture = menuSheet.textures['start.png'];
	this.cursor = 'default';
}

function createRoomOut() {

}

function joinRoomClick() {

}

async function onJoinRoom(roomField) {
	handleStatusText();
	loadingAnimation = createLoadingAnimationInterval();

	let joinRoom = JSON.stringify({
		type: socketTypes.JOIN_ROOM,
		roomId: roomField.text,
		player: {
			playerName,
			charId: playerContainer.charId,
			currentTextures: TEXTURE_NAMES.JUMPING,
			previousTextures: '',
			x: playerContainer.x,
			y: playerContainer.y
		}
	});
	// the sock client calls the handleSuccessfulJoinRoom function
	// TODO: figure out a way to decouple this
	createConnection(SERVER_URL, [joinRoom]);

	sock.onclose = function() {
		console.log("connection closed");
		clearInterval(loadingAnimation);
		statusText.text = "Error: failed to join room.";
		statusText.x = MAIN_CONTAINER_WIDTH/2 - statusText.width/2;
		statusText.style.fill = 0xF00909;
    }
}

function handleSuccessfulJoinRoom(roomId) {
	statusText.visible = false;
	toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, false);
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
	spawnPlayer(LOBBY, playerContainer);
	entityGrid[0] = generateLobbyBoundaries();
	clearInterval(loadingAnimation);
	setRoomIdNumber(roomId);
}

function joinRoomOut() {

}

function createMultiplayerLobby(loader) {
	const multiplayerLobby = new Container();
	//generate the lobby scene
	let roomIdText = new Text('Room ID', {
		fontFamily: 'Times New Roman',
		fontSize: 20,
		fill: 0xFFFFFF,
		align: 'center',
		fontWeight: 'bold',
	});
	let roomIdNumber = new Text('test', {
		fontFamily: 'Times New Roman',
		fontSize: 35,
		fill: 0xFFFFFF,
		align: 'center',
		fontWeight: 'bold',
	});
	let roomIdContainer = new Container();
	// let stand = new Sprite(menuSheet.textures['roomIdStand.png']);
	let stand = new Sprite(loader.resources.roomIdStand.texture);
	stand.scale.x = 0.4;
	stand.scale.y = 0.4;
	roomIdContainer.addChild(stand);
	roomIdContainer.addChild(roomIdText);
	roomIdContainer.addChild(roomIdNumber);

	roomIdContainer.x = 10;
	roomIdContainer.y = 245;
	roomIdText.y = stand.height/3.225;
	roomIdText.x = stand.width/3.273 - 5;
	roomIdNumber.y = stand.height/1.56 - roomIdNumber.height/2;
	roomIdNumber.x = stand.width/3.273;

	roomIdContainer.alpha = 0.9;

	multiplayerLobby.addChild(roomIdContainer);
	multiplayerLobby.roomIdNumber = roomIdNumber;

	return multiplayerLobby;
}



//we incorporate this into a grid array later
const stepPositions = [
	// { x: 50, y: -100},
	{ x: 150, y: -50 },
	{ x: 230, y: -110 },
	// { x: 250, y: -100 },
	// { x: 300, y: -150 },
	// { x: 350, y: -150 },
	// { x: 250, y: -200 },
	// { x: 400, y: -250 },
]

function toggleMenuVisibility(target, visible) {
	menuScenes[target].visible = visible;
};

function addChildToScene(scene, child) {
	menuScenes[scene].addChild(child);
}

export {
	handleSuccessfulRoomCreation,
	handleSuccessfulJoinRoom
}