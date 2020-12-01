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
	LOBBY_START_POSITION_X,
	LOBBY_START_POSITION_Y,
} from '../constants/constants.js';
import socketTypes from '../constants/socketTypes.js';

import SContainer from '../scripts/SContainer.js';

import { createConnection, sock, currentConnectionId } from '../sockClient.js';

import { audioContext } from '../helpers/audio.js';
import createCharacter from '../helpers/playerCreator.js';
import { changeScene, setPlayerContainer } from '../main.js';

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
	STAGE4_BG: 'stage4Bg',
}

const {
	Sprite,
	AnimatedSprite,
	Container,
	Graphics,
	Texture,
	Text,
	TextInput,
} = PIXI;

let MAIN_CONTAINER_WIDTH, MAIN_CONTAINER_HEIGHT;
let selectedPlayerMode;

let menuScenes;
let playerName;
let playerContainer;

let entityGrid, loadingAnimation;

let menuSheet;
function createAllMenuScenes(mainContainer, loader, characterTextures, entityGrid1) {

	menuSheet = loader.resources[ASSET_PATH + "sprites/menuSheet.json"].spritesheet;

	menuScenes = new SContainer();
	generateBackgrounds(menuScenes);

	MAIN_CONTAINER_HEIGHT = menuScenes.height;
    MAIN_CONTAINER_WIDTH = menuScenes.width;
	entityGrid = entityGrid1;

	const startMenu = createStartMenu();
	const characterCreationMenu = createCharacterCreationMenu(characterTextures);
	const modeSelectionMenu = createModeSelectionMenu();
	const stageSelectionMenu = createStageSelection(mainContainer);

	const multiplayerMenu = createMultiplayerMenu();
	const multiplayerLobby = createMultiplayerLobby();

	//add all the menus
	menuScenes.addChild(startMenu, 1);
	menuScenes.addChild(characterCreationMenu, 1);
	menuScenes.addChild(modeSelectionMenu, 1);
	menuScenes.addChild(stageSelectionMenu, 1);
	menuScenes.addChild(multiplayerMenu, 1);
	menuScenes.addChild(multiplayerLobby, 1);
	menuScenes[SCENES.START] = startMenu;
	menuScenes[SCENES.CHAR_CREATION] = characterCreationMenu;
	menuScenes[SCENES.MODE_SELECTION] = modeSelectionMenu;
	menuScenes[SCENES.STAGE_SELECTION] = stageSelectionMenu;
	menuScenes[SCENES.MULTIPLAYER_MENU] = multiplayerMenu;
	menuScenes[SCENES.MULTIPLAYER_LOBBY] = multiplayerLobby;

	menuScenes[SCENES.CHAR_CREATION].visible = false;
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
	const stage1Bg = new Sprite(menuSheet.textures['ludiStage.png']);
	menuScenes.addChild(stage1Bg, 0);
	menuScenes[BACKGROUNDS.STAGE1_BG] = stage1Bg;
	stage1Bg.visible = false;

	const stage2Bg = new Sprite(menuSheet.textures['mushStage.png']);
	menuScenes.addChild(stage2Bg, 0);
	menuScenes[BACKGROUNDS.STAGE2_BG] = stage2Bg;
	stage2Bg.visible = false;

	const lobbyBg = new Sprite(menuSheet.textures['lobby.png']);
	menuScenes.addChild(lobbyBg, 0);
	menuScenes[BACKGROUNDS.LOBBY_BG] = lobbyBg;
	lobbyBg.visible = false;
}

