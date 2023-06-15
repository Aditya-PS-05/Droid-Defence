"use strict";
// VARIABLES

// Get the canva and context element
const canvas = document.getElementById("myCanvas") ;
const c = canvas.getContext('2d') ;
const tileSize = 32;
const columns = 35;
const rows = 25;
// Set canva full screen
canvas.width = tileSize*columns;
canvas.height = tileSize*rows;
// canvas.width = 500p;
canvas.height = window.innerHeight ;
document.body.style.overflow = 'hidden';

let canvasWidth = canvas.width ;
let canvasHeight = canvas.height ;
let pressedKey = {a:false, d:false, w:false, s:false} ;
let mouseX = 0 ;
let mouseY = 0 ;
let health = 100 ;
let maxHealth = 100 ;
let score = 0 ;
let highScoreVal = 0 ;
let paused = true ;
let playPause = document.getElementById('playPause') ;
let info = document.getElementById('info') ;
let intervalId = null ;
let intervalId2 = null ;
let shield = false ;
let explosive = false ;
let enemyShoot = new Audio('assets/enemyShoot.wav') ;
let explosiveAudio = new Audio('assets/explosive.mp3') ;
let healthAudio = new Audio('assets/health.mp3') ;
let hurt = new Audio('assets/hurt.mp3') ;
let playerShoot = new Audio('assets/playerShoot.wav') ;
let powerGun = new Audio('assets/powerGun.mp3') ;
let sheildAudio = new Audio('assets/shield.wav') ;
let killed = new Audio('assets/killed.mp3') ;
let menu = document.getElementById('menu') ;
menu.showModal() ;

// Player object
class Player {
    constructor() {
        this.position = {x:200, y:canvasHeight - 100} ;
        this.velocity = {x:0, y:0} ;
        this.radius = 20 ;
        this.angle = radian(270) ;
    }

    draw() {
        // set position
        this.position.x += this.velocity.x ;
        this.position.y += this.velocity.y ;

        // gun part
        let angle = Math.atan((mouseY - this.position.y) / (mouseX - this.position.x)) ;
        if (mouseX < this.position.x) {
            angle += Math.PI ;
        }
        c.save() ;
        c.translate(this.position.x, this.position.y) ;
        c.rotate(angle) ;
        c.fillStyle = 'rgba(155,164,181,255)' ;
        c.fillRect(0, -5, 40, 10) ;
        c.restore() ;

        // circle part
        c.beginPath() ;
        c.fillStyle = 'rgba(183,19,115,255)' ;
        c.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI) ;
        c.fill() ;     
    }
}

class Bullet {
    constructor(position, velocity, colour) {
        this.position = position ;
        this.velocity = velocity ;
        this.colour = 'rgba(208,78,208,255)' ;
    }

    draw() {
        // set position
        this.position.x += this.velocity.x ;
        this.position.y += this.velocity.y ;

        c.beginPath() ;
        c.fillStyle = this.colour ;
        c.arc(this.position.x, this.position.y, 10, 0, 2*Math.PI) ;
        c.fill() ;  
    }
}

class Bot {
    constructor(position, velocity) {
        this.position = position ;
        this.velocity = velocity ;
        this.originalVelocity = velocity ;

        let image = new Image() ;
        image.src = 'assets/bot.png' ;
        image.onload = () => {
            this.image = image ;
            this.width = 35 ;
            this.height = 35 ;
        } ;
    }

    draw() {
        this.position.x += this.velocity.x ;
        this.position.y += this.velocity.y ;

        if (this.image) {
            c.fillStyle = 'orange';
            c.fillRect(
                this.position.x,
                this.position.y,
                this.width,
                this.height
            )

            
        }
    }
}

class Cluster {
    constructor(position, velocity) {
        this.position = position ;
        this.velocity = velocity ;
        this.bots = [] ;
    }
}

