// / @ts-check
import {
	STATES,
	BACKGROUND_SCALING_FAR,
	BACKGROUND_SCALING_NEAR,
	TERMINAL_VELOCITY,
	OBSTACLE,
	HORIZONTAL,
	VERTICAL,
	GRAVITY,
	PLAYABLE_CHARACTERS,
	WALL,
	TEXTURE_NAMES,
	CONNECTION_STATUS,
	ANIMATION_SPEEDS,
	SCENES,
	ASSET_PATH,
	LOBBY_START_POSITION_X,
	LOBBY_START_POSITION_Y,
	TIME_REMAINING,
} from './constants/constants.js';
import socketTypes from './constants/socketTypes.js';

import {
	primus,
	connectionStatus,
	updatedPlayerProperties,
	currentConnectionId,
	playersToRemove,
} from './primusClient.js';

import SContainer from './scripts/SContainer.js';

import { createAllMenuScenes, generateLobbyBoundaries, createLoadingScreen } from './scenes/menuScenes.js';
import { createJumpQuest1Scene } from './scenes/jumpQuest1.js';
import { createJumpQuest2Scene } from './scenes/jumpQuest2.js';
import { createJumpQuest3Scene } from './scenes/jumpQuest3.js';
import { createJumpQuest4Scene } from './scenes/jumpQuest4.js';

import {
	collisionDirection,
	handleCollision,
	hitTestRectangle
} from './helpers/collisionHandler.js';
import { audioContext, filesLoaded, totalFiles } from '../helpers/audio.js';
import createCharacter from '../helpers/playerCreator.js';
import { createJumpQuest } from './helpers/jumpQuestCreator.js';

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
	type = "canvas";
}

const { loader } = PIXI;

//Create a Pixi Application
let app = new PIXI.Application({
	width: 512,
	height: 512,
	antialias: true,
	transparent: false,
	resolution: 1,
}
);
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

const mainContainer = new SContainer();
app.stage.addChild(mainContainer);

const viewportContainer = new Viewport.Viewport({
	screenWidth: window.innerWidth,
	screenHeight: window.innerHeight,
	worldWidth: 512,
	worldHeight: 512,
	interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});
viewportContainer.clampZoom({
	maxWidth: 2000,
	maxHeight: 1000
});

const viewportSorter = new SContainer();
viewportContainer.addChild(viewportSorter);

window.addEventListener('resize', () => {
	app.renderer.resize(window.innerWidth, window.innerHeight);
	viewportContainer.resize(window.innerWidth, window.innerHeight);
});

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.plugins.interaction.cursorStyles.default = "url('" + ASSET_PATH + "sprites/current spritesheet/cursor.png'),auto";
app.renderer.plugins.interaction.cursorStyles.hover = "url('" + ASSET_PATH + "sprites/current spritesheet/cursorHover.png'),auto"
app.renderer.plugins.interaction.cursorStyles.click = "url('" + ASSET_PATH + "sprites/current spritesheet/cursorClick.png'),auto";

viewportContainer
	// .drag({
	// 	pressDrag: false,
	// })
	.pinch()
	//  .wheel()
	.decelerate();


createLoadingScreen(mainContainer);

PIXI.loader
	.add('ludiClouds', ASSET_PATH + "sprites/current spritesheet/jq assets/ludi/midClouds.png")
	.add('towerA', ASSET_PATH + "sprites/current spritesheet/jq assets/ludi/towerA.png")
	.add('platform1', ASSET_PATH + "sprites/current spritesheet/jq assets/ludi/platform1.png")
	.add('mushFloor', ASSET_PATH + "sprites/current spritesheet/jq assets/mush/mushFloor.png")
	.add('mushFloorBg', ASSET_PATH + "sprites/current spritesheet/jq assets/mush/mushFloorBg.png")
	.add(ASSET_PATH + "sprites/characters.json")
	.add(ASSET_PATH + "sprites/menuSheet.json")
	.add(ASSET_PATH + "sprites/jumpQuest1.json")
	.add(ASSET_PATH + "sprites/jumpQuest2.json")
	.load(setup);

