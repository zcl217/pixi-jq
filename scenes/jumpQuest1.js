// @ts-check
import { 
    FINAL_PLATFORM, 
    HORIZONTAL, 
    NEXT_STEP_X, 
    NEXT_STEP_Y, 
    OBSTACLE, 
	WALL,
	ASSET_PATH,
	VERTICAL,
	INVISIBLE,
	TELEPORT_PLATFORM
} from '../constants/constants.js';
import SContainer from '../scripts/SContainer.js';

const { TilingSprite, Sprite, Container } = PIXI;

function createJumpQuest1Scene(loader) {
    const jumpQuestScene = new SContainer();
    generateBackgrounds(jumpQuestScene, loader);
    return jumpQuestScene;
}

//memo: adding roundpixels: true to the app settings
//fixes the weird pixel glitch but makes the movement
//less smooth. might be a problem with the image? ... not sure
// the problem is with the spritesheet! 
// IF SOMETHING LIKE THIS HAPPENS AGAIN JUST DIRECTLY IMPORT
// THAT TEXTURE INSTEAD OF WASTING TIME.
function generateBackgrounds(jumpQuestScene, loader) {
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest.json"].spritesheet;

    let clouds = new TilingSprite(loader.resources.clouds.texture,
        loader.resources.clouds.texture.width,
        loader.resources.clouds.texture.height);
    jumpQuestScene.addChild(clouds, 1);
    jumpQuestScene.clouds = clouds;

    let bgTowerFar = new Sprite(loader.resources.bgtf.texture);
    //let bgTowerFar = new Sprite(sheet.textures['bgTowerFar.png']);
    let bgTowerNear = new TilingSprite(
        jumpQuestSheet.textures['bgTowerNear.png'],
        jumpQuestSheet.textures['bgTowerNear.png'].width,
        jumpQuestSheet.textures['bgTowerNear.png'].height
    );
    jumpQuestScene.addChild(bgTowerFar, 0);
    jumpQuestScene.addChild(bgTowerNear, 2);
    bgTowerFar.position.set(100, 10);
    bgTowerNear.position.set(500, 0);
    
    let movingBackgroundsFar = [];
    let movingBackgroundsNear = [];
    movingBackgroundsFar.push(bgTowerFar);
    movingBackgroundsNear.push(bgTowerNear);
    jumpQuestScene.movingBackgroundsFar = movingBackgroundsFar;
    jumpQuestScene.movingBackgroundsNear = movingBackgroundsNear;
}

function createJumpQuest1Viewport(
    mainContainer,
    viewportContainer,
    loader,
    viewportSorter,
    entityGrid,
) {
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest.json"].spritesheet;

    mainContainer.jumpQuest1.addChild(viewportContainer, 10);
    let tower = new Sprite(loader.resources.towerA.texture);
    //tower.scale = 1;	
    //first arg = left or right, second arg = top or bottom
    //so this means bottom left
    tower.anchor.set(0, 1);
    tower.position.set(0, 237);
    viewportSorter.addChild(tower);
	//let platform1 = new Sprite(sheet.textures["platform1.png"]);
	const checkpoints = generateCheckpoints(jumpQuestSheet);
    viewportSorter.addChild(checkpoints);
	entityGrid[0].push(...checkpoints.children);
	
    const steps = generateSteps(entityGrid, jumpQuestSheet);
	for (let step of steps) viewportSorter.addChild(step);
	
    const obstacles = generateObstacles(jumpQuestSheet);
    console.log(obstacles[0]);
	for (let obstacle of obstacles) viewportSorter.addChild(obstacle);
	entityGrid[0].push(...obstacles);
	
	let finishFlag = new Sprite(jumpQuestSheet.textures['finishFlag.png']);
	viewportSorter.addChild(finishFlag);
	finishFlag.scale.x = 0.7;
	finishFlag.scale.y = 0.7;
	finishFlag.x = finalX + finishFlag.width/2;
	finishFlag.y = finalY + 3;
	finishFlag.anchor.set(0, 1);
	console.log(finishFlag);
	console.log(finalX + " "  + finalY);

    viewportSorter.obstacles = obstacles;
    
    generateJumpQuest1Boundaries(entityGrid, tower);

    viewportSorter.sortChildren();
    mainContainer.jumpQuest1.sortChildren();
}

const checkpointPositions = [
	{
		x: 0,
		y: 0,
		platformType: 1
	},
	{
		x: 200,
		y: -2400,
		platformType: 2
	},
	{
		x: 450,
		y: -1800,
		platformType: 3
	}
];

