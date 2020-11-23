import { STATES, OBSTACLE } from '../constants/constants.js';

export const spriteCollision = (
	r1, r2, r1Container, r1State = undefined,
	currentlyCollidingSprite = undefined, bounce = false, global = true
) => {

	if (!r1._bumpPropertiesAdded) addCollisionProperties(r1);
	if (!r2._bumpPropertiesAdded) addCollisionProperties(r2);

	let collision, combinedHalfWidths, combinedHalfHeights,
		overlapX, overlapY, vx, vy;
	//Calculate the distance vector
	//for the player, we use the next frame value so we can control its position before they actually collide
	//for the second object, we can't use the global x and y because we're using a viewport to move the camera,
	//so since we're using relative value for player, we have to use the relative value for the object too
	if (global) {
		vx = calculateXVector(r1, r2);
		vy = calculateYVector(r1, r2);
	} else {
		//vx = r1.centerX - r2.centerX;
		//vy = r1.centerY - r2.centerY;
		vx = (r1.x + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
		vy = (r1.y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
	}
	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = calculateCombinedHalfWidths(r1, r2);
	combinedHalfHeights = calculateCombinedHalfHeights(r1, r2);
	//Check whether vx is less than the combined half widths
	if (Math.abs(vx) < combinedHalfWidths) {
		//A collision might be occurring!
		//Check whether vy is less than the combined half heights
		if (Math.abs(vy) < combinedHalfHeights) {
			//A collision has occurred! This is good!
			//Find out the size of the overlap on both the X and Y axes
			overlapX = combinedHalfWidths - Math.abs(vx);
			overlapY = combinedHalfHeights - Math.abs(vy);
			//The collision has occurred on the axis with the
			//*smallest* amount of overlap. Let's figure out which
			//axis that is
			if (overlapX >= overlapY) {
				//The collision is happening on the X axis
				if (vy > 0) {
					if (
						r1State === STATES.JUMPING ||
						r1State === STATES.FALLING
					) return;
					collision = "top";
				} else {
					// console.log(overlapX + " " + overlapY);
					// console.log((r1.y - overlapY) + " " + (r1.nextFrameY - overlapY))
					collision = "bottom";
					//if (r1.vy < 0) return;
					if (r2.type !== OBSTACLE) {
						//Move the rectangle out of the collision
						r1Container.y = r2.y - r1.halfHeight;
					}
					
					// previous equation: r1.nextFrameY - overlapY
					//but with the new way, don't we always guarantee we're on
					//top anyway?
				}
				//Bounce
				if (bounce) {
					r1.vy *= -1;

					/*Alternative
					//Find the bounce surface's vx and vy properties
					var s = {};
					s.vx = r2.x - r2.x + r2.width;
					s.vy = 0;

					//Bounce r1 off the surface
					//this.bounceOffSurface(r1, s);
					*/
				}
			} else {
				if (
					r1State === STATES.JUMPING ||
					r1State === STATES.FALLING
				) return;
				//The collision is happening on the Y axis
				if (vx > 0) {
					collision = "left";
				} else {
					collision = "right";
				}
				//Bounce
				if (bounce) {
					r1.vx *= -1;

					/*Alternative
					//Find the bounce surface's vx and vy properties
					var s = {};
					s.vx = 0;
					s.vy = r2.y - r2.y + r2.height;

					//Bounce r1 off the surface
					this.bounceOffSurface(r1, s);
					*/
				}
			}
		}
	}
	//Return the collision string. it will be either "top", "right",
	//"bottom", or "left" depending on which side of r1 is touching r2.
	return collision;
}



function calculateCombinedHalfWidths(r1, r2) {
	return Math.abs(r1.halfWidth) + Math.abs(r2.halfWidth);
}

function calculateCombinedHalfHeights(r1, r2) {
	return Math.abs(r1.halfHeight) + Math.abs(r2.halfHeight);
}

function calculateXVector(r1, r2) {
	return (r1.nextFrameX + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
}

function calculateYVector(r1, r2) {
	return (r1.nextFrameY + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
}

export const hitTestRectangle = (r1, r2, movingRight = false, global = true) => {
	//Add collision properties
	if (!r1._bumpPropertiesAdded) addCollisionProperties(r1);
	if (!r2._bumpPropertiesAdded) addCollisionProperties(r2);

	let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

	//A variable to determine whether there's a collision
	hit = false;

	//Calculate the distance vector
	if (global) {
		vx = calculateXVector(r1, r2);
		vy = calculateYVector(r1, r2);
	} else {
		vx = (r1.nextFrameX + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
		vy = (r1.nextFrameY + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
	}

	//if (movingRight) vx += r1.width;
	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = calculateCombinedHalfWidths(r1, r2) ;
	combinedHalfHeights = calculateCombinedHalfHeights(r1, r2);
	
	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {
		//A collision might be occuring. Check for a collision on the y axis
		if (Math.abs(vy) <= combinedHalfHeights) {
			// console.log(combinedHalfHeights + " " + combinedHalfWidths);
			// console.log(vx + " " + vy);
			//There's definitely a collision happening
			hit = true;
		} else {

			//There's no collision on the y axis
			hit = false;
		}
	} else {

		//There's no collision on the x axis
		hit = false;
	}

	//`hit` will be either `true` or `false`
	return hit;
}

export const platformCollision = (
	r1, r2, r1State = undefined,
	currentlyCollidingSprite = undefined, bounce = false, global = true
) => {

	if (!r1._bumpPropertiesAdded) addCollisionProperties(r1);
	if (!r2._bumpPropertiesAdded) addCollisionProperties(r2);

	let collision, combinedHalfWidths, combinedHalfHeights,
		overlapX, overlapY, vx, vy;
	//Calculate the distance vector
	//for the player, we use the next frame value so we can control its position before they actually collide
	//for the second object, we can't use the global x and y because we're using a viewport to move the camera,
	//so since we're using relative value for player, we have to use the relative value for the object too
	if (global) {
		vx = (r1.nextFrameX + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
		vy = (r1.nextFrameY + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
	} else {
		//vx = r1.centerX - r2.centerX;
		//vy = r1.centerY - r2.centerY;
		vx = (r1.x + Math.abs(r1.halfWidth) - r1.xAnchorOffset) - (r2.x + Math.abs(r2.halfWidth) - r2.xAnchorOffset);
		vy = (r1.y + Math.abs(r1.halfHeight) - r1.yAnchorOffset) - (r2.y + Math.abs(r2.halfHeight) - r2.yAnchorOffset);
	}
	//Figure out the combined half-widths and half-heights
	combinedHalfWidths = Math.abs(r1.halfWidth) + Math.abs(r2.halfWidth);
	combinedHalfHeights = Math.abs(r1.halfHeight) + Math.abs(r2.halfHeight);
	//Check whether vx is less than the combined half widths
	if (Math.abs(vx) < combinedHalfWidths) {
		//A collision might be occurring!
		//Check whether vy is less than the combined half heights
		if (Math.abs(vy) < combinedHalfHeights) {
			//A collision has occurred! This is good!
			//Find out the size of the overlap on both the X and Y axes
			overlapX = combinedHalfWidths - Math.abs(vx);
			overlapY = combinedHalfHeights - Math.abs(vy);
			//The collision has occurred on the axis with the
			//*smallest* amount of overlap. Let's figure out which
			//axis that is
			if (overlapX >= overlapY) {
				//The collision is happening on the X axis
				if (vy < 0) {
					return true;
					//if (r1.vy < 0) return;
					//Move the rectangle out of the collision
				}
			}
			
		}
	}
	//Return the collision string. it will be either "top", "right",
	//"bottom", or "left" depending on which side of r1 is touching r2.
	return collision;
}

function addCollisionProperties(sprite) {

	//gx
	if (sprite.gx === undefined) {
		Object.defineProperty(sprite, "gx", {
			get() { return sprite.getGlobalPosition().x },
			enumerable: true, configurable: true
		});
	}

	//gy
	if (sprite.gy === undefined) {
		Object.defineProperty(sprite, "gy", {
			get() { return sprite.getGlobalPosition().y },
			enumerable: true, configurable: true
		});
	}

	//centerX
	if (sprite.centerX === undefined) {
		Object.defineProperty(sprite, "centerX", {
			get() { return sprite.x + sprite.width / 2 },
			enumerable: true, configurable: true
		});
	}

	//centerY
	if (sprite.centerY === undefined) {
		Object.defineProperty(sprite, "centerY", {
			get() { return sprite.y + sprite.height / 2 },
			enumerable: true, configurable: true
		});
	}

	//halfWidth
	if (sprite.halfWidth === undefined) {
		Object.defineProperty(sprite, "halfWidth", {
			get() { return sprite.width / 2 },
			enumerable: true, configurable: true
		});
	}

	//halfHeight
	if (sprite.halfHeight === undefined) {
		Object.defineProperty(sprite, "halfHeight", {
			get() { return sprite.height / 2 },
			enumerable: true, configurable: true
		});
	}

	//xAnchorOffset
	if (sprite.xAnchorOffset === undefined) {
		Object.defineProperty(sprite, "xAnchorOffset", {
			get() {
				if (sprite.anchor !== undefined) {
					return sprite.width * sprite.anchor.x;
				} else {
					return 0;
				}
			},
			enumerable: true, configurable: true
		});
	}

	//yAnchorOffset
	if (sprite.yAnchorOffset === undefined) {
		Object.defineProperty(sprite, "yAnchorOffset", {
			get() {
				if (sprite.anchor !== undefined) {
					return sprite.height * sprite.anchor.y;
				} else {
					return 0;
				}
			},
			enumerable: true, configurable: true
		});
	}

	if (sprite.circular && sprite.radius === undefined) {
		Object.defineProperty(sprite, "radius", {
			get() { return sprite.width / 2 },
			enumerable: true, configurable: true
		});
	}

	//Earlier code - not needed now.
	/*
	Object.defineProperties(sprite, {
		"gx": {
			get(){return sprite.getGlobalPosition().x},
			enumerable: true, configurable: true
		},
		"gy": {
			get(){return sprite.getGlobalPosition().y},
			enumerable: true, configurable: true
		},
		"centerX": {
			get(){return sprite.x + sprite.width / 2},
			enumerable: true, configurable: true
		},
		"centerY": {
			get(){return sprite.y + sprite.height / 2},
			enumerable: true, configurable: true
		},
		"halfWidth": {
			get(){return sprite.width / 2},
			enumerable: true, configurable: true
		},
		"halfHeight": {
			get(){return sprite.height / 2},
			enumerable: true, configurable: true
		},
		"xAnchorOffset": {
			get(){
				if (sprite.anchor !== undefined) {
					return sprite.height * sprite.anchor.x;
				} else {
					return 0;
				}
			},
			enumerable: true, configurable: true
		},
		"yAnchorOffset": {
			get(){
				if (sprite.anchor !== undefined) {
					return sprite.width * sprite.anchor.y;
				} else {
					return 0;
				}
			},
			enumerable: true, configurable: true
		}
	});
	*/


	//Add a Boolean `_bumpPropertiesAdded` property to the sprite to flag it
	//as having these new properties
	sprite._bumpPropertiesAdded = true;
}