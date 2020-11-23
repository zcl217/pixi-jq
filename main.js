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
	ASSET_PATH
} from './constants/constants.js';

import SContainer from './scripts/SContainer.js';
import {
	spriteCollision,
	platformCollision,
	hitTestRectangle
} from './helpers/collisionHandler.js';

import createAllMenuScenes from './scenes/menuScenes.js';
import {
	createJumpQuest1Scene,
 } from './scenes/jumpQuest1.js';
 
import socketTypes from './constants/socketTypes.js';

import { 
	sock,
	connectionStatus,
	updatedPlayerProperties,
	currentConnectionId,
	updatedScene
} from './sockClient.js';

import { audioContext } from '../helpers/audio.js';
import createCharacter from '../helpers/playerCreator.js';
import createJumpQuest from './helpers/jumpQuestCreator.js';

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
	type = "canvas";
}

const {
	loader,
	Container,
} = PIXI;
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
const viewportSorter = new SContainer();
app.stage.addChild(mainContainer);

const viewportContainer = new Viewport.Viewport({
	screenWidth: window.innerWidth,
	screenHeight: window.innerHeight,
	worldWidth: 512,
	worldHeight: 512,

	interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
})

viewportContainer.addChild(viewportSorter);

// viewport.clamp({
//   direction: 'all'
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
//app.stage.addChild(viewport);
// mainContainer.addChild(viewport, 10);
// viewport.interactive = true;
// viewport.on('pointerdown', () => {
//   console.log("ASdf");
//   viewport.cursor= "url('./sprites/temp/cursorClick.png'),auto";
// });
// viewport.on('pointerup', () => {
//   console.log("Wew");
//   viewport.cursor = "url('./sprites/temp/cursor.png'),auto";
// })

viewportContainer
	// .drag({
	// 	pressDrag: false,
	// })
	.pinch()
	//  .wheel()
	.decelerate();


//in the future, make sure we put all sprites in the spritesheet
PIXI.loader
	.add('clouds', ASSET_PATH + "sprites/current spritesheet/midClouds.png")
	.add("bgtf", ASSET_PATH + "sprites/current spritesheet/jq assets/bgTowerFar.png")
	.add('towerA', ASSET_PATH + "sprites/current spritesheet/jq assets/towerA.png")
	.add('platform1', ASSET_PATH + "sprites/current spritesheet/platform1.png")
	.add('roomIdStand', ASSET_PATH + "sprites/current spritesheet/roomIdStand.png")
	.add(ASSET_PATH + "sprites/characters.json")
	.add(ASSET_PATH + "sprites/menuSheet.json")
	.add(ASSET_PATH + "sprites/jumpQuest.json")
	.load(setup);

loader.onProgress.add(loadHandler);

function loadHandler(loader, resource) {
	console.log("loading: " + resource.url);
	console.log("Progress: " + loader.progress.toString().substring(0, 4) + "%");
}

let characterSheet;
let player, playerContainer;

let clouds, movingBackgroundsFar, movingBackgroundsNear;

let currentState = STATES.DISABLED, currentScene = '';

let entityGrid = [[]];

let otherPlayersMap = new Map();

function setup() {
	console.log(app.renderer.type);
	characterSheet = loader.resources[ASSET_PATH + "sprites/characters.json"].spritesheet;
	//app.stage.viewportContainer.visible = false;
	initializeTextures();

	//let menuScenes = createMenuScene();
	let jumpQuest1 = createJumpQuest1Scene(loader);
	
	//we should create all containers in menuscenes.js instead!
	// then just reassign them here!
	const containers = {
		viewportContainer,
		viewportSorter,
		entityGrid,
		mainContainer
	};
	console.log(containers);
	let menuScenes = createAllMenuScenes(
						app, 
						loader, 
						characterTextures, 
						containers,
						sock
					);
	mainContainer.addChild(menuScenes);
	mainContainer.addChild(jumpQuest1);
	mainContainer.menuScenes = menuScenes;
	mainContainer.jumpQuest1 = jumpQuest1;

	menuScenes.x = app.screen.width/2 - menuScenes.width/2;
	menuScenes.y = app.screen.height/2 - menuScenes.height/2;
	
	movingBackgroundsFar  = jumpQuest1.movingBackgroundsFar;
	movingBackgroundsNear = jumpQuest1.movingBackgroundsNear;
	clouds = jumpQuest1.clouds;
	mainContainer.menuScenes.visible = true;
	mainContainer.jumpQuest1.visible = false;
	app.renderer.backgroundColor = 0x000000;
	audioContext.title.play();
	console.log(menuScenes);


	app.ticker.add(delta => gameLoop(delta));
}

