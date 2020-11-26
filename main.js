// / @ts-check
import {
	STATES,
	PLAYER_XVELOCITY,
	BACKGROUND_SCALING_FAR,
	BACKGROUND_SCALING_NEAR,
	TERMINAL_VELOCITY,
	FINAL_PLATFORM,
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
	TELEPORT_PLATFORM
} from './constants/constants.js';
import socketTypes from './constants/socketTypes.js';

import { 
	sock,
	connectionStatus,
	updatedPlayerProperties,
	currentConnectionId,
	playersToRemove
} from './sockClient.js';

import SContainer from './scripts/SContainer.js';

import createAllMenuScenes from './scenes/menuScenes.js';
import { createJumpQuest1Scene } from './scenes/jumpQuest1.js';
import { createJumpQuest2Scene } from './scenes/jumpQuest2.js';
import { createJumpQuest3Scene } from './scenes/jumpQuest3.js';

import {
	collisionDirection,
	platformCollision,
	hitTestRectangle
} from './helpers/collisionHandler.js';
import { audioContext } from '../helpers/audio.js';
import createCharacter from '../helpers/playerCreator.js';
import createJumpQuest from './helpers/jumpQuestCreator.js';

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
	type = "canvas";
}

const { loader } = PIXI;
PIXI.utils.sayHello(type);

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
})

const viewportSorter = new SContainer();
viewportContainer.addChild(viewportSorter);

// viewportContainer.clampZoom({
//   maxWidth: 2000,
//   maxHeight: 500
// });

window.addEventListener('resize', () => {
	app.renderer.resize(window.innerWidth, window.innerHeight);
	viewportContainer.resize(window.innerWidth, window.innerHeight);
});

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.antialias = false;	
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


//in the future, make sure we put all sprites in the spritesheet
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
	console.log("loading: " + resource.url);
	console.log("Progress: " + loader.progress.toString().substring(0, 4) + "%");
}

let player, playerContainer;

let currentState = STATES.DISABLED;
let updatedScene;

let entityGrid = [[]], obstacleList = [];

let otherPlayersMap = new Map();

function setup() {
	console.log(app.renderer.type);
	//app.stage.viewportContainer.visible = false;
	initializeCharacterTextures();
	initializeScenes();
	app.renderer.backgroundColor = 0x000000;
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
	// let jumpQuest4 = createJumpQuest4Scene(loader);
	let menuScenes = createAllMenuScenes(
		mainContainer,
		loader,
		characterTextures, 
		entityGrid
	);
	console.log(jumpQuest1);
	mainContainer.addChild(menuScenes);
	mainContainer.addChild(jumpQuest1);
	mainContainer.addChild(jumpQuest2);
	mainContainer.addChild(jumpQuest3);
	mainContainer.menuScenes = menuScenes;
	mainContainer.jumpQuest1 = jumpQuest1;
	mainContainer.jumpQuest2 = jumpQuest2;
	mainContainer.jumpQuest3 = jumpQuest3;

	menuScenes.x = app.screen.width/2 - menuScenes.width/2;
	menuScenes.y = app.screen.height/2 - menuScenes.height/2;
	
	mainContainer.menuScenes.visible = true;
	mainContainer.jumpQuest1.visible = false;
	mainContainer.jumpQuest2.visible = false;
	mainContainer.jumpQuest3.visible = false;
}