class Home {
    constructor() {
        this.width = 120 ;
        this.height = 100 ;
        this.position = {x: (canvasWidth/2) - (this.width/2), y: canvasHeight - 350} ;

        let image = new Image() ;
        image.src = 'assets/home.jpg' ;
        image.onload = () => {
            this.image = image ;
        } ;
    }
    draw() {
        if (this.image) {
            c.fillStyle = 'yellow';
            c.fillRect(
                this.position.x,
                this.position.y,
                this.width,
                this.height
            )

            c.fillStyle="black";
            c.font="30px courier";
            c.fillText('HOME', this.position.x + this.width/6, this.position.y + this.height/2);

        }
    }
}

class Shooter {
    constructor(position, velocity) {
        this.position = position ;
        this.velocity = velocity ;
        this.originalVelocity = velocity ;
        this.radius = 20 ;
    }

    draw() {
        // set position
        this.position.x += this.velocity.x ;
        this.position.y += this.velocity.y ;

        // gun part
        let homeCenter = {x:(home.position.x + (home.width/2)), y:(home.position.y + (home.height/2))} ;
        let angle = Math.atan((homeCenter.y - this.position.y) / (homeCenter.x - this.position.x)) ;
        if (homeCenter.x < this.position.x) {
            angle += Math.PI ;
        }
        c.save() ;
        c.translate(this.position.x, this.position.y) ;
        c.rotate(angle) ;
        c.fillStyle = '#9ba4b5' ;
        c.fillRect(0, -5, 40, 10) ;
        c.restore() ;

        // circle part
        c.beginPath() ;
        c.fillStyle = '#e54645' ;
        c.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI) ;
        c.fill() ;
    }
}

class PowerUp {
    constructor(position, type) {
        this.position = position ;
        this.type = type ;
        this.width = 30 ;
        this.height = 30 ;

        let image = new Image() ;
        image.src = 'assets/' + type + ".png" ;
        image.onload = () => {
            this.image = image ;
        } ;
    }

    draw() {
        if (this.image) {
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            )

            // c.beginPath();
            // c.fillStyle = 'white' ;
            // c.arc(this.position, this.position, this.radius, 0, 2*Math.PI) ;
            // c.fill(); 
        }
    }
}

let player = new Player() ;
let bullets = [] ;
let home = new Home() ;
let clusters = [] ;
let frames = 0 ;
let interval = 500 ;
let shooters = [] ;
let enemyBullets = [] ;
let powerUps = [] ;

// FUNCTIONS

// degree to radian
function radian(deg) {
    return (Math.PI / 180) * deg ;
}

// Draw background
function background() {
    let gradient = c.createRadialGradient(
        canvasWidth / 2,
        canvasHeight / 2,
        50,
        canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth / 2
    ) ;
    gradient.addColorStop(0.2, "rgba(108,49,105,255)") ;
    gradient.addColorStop(1, "rgba(75,42,78,255)") ;
    c.fillStyle = gradient ;
    c.fillRect(0, 0, canvasWidth, canvasHeight) ;
}

// Check whether colliding ; radius coressponds to radius around cord2
function isCollide(cords1, cords2, radius) {
    let distance = Math.sqrt((cords1.x - cords2.x)**2 + (cords1.y - cords2.y)**2) ;
    if (distance > radius) {
        return false ;
    } else {
        return true ;
    }
}