loader.onProgress.add(loadHandler);

function loadHandler(loader, resource) {
	let percentage = loader.progress + (filesLoaded / totalFiles);
	mainContainer.loadingPercentage.text = percentage.toString().substring(0, 4) + ' %';
	console.log("loading: " + resource.url);
	console.log("Progress: " + percentage.toString().substring(0, 4) + "%");
}

let player, playerContainer;

let currentState = STATES.DISABLED;
let updatedScene;

let entityGrid = [[]], obstacleList = [];

let otherPlayersMap = new Map();

let playerReachedGoal = false;
let timeRemaining = TIME_REMAINING;

function setup() {
	mainContainer.removeChildren();
	initializeCharacterTextures();
	initializeScenes();
	changeAppBackgroundColor(0x000000);
	audioContext.title.play();
	app.ticker.add(delta => gameLoop(delta));
}

const characterTextures = [];
function initializeCharacterTextures() {
	const characterSheet = loader.resources[ASSET_PATH + "sprites/characters.json"].spritesheet;
	PLAYABLE_CHARACTERS.forEach((charId) => {
		let walkingTextures = characterSheet.animations[charId + "walk"];
		let standingTextures = characterSheet.animations[charId + "stand"];
		let alertTextures = characterSheet.animations[charId + "alert"];
		let jumpTexture = [characterSheet.textures[charId + "jump_0.png"]];
		let proneTexture = [characterSheet.textures[charId + "prone_0.png"]];
		let texture = {
			walkingTextures,
			standingTextures,
			alertTextures,
			jumpTexture,
			proneTexture,
		};
		characterTextures.push(texture);
	});
}

function initializeScenes() {
	let jumpQuest1 = createJumpQuest1Scene(loader);
	let jumpQuest2 = createJumpQuest2Scene(loader);
	let jumpQuest3 = createJumpQuest3Scene(loader);
	let jumpQuest4 = createJumpQuest4Scene(loader);
	let menuScenes = createAllMenuScenes(
		mainContainer,
		loader,
		characterTextures,
		entityGrid
	);
	mainContainer.addChild(menuScenes);
	mainContainer.addChild(jumpQuest1);
	mainContainer.addChild(jumpQuest2);
	mainContainer.addChild(jumpQuest3);
	mainContainer.addChild(jumpQuest4);
	mainContainer.menuScenes = menuScenes;
	mainContainer.jumpQuest1 = jumpQuest1;
	mainContainer.jumpQuest2 = jumpQuest2;
	mainContainer.jumpQuest3 = jumpQuest3;
	mainContainer.jumpQuest4 = jumpQuest4;

	menuScenes.x = app.screen.width / 2 - menuScenes.width / 2;
	menuScenes.y = app.screen.height / 2 - menuScenes.height / 2;

	mainContainer.menuScenes.visible = true;
	mainContainer.jumpQuest1.visible = false;
	mainContainer.jumpQuest2.visible = false;
	mainContainer.jumpQuest3.visible = false;
	mainContainer.jumpQuest4.visible = false;
}

function gameLoop(delta) {
	if (primus) {
		switch (connectionStatus) {
			case CONNECTION_STATUS.PENDING:
				return;
			case CONNECTION_STATUS.ERROR:
				console.log("Error in server connection");
				return;
			default:
				break;
		}
	}
	if (!shouldRender(mainContainer)) return;
	handleScene();
	// if multiplayer mode, update other players
	if (primus) {
		handleMultiplayer();
	}
	player.nextFrameX = playerContainer.x + player.vx;
	player.nextFrameY = playerContainer.y + player.vy;
	handlePlayerState();
	if (updatedScene && updatedScene !== SCENES.MULTIPLAYER_LOBBY && updatedScene !== SCENES.STAGE_SELECTION) {
		handleClouds();
		handleObstacleMovement(delta);
		handleTimerPositioning();
	}
}

function shouldRender(mainContainer) {
	return mainContainer.menuScenes.visible === false ||
		mainContainer.menuScenes.multiplayerLobby.visible === true;
}

