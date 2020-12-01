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

import {
	addChildToViewportSorter,
} from '../main.js';

const { TilingSprite, Sprite, Container } = PIXI;

function createJumpQuest1Scene(loader) {
    const jumpQuestScene = new SContainer();
    generateBackgrounds(jumpQuestScene, loader);
    return jumpQuestScene;
}

function generateBackgrounds(jumpQuestScene, loader) {
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest1.json"].spritesheet;

    let clouds = new TilingSprite(loader.resources.ludiClouds.texture,
        loader.resources.ludiClouds.texture.width * 1.5,
        loader.resources.ludiClouds.texture.height);
    jumpQuestScene.addChild(clouds, 1);
    jumpQuestScene.clouds = clouds;

    let bgTowerFar = new Sprite(jumpQuestSheet.textures['bgTowerFar.png']);
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

let finalX, finalY;

function createJumpQuest1Viewport(
    loader,
    entityGrid,
) {
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest1.json"].spritesheet;

    let tower = new Sprite(loader.resources.towerA.texture);
    //tower.scale = 1;	
    //first arg = left or right, second arg = top or bottom
    //so this means bottom left
    tower.anchor.set(0, 1);
	tower.position.set(0, 237);
	addChildToViewportSorter(tower);
	//let platform1 = new Sprite(sheet.textures["platform1.png"]);
	const checkpoints = generateCheckpoints(jumpQuestSheet);
    addChildToViewportSorter(checkpoints);
	entityGrid[0].push(...checkpoints.children);
	
    const steps = generateSteps(entityGrid, jumpQuestSheet);
	for (let step of steps) addChildToViewportSorter(step);
	
    const obstacles = generateObstacles(jumpQuestSheet);
	entityGrid[0].push(...obstacles);
	
	let finishFlag = new Sprite(jumpQuestSheet.textures['finishFlag.png']);
	addChildToViewportSorter(finishFlag);
	finishFlag.scale.x = 0.7;
	finishFlag.scale.y = 0.7;
	finishFlag.x = finalX + finishFlag.width/2;
	finishFlag.y = finalY + 3;
	finishFlag.anchor.set(0, 1);

//    viewportSorter.obstacles = obstacles;
    
    generateJumpQuest1Boundaries(entityGrid, tower);
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
	let stepPositions = generateStepPositions();
	let steps = [];
	for (let position of stepPositions) {
		let step = new Sprite(jumpQuestSheet.textures['jumpQuest1Step.png']);
		steps.push(step);
		Object.assign(step, position);
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
	// push an obstacle at this current y position
	for (let a = 0; a < 5; a++) {
		steps.push({
			x,
			y
		});
		x += NEXT_STEP_X;
	}
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
    finalX = x;
    finalY = y;
	// NEXT_STEP_Y *= -1;
	return steps;
}

//
// x: 250, 
// y: -590,
function generateObstacles(jumpQuestSheet) {
	let obstacles = [
		{
			x: 300, 
			y: -620,
			vx: 3,
			vy: 0,
			boundaryLeft: 300,
			boundaryRight: 850,
			movementType: HORIZONTAL,
			type: OBSTACLE,
			rotate: true
		},
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
    leftWall.x = tower.x;
    leftWall.y = -2000;
	leftWall.width = 30;
	leftWall.height = 3000;
	leftWall.type = WALL;
	leftWall.roundpixels = true;
    entityGrid[0].push(leftWall);

	let rightWall = new Sprite();
	rightWall.x = tower.width - 30;
    rightWall.y = -2000;
	rightWall.width = 30;
	rightWall.height = 3000;
	rightWall.type = WALL;
	rightWall.roundpixels = true;
    entityGrid[0].push(rightWall);
}


export {
    createJumpQuest1Scene,
    createJumpQuest1Viewport
}