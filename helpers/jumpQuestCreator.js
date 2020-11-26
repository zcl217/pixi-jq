// / @ts-check


import { createJumpQuest1Viewport } from '../scenes/jumpQuest1.js';
import { createJumpQuest2Viewport } from '../scenes/jumpQuest2.js';
import { createJumpQuest3Viewport } from '../scenes/jumpQuest3.js';
import { 
    SCENES, 
    LUDI_START_POSITION_Y,
    LUDI_START_POSITION_X,
    MUSH_START_POSITION_Y,
    MUSH_START_POSITION_X,
} from '../constants/constants.js';

import { 
    addViewportToMainContainer,
    addChildToViewportSorter,
    changeAppBackgroundColor,
} from '../main.js';

function createJumpQuest(
    mainContainer,
    loader,
    entityGrid,
    audioContext,
    playerContainer,
    selectedStage,
) {
    //reset entitygrid
    entityGrid.forEach((grid) => {
        grid.length = 0;
    });
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
                audioContext.jumpQuest1BGM.fade(0, 0.3, 3000);
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
                audioContext.jumpQuest2BGM.fade(0, 0.3, 3000);
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
                audioContext.jumpQuest1BGM.fade(0, 0.3, 3000);
            }, 2000);
            console.log("WTF?!?!");
            break;
        case 4:
            playerContainer.y = MUSH_START_POSITION_Y;
            playerContainer.x = MUSH_START_POSITION_X;
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
        audioContext.title.fade(1, 0, 3000);
    }
    if (audioContext.lobby.playing()) {
        audioContext.lobby.fade(1, 0, 3000);
    }
    addChildToViewportSorter(playerContainer, 10);
    addViewportToMainContainer(selectedStage);
    audioContext.startJumpQuest.play();
}

export default createJumpQuest;