function handleScene() {
	if (mainContainer.currentScene !== updatedScene) {
		mainContainer.currentScene = updatedScene;
		resetValues();
		obstacleList.length = 0;
		let args = [
			mainContainer,
			loader,
			entityGrid,
			audioContext,
			playerContainer
		];
		switch (updatedScene) {
			case SCENES.JUMP_QUEST_1:
				createJumpQuest(...args, 1);
				handleJumpQuestSceneChange(1);
				break;
			case SCENES.JUMP_QUEST_2:
				createJumpQuest(...args, 2);
				handleJumpQuestSceneChange(2);
				//clamp zoom here?
				break;
			case SCENES.JUMP_QUEST_3:
				createJumpQuest(...args, 3);
				handleJumpQuestSceneChange(3);
				break;
			case SCENES.JUMP_QUEST_4:
				createJumpQuest(...args, 4);
				handleJumpQuestSceneChange(4);
				break;
			case SCENES.STAGE_SELECTION:
				hideJumpQuestScenes();
				mainContainer.menuScenes.visible = true;
				mainContainer.menuScenes[SCENES.STAGE_SELECTION].visible = true;			
				handleBGMTransition(SCENES.STAGE_SELECTION);
				changeAppBackgroundColor(0x000000);
				break;
			case SCENES.MULTIPLAYER_LOBBY:
				handleMultiplayerSceneChange();
				break;
			default:
				break;
		}
		viewportContainer.follow(playerContainer, {
			radius: 80,
		});
		changePlayerState(STATES.FALLING);
	}
}

function resetValues() {
	viewportSorter.removeChildren();
	//reset entitygrid
	entityGrid.forEach((grid) => {
		grid.length = 0;
	});
	timeRemaining = TIME_REMAINING;
	playerReachedGoal = false;
}

function handleJumpQuestSceneChange(sceneNumber) {
	transferPlayersToNewScene(viewportSorter);
	let currentJumpQuest = 'jumpQuest' + sceneNumber;
	entityGrid.forEach((grid) => {
		obstacleList.push(...grid.filter((entity) => entity.type === OBSTACLE));
	});
	obstacleList.forEach((obstacle) => {
		viewportSorter.addChild(obstacle, 5);
	});
	// // the first child is the start button if you're the host, so don't remove it
	// if (getIsHost()) {
	// 	mainContainer.menuScenes.multiplayerLobby.removeChildren(1);
	// } else {
	// 	mainContainer.menuScenes.multiplayerLobby.removeChildren();
	// }
}

function handleMultiplayerSceneChange() {
	//mainContainer.jumpQuest4.visible = false;
	mainContainer.menuScenes.visible = true;
	//mainContainer.menuScenes.multiplayerLobby.visible = true;
	entityGrid[0] = generateLobbyBoundaries();
	transferPlayersToNewScene(mainContainer.menuScenes.multiplayerLobby);
	mainContainer.menuScenes.multiplayerLobby.addChild(playerContainer);
	playerContainer.x = LOBBY_START_POSITION_X;
	playerContainer.y = LOBBY_START_POSITION_Y;
	handleBGMTransition(SCENES.MULTIPLAYER_LOBBY);
	changeAppBackgroundColor(0x000000);
	// it's important to removeChildren here or else memory isn't released
	// (I guess a reference of some sort still exists)
	hideJumpQuestScenes();
}

function transferPlayersToNewScene(container) {
	otherPlayersMap.forEach((player, connectionId) => {
		//console.log(currentConnectionId + " " + connectionId);
		// for some reason connectionId is sometimes undefined, not sure why
		if (connectionId && (currentConnectionId !== connectionId)) {
			// console.log("Adding child!");
			container.addChild(player);
		}
	});
}