function generateCheckpoints(jumpQuestSheet) {
	let checkpoints = new Container();
	for (let position of checkpointPositions) {
		let imagePath = 'platform' + position.platformType + '.png';
		let checkpoint = new Sprite(jumpQuestSheet.textures[imagePath]);

		checkpoint.x = position.x;
		checkpoint.y = position.y;
		checkpoints.addChild(checkpoint);
		checkpoint.roundpixels = true;
	}
	return checkpoints;
}

function generateSteps(entityGrid, jumpQuestSheet) {
	let stepPositions = generateStepPositions2();
	let steps = [];
	for (let position of stepPositions) {
		let step = new Sprite(jumpQuestSheet.textures['jumpQuest1Step.png']);
		steps.push(step);
		Object.assign(step, position);
		if (step.type === TELEPORT_PLATFORM) console.log(step);
		step.halfWidth = step.width / 2 - 12;
		if (position.type !== INVISIBLE) {
			entityGrid[0].push(step);
		}
	}
	return steps;
}

function generateStepPositions() {
	let x = 150;
	let y = -50;
	let steps = [];
	for (let a = 0; a < 4; a++) {
		steps.push({
			x,
			y
		});
		x += NEXT_STEP_X;
		y -= NEXT_STEP_Y;
	} 
	for (let a = 0; a < 2; a++) {
		steps.push({
			x,
			y
		});
		y -= NEXT_STEP_Y;
	} 
	for (let a = 0; a < 3; a++) {
		steps.push({
			x,
			y
		});
		x -= NEXT_STEP_X;
		y -= NEXT_STEP_Y;
	}
	x += NEXT_STEP_X;
	console.log(x);
	// push an obstacle at this current y position
	for (let a = 0; a < 5; a++) {
		steps.push({
			x,
			y
		});
		x += NEXT_STEP_X;
	}
	console.log(x);
	x -= NEXT_STEP_X;
	y -= NEXT_STEP_Y;
	for (let a = 0; a < 2; a++) {
		steps.push({
			x,
			y
		});
		x -= NEXT_STEP_X;
		y -= NEXT_STEP_Y;
	}
	// push a flag on the current x and y coordinates
	steps.push({
		x,
		y,
		type: FINAL_PLATFORM
	});
	
	// NEXT_STEP_Y *= -1;
	return steps;
}

let initialStepX = 300;
let finalX, finalY;
function generateStepPositions2() {
	let x = initialStepX;
	let y = -50;
	let steps = [];
	steps.push({
		x,
		y
	});
	y -= NEXT_STEP_Y;
	for (let a = 0; a < 8; a++) {
		if (a % 2 === 0) {
			steps.push({
				x: x + NEXT_STEP_X,
				y
			});
			steps.push({
				x: x - NEXT_STEP_X,
				y
			});
		} else {
			steps.push({
				x,
				y
			})
		}
		y -= NEXT_STEP_Y;
	} 
	for (let a = 0; a < 5; a++) {
		steps.push({
			x,
			y
		});
		y -= NEXT_STEP_Y;
		x += NEXT_STEP_X;
	} 
	steps.push({
		x,
		y
	});
	y -= NEXT_STEP_Y;
	console.log(x);
	for (let a = 0; a < 7; a++) {
		steps.push({
			x,
			y
		});
		x -= NEXT_STEP_X;
	}
	y -= NEXT_STEP_Y;
	steps.push({
		x,
		y
	});
	y -= NEXT_STEP_Y;
	console.log(x);
	for (let a = 0; a < 7; a++) {
		steps.push({
			x,
			y
		});
		x += NEXT_STEP_X;
	}
	for (let a = 0; a < 3; a++) {
		steps.push({
			x,
			y
		});
		y -= NEXT_STEP_Y;
		x += NEXT_STEP_X;
	}
	x -= NEXT_STEP_X;
	
	let teleportX = x;
	let teleportY = y - (NEXT_STEP_Y * 2);

	steps.push({
		x,
		y
	})
	y -= NEXT_STEP_Y;
	for (let a = 0; a < 8; a++) {
		let randomBlock = Math.round(Math.random()*1);
		console.log(randomBlock);
		if (a % 2 === 0) {
			let currentStep = generateRandomTeleportStep(x, y + NEXT_STEP_Y, teleportX, teleportY, randomBlock);
			steps.push(currentStep);
			randomBlock += randomBlock === 0 ? 1 : -1;
			currentStep = generateRandomTeleportStep(x, y - NEXT_STEP_Y, teleportX, teleportY, randomBlock);
			steps.push(currentStep);
		} else {
			steps.push({
				x,
				y
			})
		}
		x -= NEXT_STEP_X;
	}
	y -= NEXT_STEP_Y;

	steps.push({
		x,
		y
	});
	y -= NEXT_STEP_Y;
	
	for (let a = 0; a < 7; a++) {
		
		steps.push({
			x,
			y
		});
		if (a % 2 === 0) {
			x += NEXT_STEP_X;	
		} else {
			x -= NEXT_STEP_X;
		}
		y -= NEXT_STEP_Y;
	}

	for (let a = 0; a < 2; a++) {
		
		steps.push({
			x,
			y
		});
		y -= NEXT_STEP_Y;
		x += NEXT_STEP_X;
	}

	x += (NEXT_STEP_X * 3);
	y += (NEXT_STEP_Y * 2);
	steps.push({
		x,
		y,
		type: FINAL_PLATFORM
	})
	finalX = x;
	finalY = y;

	// push a flag on the current x and y coordinates
	return steps;
}

