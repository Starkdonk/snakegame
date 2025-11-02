// Controls: WASD or Arrow Keys
// World: Wrap-around
// Rules: Eat food to grow; self-collision = game over
// Grass: green tiles; when the head touches one, it moves elsewhere

scene.setBackgroundColor(9) // light green field

const SCREEN_W = 160
const SCREEN_H = 120
const STEP = 8

// timings (ms per step)
const NORMAL_DELAY = 160
const GRASS_DELAY = 90
let currentDelay = NORMAL_DELAY

// after touching grass, keep fast speed for a few steps
const BOOST_STEPS_ON_TOUCH = 4
let boostStepsLeft = 0

let dx = 1
let dy = 0

let snake: Sprite[] = []
let startX = 80
let startY = 60
let initLen = 2 // initial length

// images
const SNAKE_IMG = img`
    . . . . .
    . 2 2 2 .
    . 2 2 2 .
    . 2 2 2 .
    . . . . .
`
const FOOD_IMG = img`
    . . . . .
    . . 5 . .
    . 5 5 5 .
    . . 5 . .
    . . . . .
`
const GRASS_IMG = img`
    . . . . . . . . . . . . . . . .
    . . . 7 7 7 7 7 7 7 7 7 7 . . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . 7 7 7 7 7 7 7 7 7 7 7 7 7 . .
    . . . 7 7 7 7 7 7 7 7 7 7 . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
`

// ===== snake =====
for (let i = 0; i < initLen; i++) {
    const part = sprites.create(SNAKE_IMG, SpriteKind.Player)
    part.setPosition(startX - i * STEP, startY)
    snake.push(part)
}

// ===== food =====
let food = sprites.create(FOOD_IMG, SpriteKind.Food)

function snapGrid(n: number): number {
    return Math.round(n / STEP) * STEP
}
function placeFood() {
    while (true) {
        const fx = snapGrid(randint(0, SCREEN_W - STEP))
        const fy = snapGrid(randint(0, SCREEN_H - STEP))
        let bad = false
        for (const s of snake) { if (s.x == fx && s.y == fy) { bad = true; break } }
        if (!bad) { food.setPosition(fx, fy); break }
    }
}
placeFood()
info.setScore(0)

// ===== grass (GREEN, disappears & respawns) =====
namespace SpriteKind { export const Grass = SpriteKind.create() }
const grasses: Sprite[] = []

function randGridX(): number {
    const cols = Math.idiv(SCREEN_W, STEP)
    return randint(0, cols - 1) * STEP
}
function randGridY(): number {
    const rows = Math.idiv(SCREEN_H, STEP)
    return randint(0, rows - 1) * STEP
}
function placeGrassAtRandom(g: Sprite) {
    while (true) {
        const gx = randGridX()
        const gy = randGridY()
        let bad = false
        for (const s of snake) { if (s.x == gx && s.y == gy) { bad = true; break } }
        if (!bad && food.x == gx && food.y == gy) bad = true
        if (!bad) {
            for (const other of grasses) {
                if (other != g && other.x == gx && other.y == gy) { bad = true; break }
            }
        }
        if (!bad) { g.setPosition(gx, gy); return }
    }
}
function createGrass(count: number) {
    for (let i = 0; i < count; i++) {
        const g = sprites.create(GRASS_IMG, SpriteKind.Grass)
        placeGrassAtRandom(g)
        grasses.push(g)
    }
}
createGrass(5)

// ===== controls =====
controller.up.onEvent(ControllerButtonEvent.Pressed, function () { if (dy == 0) { dx = 0; dy = -1 } })
controller.down.onEvent(ControllerButtonEvent.Pressed, function () { if (dy == 0) { dx = 0; dy = 1 } })
controller.left.onEvent(ControllerButtonEvent.Pressed, function () { if (dx == 0) { dx = -1; dy = 0 } })
controller.right.onEvent(ControllerButtonEvent.Pressed, function () { if (dx == 0) { dx = 1; dy = 0 } })

// ===== one tick =====
function tick() {
    // body follow
    for (let i = snake.length - 1; i > 0; i--) {
        snake[i].setPosition(snake[i - 1].x, snake[i - 1].y)
    }

    // head move (wrap)
    const head = snake[0]
    let nx = head.x + dx * STEP
    let ny = head.y + dy * STEP
    if (nx < 0) nx = SCREEN_W - STEP
    else if (nx > SCREEN_W - STEP) nx = 0
    if (ny < 0) ny = SCREEN_H - STEP
    else if (ny > SCREEN_H - STEP) ny = 0
    head.setPosition(nx, ny)

    // self-hit
    for (let i = 1; i < snake.length; i++) {
        if (head.x == snake[i].x && head.y == snake[i].y) { game.over(false); return }
    }

    // eat
    if (head.overlapsWith(food)) {
        const tail = snake[snake.length - 1]
        const newPart = sprites.create(SNAKE_IMG, SpriteKind.Player)
        newPart.setPosition(tail.x, tail.y)
        snake.push(newPart)
        info.changeScoreBy(1)
        placeFood()
    }

    // grass touch → teleport that grass + speed boost
    for (const g of grasses) {
        if (head.overlapsWith(g)) {
            placeGrassAtRandom(g)
            boostStepsLeft = BOOST_STEPS_ON_TOUCH
        }
    }

    // speed
    currentDelay = boostStepsLeft > 0 ? GRASS_DELAY : NORMAL_DELAY
    if (boostStepsLeft > 0) boostStepsLeft -= 1
}

// SAFE scheduler: re-register interval whenever delay changes
let lastDelay = currentDelay
game.onUpdateInterval(currentDelay, function () {
    tick()
    // if delay changed, rebind timer
    if (currentDelay != lastDelay) {
        lastDelay = currentDelay
        // tiny re-arm trick: queue a no-op; the new onUpdateInterval takes effect immediately
        control.runInParallel(function () { })
    }
})