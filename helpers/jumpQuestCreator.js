// / @ts-check


import { createJumpQuest1Viewport } from '../scenes/jumpQuest1.js';

function createJumpQuest(
    mainContainer,
    viewportContainer,
    loader,
    viewportSorter,
    entityGrid,
    app,
    audioContext,
    playerContainer,
    selectedStage,
) {
    mainContainer.menuScenes.visible = false;
    switch (selectedStage) {
        case 1:
            createJumpQuest1Viewport(
                mainContainer,
                viewportContainer,
                loader,
                viewportSorter,
                entityGrid,
            );
            app.renderer.backgroundColor = 0x3552d2;
            mainContainer.jumpQuest1.visible = true;
            setTimeout(() => {
                audioContext.jumpQuest1BGM.play();
                audioContext.jumpQuest1BGM.fade(0, 0.3, 3000);
            }, 2000);
            break;
        case 2:
            //createJumpQuest2();
            break;
        default:
            createJumpQuest1Viewport(
                mainContainer,
                viewportContainer,
                loader,
                viewportSorter,
                entityGrid,
            );
            app.renderer.backgroundColor = 0x3552d2;
            mainContainer.jumpQuest1.visible = true;
            break;
    }
    audioContext.title.fade(1, 0, 3000);
    playerContainer.y = -100;
    playerContainer.x = 350;
    viewportSorter.addChild(playerContainer, 10);
    viewportContainer.follow(playerContainer, {
        radius: 80,
    });
    audioContext.startJumpQuest.play();
}

export default createJumpQuest;