function generateRandomTeleportStep(x, y, teleportX, teleportY, randomBlock) {
	if (randomBlock === 0) {
		return {
			x,
			y,
			type: TELEPORT_PLATFORM,
			teleportCoordinatesX: teleportX,
			teleportCoordinatesY: teleportY
		}
	} else {
		return {
			x,
			y
		}
	}
}
//
// x: 250, 
// y: -590,
function generateObstacles(jumpQuestSheet) {
	let obstacles = [
		// {
		// 	x: 300, 
		// 	y: -620,
		// 	vx: 3,
		// 	vy: 0,
		// 	boundary1: 300,
		// 	boundary2: 850,
		// 	movementType: HORIZONTAL,
		// 	type: OBSTACLE,
		// 	rotate: true
		// },
		{
			x: initialStepX, 
			y: -950,
			vx: 3,
			vy: 0,
			boundary1: initialStepX - 260,
			boundary2: initialStepX + 325,
			movementType: HORIZONTAL,
			type: OBSTACLE,
			rotate: true
		},
		{
			x: initialStepX, 
			y: -950,
			vx: 3,
			vy: 0,
			boundary1: initialStepX - 260,
			boundary2: initialStepX + 325,
			movementType: HORIZONTAL,
			type: OBSTACLE,
			rotate: true
		},
		{
			x: initialStepX - 260, 
			y: -1070,
			vx: 6,
			vy: 0,
			boundary1: initialStepX - 260,
			boundary2: initialStepX + 325,
			movementType: HORIZONTAL,
			type: OBSTACLE,
			rotate: true
		},
		{
			x: initialStepX + 300, 
			y: -1070,
			vx: 3,
			vy: 0,
			boundary1: initialStepX - 260,
			boundary2: initialStepX + 325,
			movementType: HORIZONTAL,
			type: OBSTACLE,
			rotate: true
		},
		{
			x: initialStepX + 50, 
			y: -1070,
			vx: 0,
			vy: 3,
			boundary1: -1400,
			boundary2: -700,
			movementType: VERTICAL,
			type: OBSTACLE,
			rotate: true
		},
		{
			x: initialStepX - 10, 
			y: -1400,
			vx: 0,
			vy: 15,
			boundary1: -1900,
			boundary2: -1100,
			movementType: VERTICAL,
			type: OBSTACLE,
			rotate: true
		}
	];
	let obstacleSprites = [];
	for (let obstacleData of obstacles) {
		let obstacle = new Sprite(jumpQuestSheet.textures['obstacle.png']);
		obstacleSprites.push(obstacle);
		Object.assign(obstacle, obstacleData);
		obstacle.y -= obstacle.height;
		obstacle.halfWidth = obstacle.width / 2 - obstacle.width / 4;
		obstacle.type = obstacleData.type;
		if (obstacleData.rotate) {
			obstacle.anchor.set(0.5);
		}
	}
	return obstacleSprites;
}

function generateJumpQuest1Boundaries(entityGrid, tower) {

	let leftWall = new Sprite();
    leftWall.x = tower.x - 30;
    leftWall.y = -2000;
	leftWall.width = 30;
	leftWall.height = 3000;
    leftWall.type = WALL;
    entityGrid[0].push(leftWall);

	let rightWall = new Sprite();
	rightWall.x = tower.width - 30;
    rightWall.y = -2000;
	rightWall.width = 10;
	rightWall.height = 3000;
	rightWall.type = WALL;
    entityGrid[0].push(rightWall);
}


export {
    createJumpQuest1Scene,
    createJumpQuest1Viewport
}