// Generate random cluster with random size and random location
function genCluster() {
    let cWidth = 150 ;
    let cHeight = 80 ;
    let cPos = {x: Math.round((canvasWidth - cWidth)*Math.random()), y:20} ;
    let locs = [] ;
    let newPos = {
        x: Math.round(cPos.x + (cWidth)*Math.random()),
        y: Math.round(cPos.y + (cHeight)*Math.random())
    } ;
    locs.push(newPos) ;
    let num = Math.round(2 + (3)*Math.random()) ;
    while (true) {
        newPos = {
            x: Math.round(cPos.x + (cWidth)*Math.random()),
            y: Math.round(cPos.y + (cHeight)*Math.random())
        } ;
        let cond = true ;
        locs.forEach((e) => {
            if (isCollide(newPos, e, 50)) {
                cond = false ;
            }
        }) ;
        if (cond) {
            locs.push(newPos) ;
        }
        if (locs.length === num) {
            break ;
        }
    }

    let cAngle = Math.atan(((cPos.y + cHeight/2) - (home.position.y + home.height/2)) / ((cPos.x + cWidth/2) - (home.position.x + home.width/2))) ;
    if (cPos.x < home.position.x) {
        cAngle += Math.PI ;
    }
    let cVelocity = {
        x: -2 * Math.cos(cAngle),
        y: -2 * Math.sin(cAngle)
    } ;

    let cluster = new Cluster(cPos, cVelocity) ;
    locs.forEach((loc) => {
        let bot =  new Bot(loc, cluster.velocity) ;
        cluster.bots.push(bot) ;
    }) ;

    return cluster ;
}

function genShooters() {
    if (shooters.length < 2) {
        while (true) {
            let loc = {x: Math.round(50 + Math.random()*(canvasWidth-100)), y: 0} ;
            let cond = true ;
            shooters.forEach((e) => {
                let val = Math.abs(e.position.x - loc.x) ;
                if (val < 50) {
                    cond = false ;
                }
            }) ;
            if (cond) {
                shooters.push(new Shooter(loc, {x:0, y:1})) ;
                break ;
            }
        }
        genShooters() ;
    } else {
        return
    }
}

function shootHome() {
    shooters.forEach((shooter) => {
        let homeCenter = {x:(home.position.x + (home.width/2)), y:(home.position.y + (home.height/2))} ;
        let angle = Math.atan((homeCenter.y - shooter.position.y) / (homeCenter.x - shooter.position.x)) ;
        if (homeCenter.x < shooter.position.x) {
            angle += Math.PI ;
        }
        let velocity = {
            x: 10 * Math.cos(angle),
            y: 10 * Math.sin(angle)
        } ;
        let position = {
            x: shooter.position.x + 40 * Math.cos(angle),
            y: shooter.position.y + 40 * Math.sin(angle)
        } ;
        if (shooter.position.y > canvasHeight*0.05) {
            enemyBullets.push(new Bullet(position, velocity, "black")) ;
            enemyShoot.currentTime = 0 ;
            enemyShoot.volume = 0.75 ;
            enemyShoot.play() ;
        }
    }) ;
}

function distance(pos1, pos2) {
    let dist = Math.sqrt((pos1.x - pos2.x)**2 + (pos1.y - pos2.y)**2) ;
    return dist ;
}

// MAIN GAME LOOP