function handleBGMTransition(scene) {
	if (audioContext.title.playing()) {
		audioContext.title.fade(0.3, 0, 2000);
		setTimeout(() => {
			audioContext.title.stop();
		}, 3000);
	}
	if (audioContext.jumpQuest1BGM.playing()) {
		audioContext.jumpQuest1BGM.fade(0.3, 0, 2000);
		setTimeout(() => {
			audioContext.jumpQuest1BGM.rate(1);
			audioContext.jumpQuest1BGM.stop();
		}, 3000);
	}
	if (audioContext.jumpQuest2BGM.playing()) {
		audioContext.jumpQuest2BGM.fade(0.3, 0, 2000);
		setTimeout(() => {
			audioContext.jumpQuest2BGM.rate(1);
			audioContext.jumpQuest2BGM.stop();
		}, 3000);
	}
	if (scene === SCENES.MULTIPLAYER_LOBBY) {
		setTimeout(() => {
			audioContext.lobby.play();
			audioContext.lobby.fade(0, 0.3, 2000);
		}, 2000);
	} else if (scene === SCENES.STAGE_SELECTION) {
		setTimeout(() => {
			audioContext.title.play();
			audioContext.title.fade(0, 0.3, 2000);
		}, 2000);
	}
}

function hideJumpQuestScenes() {
	mainContainer.jumpQuest1.visible = false;
	mainContainer.jumpQuest2.visible = false;
	mainContainer.jumpQuest3.visible = false;
	mainContainer.jumpQuest4.visible = false;
}

function handleMultiplayer() {
	handleOtherPlayers();
	primus.write({
		type: socketTypes.UPDATE_PLAYER,
		player: {
			connectionId: currentConnectionId,
			charId: playerContainer.charId,
			currentTextures: TEXTURE_NAMES[currentState],
			x: playerContainer.x,
			y: playerContainer.y,
			direction: player.scale.x,
			name: playerContainer.name,
		}
	});
}

function handleOtherPlayers() {
	while (playersToRemove.length > 0) {
	//	console.log("Removing player");
		let id = playersToRemove.pop();
		let playerToRemove = otherPlayersMap.get(id);
		if (playerToRemove) {
			playerToRemove.destroy();
			otherPlayersMap.delete(id);
			removePlayerFromContainers(id);
		}
	}
	for (let a = 0; a < updatedPlayerProperties.length; a++) {
		let updatedPlayer = updatedPlayerProperties[a];
		// don't need to update yourself
		if (!updatedPlayer.connectionId ||
			(updatedPlayer.connectionId === currentConnectionId)) continue;
		// add player if they aren't in the map
		if (!otherPlayersMap.has(updatedPlayer.connectionId)) {
			console.log("Adding player");
			addPlayer(updatedPlayer);
			continue;
		}
		let otherPlayerContainer = otherPlayersMap.get(updatedPlayer.connectionId);
		let playerSprite = otherPlayerContainer.player;
		//	console.log(updatedPlayer);
		// update player textures if they changed state
		if (playerSprite.currentTextures !== updatedPlayer.currentTextures) {
			updateOtherPlayerTextures(updatedPlayer, playerSprite);
		}
		otherPlayerContainer.x = updatedPlayer.x;
		otherPlayerContainer.y = updatedPlayer.y;
		playerSprite.scale.x = updatedPlayer.direction;
	}
}

function removePlayerFromContainers(id) {
	for (let a = 0; a < viewportSorter.children.length; a++) {
		if (viewportSorter[a]?.connectionId === id) {
			viewportSorter.splice(a, 1);
			break;
		}
	}
	let lobby = mainContainer.menuScenes.multiplayerLobby;
	for (let a = 0; a < lobby.children.length; a++) {
		if (lobby.children[a].connectionId === id) {
			lobby.splice(a, 1);
			break;
		}
	}
}

function updateOtherPlayerTextures(updatedPlayer, playerSprite) {
	// handle anchor setting
	if (updatedPlayer.currentTextures == TEXTURE_NAMES.PRONE) {
		playerSprite.anchor.set(0.5, 0.1);
	} else {
		playerSprite.anchor.set(0.5);
	}
	playerSprite.textures = characterTextures[updatedPlayer.charId][updatedPlayer.currentTextures];
	// handle animation playing
	if (updatedPlayer.currentTextures != TEXTURE_NAMES.JUMPING &&
		updatedPlayer.currentTextures != TEXTURE_NAMES.PRONE) {
		playerSprite.animationSpeed = ANIMATION_SPEEDS[updatedPlayer.currentTextures];
		playerSprite.play();
	}
	playerSprite.currentTextures = updatedPlayer.currentTextures;
}

