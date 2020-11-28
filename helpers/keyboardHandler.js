import { STATES, PLAYER_XVELOCITY } from '../constants/constants.js';

import {
	 changePlayerState,
	 setXVelocity,
	 increaseXVelocity,
	 getCurrentState,
	 horizontallyFlipCharacter 
} from '../main.js';

const left = keyboard("ArrowLeft");
const right = keyboard("ArrowRight");
const jump = keyboard(" ");
const down = keyboard("ArrowDown");

let rightHeldDown = false, leftHeldDown = false, jumpButtonIsHeldDown = false;
left.press = () => {
	leftHeldDown = true;
	switch (getCurrentState()) {
		case STATES.STANDING:
			increaseXVelocity(-PLAYER_XVELOCITY);
			changePlayerState(STATES.WALKING);
			break;
		// if you are already walking when the left button was pressed, 
		// you must've been walking right
		case STATES.WALKING:
			increaseXVelocity(-PLAYER_XVELOCITY);
			changePlayerState(STATES.STANDING);
			break;
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	// don't flip object if other arrow key is pressed
	if (!rightHeldDown) horizontallyFlipCharacter(1);
};

right.press = () => {
	rightHeldDown = true;
	switch (getCurrentState()) {
		case STATES.STANDING:
			increaseXVelocity(PLAYER_XVELOCITY);
			changePlayerState(STATES.WALKING);
			break;
		case STATES.WALKING:
			increaseXVelocity(PLAYER_XVELOCITY);
			changePlayerState(STATES.STANDING);
			break;
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	//don't flip object if other arrow key is pressed
	if (!leftHeldDown) horizontallyFlipCharacter(-1);
};

left.release = () => {
	leftHeldDown = false;
	switch (getCurrentState()) {
		case STATES.STANDING:
		case STATES.WALKING:
			setXVelocity(0);
			//flip object back to original orientation
			if (rightHeldDown) {
				horizontallyFlipCharacter(-1);
				changePlayerState(STATES.WALKING);
				increaseXVelocity(PLAYER_XVELOCITY);
			} else {
				changePlayerState(STATES.STANDING);
			}
			break;
		case STATES.JUMPING:
		case STATES.FALLING:
			if (rightHeldDown) horizontallyFlipCharacter(-1);
			break;
		default:
			break;
	}
}
right.release = () => {
	rightHeldDown = false;
	switch (getCurrentState()) {
		case STATES.STANDING:
		case STATES.WALKING:
			setXVelocity(0);
			//flip object back to original orientation
			if (leftHeldDown) {
				horizontallyFlipCharacter(1);
				changePlayerState(STATES.WALKING);
				increaseXVelocity(-PLAYER_XVELOCITY);
			} else {
				changePlayerState(STATES.STANDING);
			}
			break;
		case STATES.JUMPING:
		case STATES.FALLING:
			if (leftHeldDown) horizontallyFlipCharacter(1);
			break;
		default:
			break;
	}
}

jump.press = () => {
	switch (getCurrentState()) {
		case STATES.JUMPING:
		case STATES.FALLING:
		case STATES.DISABLED:
			return;
		default:
			break;
	}
	changePlayerState(STATES.JUMPING);
	jumpButtonIsHeldDown = true;
};

jump.release = () => {
	jumpButtonIsHeldDown = false;
}

down.press = () => {
	if (getCurrentState() === STATES.STANDING || getCurrentState() === STATES.WALKING) {
			changePlayerState(STATES.PRONE);
	}
}

down.release = () => {
	if (getCurrentState() !== STATES.PRONE) return;
	changePlayerState(STATES.STANDING);
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

export {
  leftHeldDown,
  rightHeldDown,
  jumpButtonIsHeldDown
}