function main() {
    window.requestAnimationFrame(main) ;
    background() ;

    // Draw home health bar
    c.fillStyle = "white" ;
    c.fillRect(20, 20, 400, 40) ;
    c.fillStyle = "rgba(122,170,115,255)" ;
    if (health >= 0) {
        c.fillRect(20, 20, 400 * (health/maxHealth), 40) ;
    }

    c.fillStyle = 'white';
    c.font = '25px courier';
    c.fillText("Home Health", 25, 45, 150, 20);

    // Check if game over
    if (health <= 0) {
        alert("Game Over! Score: " + score.toString()) ;
        score = 0 ;
        health = maxHealth ;
        clusters = [] ;
        bullets = [] ;
        player = new Player() ;
        interval = 500 ;
        frames = 0 ;
        paused = true ;
        clearInterval(intervalId) ;
        clearInterval(intervalId2) ;
        shooters = [] ;
        enemyBullets = [] ;
        powerUps = [] ;
        playPause.style.backgroundImage = 'url("assets/play.png")' ;
    }

    // Change velocity based on input
    if (pressedKey.a && !pressedKey.d && player.position.x > 20) {
        player.velocity.x = -5 ;
    } else if (pressedKey.d && !pressedKey.a && player.position.x < canvasWidth - 20) {
        player.velocity.x = 5 ;
    } else {
        player.velocity.x = 0 ;
    }

    if (pressedKey.w && !pressedKey.s && player.position.y > 20) {
        player.velocity.y = -5 ;
    } else if (pressedKey.s && !pressedKey.w && player.position.y < canvasHeight - 20) {
        player.velocity.y = 5 ;
    } else {
        player.velocity.y = 0 ;
    }

    // Draw score and high score
    c.font = "30px courier" ;
    c.fillStyle = "white" ;
    c.fillText("SCORE: " + score.toString(), canvasWidth - 300, 40) ;
    c.fillText("HIGH SCORE: " + highScoreVal.toString(), canvasWidth - 300, 70) ;

    // Draw home
    home.draw() ;

    // Draw shield
    if (shield) {
        c.save() ;
        c.globalAlpha = 0.3 ;
        c.fillStyle = '#6e406b' ;
        c.beginPath();
        c.arc(home.position.x + home.width/2, home.position.y + home.height/2, 100, 0, 2 * Math.PI);
        c.fill();
        c.globalAlpha = 1 ;
        c.lineWidth = 2 ;
        c.strokeStyle='#c091da';
        c.arc(home.position.x + home.width/2, home.position.y + home.height/2, 100, 0, 2 * Math.PI);
        c.stroke();
        c.restore() ;
    }

    // Draw player
    player.draw() ;

    // Draw shooters 
    shooters.forEach((shooter, index) => {
        // If paused, set velocity to 0, else set to original value
        if (paused === true) {
            if (shooter.velocity.y === shooter.originalVelocity.y) {
                shooter.velocity = {x:0, y:0} ;
            }
        } else {
            shooter.velocity = shooter.originalVelocity ;
        }

        // If reached 25% of distance, stop shooter
        if (shooter.position.y > canvasHeight/4) {
            shooter.velocity.y = 0 ;
        }

        // If any bullet hit the shooter, remove the bullet and the shooter, increase score
        for (let i = 0 ; i < bullets.length ; i++) {
            let bullet = bullets[i] ;
            if (isCollide(bullet.position, shooter.position, 20)) {
                killed.currentTime = '0' ;
                killed.play() ;
                score += 5 ;
                if (score > highScoreVal) {
                    highScoreVal = score ;
                    localStorage.setItem('highScore', JSON.stringify(highScoreVal)) ;
                }
                // Reduce interval for higher score
                if (score % 100 === 0 && score > 0) {
                    if (interval >= 200) {
                        interval -= 100 ;
                    } else if (interval >= 50) {
                        interval -= 5 ;
                    }
                }
    
                setTimeout(() => {
                    bullets.splice(i, 1) ;
                    shooters.splice(index, 1) ;
                }, 0) ;
                break ;
            }
        }

        shooter.draw() ;
    }) ;

    // Draw clusters
    clusters.forEach((cluster, cindex) => {
        cluster.bots.forEach((bot, index) => {
            // If paused, set velocity to 0, else set to original value
            if (paused === true) {
                if (bot.velocity.x === bot.originalVelocity.x && bot.velocity.y === bot.originalVelocity.y) {
                    bot.velocity = {x:0, y:0} ;
                }
            } else {
                bot.velocity = bot.originalVelocity ;
            }

            // If any bullet hit the bot, remove the bullet and the bot, increase score
            for (let i = 0 ; i < bullets.length ; i++) {
                let bullet = bullets[i] ;
                let newPos = {
                    x: bot.position.x + 17,
                    y: bot.position.y + 17
                } ;
                if (isCollide(bullet.position, newPos, 17)) {
                    if (explosive) {
                        score += 10 * cluster.bots.length ;
                        explosiveAudio.currentTime = 0 ;
                        explosiveAudio.play() ;
                        setTimeout(() => {
                            bullets.splice(i, 1) ;
                            clusters.splice(cindex, 1) ;
                        }, 0) ;
                    } else {
                        score += 10 ;
                        killed.currentTime = '0' ;
                        killed.play() ;
                        setTimeout(() => {
                            bullets.splice(i, 1) ;
                            cluster.bots.splice(index, 1) ;
                        }, 0) ;
                    }

                    if (score > highScoreVal) {
                        highScoreVal = score ;
                        localStorage.setItem('highScore', JSON.stringify(highScoreVal)) ;
                    }
                    // Reduce interval for higher score
                    if (score % 100 === 0 && score > 0) {
                        if (interval >= 200) {
                            interval -= 100 ;
                        } else if (interval >= 50) {
                            interval -= 5 ;
                        }
                    }
                    break ;
                }
            }

            // If bot went past the screen, remove the bot
            if (bot.position.y > canvasHeight + 50) {
                setTimeout(() => {
                    cluster.bots.splice(index, 1) ;
                }, 0) ;
            }

            // If bot hit the home, remove bot, and reduce health
            let newPos = {
                x: home.position.x + (home.width / 2),
                y: home.position.y + (home.height / 2)
            } ;
            if ((isCollide(bot.position, newPos, 75) || bot.position.y > home.position.y + 20)) {
                setTimeout(() => {
                    cluster.bots.splice(index, 1) ;
                }, 0) ;
                if (!shield) {
                    hurt.currentTime = 0 ;
                    hurt.play() ;
                    health -= 5 ;
                }
            }

            // Draw the bot
            bot.draw() ;
        }) ;
    }) ; 

    // Draw bullets
    bullets.forEach( (e, i) => {
        if (e.position.y < -20) {
            setTimeout(() => {
                bullets.splice(i, 1) ;
            }, 0) ;
        } else {
            e.draw() ;
        }
    }) ;

    // Draw enemy bullets
    enemyBullets.forEach((e,i) => {
        if (e.position.y > canvasHeight + 20) {
            setTimeout(() => {
                enemybullets.splice(i, 1) ;
            }, 0) ;
        } else {
            e.draw() ;
        }
    }) ;

    // Check for bullets hitting home
    enemyBullets.forEach((bullet, i) => {
        let newPos = {
            x: home.position.x + (home.width / 2),
            y: home.position.y + (home.height / 2)
        } ;
        if (isCollide(bullet.position, newPos, 75) || bullet.position.y > home.position.y + 20) {
            setTimeout(() => {
                enemyBullets.splice(i, 1) ;
            }, 0) ;
            if (!shield) {
                hurt.currentTime = 0 ;
                hurt.play() ;
                health -= 2 ;
            }
        }
    }) ;

    // Powerup spawn
    let types = ['shield', 'regen', 'explosive'] ;
    if (Math.random() < 0.003 && !paused) {
        let type = types[Math.round(Math.random()*(2))] ;
        let pos = {x:0, y:0} ;
        pos.x = Math.round(canvasWidth*0.10 + Math.random()*(canvasWidth*0.80)) ;
        pos.y = Math.round(canvasHeight*0.20 + Math.random()*(home.position.y - 100 - canvasHeight*0.20)) ;
        let cond = true ;
        powerUps.forEach((e) => {
            if (distance(e.power.position, pos) < 50) {
                cond = false
            }
        }) ;
        shooters.forEach((e) => {
            if (distance(e.position, pos) < 50) {
                cond = false
            }
        }) ;
        if (cond) {
            powerUps.push({power: new PowerUp(pos, type), start: new Date()}) ;
        }
    }

    // Powerup despwan or selection
    powerUps.forEach((powerUp, index) => {
        let currentTime = new Date() ;
        if (Math.abs(currentTime - powerUp.start) > 5000) {
            setTimeout(() => {
                powerUps.splice(index, 1) ;
            }, 0) ;
        }

        // If bullet hit the powerup, give the powerup
        for (let i = 0 ; i < bullets.length ; i++) {
            let bullet = bullets[i] ;
            let newPos = {
                x: powerUp.power.position.x + 15,
                y: powerUp.power.position.y + 15
            } ;
            if (isCollide(bullet.position, newPos, 15)) {

                if (powerUp.power.type === "shield" && !shield) {
                    shield = true ;
                    sheildAudio.play() ;
                    setTimeout(() => {
                        shield = false ;
                    }, 5000) ;
                }

                if (powerUp.power.type === "regen") {
                    let newHealth = health + 15 ;
                    if (newHealth > maxHealth) {
                        health = maxHealth ;
                    } else {
                        healthAudio.currentTime = 0 ;
                        healthAudio.play() ;
                        health = newHealth ;
                    }
                }

                if (powerUp.power.type === "explosive" && !explosive) {
                    powerGun.play() ;
                    explosive = true ;
                    setTimeout(() => {
                        explosive = false ;
                    }, 5000) ;
                }

                setTimeout(() => {
                    bullets.splice(i, 1) ;
                    powerUps.splice(index, 1) ;
                }, 0) ;
                break ;
            }
        }
    }) ;
    
    // Draw powerups
    powerUps.forEach((powerUp) => {
        powerUp.power.draw() ;
    }) ;

    if (!paused) {
        // Create cluster
        if (frames % interval === 0 && health > 0) {
            clusters.push(genCluster()) ;
            frames = 0 ;
        }

        frames += 1 ;
    }
}

