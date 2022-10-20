kaboom({
    global: true,
    fullscreen: true,
    scale: 1,
    debug: true,
    clearColor: [0,0,0,1],
});

const MOVE_SPEED = 120;
const JUMP_FORCE = 360; 
const BIG_JUMP_FORCE = 550;
let CURRENT_JUMP_FORCE = JUMP_FORCE;
let isJumping = true;
const FALL_DEATH = 400;


loadRoot('./sprites/');
loadSprite('mushroom', 'pilz.png');
loadSprite('brick', 'brick.png');
loadSprite('gumbaL', 'gumba_left.png');
loadSprite('mario', 'mario.png');
loadSprite('flower', 'flower.png');
loadSprite('surprise', 'surprise.png');
loadSprite('pipe-top', 'pipe_top.png');
loadSprite('pipe-top-left', 'pipe_top_left.png');
loadSprite('pipe-top-right', 'pipe_top_right.png');
loadSprite('pipe-bottom-left', 'pipe_BL.png');
loadSprite('pipe-bottom-right', 'pipe_BR.png');
loadSprite('coin', 'coin.png');
loadSprite('boxed', 'boxed.png');

scene("game", ({ level, score }) => {
    layers(['bg', 'obj', 'ui'], 'obj');

    const map = [
        '                                                               ',
        '                                                               ',
        '                                                               ',
        '                                                               ',
        '                                                               ',
        '    %   %=*=$                                                  ',
        '                                                               ',
        '                           -+                                  ',
        '                 ^    ^    ()                                  ',
        '=============================    ===========  =================',
    ];

    const levelConfig = {
        width: 20,
        height: 20,
        '=': [sprite('brick'), solid()],
        '$': [sprite('coin'), solid(), 'coin'], 
        '%': [sprite('surprise'), solid(), 'coin-surprise', scale(0.5)],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise', scale(0.5)],
        '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^': [sprite('gumbaL'), solid(), 'dangerous'],
        'x': [sprite('boxed'), solid()],
        'p': [sprite('mushroom'), solid(), 'mushroom', body()]
    }

    const gameLevel = addLevel(map, levelConfig);

    const scoreLabel = add([
        text(score),
        pos(30,10),
        layer('ui'),
        {
            value: score,
        }
    ]);

    add([text('level ' + parseInt(level + 1)), pos(60,10)]);

    function big(){
        let timer = 0;
        let isBig = false;
        return {
            update() {
                if(isBig) {
                    timer -= dt();                
                    if(timer <= 0) {
                        this.smallify();
                    } 
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                this.scale = vec2(1)
                CURRENT_JUMP_FORCE = JUMP_FORCE
                timer = 0
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(2)
                CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                timer = time
                isBig = true
            }
        }
    }

    const player = add([
        sprite('mario'), solid(), 
        pos(30,0),
        body(),
        big(),
        origin('bot'),
    ]);

    action('mushroom', (m) => {
        m.move(25,0);
    })

    action('dangerous', (d) => {
        d.move(20,0);
    })

    player.on("headbump", (obj) => {
        if(obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0,1));
            destroy(obj);
            gameLevel.spawn('x', obj.gridPos.sub(0,0));
        }
        if(obj.is('mushroom-surprise')) {
            gameLevel.spawn('p', obj.gridPos.sub(0,1));
            destroy(obj);
            gameLevel.spawn('x', obj.gridPos.sub(0,0));
        }
    });

    player.action(() => {
        if(player.grounded()) {
            isJumping = false; 
        }
    })

    player.collides('mushroom', (m) => {
        destroy(m);
        player.biggify(16);
    });

    player.collides('coin', (c) => {
        destroy(c);
        scoreLabel.value ++;
        scoreLabel.text = scoreLabel.value;
    });

    player.collides('dangerous', (d) => {
        if(isJumping) {
            destroy(d);
        }else {
            go('lose', {score: scoreLabel.value});
        }
    });

    player.action(() => {
        //c amPos(player.pos);
        if(player.pos.y >= FALL_DEATH) {
            go('lose', {score: scoreLabel.value});
        }
    });

    player.collides('pipe', (p) => {
        keyPress('down', () => {
            go("game", {
                level: (level +1),
                score: scoreLabel.value
            })
        })
    })

    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0);
    });

    keyDown('right', () => {
        player.move(MOVE_SPEED, 0);
    });

    keyPress('space', () => {
        if(player.grounded()) {
            isJumping = true;
            player.jump(CURRENT_JUMP_FORCE);
        }
        
    });
});

scene('lose', ({score}) => {
    add([text(score, 32), origin('center'), pos(width()/2, height()/2)]);
})

start("game", {level: 0, score: 0});