const characterTextures = [];
function initializeTextures() {
	PLAYABLE_CHARACTERS.forEach((charId) => {
		let walkingTextures = characterSheet.animations[charId + "walk"];
		let standingTextures = characterSheet.animations[charId + "stand"];
		let alertTextures = characterSheet.animations[charId + "alert"];
		let jumpTexture = [characterSheet.textures[charId + "jump_0.png"]];
		let texture = {
			walkingTextures,
			standingTextures,
			alertTextures,
			jumpTexture,
		};
		characterTextures.push(texture);
	});
}

let tick = 0;
let initialRender = true;
function gameLoop(delta) {
	if (!shouldRender(mainContainer)) return;
	if (sock) {
		switch(connectionStatus) {
			case CONNECTION_STATUS.PENDING:
				return;
			case CONNECTION_STATUS.ERROR:
				console.log("error");
				return;
			default:
				break;
		}
	}
	if (initialRender) {
		playerContainer = mainContainer.menuScenes.playerContainer;
		player = mainContainer.menuScenes.playerContainer.player;
		initialRender = false;
		changeCharacterState(player, STATES.FALLING);
	}
	// if multiplayer mode
	if (sock) {
		handleScene();
		handleMultiplayer();
	}
	player.nextFrameX = playerContainer.x + player.vx;
	player.nextFrameY = playerContainer.y + player.vy;
	handlePlayerState();
	handleBackground();
	handleObstacleMovement(entityGrid, delta);
}

function shouldRender(mainContainer) {
	return mainContainer.jumpQuest1.visible === true ||
		   mainContainer.jumpQuest2?.visible === true ||
		   mainContainer.jumpQuest3?.visible === true ||
		   mainContainer.menuScenes?.multiplayerLobby.visible === true;
}