// START GAME
let highScore = localStorage.getItem('highScore') ;
if (highScore == null) {
    localStorage.setItem('highScore', JSON.stringify(highScoreVal)) ;
} else {
    highScoreVal = JSON.parse(highScore) ;
}

window.requestAnimationFrame(main) ;

// INPUT CONTROL
window.addEventListener('keydown', (e) => {
    if (paused === false) {
        switch (e.key) {
            case 'a':
                pressedKey.a = true ;
                break ;
            case 'd':
                pressedKey.d = true ;
                break ;
            case 'w':
                pressedKey.w = true ;
                break ;
            case 's':
                pressedKey.s = true ;
                break ;
        }
    }
}) ;

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'a':
            pressedKey.a = false ;
            break ;
        case 'd':
            pressedKey.d = false ;
            break ;
        case 'w':
            pressedKey.w = false ;
            break ;
        case 's':
            pressedKey.s = false ;
            break ;
    }
}) ;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX ;
    mouseY = e.clientY ;
}) ;

window.addEventListener('keyup', (e) => {
    if (e.key ==- " " && paused === false) {
        let angle = Math.atan((mouseY - player.position.y) / (mouseX - player.position.x)) ;
        if (mouseX < player.position.x) {
            angle += Math.PI ;
        }
        let velocity = {
            x: 10 * Math.cos(angle),
            y: 10 * Math.sin(angle)
        } ;
        let position = {
            x: player.position.x + 40 * Math.cos(angle),
            y: player.position.y + 40 * Math.sin(angle)
        } ;
        let colour = "pink" ;
        if (explosive) {
            colour = "red" ;
        }
        playerShoot.currentTime = 0 ;
        playerShoot.play() ;
        bullets.push(new Bullet(position, velocity, colour)) ;
    }
}) ;

playPause.addEventListener('click', (e) => {
    paused = !paused ;
    if (paused === true) {
        clearInterval(intervalId) ;
        clearInterval(intervalId2) ;
        info.style.display = 'block' ;
        playPause.style.backgroundImage = 'url("assets/play.png")' ;
    } else {
        intervalId = setInterval(genShooters, 15000) ;
        intervalId2 = setInterval(shootHome, 3000) ;
        info.style.display = 'None' ;
        playPause.style.backgroundImage = 'url("assets/pause.png")' ;
    }
    playPause.blur() ;
}) ;

menu.addEventListener('click', (e) => {
    menu.close() ;
    menu.style.display = "None" ;
}) ;

info.addEventListener('click', (e) => {
    menu.show() ;
    menu.style.display = "flex" ;
}) ;