function addPlayer(playerToAdd) {
	// console.log("Adding player");
	let connectionId = playerToAdd.connectionId;
	let newPlayerContainer = createCharacter(playerToAdd.playerName, playerToAdd.charId, characterTextures);
	mainContainer.menuScenes.multiplayerLobby.addChild(newPlayerContainer);
	//viewportSorter.addChild(newPlayerContainer);
	newPlayerContainer.x = 200;
	newPlayerContainer.y = -100;
	// a local property that helps us decide when to change textures
	newPlayerContainer.player.currentTextures = TEXTURE_NAMES.JUMPING;
	otherPlayersMap.set(connectionId, newPlayerContainer);
}

function handlePlayerState() {
	switch (currentState) {
		case STATES.STANDING:
			for (let entity of obstacleList) checkForObstacleCollisions(entity);
			break;
		case STATES.PRONE:
			for (let entity of obstacleList) checkForObstacleCollisions(entity);
			break;
		case STATES.WALKING:
			movePlayerContainerRelatively(player.vx, 0);
			moveBackgroundsRelatively(player.vx, 0);
			//check if on platform, if not then change to falling state
			let onPlatform = false;
			for (let entity of entityGrid[0]) {
				let direction = collisionDirection(player, entity);
				if (!direction) continue;
				switch (entity.type) {
					case OBSTACLE: {
						onPlatform = false;
						let newState = handleCollision(player, entity, direction, currentState, currentlyCollidingSprites);
						changePlayerState(newState);
						break;
					}
					case WALL: {
						let newState = handleCollision(player, entity, direction, currentState, currentlyCollidingSprites);
						changePlayerState(newState);
						break;
					}
					default:
						if (direction === "bottom") onPlatform = true;
						break;
				}
			}
			if (!onPlatform) changePlayerState(STATES.FALLING);
			break;
		case STATES.JUMPING:
			handleJump();
			break;
		case STATES.FALLING:
			handleFall();
			break;
		default:
			break;
	}
}

function checkForObstacleCollisions(entity) {
	let direction = collisionDirection(player, entity);
	if (entity.type === OBSTACLE && direction) {
		let newState = handleCollision(player, entity, direction, currentState, currentlyCollidingSprites);
		changePlayerState(newState);
	}
}

function handleClouds() {
	mainContainer[updatedScene].clouds.tilePosition.x += 0.1;
	mainContainer[updatedScene].clouds.tilePosition.y += 0;
}

function handleObstacleMovement(delta) {
	obstacleList.forEach((obstacle) => {
		obstacle.x += obstacle.vx;
		obstacle.y += obstacle.vy;
		if (obstacle.rotate) {
			obstacle.rotation += delta * 0.3;
		}
		handleObstacleBoundaries(obstacle);
	})
}

function handleTimerPositioning() {
	if (viewportSorter.timer?.visible) {
		viewportSorter.timer.x = viewportContainer.right - viewportContainer.screenWidth / 2;
		viewportSorter.timer.y = viewportContainer.top + 20;
	}
}

function handleObstacleBoundaries(obstacle) {
	switch (obstacle.movementType) {
		case HORIZONTAL:
			if (obstacle.x < obstacle.boundaryLeft ||
				obstacle.x > obstacle.boundaryRight) {
				obstacle.vx *= -1;
			}
			break;
		case VERTICAL:
			if (obstacle.y < obstacle.boundaryLeft ||
				obstacle.y > obstacle.boundaryRight) {
				obstacle.vy *= -1;
			}
			break;
		default:
			break;
	}
}

