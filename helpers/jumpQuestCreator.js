// / @ts-check


import { createJumpQuest1Viewport } from '../scenes/jumpQuest1.js';
import { createJumpQuest2Viewport } from '../scenes/jumpQuest2.js';
import { createJumpQuest3Viewport } from '../scenes/jumpQuest3.js';
import { createJumpQuest4Viewport } from '../scenes/jumpQuest4.js';
import { 
    ASSET_PATH,
    LUDI_START_POSITION_Y,
    LUDI_START_POSITION_X,
    MUSH_START_POSITION_Y,
    MUSH_START_POSITION_X,
} from '../constants/constants.js';

import { 
    addViewportToMainContainer,
    addChildToViewportSorter,
    changeAppBackgroundColor,
    setTimerReference
} from '../main.js';

const { Container, Sprite } = PIXI;

function createJumpQuest(
    mainContainer,
    loader,
    entityGrid,
    audioContext,
    playerContainer,
    selectedStage,
) {
    mainContainer.menuScenes.visible = false;
    switch (selectedStage) {
        case 1:
            createJumpQuest1Viewport(
                loader,
                entityGrid,
            );
            changeAppBackgroundColor(0x3552d2);
            mainContainer.jumpQuest1.visible = true;
            playerContainer.y = LUDI_START_POSITION_Y;
            playerContainer.x = LUDI_START_POSITION_X;
            setTimeout(() => {
                audioContext.jumpQuest1BGM.play();
                audioContext.jumpQuest1BGM.fade(0, 0.3, 2000);
            }, 2000);
            break;
        case 2:
            createJumpQuest2Viewport(
                loader,
                entityGrid,
            );
            changeAppBackgroundColor(0x31a9ff);
            mainContainer.jumpQuest2.visible = true;
            playerContainer.y = MUSH_START_POSITION_Y;
            playerContainer.x = MUSH_START_POSITION_X;
            setTimeout(() => {
                audioContext.jumpQuest2BGM.play();
                audioContext.jumpQuest2BGM.fade(0, 0.3, 2000);
            }, 2000);
            break;
        case 3:
            createJumpQuest3Viewport(
                loader,
                entityGrid,
            );
            changeAppBackgroundColor(0x3552d2);
            mainContainer.jumpQuest3.visible = true;
            playerContainer.y = LUDI_START_POSITION_Y;
            playerContainer.x = LUDI_START_POSITION_X;
            setTimeout(() => {
                audioContext.jumpQuest1BGM.play();
                audioContext.jumpQuest1BGM.fade(0, 0.3, 2000);
            }, 2000);
            console.log("WTF?!?!");
            break;
        case 4:
            createJumpQuest4Viewport(
                loader,
                entityGrid,
            );
            changeAppBackgroundColor(0x31a9ff);
            mainContainer.jumpQuest4.visible = true;
            playerContainer.y = MUSH_START_POSITION_Y;
            playerContainer.x = MUSH_START_POSITION_X;
            setTimeout(() => {
                audioContext.jumpQuest2BGM.play();
                audioContext.jumpQuest2BGM.fade(0, 0.3, 2000);
            }, 2000);
            break;
        default:
            createJumpQuest1Viewport(
                mainContainer,
                viewportContainer,
                loader,
                viewportSorter,
                entityGrid,
            );
            changeAppBackgroundColor(0x3552d2);
            mainContainer.jumpQuest1.visible = true;
            break;
    }
    if (audioContext.title.playing()) {
        audioContext.title.fade(0.3, 0, 2000);
        setTimeout(() => {
            audioContext.title.stop();
        }, 3000);
    }
    if (audioContext.lobby.playing()) {
        audioContext.lobby.fade(0.3, 0, 2000);
        setTimeout(() => {
            audioContext.lobby.stop();
        }, 3000);
    }
    addChildToViewportSorter(playerContainer, 10);
    addViewportToMainContainer(selectedStage);
    let timer = createTimer(loader);
    console.log(timer);
    addChildToViewportSorter(timer, 9);
    setTimerReference(timer);
    
    audioContext.startJumpQuest.play();
}

function createTimer(loader) {
    let timer = new Container();
    let jumpQuestSheet = loader.resources[ASSET_PATH + "sprites/jumpQuest2.json"].spritesheet;
    let tens = new Sprite(jumpQuestSheet.textures['6.png']);
    let ones = new Sprite(jumpQuestSheet.textures['0.png']);
    tens.scale.x = 1.5;
    tens.scale.y = 1.5;
    ones.scale.x = 1.5;
    ones.scale.y = 1.5;
    timer.addChild(tens);
    timer.addChild(ones);
    tens.x = ones.x - tens.width;
    timer.tens = tens;
    timer.ones = ones;
    timer.visible = false;
    return timer;
}

export {
    createTimer,
    createJumpQuest
};