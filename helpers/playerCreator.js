import { PLAYER_HEIGHT_ADJUSTMENT, PLAYER_WIDTH_ADJUSTMENT } from '../constants/constants.js';

const {
	Sprite,
	AnimatedSprite,
	Container,
	Texture,
	Text,
} = PIXI;

function createCharacter(playerName, charId, characterTextures) {
    let playerContainer = new Container();
    let player = new AnimatedSprite(characterTextures[charId].jumpTexture);
    setPlayerProperties(player, charId);
    playerContainer.addChild(player);
    playerContainer.player = player;
    let nameContainer = createNameContainer(player, playerName);
    playerContainer.addChild(nameContainer);
    playerContainer.name = nameContainer.name.text;
    playerContainer.charId = charId;
    return playerContainer;
}

function setPlayerProperties(player, charId) {
    player.animationSpeed = 0.05;
    player.charId = charId;
    player.vx = 0;
    player.vy = 0;
    player.halfHeight = player.height / 2 - PLAYER_HEIGHT_ADJUSTMENT;
    player.halfWidth = player.width / 2 - PLAYER_WIDTH_ADJUSTMENT;
    player.nextFrameX = 0;
    player.nextFrameY = 0;
    player.roundPixels = true;
    player.position.set(0, 0);
    player.anchor.set(0.5);
}

function createNameContainer(playerSprite, playerName) {
    let nameContainer = new Container();
    let name = new Text(playerName, {
        fontFamily: 'Times New Roman',
        fontSize: 18,
        fill: 0xFFFFFF,
        align: 'center'
    });
    let nameBackground = new Sprite(Texture.WHITE);
    nameBackground.tint = 0x000000;
    nameBackground.width = name.width + 10;
    nameBackground.height = name.height + 5;
    nameBackground.alpha = 0.5;
    nameContainer.addChild(nameBackground);
    nameContainer.addChild(name);
    nameContainer.name = name;
    console.log(playerSprite.x + " " + playerSprite.halfWidth + " " + nameBackground.width);
    nameBackground.x = playerSprite.x - nameBackground.width / 2;
    console.log(nameBackground.x);
    nameBackground.y = playerSprite.halfHeight;
    name.x = playerSprite.x - name.width / 2;
    name.y = playerSprite.halfHeight;
    return nameContainer;
}

export default createCharacter;