// Snake
// Controls: WASD or Arrow Keys
// Rules: Eat food to grow; self-collision = Game Over
// World: Wrap-around edges

scene.setBackgroundColor(7)

const SCREEN_W = 160
const SCREEN_H = 120
const STEP = 8

let dx = 1
let dy = 0

let snake: Sprite[] = []
let startX = 80
let startY = 60
let initLen = 2   // start length = 2

// Create snake
for (let i = 0; i < initLen; i++) {
    const part = sprites.create(img`
        . . . . .
        . 2 2 2 .
        . 2 2 2 .
        . 2 2 2 .
        . . . . .
    `, SpriteKind.Player)
    part.setPosition(startX - i * STEP, startY)
    snake.push(part)
}

// Food
let food = sprites.create(img`
    . . . . .
    . . 5 . .
    . 5 5 5 .
    . . 5 . .
    . . . . .
`, SpriteKind.Food)

function snapToGrid(n: number) {
    return Math.round(n / STEP) * STEP
}

function placeFood() {
    while (true) {
        const fx = snapToGrid(randint(0, SCREEN_W - STEP))
        const fy = snapToGrid(randint(0, SCREEN_H - STEP))
        let clash = false
        for (const s of snake) {
            if (s.x == fx && s.y == fy) { clash = true; break }
        }
        if (!clash) { food.setPosition(fx, fy); break }
    }
}
placeFood()
info.setScore(0)

// Controls (WASD/Arrows)
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (dy == 0) { dx = 0; dy = -1 }
})
controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (dy == 0) { dx = 0; dy = 1 }
})
controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (dx == 0) { dx = -1; dy = 0 }
})
controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (dx == 0) { dx = 1; dy = 0 }
})

// Move one step
function step() {
    // body follow
    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].setPosition(snake[i - 1].x, snake[i - 1].y)
    }

    // move head with wrap-around
    const head = snake[0]
    let nx = head.x + dx * STEP
    let ny = head.y + dy * STEP

    // wrap horizontally
    if (nx < 0) nx = SCREEN_W - STEP
    else if (nx > SCREEN_W - STEP) nx = 0

    // wrap vertically
    if (ny < 0) ny = SCREEN_H - STEP
    else if (ny > SCREEN_H - STEP) ny = 0

    head.setPosition(nx, ny)

    // self-collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x == snake[i].x && head.y == snake[i].y) {
            music.wawawawaa.play()
            game.over(false)
            return
        }
    }

    // eat food
    if (head.x == food.x && head.y == food.y) {
        const tail = snake[snake.length - 1]
        const newPart = sprites.create(img`
            . . . . .
            . 2 2 2 .
            . 2 2 2 .
            . 2 2 2 .
            . . . . .
        `, SpriteKind.Player)
        newPart.setPosition(tail.x, tail.y)
        snake.push(newPart)
        info.changeScoreBy(1)
        music.baDing.play()
        placeFood()
    }
}

game.onUpdateInterval(160, step)

game.showLongText("WASD/Arrows to move. Wrap-around world. Eat food to grow. Self-hit ends the game.", DialogLayout.Top)