function changePlayerState(state) {
	switch (state) {
		case STATES.STANDING:
			player.anchor.set(0.5);
			currentState = STATES.STANDING;
			player.textures = characterTextures[player.charId].standingTextures;
			player.animationSpeed = ANIMATION_SPEEDS.standingTextures;
			player.play();
			break;
		case STATES.PRONE:
			currentState = STATES.PRONE;
			player.textures = characterTextures[player.charId].proneTexture;
			player.anchor.set(0.5, 0.1);
			break;
		case STATES.WALKING:
			player.anchor.set(0.5);
			currentState = STATES.WALKING;
			player.textures = characterTextures[player.charId].walkingTextures;
			player.animationSpeed = ANIMATION_SPEEDS.walkingTextures;
			player.play();
			setYVelocity(1);
			break;
		case STATES.JUMPING:
			player.anchor.set(0.5);
			audioContext.jumpSound.play();
			currentState = STATES.JUMPING;
			player.textures = characterTextures[player.charId].jumpTexture;
			setYVelocity(-8);
			break;
		case STATES.FALLING:
			player.anchor.set(0.5);
			currentState = STATES.FALLING;
			player.textures = characterTextures[player.charId].jumpTexture;
			break;
		case STATES.DISABLED:
			player.anchor.set(0.5);
			currentState = STATES.DISABLED;
			player.textures = characterTextures[player.charId].standingTextures;
			player.play();
			break;
		default:
			break;
	}
	// console.log("CHANGING CHARACTER STATE TO " + currentState);
}
let currentlyCollidingSprites = new Set();
function handleJump() {
	// if collision (check not just platforms but all objects in grid)
	for (let entity of entityGrid[0]) {
		if (currentlyCollidingSprites.has(entity)) continue;
		// if we're going up, ignore all entities (except walls and obstacles)
		// we also need to record the entities we've ignored so that
		// the character doesn't glitch out when their velocity
		// changes from positive to negative while they're in the middle of a sprite
		if (entity.type !== WALL & entity.type !== OBSTACLE) {
			if (player.vy < 0 && hitTestRectangle(player, entity)) {
				currentlyCollidingSprites.add(entity);
			}
			//ignore collision if moving upwards
			if (player.vy < 0) continue;
		}
		let direction = collisionDirection(player, entity);
		if (!direction) continue;
		let newState = handleCollision(player, entity, direction, currentState, currentlyCollidingSprites);
		changePlayerState(newState);
		break;
	}
	movePlayerContainerRelatively(player.vx, player.vy);
	moveBackgroundsRelatively(player.vx, player.vy);
	increaseYVelocity(GRAVITY);
	currentlyCollidingSprites.forEach((entity) => {
		if (!hitTestRectangle(player, entity)) {
			currentlyCollidingSprites.delete(entity);
		}
	});
}

function handleFall() {
	for (let entity of entityGrid[0]) {
		if (currentlyCollidingSprites.has(entity)) continue;
		if (entity.type === OBSTACLE) continue;
		let direction = collisionDirection(player, entity);
		if (!direction) continue;
		let newState = handleCollision(player, entity, direction, currentState, currentlyCollidingSprites);
		changePlayerState(newState);
		break;
	}
	movePlayerContainerRelatively(player.vx, player.vy);
	moveBackgroundsRelatively(player.vx, player.vy);
	increaseYVelocity(GRAVITY);
	currentlyCollidingSprites.forEach((entity) => {
		if (!hitTestRectangle(player, entity)) {
			currentlyCollidingSprites.delete(entity);
		}
	});
}

function setXVelocity(velocity) {
	player.vx = velocity;
}

function setYVelocity(velocity) {
	player.vy = velocity;
}

function increaseXVelocity(velocity) {
	player.vx += velocity;
}

function increaseYVelocity(velocity) {
	if (player.vy < TERMINAL_VELOCITY) player.vy += velocity;
}

function movePlayerContainerRelatively(vx, vy) {
	playerContainer.x += vx;
	playerContainer.y += vy;
}

function setPlayerContainerPosition(x, y) {
	if (x !== undefined) playerContainer.x = x;
	if (y !== undefined) playerContainer.y = y;
}

function horizontallyFlipCharacter(x) {
	player.scale.x = x;
}

