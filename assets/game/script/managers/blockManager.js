var mvs = require("Matchvs");
cc.Class({
    extends: cc.Component,

    properties: {
        blockPrefab:{
            type: cc.Prefab,
            default: null
        },
        linkAudio: {
            default: null,
            type: cc.AudioClip
        },
        blockSpriteFrame:{
            default:[],
            type: cc.SpriteFrame
        }
    },

    onLoad () {
        Game.BlockManager = this;
        this.index = 0;
        this.arrMap = [];
        this.newArrMap = [];
        this.blockPool = new cc.NodePool();
    },
    receiveArrMap(array){
        this.arrMap.push(array);
        this.index++;
        if(this.index >= 8) {
            this.index = 0;
            this.bubblingSort(this.arrMap);
            this.initMap(this.arrMap);
        }

    },
    updataArrMap(array){
        this.newArrMap.push(array);
        this.index++;
        if(this.index >= 8) {
            cc.log("刷新地图方块");
            this.index = 0;
            this.deleteWholeBlock();
            this.arrMap.push(...this.newArrMap);
            this.newArrMap = [];
            this.bubblingSort(this.arrMap);
            this.initMap(this.arrMap);
        }
    },

    bubblingSort(array){
        //冒泡排序数组
        for (let i = 0 ; i < array.length - 1 ;i++){
            for (let j = 0; j < array.length - 1 -i;j++){
                if (array[j][0].pos.y < array[j + 1][0].pos.y){
                    var temp = array[j];
                    array[j] = array[j+1];
                    array[j+1] = temp;
                }
            } 
        }
    },
    initMap(arrMap){
        //初始化地图
        for(let row = 0; row < 8; row++){
            for (let col = 0; col < 9; col++){
                if(arrMap[row][col].type !== null){
                    var block = this.blockPool.get();
                    if (!block){
                       block = cc.instantiate(this.blockPrefab);
                    }
                    block.getComponent(cc.Sprite).spriteFrame = this.blockSpriteFrame[arrMap[row][col].type];
                    block.parent = this.node;
                    block.setPosition(arrMap[row][col].pos);
                    block.row = row;
                    block.col = col;
                    block.type = arrMap[row][col].type;
                    arrMap[row][col].sprite = block;
                }
            }
        }
        Game.ClickManager.setArrMap(arrMap)
        Game.PlayerManager.self.combo = 1;
        Game.PlayerManager.rival.combo = 1;
    },
    deleteBlock(first,last,id,arrPath) {
        if (this.arrMap[first.row][first.col].sprite === null
            || this.arrMap[last.row][last.col].sprite === null) {
            return;
        }
        if (this.arrMap[first.row][first.col].type !== this.arrMap[last.row][last.col].type) {
            return;
        }
        cc.audioEngine.play(this.linkAudio, false, 1);
        Game.PathManager.addPath(arrPath, id);
        this.arrMap[first.row][first.col].type = null;
        this.recycleBlock(this.arrMap[first.row][first.col].sprite);
        this.arrMap[first.row][first.col].sprite = null;
        this.arrMap[last.row][last.col].type = null;
        this.recycleBlock(this.arrMap[last.row][last.col].sprite);
        this.arrMap[last.row][last.col].sprite = null;
        if (id === GLB.userInfo.id) {
            Game.PlayerManager.self.addScore();
        } else {
            Game.PlayerManager.rival.addScore();
            Game.ClickManager.curBlocBeDelete(first);
            Game.ClickManager.curBlocBeDelete(last);
        }
        var pos = this.arrMap[last.row][last.col].pos;
        Game.ComboManager.addCombo(pos, id);
        this.resettingMap();
    },
    resettingMap(){
        let arrBlock = this.node.children;
        if (arrBlock.length <= 0){
            this.node.dispatchEvent(new cc.Event.EventCustom(clientEvent.eventType.nextRound,true));
            return;
        }
        if (this.automaticClearing()) {
            return;
        }
        var number1 = 0;
        var number2 = 0;
        while (number1 === number2){
            number1 = Math.floor(Math.random() * arrBlock.length);
            number2 = Math.floor(Math.random() * arrBlock.length);
        }
        this.exchangeType(arrBlock[number1],arrBlock[number2]);
        this.resettingMap();

    },
    exchangeType(block1,block2){
        var temp = block1.type;
        block1.getComponent(cc.Sprite).spriteFrame = this.blockSpriteFrame[block2.type];
        block1.type = block2.type;
        this.arrMap[block1.row][block1.col].type = block2.type;
        block2.getComponent(cc.Sprite).spriteFrame = this.blockSpriteFrame[temp];
        block2.type = temp;
        this.arrMap[block2.row][block2.col].type = temp;
    },
    deleteWholeBlock(){
        this.arrMap = [];
        if(this.node.children.length > 0){
            this.node.removeAllChildren();
        }
        Game.ClickManager.choiceBox.destroy();
        Game.ClickManager.curSelec = null;
        Game.ClickManager.setChoiceBox();
    },
    recycleBlock(target){
        this.blockPool.put(target);
    },
    getArrMap(){
        var arrMap = [];
        for (let row = 0; row < 8 ; row++){
            arrMap[row] = [];
            for(let col = 0; col < 9; col++){
                let data = {
                    pos:this.arrMap[row][col].pos,
                    type:this.arrMap[row][col].type,
                    sprite:null
                }
                arrMap[row][col] = data;

            }
        }
        return arrMap;
    },
    nextRound(){
        this.deleteWholeBlock();
        this.node.dispatchEvent(new cc.Event.EventCustom(clientEvent.eventType.nextRound,true));
    },
    automaticClearing(){
        let arrBlock = this.node.children;
        for (let i = 0; i < arrBlock.length; i++){
            for (let j = i + 1; j < arrBlock.length; j++){
                if (Game.ClickManager.link(arrBlock[i],arrBlock[j])){
                    return true;
                }
            }
        }
        return false;
    },
    // update (dt) {},
});