function handlePlayerState() {
	switch (currentState) {
		case STATES.STANDING:
			for (let entity of entityGrid[0]) checkForObstacleCollisions(entity);
			break;
		case STATES.WALKING:
			moveCharacterRelatively(playerContainer, player.vx, 0);
			moveBackgroundsRelatively(player.vx, 0);
			//check if on platform still, if not then change to falling state
			let onPlatform = false;
			for (let entity of entityGrid[0]) {
				if (entity.type === WALL) {
				//	console.log(entity.x + " " + entity.width + " " + playerContainer.x);
				}
				//console.log(entity.type);
				let direction = spriteCollision(player, entity, playerContainer);
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
	let direction = spriteCollision(player, entity, playerContainer);
	if (entity.type === OBSTACLE && direction) {
		handleCollision(player, playerContainer, entity, direction);
		changeCharacterState(player, STATES.FALLING);
	}
}

function handleBackground() {
	clouds.tilePosition.x += 0.1;
	clouds.tilePosition.y += 0;
}

function handleObstacleMovement(entityGrid, delta) {
	let obstacleList = entityGrid[0].filter((entity) => entity.type === OBSTACLE);
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

function handleScene() {
	if (currentScene !== updatedScene) {
		currentScene = updatedScene;
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
		switch(updatedScene) {
			case SCENES.JUMP_QUEST_1:
				createJumpQuest(...args, 1);
				transferPlayersToNewScene(viewportSorter);
				break;
			case SCENES.JUMP_QUEST_2:
				createJumpQuest(...args, 2);
				transferPlayersToNewScene(viewportSorter);
				break;
			case SCENES.JUMP_QUEST_3:
				createJumpQuest(...args, 3);
				transferPlayersToNewScene(viewportSorter);
				break;
		}
	}
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
	for (let a = 0; a < updatedPlayerProperties.length; a++) {
		let updatedPlayer = updatedPlayerProperties[a];
		// don't need to update yourself
		if (updatedPlayer.connectionId === currentConnectionId) continue;
		if (!otherPlayersMap.has(updatedPlayer.connectionId)) {
			addPlayer(updatedPlayer);
			console.log("wtf");
			continue;
		}
		let playerContainer = otherPlayersMap.get(updatedPlayer.connectionId);
		let playerSprite = playerContainer.player;
	//	console.log(updatedPlayer);
		// update player textures if they changed state
		if (playerSprite.currentTextures !== updatedPlayer.currentTextures) {
			playerSprite.textures = characterTextures[updatedPlayer.charId][updatedPlayer.currentTextures];
			console.log(updatedPlayer.charId);
			if (updatedPlayer.currentTextures != TEXTURE_NAMES.JUMPING) {
				console.log("wtafweaf");
				playerSprite.animationSpeed = ANIMATION_SPEEDS[updatedPlayer.currentTextures];
				playerSprite.play();
			}
			playerSprite.currentTextures = updatedPlayer.currentTextures;
		}
		playerContainer.x = updatedPlayer.x;
		playerContainer.y = updatedPlayer.y;
		playerSprite.scale.x = updatedPlayer.direction;
	}
}

function addPlayer(playerToAdd) {
	console.log(playerToAdd);
	console.log("Hey?");
	let connectionId = playerToAdd.connectionId;

	let newPlayerContainer = createCharacter(playerToAdd.playerName, playerToAdd.charId, characterTextures);
	mainContainer.menuScenes.multiplayerLobby.addChild(newPlayerContainer);
	console.log(newPlayerContainer);
	newPlayerContainer.x = 200;
	newPlayerContainer.y = -100;
	// a local property that helps us decide when to change textures
	newPlayerContainer.player.currentTextures = TEXTURE_NAMES.JUMPING;
	otherPlayersMap.set(connectionId, newPlayerContainer);
}

function changeCharacterState(entity, state) {
	switch (state) {
		case STATES.STANDING:
			currentState = STATES.STANDING;
			entity.textures = characterTextures[entity.charId].standingTextures;
			entity.animationSpeed = ANIMATION_SPEEDS.standingTextures;
			entity.play();
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
			tick = 0;
			break;
		case STATES.FALLING:
			currentState = STATES.FALLING;
			entity.textures = characterTextures[entity.charId].jumpTexture;
			tick = 0;
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
		//if we're going up, ignore all entities
		// HOWEVER, THIS GLITCHES OUT WHEN OUR VELOCITY CHANGES FROM POSITIVE TO NEGATIVE
		// WHILE COLLIDING WITH AN ENTITY, SINCE WE START CONSIDERING COLLISION
		// IN THE MIDST OF AN ONGOING COLLISION
		// solution is to ignore the ones you are currently colliding with!
		// to do this, we could make a set to check which ones we are currenlty colliding with
		// at the instant of our positive -> negative y velocity change
		// we ignore all the ones in the set
		if (player.vy < 0 && hitTestRectangle(player, entity) && entity.type !== OBSTACLE) {
			console.log(entity);
			currentlyCollidingSprites.add(entity);
		}
		//ignore collision if moving upwards
		if (player.vy < 0) continue;
		let direction = spriteCollision(player, entity, playerContainer);
		if (!direction) continue;
		handleCollision(player, playerContainer, entity, direction);

		// console.log((player.y + player.halfHeight) + " " + entity.y);
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
	let collided = false;
	for (let entity of entityGrid[0]) {
		if (currentlyCollidingSprites.has(entity)) continue;
		let direction = spriteCollision(player, entity, playerContainer);
		//console.log(player.nextFrameY +  " " + player.gy +  " " + entity.y);
		if (!direction) continue;
		handleCollision(player, playerContainer, entity, direction);
collided = true;
		console.log((player.gy + player.halfHeight) + " " + entity.y);
		break;
	}
	if (collided) console.log(player.vx + " " + player.vy);
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

let rightHeldDown = false, leftHeldDown = false, jumpButtonIsHeldDown = false;
left.press = () => {
	leftHeldDown = true;
	switch (currentState) {
		case STATES.STANDING:
			increaseXVelocity(player, -PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.WALKING);
			break;
		//if you are already walking when the left button was pressed, 
		//you must've been walking right
		case STATES.WALKING:
			increaseXVelocity(player, -PLAYER_XVELOCITY);
			changeCharacterState(player, STATES.STANDING);
			break;
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	//don't flip object if other arrow key is pressed
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
	if (!leftHeldDown) player.scale.x = -1;
};

left.release = () => {
	leftHeldDown = false;
	switch (currentState) {
		case STATES.STANDING:
		case STATES.WALKING:
			setXVelocity(player, 0);
			//flip object back to original orientation
			if (rightHeldDown) {
				player.scale.x = -1;
				changeCharacterState(player, STATES.WALKING);
				increaseXVelocity(player, PLAYER_XVELOCITY);
			} else {
				changeCharacterState(player, STATES.STANDING);
			}
			break;
		case STATES.JUMPING:
		case STATES.FALLING:
			if (rightHeldDown) player.scale.x = -1;
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
	console.log("increase x velocity! " + velocity + " cur Xvelocity: " + entity.vx);
}

function increaseYVelocity(entity, velocity) {
	if (entity.vy < TERMINAL_VELOCITY) entity.vy += velocity;
}

function moveCharacterRelatively(entity, x, y) {
	entity.x += x;
	entity.y += y;
}

function moveBackgroundsRelatively(x, y) {
	for (let bg of movingBackgroundsFar) {
		bg.x += (-x * BACKGROUND_SCALING_FAR)
		bg.y += (-y * BACKGROUND_SCALING_FAR);
	}
	for (let bg of movingBackgroundsNear) {
		bg.x += (-x * BACKGROUND_SCALING_NEAR)
		bg.y += (-y * BACKGROUND_SCALING_NEAR);
	}
}

// update nextFrameX at the beginning of render.
// after making sure there aren't any collisions, update X
// this direction is the direction you approach the entity from
// (so right means you are to the right of the entity when colliding)
export const handleCollision = (sprite, spriteContainer, entity, direction) => {
	console.log(direction + " " + currentState);

	/*
		current problem: jumping onto the top right of a platform
		it says we collide left, and then collide bottom
		the problem is that when we collide left, we get nudged
		towards the right of the platform and then fall naturally again.
		what we want is for the bottom collision to take priority
		OR just not get nudged off the platform (Which seems impossible
		since that's the expected behavior if we get collide left
		//although I feel like I've already looked into the source code
		//to try and make bottom collisions take priority...
	*/

	if (entity.type === OBSTACLE) {
		console.log(direction);
		flinchSprite(sprite, spriteContainer, direction);
		changeCharacterState(sprite, STATES.FALLING);
		currentlyCollidingSprites.add(entity);
		return;
	}
	switch (direction) {
		case 'top':
			return;
			setYVelocity(sprite, 0);
			changeCharacterState(sprite, STATES.FALLING);
			break;
		case 'bottom':
			if (currentState === STATES.WALKING) return;
			playerContainer.y = entity.y - player.halfHeight;
			//if (sprite.vy < 0) return;
			switch (entity.type) {
				case FINAL_PLATFORM:
					//when reaching the final platform, we don't want to disable the char,
					//but create an invisible box where the player can't exit?
					//changeCharacterState(sprite, STATES.DISABLED);
					//return;
					audioContext.jumpQuestFinished.play();
					break;
				default:
					break;
			}

			console.log(sprite.vy);
			setYVelocity(sprite, 0);
			if (jumpButtonIsHeldDown) {
				// console.log("jumping");
				// console.log(sprite.y + " " + sprite.vy);
				// not sure how to fix jump spam when landing on platform
				//changeCharacterState(sprite, STATES.STANDING);
				return;
				changeCharacterState(sprite, STATES.JUMPING);
			}
			if (leftHeldDown != rightHeldDown) {
				console.log("walking");
				if (leftHeldDown) setXVelocity(sprite, -PLAYER_XVELOCITY);
				if (rightHeldDown) setXVelocity(sprite, PLAYER_XVELOCITY);
				changeCharacterState(sprite, STATES.WALKING);
			} else {
				console.log("standing");
				setXVelocity(sprite, 0);
				changeCharacterState(sprite, STATES.STANDING);
			}
			break;
		case 'left':
			if (currentState !== STATES.WALKING) return;
			setXVelocity(sprite, 0);
			spriteContainer.x = entity.x + entity.width + playerContainer.width/2;
			break;
		case 'right':
			if (currentState !== STATES.WALKING) return;
			setXVelocity(sprite, 0);
			spriteContainer.x = entity.x - player.width/2 + 15;
			break;
		default:
			break;
	}
}

function flinchSprite(r1, r1Container, direction) {
	r1.vy = -4;
	if (direction === "left") {
		r1.vx = 3;
	} else {
		r1.vx = -3;
	}
	console.log(r1.vx + " " + r1.vy);
}