function moveBackgroundsRelatively(x, y) {
	if (updatedScene === SCENES.MULTIPLAYER_LOBBY ||
		updatedScene === SCENES.STAGE_SELECTION) return;
	if (updatedScene === SCENES.JUMP_QUEST_1 || updatedScene === SCENES.JUMP_QUEST_3) {
		for (let bg of mainContainer[updatedScene].movingBackgroundsFar) {
			bg.x += (-x * BACKGROUND_SCALING_FAR);
			bg.y += (-y * BACKGROUND_SCALING_FAR);
		}
		for (let bg of mainContainer[updatedScene].movingBackgroundsNear) {
			bg.x += (-x * BACKGROUND_SCALING_NEAR);
			bg.y += (-y * BACKGROUND_SCALING_NEAR);
		}
	} else {
		for (let bg of mainContainer[updatedScene].movingBackgroundsFar) {
			bg.x += (-x * (BACKGROUND_SCALING_FAR / 2));
			bg.y += (-y * BACKGROUND_SCALING_FAR);
		}
		for (let bg of mainContainer[updatedScene].movingBackgroundsNear) {
			bg.x += (-x * BACKGROUND_SCALING_NEAR);
			bg.y += (-y * BACKGROUND_SCALING_NEAR);
		}
	}
}

function setPlayerContainer(newPlayerContainer) {
	playerContainer = newPlayerContainer;
	player = newPlayerContainer.player;
}

function changeScene(newScene) {
	updatedScene = newScene;
}

function addChildToViewportContainer(child) {
	viewportContainer.addChild(child);
}

function addChildToViewportSorter(child, zIndex = 0) {
	viewportSorter.addChild(child, zIndex);
}

function changeAppBackgroundColor(color) {
	app.renderer.backgroundColor = color;
}

function addViewportToMainContainer(stage) {
	switch (stage) {
		case 1:
			mainContainer.jumpQuest1.addChild(viewportContainer, 10);
			mainContainer.jumpQuest1.sortChildren();
			break;
		case 2:
			mainContainer.jumpQuest2.addChild(viewportContainer, 10);
			mainContainer.jumpQuest2.sortChildren();
			break;
		case 3:
			mainContainer.jumpQuest3.addChild(viewportContainer, 10);
			mainContainer.jumpQuest3.sortChildren();
			break;
		case 4:
			mainContainer.jumpQuest4.addChild(viewportContainer, 10);
			mainContainer.jumpQuest4.sortChildren();
			break;
		default:
			break;
	}
}

function initiateTimer() {
	if (!playerReachedGoal && viewportSorter.timer) {
		viewportSorter.timer.visible = true;
		viewportSorter.sortChildren();
		if (audioContext.jumpQuest1BGM.playing()) audioContext.jumpQuest1BGM.rate(1.3);
		if (audioContext.jumpQuest2BGM.playing()) audioContext.jumpQuest2BGM.rate(1.3);
		let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest2.json"].spritesheet;
		let timer = setInterval(() => {
			let tensDigit = Math.floor(timeRemaining / 10);
			let onesDigit = timeRemaining % 10;
			viewportSorter.timer.tens.texture = jumpQuestSheet.textures[tensDigit + '.png'];
			viewportSorter.timer.ones.texture = jumpQuestSheet.textures[onesDigit + '.png'];
			timeRemaining--;
			if (timeRemaining < 0) {
				clearInterval(timer);
				updatedScene = SCENES.MULTIPLAYER_LOBBY;
			}
		}, 1000);
	}
}

function setPlayerReachedGoal() {
	if (!playerReachedGoal) {
		playerReachedGoal = true;
		audioContext.firstPlace.play();
	}
}

function getPlayerReachedGoal() {
	return playerReachedGoal;
}

function setTimerReference(timer) {
	viewportSorter.timer = timer;
}

//also need to export maincontainer

function getCurrentState() {
	return currentState;
}

export {
	getCurrentState,
	setYVelocity,
	setXVelocity,
	increaseXVelocity,
	changePlayerState,
	horizontallyFlipCharacter,
	setPlayerContainerPosition,
	setPlayerContainer,
	addChildToViewportContainer,
	addChildToViewportSorter,
	changeAppBackgroundColor,
	addViewportToMainContainer,
	changeScene,
	initiateTimer,
	setPlayerReachedGoal,
	getPlayerReachedGoal,
	setTimerReference,
}