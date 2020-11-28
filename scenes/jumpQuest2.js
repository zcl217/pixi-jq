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

function createJumpQuest2Scene(loader) {
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
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest2.json"].spritesheet;

    let clouds = new TilingSprite(jumpQuestSheet.textures['mushClouds.png'],
        jumpQuestSheet.textures['mushClouds.png'].width * 4,
        jumpQuestSheet.textures['mushClouds.png'].height);

    let moon = new Sprite(jumpQuestSheet.textures['moon.png']);
    moon.alpha = 0.3;
	let mountain = new Sprite(jumpQuestSheet.textures['mountain.png']);
	mountain.scale.x = 1.7;
	mountain.scale.y = 1.7;
    mountain.roundpixels = true;
    
    // let castleFar = new Sprite(jumpQuestSheet.textures['castleFar.png']);
	// castleFar.scale.x = 0.5;
    // castleFar.scale.y = 0.5;
    // castleFar.alpha = 0.8;
    // castleFar.roundpixels = true;
    
    // let castleNear = new Sprite(jumpQuestSheet.textures['castleNear.png']);
    
    jumpQuestScene.addChild(mountain, 0);
    jumpQuestScene.addChild(moon, 0);
    jumpQuestScene.addChild(clouds, 1);
    // jumpQuestScene.addChild(castleFar, 2);
    // jumpQuestScene.addChild(castleNear, 3);
    moon.position.set(0, 0);
	mountain.position.set(150, 450);
    // castleFar.position.set(300, 600);
    // castleNear.position.set(100, 100);
    
    let movingBackgroundsFar = [];
    let movingBackgroundsNear = [];
    movingBackgroundsFar.push(moon);
    // movingBackgroundsFar.push(castleFar);
    // movingBackgroundsNear.push(castleNear);
    jumpQuestScene.clouds = clouds;
    jumpQuestScene.movingBackgroundsFar = movingBackgroundsFar;
    jumpQuestScene.movingBackgroundsNear = movingBackgroundsNear;
}