function gameLoop(delta) {
	if (sock) {
		switch(connectionStatus) {
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
	if (sock) {
		handleMultiplayer();
	}
	player.nextFrameX = playerContainer.x + player.vx;
	player.nextFrameY = playerContainer.y + player.vy;
	handlePlayerState();
	handleClouds();
	handleObstacleMovement(delta);
}

function shouldRender(mainContainer) {
	return mainContainer.menuScenes.visible === false ||
		   	 mainContainer.menuScenes.multiplayerLobby.visible === true;
}

function handleScene() {
	if (mainContainer.currentScene !== updatedScene) {
		console.log(mainContainer.currentScene + " " + updatedScene);
		mainContainer.currentScene = updatedScene;
		viewportContainer.follow(playerContainer, {
			radius: 80,
		});
		changeCharacterState(player, STATES.FALLING);
		// I think we have to also clear the players in viewport sorter, or 
		// find a way to only add new players in them once and never do that again
		// before adding them again. not sure how we will handle
		// changing back and forth between jq and lobby

		//also fix the logic for how we do this currentscene !== updatedscene thing
		// right now i'm just toggling menuScenes.visible = false in onStageConfirm
		// but we also do that another time in createJumpQuest, so must be a way
		// we can simplify this
		obstacleList.length = 0;
		let args = [
			mainContainer,
			loader,
			entityGrid,
			audioContext,
			playerContainer
		];
		console.log(updatedScene);
		switch(updatedScene) {
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
			case SCENES.LOBBY:
				mainContainer.jumpQuest1.visible = false;
				mainContainer.jumpQuest2.visible = false;
				mainContainer.jumpQuest3.visible = false;
				mainContainer.jumpQuest4.visible = false;
				mainContainer.menuScenes.multiplayerLobby.visible = true;
				// transferPlayersToNewScene(mainContainer.menuScenes.multiplayerLobby);
				break;
			default:
				break;
		}
	}
}

function handleJumpQuestSceneChange(sceneNumber) {
	// transferPlayersToNewScene(viewportSorter);
	let currentJumpQuest = 'jumpQuest' + sceneNumber;
	console.log(mainContainer[currentJumpQuest]);
	console.log(currentJumpQuest);
	entityGrid.forEach((grid) => {
		obstacleList.push(...grid.filter((entity) => entity.type === OBSTACLE));
	});
	obstacleList.forEach((obstacle) => {
		viewportSorter.addChild(obstacle, 5);
	});
	console.log(obstacleList);
}

function transferPlayersToNewScene(container) {
	console.log("Transferring players.");
	otherPlayersMap.forEach((player, connectionId) => {
		console.log(currentConnectionId + " " + connectionId);
		// for some reason connectionId is sometimes undefined, not sure why
		if (connectionId && (currentConnectionId !== connectionId)) {
			console.log("Adding child!");
			container.addChild(player);
		}
	});
}

function handleMultiplayer() {
	handleOtherPlayers();
	sock.send(JSON.stringify({
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
	}));
}

function handleOtherPlayers() {
	while (playersToRemove.length > 0) {
		let id = playersToRemove.pop().connectionId;
		let playerToRemove = otherPlayersMap.get(id);
		playerToRemove.destroy();
		otherPlayersMap.delete(id);
		removePlayerFromContainers(id);
	}
	for (let a = 0; a < updatedPlayerProperties.length; a++) {
		let updatedPlayer = updatedPlayerProperties[a];
		// don't need to update yourself
		if (!updatedPlayer.connectionId || 
			(updatedPlayer.connectionId === currentConnectionId)) continue;
		// add player if they aren't in the map
		if (!otherPlayersMap.has(updatedPlayer.connectionId)) {
			addPlayer(updatedPlayer);
			continue;
		}
		let playerContainer = otherPlayersMap.get(updatedPlayer.connectionId);
		let playerSprite = playerContainer.player;
	//	console.log(updatedPlayer);
		// update player textures if they changed state
		if (playerSprite.currentTextures !== updatedPlayer.currentTextures) {
			updateOtherPlayerTextures(updatedPlayer, playerSprite);
		}
		playerContainer.x = updatedPlayer.x;
		playerContainer.y = updatedPlayer.y;
		playerSprite.scale.x = updatedPlayer.direction;
	}
}

function removePlayerFromContainers(id) {
	for (let a = 0; a < viewportSorter.children.length; a++) {
		if (viewportSorter[a].connectionId === id) {
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
	console.log(playerToAdd);
	console.log("Hey?");
	let connectionId = playerToAdd.connectionId;

	let newPlayerContainer = createCharacter(playerToAdd.playerName, playerToAdd.charId, characterTextures);
	mainContainer.menuScenes.multiplayerLobby.addChild(newPlayerContainer);
	viewportSorter.addChild(newPlayerContainer);
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
			moveCharacterRelatively(playerContainer, player.vx, 0);
			moveBackgroundsRelatively(player.vx, 0);
			//check if on platform, if not then change to falling state
			let onPlatform = false;
			for (let entity of entityGrid[0]) {
				if (entity.type === WALL) {
				//	console.log(entity.x + " " + entity.width + " " + playerContainer.x);
				}
				//console.log(entity.type);
				let direction = collisionDirection(player, entity, playerContainer);
				if (!direction) continue;
				switch(entity.type) {
					case OBSTACLE:
						onPlatform = false;
						handleCollision(player, playerContainer, entity, direction);
						break;
					case WALL:
						console.log(entity.type);
						handleCollision(player, playerContainer, entity, direction);
						break;
					default:
						if (direction === "bottom") onPlatform = true;
						break;
				}
			}
			console.log(onPlatform);
			if (!onPlatform) changeCharacterState(player, STATES.FALLING);
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
	let direction = collisionDirection(player, entity, playerContainer);
	if (entity.type === OBSTACLE && direction) {
		handleCollision(player, playerContainer, entity, direction);
		changeCharacterState(player, STATES.FALLING);
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

function handleObstacleBoundaries(obstacle) {
	switch (obstacle.movementType) {
		case HORIZONTAL:
			if (obstacle.x < obstacle.boundary1 ||
				obstacle.x > obstacle.boundary2) {
				obstacle.vx *= -1;
			}
			break;
		case VERTICAL:
			if (obstacle.y < obstacle.boundary1 ||
				obstacle.y > obstacle.boundary2) {
				obstacle.vy *= -1;
			}
			break;
		default:
			break;
	}
}

function changeCharacterState(entity, state) {
	entity.anchor.set(0.5);
	console.log("WTf");
	switch (state) {
		case STATES.STANDING:
			currentState = STATES.STANDING;
			entity.textures = characterTextures[entity.charId].standingTextures;
			entity.animationSpeed = ANIMATION_SPEEDS.standingTextures;
			entity.play();
			break;
		case STATES.PRONE:
			currentState = STATES.PRONE;
			entity.textures = characterTextures[entity.charId].proneTexture;
			entity.anchor.set(0.5, 0.1);
			break;
		case STATES.WALKING:
			currentState = STATES.WALKING;
			entity.textures = characterTextures[entity.charId].walkingTextures;
			entity.animationSpeed = ANIMATION_SPEEDS.walkingTextures;
			entity.play();
			setYVelocity(entity, 1);
			break;
		case STATES.JUMPING:
			audioContext.jumpSound.play();
			currentState = STATES.JUMPING;
			entity.textures = characterTextures[entity.charId].jumpTexture;
			setYVelocity(entity, -8);
			break;
		case STATES.FALLING:
			currentState = STATES.FALLING;
			entity.textures = characterTextures[entity.charId].jumpTexture;
			break;
		case STATES.DISABLED:
			currentState = STATES.DISABLED;
			entity.textures = characterTextures[entity.charId].standingTextures;
			entity.play();
			break;
		default:
			break;
	}
	
	console.log("CHANGING CHARACTER STATE TO "  + currentState);
}
let currentlyCollidingSprites = new Set();
function handleJump() {
	// if collision (check not just platforms but all objects in grid)
	for (let entity of entityGrid[0]) {
//		console.log(entity.type);
		if (currentlyCollidingSprites.has(entity)) continue;
		// if we're going up, ignore all entities (except walls and obstacles)
		// we also need to record the entities we've ignored so that
		// the character doesn't glitch out when their velocity
		// changes from positive to negative while they're in the middle of a sprite
		if (entity.type !== WALL & entity.type !== OBSTACLE) {
			if (player.vy < 0 && hitTestRectangle(player, entity)) {
				console.log(entity);
				currentlyCollidingSprites.add(entity);
			}
			//ignore collision if moving upwards
			if (player.vy < 0) continue;
		}
		let direction = collisionDirection(player, entity, playerContainer);
		if (!direction) continue;
		handleCollision(player, playerContainer, entity, direction);
		break;
	}
	moveCharacterRelatively(playerContainer, player.vx, player.vy);
	moveBackgroundsRelatively(player.vx, player.vy);
	increaseYVelocity(player, GRAVITY);
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
		let direction = collisionDirection(player, entity, playerContainer);
		//console.log(player.nextFrameY +  " " + player.gy +  " " + entity.y);
		if (!direction) continue;
		handleCollision(player, playerContainer, entity, direction);
		console.log((player.gy + player.halfHeight) + " " + entity.y);
		break;
	}
	moveCharacterRelatively(playerContainer, player.vx, player.vy);
	moveBackgroundsRelatively(player.vx, player.vy);
	increaseYVelocity(player, GRAVITY);
	currentlyCollidingSprites.forEach((entity) => {
		if (!hitTestRectangle(player, entity)) {
			currentlyCollidingSprites.delete(entity);
		}
	});
}

const left = keyboard("ArrowLeft");
const right = keyboard("ArrowRight");
const jump = keyboard(" ");
const down = keyboard("ArrowDown");

let rightHeldDown = false, leftHeldDown = false, jumpButtonIsHeldDown = false;
left.press = () => {
	leftHeldDown = true;
	switch (currentState) {
		case STATES.STANDING:
			increaseXVelocity(player, -PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.WALKING);
			break;
		// if you are already walking when the left button was pressed, 
		// you must've been walking right
		case STATES.WALKING:
			increaseXVelocity(player, -PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.STANDING);
			break;
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	// don't flip object if other arrow key is pressed
	if (!rightHeldDown) player.scale.x = 1;
};

right.press = () => {
	rightHeldDown = true;
	switch (currentState) {
		case STATES.STANDING:
			increaseXVelocity(player, PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.WALKING);
			break;
		case STATES.WALKING:
			increaseXVelocity(player, PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.STANDING);
			break;
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	//don't flip object if other arrow key is pressed
	if (!leftHeldDown) horizontallyFlipCharacter(player, -1);
};

left.release = () => {
	leftHeldDown = false;
	switch (currentState) {
		case STATES.STANDING:
		case STATES.WALKING:
			setXVelocity(player, 0);
			//flip object back to original orientation
			if (rightHeldDown) {
				horizontallyFlipCharacter(player, -1);
				changeCharacterState(player, STATES.WALKING);
				increaseXVelocity(player, PLAYER_XVELOCITY);
			} else {
				changeCharacterState(player, STATES.STANDING);
			}
			break;
		case STATES.JUMPING:
		case STATES.FALLING:
			if (rightHeldDown) horizontallyFlipCharacter(player, -1);
			break;
		default:
			break;
	}
}
right.release = () => {
	rightHeldDown = false;
	switch (currentState) {
		case STATES.STANDING:
		case STATES.WALKING:
			setXVelocity(player, 0);
			//flip object back to original orientation
			if (leftHeldDown) {
				player.scale.x = 1;
				changeCharacterState(player, STATES.WALKING);
				increaseXVelocity(player, -PLAYER_XVELOCITY);
			} else {
				changeCharacterState(player, STATES.STANDING);
			}
			break;
		case STATES.JUMPING:
		case STATES.FALLING:
			if (leftHeldDown) player.scale.x = 1;
			break;
		default:
			break;
	}
}

jump.press = () => {
	switch (currentState) {
		case STATES.JUMPING:
		case STATES.FALLING:
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	changeCharacterState(player, STATES.JUMPING);
	jumpButtonIsHeldDown = true;
};

jump.release = () => {
	jumpButtonIsHeldDown = false;
}

down.press = () => {
	if (currentState === STATES.STANDING || currentState === STATES.WALKING) {
			changeCharacterState(player, STATES.PRONE);
	}
}

down.release = () => {
	if (currentState !== STATES.PRONE) return;
	changeCharacterState(player, STATES.STANDING);
}

function keyboard(value) {
	let key = {};
	key.value = value;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`
	key.downHandler = event => {
		if (event.key === key.value) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
			event.preventDefault();
		}
	};
	//The `upHandler`
	key.upHandler = event => {
		if (event.key === key.value) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
			event.preventDefault();
		}
	};
	//Attach event listeners
	const downListener = key.downHandler.bind(key);
	const upListener = key.upHandler.bind(key);
	window.addEventListener(
		"keydown", downListener, false
	);
	window.addEventListener(
		"keyup", upListener, false
	);
	// Detach event listeners
	key.unsubscribe = () => {
		window.removeEventListener("keydown", downListener);
		window.removeEventListener("keyup", upListener);
	};
	return key;
}

function setXVelocity(entity, velocity) {
	entity.vx = velocity;
}

function setYVelocity(entity, velocity) {
	entity.vy = velocity;
}

function increaseXVelocity(entity, velocity) {
	entity.vx += velocity;
}

function increaseYVelocity(entity, velocity) {
	if (entity.vy < TERMINAL_VELOCITY) entity.vy += velocity;
}

function moveCharacterRelatively(entity, x, y) {
	entity.x += x;
	entity.y += y;
}

function horizontallyFlipCharacter(entity, x) {
	entity.scale.x = x;
}

function moveBackgroundsRelatively(x, y) {
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
			bg.x += (-x * (2 *BACKGROUND_SCALING_FAR));
			bg.y += (-y * BACKGROUND_SCALING_FAR);
		}
		for (let bg of mainContainer[updatedScene].movingBackgroundsNear) {
			bg.x += (-x * BACKGROUND_SCALING_NEAR);
			bg.y += (-y * BACKGROUND_SCALING_NEAR);
		}
	}
}

// update nextFrameX at the beginning of render.
// after making sure there aren't any collisions, update X
// this direction is the direction you approach the entity from
// (so right means you are to the right of the entity when colliding)
export const handleCollision = (sprite, spriteContainer, entity, direction) => {
	console.log(direction + " " + currentState);

	switch(entity.type) {
		case OBSTACLE:
			console.log(direction);
			flinchSprite(sprite, direction);
			changeCharacterState(sprite, STATES.FALLING);
			currentlyCollidingSprites.add(entity);
			return;
		case WALL:
			handleWallCollision(sprite, spriteContainer, entity);
			return;
		default:
			break;
	}
	switch (direction) {
		case 'top':
			return;
			setYVelocity(sprite, 0);
			changeCharacterState(sprite, STATES.FALLING);
			break;
		case 'bottom':
			if (currentState === STATES.WALKING) return;
			setYVelocity(sprite, 0);
			spriteContainer.y = entity.y - sprite.halfHeight;
			//if (sprite.vy < 0) return;
			switch (entity.type) {
				case FINAL_PLATFORM:
					//when reaching the final platform, we don't want to disable the char,
					//but create an invisible box where the player can't exit?
					//changeCharacterState(sprite, STATES.DISABLED);
					//return;
					audioContext.jumpQuestFinished.play();
					entity.type = '';
					break;
				case TELEPORT_PLATFORM:
					spriteContainer.x = entity.teleportCoordinatesX + sprite.halfWidth;
					spriteContainer.y = entity.teleportCoordinatesY - sprite.halfHeight;
					break;
				default:
					break;
			}

			console.log(sprite.vy);
			if (jumpButtonIsHeldDown) {
				// console.log("jumping");
				// console.log(sprite.y + " " + sprite.vy);
				// not sure how to fix jump spam when landing on platform
				//changeCharacterState(sprite, STATES.STANDING);
				
				//changeCharacterState(sprite, STATES.JUMPING);
			}
			if (leftHeldDown != rightHeldDown) {
				if (leftHeldDown) setXVelocity(sprite, -PLAYER_XVELOCITY);
				if (rightHeldDown) setXVelocity(sprite, PLAYER_XVELOCITY);
				changeCharacterState(sprite, STATES.WALKING);
			} else {
				setXVelocity(sprite, 0);
				changeCharacterState(sprite, STATES.STANDING);
			}
			break;
		case 'left':
			if (currentState !== STATES.WALKING) return;
			setXVelocity(sprite, 0);
			spriteContainer.x = entity.x + entity.width + sprite.width/2;
			break;
		case 'right':
			if (currentState !== STATES.WALKING) return;
			setXVelocity(sprite, 0);
			spriteContainer.x = entity.x - sprite.width/2 + 15;
			break;
		default:
			break;
	}
}

function flinchSprite(r1, direction) {
	r1.vy = -4;
	if (direction === "left") {
		r1.vx = 3;
	} else {
		r1.vx = -3;
	}
}

function handleWallCollision(sprite, spriteContainer, entity) {
	// sprite is on the right of the wall
	if (spriteContainer.x > (entity.x + entity.width/2)) {
		spriteContainer.x = entity.x + entity.width + spriteContainer.width/2;
	} else {
		spriteContainer.x = entity.x - sprite.width/2 + 15;
	}
	setXVelocity(sprite, 0);
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
	console.log("please!");
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
			mainContainer.jumpQuest3.addChild(viewportContainer, 10);
			mainContainer.jumpQuest3.sortChildren();
			break;
		default:
			break;
	}
}

//also need to export maincontainer

export {
	setPlayerContainer,
	addChildToViewportContainer,
	addChildToViewportSorter,
	changeAppBackgroundColor,
	addViewportToMainContainer,
	changeScene,
}