function createStartMenu() {
	let startMenu = new Container();
	let left = new Sprite(menuSheet.textures['left.png']);
	let right = new Sprite(menuSheet.textures['right.png']);
	let down = new Sprite(menuSheet.textures['down.png']);
	let spacebar = new Sprite(menuSheet.textures['spacebar.png']);

	const controlsText = new Text('CONTROLS', {
        fontFamily: 'Times New Roman',
        fontSize: 40,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	controlsText.x = MAIN_CONTAINER_WIDTH/2 - controlsText.width/2;
	controlsText.y = 10;

	const leftText = new Text('Move left', {
        fontFamily: 'Times New Roman',
        fontSize: 30,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	left.x = MAIN_CONTAINER_WIDTH/3;
	left.y = controlsText.y + leftText.height * 3;
	leftText.x = left.x + controlsText.width/2 + 15;
	leftText.y = left.y;

	const rightText = new Text('Move right', {
        fontFamily: 'Times New Roman',
        fontSize: 30,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	right.x = MAIN_CONTAINER_WIDTH/3;
	right.y = left.y + rightText.height * 2;
	rightText.x = right.x + controlsText.width/2 + 15;
	rightText.y = right.y;

	const downText = new Text('Duck', {
        fontFamily: 'Times New Roman',
        fontSize: 30,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	down.x = MAIN_CONTAINER_WIDTH/3;
	down.y = right.y + downText.height * 2;
	downText.x = down.x + controlsText.width/2 + 15;
	downText.y = down.y;

	const spacebarText = new Text('Jump', {
        fontFamily: 'Times New Roman',
        fontSize: 30,
        fill: 0x000000,
		align: 'center',
		fontWeight: 'bold',
	});
	spacebar.x = MAIN_CONTAINER_WIDTH/3 - spacebar.width/2 + 15;
	spacebar.y = down.y + spacebarText.height * 2;
	spacebarText.x = left.x + controlsText.width/2 + 15;
	spacebarText.y = spacebar.y;

	let startButton = new Sprite(menuSheet.textures['start.png']);
	startButton
		.on('pointerdown', startClick)
		.on('pointerup', onMainMenuStart)
		.on('pointerout', startOut);
	startButton.interactive = true;
	startButton.x = MAIN_CONTAINER_WIDTH / 2 - startButton.width / 2;
	startButton.y = MAIN_CONTAINER_HEIGHT - startButton.height * 1.5;
	
	startMenu.addChild(controlsText);
	startMenu.addChild(left);
	startMenu.addChild(right);
	startMenu.addChild(down);
	startMenu.addChild(spacebar);
	startMenu.addChild(leftText);
	startMenu.addChild(rightText);
	startMenu.addChild(downText);
	startMenu.addChild(spacebarText);
	startMenu.addChild(startButton);

	return startMenu;
}

function startClick() {
	this.texture = menuSheet.textures['startDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

function onMainMenuStart() {
	audioContext.click.play();
	this.cursor = 'default';
	toggleMenuVisibility(SCENES.START, false);
	toggleMenuVisibility(SCENES.CHAR_CREATION, true);
}

function startOut() {
	this.texture = menuSheet.textures['start.png'];
	this.cursor = 'default';
}



function createCharacterCreationMenu(characterTextures) {
	const characterCreation = new SContainer();
	const selectedCharacter = createSelectedCharacterContainer(characterTextures);
	const characterSelection = createCharacterSelectionContainer(
								selectedCharacter.character,
								characterTextures
							   );
	// https://fontfaceobserver.com/ use this to display char name with font
	let nameField = new TextInput({
		input: {
			fontSize: '20pt',
			padding: '14px',
			width: '200px',
			color: '#26272E',
		},
		box: {
			default: { fill: 0xE8E9F3, rounded: 16, stroke: { color: 0xCBCEE0, width: 4 } },
			focused: { fill: 0xE1E3EE, rounded: 16, stroke: { color: 0xABAFC6, width: 4 } },
			disabled: { fill: 0xDBDBDB, rounded: 16 }
		}
	});
	nameField.maxLength = 12;
	nameField.placeholder = 'Your Name';

	let OKButton = new Sprite(menuSheet.textures['OKButton.png']);
	OKButton
		.on('pointerdown', OKButtonClick)
		.on('pointerup', () => { 
			onCharCreation(nameField, characterSelection.charId) 
		})
		.on('pointerout', OKButtonOut);
	OKButton.x = MAIN_CONTAINER_WIDTH - (OKButton.width * 1.5);
	OKButton.y = MAIN_CONTAINER_HEIGHT - OKButton.height - 10;
	OKButton.interactive = true;

	nameField.x = OKButton.x + OKButton.width / 2 - nameField.width / 2;
	nameField.y = OKButton.y - (nameField.height * 1.5);

	characterCreation.addChild(characterSelection);
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
		setPlayerContainer(playerContainer);
	}
}

function createSelectedCharacterContainer(characterTextures) {
	const selectedCharacter = new Container();

	const selectedCharFrame = new Graphics();
	selectedCharFrame.lineStyle(2, 0xFEEB77, 1);
	selectedCharFrame.beginFill(0x000000);
	selectedCharFrame.drawRect(0, 0, 200, 200);
	selectedCharFrame.endFill();
	selectedCharFrame.alpha = 0.7;
	selectedCharacter.addChild(selectedCharFrame);

	let currentCharacter = new AnimatedSprite(characterTextures[0].alertTextures);
	currentCharacter.anchor.set(1);
	currentCharacter.animationSpeed = ANIMATION_SPEEDS.alertTextures;
	currentCharacter.play();
	// currentCharacter.x = menuScenes.width - 100;
	// currentCharacter.y = menuScenes.height/2 + 50;
	currentCharacter.scale.x = 2;
	currentCharacter.scale.y = 2;
	currentCharacter.roundPixels = true;
	selectedCharacter.addChild(currentCharacter);
	selectedCharacter.character = currentCharacter;

	selectedCharacter.x = 500 + (MAIN_CONTAINER_WIDTH - 500 - selectedCharFrame.width)/2;
	selectedCharacter.y = MAIN_CONTAINER_HEIGHT / 2 - selectedCharFrame.height;

	// currentCharacter.x = selectedCharFrame.x + selectedCharFrame.width/1.35;
	// currentCharacter.y = selectedCharFrame.y + selectedCharFrame.height/1.2;
	currentCharacter.x = selectedCharFrame.x + currentCharacter.width + selectedCharFrame.width/2 - currentCharacter.width/2 - 5;
	currentCharacter.y = selectedCharFrame.y + currentCharacter.height + 33;
	return selectedCharacter;
}

function createCharacterSelectionContainer(characterInFrame, characterTextures) {
	const characterSelection = new Container();

	const characterSelectionBg = new Sprite(createGradTexture());
	characterSelectionBg.alpha = 0.8;
	characterSelectionBg.width = 500;
	characterSelectionBg.height = MAIN_CONTAINER_HEIGHT;
	// characterSelectionBg.x = 20;
    characterSelection.charId = 1;
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
			character.animationSpeed = ANIMATION_SPEEDS.alertTextures;
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
		let alertTextures = characterTextures[currentCharId - 1].alertTextures;
		changeCharacterTextures(currentCharacter, alertTextures, TEXTURE_NAMES.ALERT);
		// change framed character's alert textures
		changeCharacterTextures(characterInFrame, walkingTextures, TEXTURE_NAMES.WALKING);
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
	modeSelectionMenu.addChild(createBackButton(SCENES.MODE_SELECTION));
	return modeSelectionMenu;
}

function createSinglePlayerButton() {
	let singlePlayerButton = new Sprite(menuSheet.textures['singlePlayerButton.png']);
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

function createBackButton(scene) {
	let backButton = new Sprite(menuSheet.textures['back.png']);
	backButton.interactive = true;
	backButton.x = 10;
	backButton.y = MAIN_CONTAINER_HEIGHT - backButton.height - 10;
	backButton
		.on('pointerdown', onBackButtonClick)
		.on('pointerup', () => { onBackButtonSelection(scene) })
		.on('pointerout', onBackButtonRelease);
	return backButton;
}

function onBackButtonClick() {
	this.texture = menuSheet.textures['backDown.png'];
	audioContext.click.play();
}

function onBackButtonSelection(scene) {
	switch(scene) {
		case SCENES.MODE_SELECTION:
			toggleMenuVisibility(SCENES.MODE_SELECTION, false);
			toggleMenuVisibility(SCENES.CHAR_CREATION, true);
			break;
		case SCENES.MULTIPLAYER_MENU:
			toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, false);
			toggleMenuVisibility(SCENES.MODE_SELECTION, true);
			break;
		case SCENES.STAGE_SELECTION:
			toggleMenuVisibility(SCENES.STAGE_SELECTION, false);
			if (selectedPlayerMode === MODES.SINGLE_PLAYER) {
				toggleMenuVisibility(SCENES.MODE_SELECTION, true);	
				toggleMenuVisibility(BACKGROUNDS.MENU_BG, true);
				toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, false);
				toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, false);
			} else if (selectedPlayerMode === MODES.MULTIPLAYER) {
				toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
				toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
				toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
			}
			break;
		default:
			break;
	}
	audioContext.clickRelease.play();
}

function onBackButtonRelease() {
	this.texture = menuSheet.textures['back.png'];
}

function createStageSelection(mainContainer) {
	const stageMenu = new Container();
	let OKButton = new Sprite(menuSheet.textures['OKButton.png']);

	let stage1Button = createStageButton(menuSheet, 1, 50, MAIN_CONTAINER_HEIGHT / 3);
	stageMenu.addChild(stage1Button);

	let rightPosition = MAIN_CONTAINER_WIDTH - stage1Button.width - 50;
	let stage2Button = createStageButton(menuSheet, 2, rightPosition, MAIN_CONTAINER_HEIGHT / 3);
	stageMenu.addChild(stage2Button);

	let stage3Button = createStageButton(menuSheet, 3, 50, MAIN_CONTAINER_HEIGHT / 1.5);
	stageMenu.addChild(stage3Button);
	// stage3Button.y = stage1Button.y + (stage3Button.height * 1.5);

	let stage4Button = createStageButton(menuSheet, 4, rightPosition, MAIN_CONTAINER_HEIGHT / 1.5);
	stageMenu.addChild(stage4Button);

	let stageButtons = [stage1Button, stage2Button, stage3Button, stage4Button];
	let selectedStage = 1;
	stage1Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(1, stage1Button, stageButtons) })
		.on('pointerout', onStageButtonOut);

	stage2Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(2, stage2Button, stageButtons) })
		.on('pointerout', onStageButtonOut);
	
	stage3Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(3, stage3Button, stageButtons) })
		.on('pointerout', onStageButtonOut);

	stage4Button
		.on('pointerdown', stageButtonClick)
		.on('pointerup', () => { onStageSelect(4, stage4Button, stageButtons) })
		.on('pointerout', onStageButtonOut);

	OKButton
		.on('pointerdown', OKButtonClick)
		.on('pointerup', onStageConfirm)
		.on('pointerout', OKButtonOut);

	OKButton.interactive = true;
	OKButton.x = MAIN_CONTAINER_WIDTH - OKButton.width - 10;
	OKButton.y = MAIN_CONTAINER_HEIGHT - OKButton.height - 10;
	stageMenu.addChild(OKButton);
	stageMenu.addChild(createBackButton(SCENES.STAGE_SELECTION));

	return stageMenu;

	// these functions are in this closure so they can access the 
	// 'selectedStage' variable
	function onStageSelect(stage, currentButton, stageButtons) {
		stageButtons.forEach((button) => button.alpha = 0.7);
		currentButton.alpha = 1;
		selectedStage = stage;
		audioContext.clickRelease.play();
		hideAllBackgrounds();
		switch (stage) {
			case 1:
				toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, true);
				break;
			case 2:
				toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, true);
				break;
			case 3:
				toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, true);
				break;
			case 4:
				toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, true);
				break;
			default:
				toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, true);
				break;
		}
	}

	function onStageConfirm() {
		let currentScene = getCurrentScene();
		if (selectedPlayerMode === MODES.MULTIPLAYER) {
			sock.send(JSON.stringify({
				type: socketTypes.UPDATE_SCENE,
				scene: currentScene
			}));
			// if the jump quest ends, we want the host to also
			// directly transition to the lobby screen instead of stage selection
			toggleMenuVisibility(SCENES.STAGE_SELECTION, false);
			hideAllBackgrounds();
			toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
			toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
		}
		changeScene(currentScene);
		mainContainer.menuScenes.visible = false;
	}

	function getCurrentScene() {
		switch (selectedStage) {
			case 1:
				return SCENES.JUMP_QUEST_1;
			case 2:
				return SCENES.JUMP_QUEST_2;
			case 3:
				return SCENES.JUMP_QUEST_3;
			case 4:
				return SCENES.JUMP_QUEST_4;
			default:
				return SCENES.JUMP_QUEST_1;
		}
	}
    
}