function createJumpQuest2Viewport(
    loader,
    entityGrid,
) {
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest2.json"].spritesheet;

	let floor = new Sprite(loader.resources.mushFloor.texture);
	let floorBg = new Sprite(loader.resources.mushFloorBg.texture);
	floorBg.x = floor.x;
	floorBg.y = floor.y - (floorBg.height / 1.4) + 12;
	floor.roundpixels = true;
	floorBg.roundpixels = true;
	addChildToViewportSorter(floorBg, 4);
	addChildToViewportSorter(floor, 5);
	entityGrid[0].push(floor);
	//let platform1 = new Sprite(sheet.textures["platform1.png"]);
	
	// const checkpoints = generateCheckpoints(jumpQuestSheet);
    // viewportSorter.addChild(checkpoints);
	// entityGrid[0].push(...checkpoints.children);
    
    let dangerSignPositions = [];
    let initialStepX = 800;
    let initialStepY = -60;
    const steps = generateSteps(
        entityGrid,
        jumpQuestSheet,
        dangerSignPositions,
        initialStepX,
        initialStepY,
    );
	for (let step of steps) addChildToViewportSorter(step, 4);
	
    const obstacles = generateObstacles(jumpQuestSheet);
    console.log(obstacles[0]);
    entityGrid[0].push(...obstacles);
    
    dangerSignPositions.forEach((signData) => {
        let sign = new Sprite(jumpQuestSheet.textures['sign1.png']);
        sign.scale.x = 0.7;
        sign.scale.y = 0.7;
        sign.x = signData.x;
        sign.y = signData.y - steps[0].height - 10;
        sign.anchor.set(0);
        sign.roundpixels = true;
        addChildToViewportSorter(sign, 3);
    });
    
    // just use the finish flag texture in the jq1 sprite sheet instead of putting it in both sheets
	let finishFlagTexture = loader.resources[ASSET_PATH + "sprites/jumpQuest1.json"].spritesheet.textures['finishFlag.png'];
	let finishFlag = new Sprite(finishFlagTexture);
	addChildToViewportSorter(finishFlag);
	finishFlag.scale.x = 0.7;
	finishFlag.scale.y = 0.7;
	finishFlag.x = finalX + finishFlag.width/2;
	finishFlag.y = finalY + 3;
	finishFlag.anchor.set(0, 1);
    
    generateJumpQuest2Boundaries(entityGrid);
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

function generateSteps(
    entityGrid, 
    jumpQuestSheet, 
    dangerSignPositions,
    initialStepX, 
    initialStepY
) {
	let stepPositions = generateStepPositions(dangerSignPositions, initialStepX, initialStepY);
	let steps = [];
	for (let position of stepPositions) {
        let randomStep = Math.ceil(Math.random()*4);
		let step = new Sprite(jumpQuestSheet.textures['jumpQuest2Step' + randomStep + '.png']);
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


let finalX, finalY;
function generateStepPositions(dangerSignPositions, initialStepX, initialStepY) {
	let x = initialStepX;
	let y = initialStepY;
    let steps = [];
    let curObstacleIndex = 0;
	steps.push({x, y});
	y -= NEXT_STEP_Y;
	steps.push({x, y});
	y -= NEXT_STEP_Y;
	for (let a = 0; a < 4; a++) {
        steps.push({x, y})
        y -= NEXT_STEP_Y;
        x += NEXT_STEP_X;
    } 
    y += ( NEXT_STEP_Y * 2 );
    steps.push({x, y});
    y += NEXT_STEP_Y;
    x += NEXT_STEP_X;
    steps.push({x, y});
    y -= NEXT_STEP_Y;
    x += NEXT_STEP_X;
    for (let a = 1; a < 5; a++) {
        if (a == 2) {
            steps.push({x, y: y - NEXT_STEP_Y, type: INVISIBLE});
            dangerSignPositions.push({x, y: y - NEXT_STEP_Y});
            steps.push({x, y: y + NEXT_STEP_Y});
        } else if (a == 4) {
            steps.push({x, y: y - NEXT_STEP_Y});
            steps.push({x, y: y + NEXT_STEP_Y, type: INVISIBLE});
            dangerSignPositions.push({x, y: y + NEXT_STEP_Y});
        } else {
            steps.push({x, y});
        }
        x += NEXT_STEP_X;
    }
    for (let a = 0; a < 2; a++) {
        steps.push({x, y});
        x += NEXT_STEP_X;
        y += NEXT_STEP_Y;
    }
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    for (let a = 0; a < 2; a++) {   
        steps.push({x, y});
        x += NEXT_STEP_X
        y -= NEXT_STEP_Y;
    }
    obstacles[curObstacleIndex].x = x;
    obstacles[curObstacleIndex].y = y;
    obstacles[curObstacleIndex].boundaryLeft = x - NEXT_STEP_X/2;
    for (let a = 0; a < 4; a++) {
        steps.push({x, y});
        x += NEXT_STEP_X;
    }
    obstacles[curObstacleIndex].boundaryRight = x;
    curObstacleIndex++;
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    y += NEXT_STEP_Y;
    x += NEXT_STEP_X;
    obstacles[curObstacleIndex].x = x;
    obstacles[curObstacleIndex].y = y;
    obstacles[curObstacleIndex].boundaryLeft = x - NEXT_STEP_X/2;
    for (let a = 0; a < 4; a++) {
        steps.push({x, y});
        x += NEXT_STEP_X;
    }
    obstacles[curObstacleIndex].boundaryRight = x;
    curObstacleIndex++;
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    y += NEXT_STEP_Y;
    x += NEXT_STEP_X;
    obstacles[curObstacleIndex].x = x;
    obstacles[curObstacleIndex].y = y;
    obstacles[curObstacleIndex].boundaryLeft = x - NEXT_STEP_X/2;
    for (let a = 0; a < 4; a++) {
        steps.push({x, y});
        x += NEXT_STEP_X;
    }
    obstacles[curObstacleIndex].boundaryRight = x;
    curObstacleIndex++;
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    x -= NEXT_STEP_X;
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    x -= NEXT_STEP_X;
    y -= NEXT_STEP_Y;
    obstacles[curObstacleIndex].x = x + NEXT_STEP_X;
    obstacles[curObstacleIndex].y = y - NEXT_STEP_Y;
    obstacles[curObstacleIndex].boundaryRight = x + NEXT_STEP_X*2;
    curObstacleIndex++;
    obstacles[curObstacleIndex].x = x;
    obstacles[curObstacleIndex].y = y - NEXT_STEP_Y;
    obstacles[curObstacleIndex].boundaryRight = x + NEXT_STEP_X*2;
    for (let a = 0; a < 7; a++) {
        steps.push({x, y});
        x -= NEXT_STEP_X;
    }
    obstacles[curObstacleIndex-1].boundaryLeft = x;
    obstacles[curObstacleIndex].boundaryLeft = x;
    y -= NEXT_STEP_Y;
    steps.push({x, y});
    x -= NEXT_STEP_X;
    y -= NEXT_STEP_Y;

    finalX = x;
    finalY = y;
    steps.push({x, y, type: FINAL_PLATFORM});

	// push a flag on the current x and y coordinates
	return steps;
}
//
// x: 250, 
// y: -590,
let obstacles = [
    {
        x: 0, 
        y: 0,
        vx: 1.5,
        vy: 0,
        boundaryLeft: 0,
        boundaryRight: 0,
        movementType: HORIZONTAL,
        type: OBSTACLE,
        spriteType: 1,
        rotate: true
    },
    {
        x: 0, 
        y: 0,
        vx: 2.5,
        vy: 0,
        boundaryLeft: 0,
        boundaryRight: 0,
        movementType: HORIZONTAL,
        type: OBSTACLE,
        spriteType: 2,
        rotate: true
    },
    {
        x: 0, 
        y: 0,
        vx: 3.5,
        vy: 0,
        boundaryLeft: 0,
        boundaryRight: 0,
        movementType: HORIZONTAL,
        type: OBSTACLE,
        spriteType: 3,
        rotate: true
    },
    {
        x: 0, 
        y: 0,
        vx: 3,
        vy: 0,
        boundaryLeft: 0,
        boundaryRight: 0,
        movementType: HORIZONTAL,
        type: OBSTACLE,
        spriteType: 2,
        rotate: true
    },
    {
        x: 0, 
        y: 0,
        vx: 3,
        vy: 0,
        boundaryLeft: 0,
        boundaryRight: 0,
        movementType: HORIZONTAL,
        type: OBSTACLE,
        spriteType: 1,
        rotate: true
    },
];
function generateObstacles(jumpQuestSheet) {
	let obstacleSprites = [];
	for (let obstacleData of obstacles) {
        console.log("dafuq");
        let obstacle;
        switch(obstacleData.spriteType) {
            case 1:
                obstacle = new Sprite(jumpQuestSheet.textures['obstacle1.png']);
                break;
            case 2:
                obstacle = new Sprite(jumpQuestSheet.textures['obstacle2.png']);
                break;
            case 3:
                obstacle = new Sprite(jumpQuestSheet.textures['obstacle3.png']);
                break;
            default:
                obstacle = new Sprite(jumpQuestSheet.textures['obstacle1.png']);
                break;
        } 
		obstacleSprites.push(obstacle);
		Object.assign(obstacle, obstacleData);
		obstacle.y -= 10;
		obstacle.halfWidth = obstacle.width / 2 - obstacle.width / 4;
		obstacle.type = obstacleData.type;
		if (obstacleData.rotate) {
			obstacle.anchor.set(0.5);
		}
	}
	return obstacleSprites;
}

function generateJumpQuest2Boundaries(entityGrid) {

	let leftWall = new Sprite();
    leftWall.x = 700;
    leftWall.y = -1500;
	leftWall.width = 30;
	leftWall.height = 2000;
    leftWall.type = WALL;
    entityGrid[0].push(leftWall);

	let rightWall = new Sprite();
	rightWall.x = 3500;
    rightWall.y = -1500;
	rightWall.width = 10;
	rightWall.height = 2000;
	rightWall.type = WALL;
    entityGrid[0].push(rightWall);
}


export {
    createJumpQuest2Scene,
    createJumpQuest2Viewport
}