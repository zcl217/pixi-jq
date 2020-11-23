import { STATES, PLAYER_XVELOCITY } from './constants.js';

import { player, changeCharacterState } from './main.js';


const currentState = STATES.STANDING;

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

function increaseXVelocity(entity, velocity) {
	entity.vx += velocity;
	console.log("increase x velocity! " + velocity + " cur Xvelocity: " + entity.vx);
}

function setXVelocity(entity, velocity) {
	entity.vx = velocity;
}

export {
  leftHeldDown,
  rightHeldDown,
  jumpButtonIsHeldDown
}