function createStageButton(menuSheet, type, xPosition, yPosition) {
	let stageButton;
	switch(type) {
		case 1:
			stageButton = new Sprite(menuSheet.textures['superEasyMode.png']);
			break;
		case 2:
			stageButton = new Sprite(menuSheet.textures['easyMode.png']);
			break;
		case 3:
			stageButton = new Sprite(menuSheet.textures['mediumMode.png']);
			break;
		case 4:
			stageButton = new Sprite(menuSheet.textures['hardMode.png']);
			break;
		default:
			stageButton = new Sprite(menuSheet.textures['superEasyMode.png']);
			break;
	}
	stageButton.scale.x = 0.8;
	stageButton.scale.y = 0.8;
	stageButton.x = xPosition;
	stageButton.y = yPosition - stageButton.height;
	stageButton.interactive = true;
	stageButton.alpha = 0.7;
	return stageButton;
}

function stageButtonClick() {
	audioContext.click.play();
	this.cursor = 'click';
}

function hideAllBackgrounds() {
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.STAGE1_BG, false);
	toggleMenuVisibility(BACKGROUNDS.STAGE2_BG, false);
	// toggleMenuVisibility(BACKGROUNDS.STAGE3_BG, false);
}

function onStageButtonOut() {
	this.cursor = 'default';
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

	const statusText = new Text('', {
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
		.on('pointerup', () => { onRoomCreation(statusText) })
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
		.on('pointerup', () => { onJoinRoom(roomField, statusText) } )
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
	multiplayerMenu.addChild(createBackButton(SCENES.MULTIPLAYER_MENU));

	return multiplayerMenu;
}

function createRoomClick() {
	this.texture = menuSheet.textures['createRoomDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

function onRoomCreation(statusText) {
	handleStatusText(statusText);
	loadingAnimation = createLoadingAnimationInterval(statusText);

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

function handleStatusText(statusText) {
	statusText.text = 'Loading';
	statusText.style.fill = 0x000000;
	statusText.visible = true;
	statusText.x = MAIN_CONTAINER_WIDTH/2 - statusText.width/2;
	statusText.y = MAIN_CONTAINER_HEIGHT/4 - statusText.height;
}

function createLoadingAnimationInterval(statusText) {
	let loadingText = statusText.text;
	let finalLoadingText = 'Loading....';
	return setInterval(() => {
		statusText.text = loadingText;
		loadingText += '.';
		if (loadingText === finalLoadingText) loadingText = 'Loading';
		
	}, 300);
}

function createRoomOut() {
	this.texture = menuSheet.textures['createRoom.png']
	this.cursor = 'default';
}

function handleSuccessfulRoomCreation(roomId) {
	clearInterval(loadingAnimation);
	toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, false);
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
	playerContainer.x = LOBBY_START_POSITION_X;
	playerContainer.y = LOBBY_START_POSITION_Y;
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
	addChildToScene(SCENES.MULTIPLAYER_LOBBY, playerContainer);

	setRoomIdNumber(roomId);
	changeScene(SCENES.MULTIPLAYER_LOBBY);
}

function setRoomIdNumber(roomId) {
	menuScenes.multiplayerLobby.roomIdNumber.text = roomId;
}

function onMultiplayerStart() {
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, false);
	toggleMenuVisibility(SCENES.STAGE_SELECTION, true);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, false);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, true);
	selectedPlayerMode = MODES.MULTIPLAYER;
	audioContext.clickRelease.play();
}

function joinRoomClick() {
	this.texture = menuSheet.textures['joinRoomDown.png'];
	audioContext.click.play();
	this.cursor = 'click';
}

async function onJoinRoom(roomField, statusText) {
	handleStatusText(statusText);
	loadingAnimation = createLoadingAnimationInterval(statusText);

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
	toggleMenuVisibility(SCENES.MULTIPLAYER_MENU, false);
	toggleMenuVisibility(SCENES.MULTIPLAYER_LOBBY, true);
	toggleMenuVisibility(BACKGROUNDS.MENU_BG, false);
	toggleMenuVisibility(BACKGROUNDS.LOBBY_BG, true);
	addChildToScene(SCENES.MULTIPLAYER_LOBBY, playerContainer);
	playerContainer.x = LOBBY_START_POSITION_X;
	playerContainer.y = LOBBY_START_POSITION_Y;
	entityGrid[0] = generateLobbyBoundaries();
	clearInterval(loadingAnimation);
	setRoomIdNumber(roomId);
	changeScene(SCENES.MULTIPLAYER_LOBBY);
}

function joinRoomOut() {
	this.texture = menuSheet.textures['joinRoom.png'];
	this.cursor = 'default';
}

function createMultiplayerLobby() {
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
	let stand = new Sprite(menuSheet.textures['roomIdStand.png']);
	stand.scale.x = 0.4;
	stand.scale.y = 0.4;
	stand.roundPixels = true;
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

function toggleMenuVisibility(target, visible) {
	menuScenes[target].visible = visible;
};

function addChildToScene(scene, child) {
	menuScenes[scene].addChild(child);
}

function createLoadingScreen(mainContainer) {
	let loadingText = new Text('Loading. . .', {
        fontFamily: 'Times New Roman',
        fontSize: 50,
        fill: 0xFFFFFFFF,
		align: 'center',
		fontWeight: 'bold',
	});
	let loadingPercentage = new Text('0 %', {
        fontFamily: 'Times New Roman',
        fontSize: 40,
        fill: 0xFFFFFFFF,
		align: 'center',
		fontWeight: 'bold',
	});
	loadingText.x = 512 / 2;
	loadingText.y = 200;
	loadingPercentage.x = loadingText.x + loadingText.width / 2;
	loadingPercentage.y = loadingText.y + loadingText.height * 1.5;
	mainContainer.addChild(loadingText);
	mainContainer.addChild(loadingPercentage);
	mainContainer.loadingPercentage = loadingPercentage;
}

export {
	createAllMenuScenes,
	handleSuccessfulRoomCreation,
	handleSuccessfulJoinRoom,
	generateLobbyBoundaries,
	createLoadingScreen
}