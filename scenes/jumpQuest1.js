// @ts-check
import { 
    FINAL_PLATFORM, 
    HORIZONTAL, 
    NEXT_STEP_X, 
    NEXT_STEP_Y, 
    OBSTACLE, 
	WALL,
	ASSET_PATH
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
    let platforms = new Container();
    //tower.scale = 1;	
    //first arg = left or right, second arg = top or bottom
    //so this means bottom left
    tower.anchor.set(0, 1);
    tower.position.set(0, 237);
    viewportSorter.addChild(tower);
    //let platform1 = new Sprite(sheet.textures["platform1.png"]);
    let platform1 = new Sprite(loader.resources.platform1.texture);

    platforms.addChild(platform1);
    //platforms.addChild(platform2);
    //app.stage.addChild(platforms);
    viewportSorter.addChild(platforms);
    entityGrid[0].push(...platforms.children);
    platform1.position.set(0, 0);
    //platform2.position.set(458, 0);
    const steps = generateSteps(entityGrid, jumpQuestSheet);
    for (let step of steps) viewportSorter.addChild(step);
    const obstacles = generateObstacles(entityGrid, jumpQuestSheet);
    console.log(obstacles[0]);
    for (let obstacle of obstacles) viewportSorter.addChild(obstacle);
       
    viewportSorter.obstacles = obstacles;
    
    generateJumpQuest1Boundaries(entityGrid, tower);

    viewportSorter.sortChildren();
    mainContainer.jumpQuest1.sortChildren();
}

function generateSteps(entityGrid, jumpQuestSheet) {
	let stepPositions = generateStepPositions2();
	let steps = [];
	for (let position of stepPositions) {
		let step = new Sprite(jumpQuestSheet.textures['jumpQuest1Step.png']);
		steps.push(step);
		step.y = position.y;
		step.x = position.x;
		if (position.type === FINAL_PLATFORM) step.type = FINAL_PLATFORM;
		step.halfWidth = step.width / 2 - 12;
		step.type = "step";
	}
	entityGrid[0].push(...steps);
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

function generateStepPositions2() {
	let x = 150;
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
	for (let a = 0; a < 7; a++) {
		steps.push({
			x,
			y
		});
		x += NEXT_STEP_X;
	}
	for (let a = 0; a < 2; a++) {
		steps.push({
			x,
			y
		});
		y -= NEXT_STEP_Y;
		x += NEXT_STEP_X;
	} 
	steps.push({
		x,
		y,
		type: FINAL_PLATFORM
	})
	// push a flag on the current x and y coordinates
	return steps;
}

//
// x: 250, 
// y: -590,
function generateObstacles(entityGrid, jumpQuestSheet) {
	let obstacles = [
		{
			x: 300, 
			y: -620,
			vx: 3,
			vy: 0,
			boundary1: 300,
			boundary2: 850,
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
		obstacle.halfWidth = obstacle.width / 2 - obstacle.width / 4;
		obstacle.type = obstacleData.type;
		if (obstacleData.rotate) {
			obstacle.anchor.set(0.5);
		}
	}
	entityGrid[0].push(...obstacleSprites);
	return obstacleSprites;
}

function generateJumpQuest1Boundaries(entityGrid, tower) {

	let leftWall = new Sprite();
    leftWall.x = tower.x - 10;
    leftWall.y = -500;
	leftWall.width = 10;
	leftWall.height = 1000;
    leftWall.type = WALL;
    entityGrid[0].push(leftWall);

	let rightWall = new Sprite();
	rightWall.x = tower.width - 30;
    rightWall.y = -500;
	rightWall.width = 10;
	rightWall.height = 1000;
	rightWall.type = WALL;
    entityGrid[0].push(rightWall);
}


export {
    createJumpQuest1Scene,
    createJumpQuest1Viewport
}