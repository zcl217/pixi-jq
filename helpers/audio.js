import { ASSET_PATH } from '../constants/constants.js';

const totalFiles = 8;
let filesLoaded = 0;

const jumpSound = new Howl({
	src: [ASSET_PATH + "audio/Jump.mp3"],
	onload: () => { filesLoaded++; console.log("loaded!"); }
});
const startJumpQuest = new Howl({
	src: [ASSET_PATH + "audio/QuestAlert.mp3"],
	volume: 0.5,
	onload: () => { filesLoaded++ }
});
const jumpQuestFinished = new Howl({
	src: [ASSET_PATH + "audio/QuestClear.mp3"],
	onload: () => { filesLoaded++ }
});
const firstPlace = new Howl({
	src: [ASSET_PATH + "audio/firstPlace.mp3"],
	onload: () => { filesLoaded ++ }
});
const click = new Howl({
	src: [ASSET_PATH + "audio/mouseClick.mp3"],
	onload: () => { filesLoaded++ }
});
const clickRelease = new Howl({
	src: [ASSET_PATH + "audio/mouseRelease.mp3"],
	onload: () => { filesLoaded++ }
});
const title = new Howl({
	src: [ASSET_PATH + "audio/Title.mp3"],
	loop: true,
	volume: 0.3,
	onload: () => { filesLoaded++ }
});
title.on('fade', () => {
	title.stop();
});
const lobby = new Howl({
	src: [ASSET_PATH + "audio/Lobby.mp3"],
	loop: true,
	volume: 0.3,
	onload: () => { filesLoaded++ }
})
const jumpQuest1BGM = new Howl({
	src: [ASSET_PATH + "audio/jumpQuest1.mp3"],
	loop: true,
	onload: () => { filesLoaded++ }
});
const jumpQuest2BGM = new Howl({
	src: [ASSET_PATH + "audio/jumpQuest2.mp3"],
	loop: true,
	onload: () => { filesLoaded++ }
});

const audioContext = {
	jumpSound,
	startJumpQuest,
	jumpQuestFinished,
	firstPlace,
	click,
	clickRelease,
	title,
	lobby,
	jumpQuest1BGM,
	jumpQuest2BGM
};

export {
	audioContext,
	filesLoaded,
	totalFiles
}

 // Howler.volume(0);