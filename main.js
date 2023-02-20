var canvas = document.getElementById('mainCanvas');
var context = canvas.getContext('2d');

// dimensions of the canvas
const WIDTH = 1024;
const HEIGHT = 768;

// number of rounds in the game
const NUMBER_OF_ROUNDS = 60;

// game states
const GAMESTATE_PREROUND = 0; // before the player has clicked to start the round
const GAMESTATE_WAITING = 1; // before the circle has appeared
const GAMESTATE_PLAYING = 2; // before the player has clicked the circle
const GAMESTATE_GAMEOVER = 3; // game has ended, display results

// current game state
gameState = GAMESTATE_PREROUND;

// gameplay variables 
timeLeftToWait = 0;
round = 0;
score = 0;
frame = 0;

// circle generation
var difficulty;
var circleDiameter;
var circleAngle;


// Current mouse position
// Updates whenever the mouse moves
// Position is relative to the centre of the screen
var mouse = {
    x:-100,
    y:-100
};

// circle object
var circle = {
    x:0,
    y:0,
    diameter: 0,
    color: 'red'
}

// circle at the centre of the screen
centerCircle = {
        x:0,
        y:0,
        diameter: 30,
        color: 'green'
}

// Define canvas Properties
canvas.width = WIDTH; 
canvas.height = HEIGHT;
canvas.style.width = WIDTH;
canvas.style.height = HEIGHT;

// Timing Variables
let arrayOfTimes = [], arrayOfDifficulties = [], arrayOfSizes = [], startTime

//Runs 60 times per second
function tick() {
    // Clear screen
    context.clearRect(0,0,Math.round(WIDTH), Math.round(HEIGHT));

    // Define the tooltip text
    tooltip = "";
    
    //Draw center circle
    draw_circle(centerCircle);
    
    // Check if the mouse is in the center circle
    var inCircle = mouseInCircle(centerCircle);

    switch(gameState) {
        case GAMESTATE_PREROUND: // While user waiting to begin playing
            tooltip = "Click the circle to begin";
            color = (inCircle) ? 'black' : 'red';
            break;

        case GAMESTATE_WAITING: // Countdown so user can start playing
            if (timeLeftToWait > 0) {
                tooltip = "";
                timeLeftToWait--;
            } else {
                // Wait is over, start playing
                gameState = GAMESTATE_PLAYING;
                timeLeftToWait = 60 * 2; // 2 seconds
                startTime = new Date(); // start the timer
                generate_circle_position();
            }
            break;

        case GAMESTATE_PLAYING:
            if (timeLeftToWait > 0) {
                tooltip = "";
                timeLeftToWait--;
            } 
            else {
                gameState = (round+1 < NUMBER_OF_ROUNDS)? GAMESTATE_PREROUND : GAMESTATE_GAMEOVER; // change game state
                
                // add 0 to array for circle unclicked
                arrayOfTimes.push(0);
                arrayOfDifficulties.push(Math.round(difficulty*1000)/1000);
                arrayOfSizes.push(circleDiameter)
                
                round++; // increment round
            }
            draw_circle(circle);
            break;

        case GAMESTATE_GAMEOVER:
            saveToCsv();
            return;   
    }

    display_tooltip(tooltip, color);

    display_stats();    
    
    frame++;
    requestAnimationFrame(tick);   
}

// update circle object with a new random position/size based on the round number
function generate_circle_position() {
    // index of difficulty (difficulty) must be between 1.59 and 2.97 to ensure that the circle always stays on the screen
    
    // difficulty increases in 1/60th increments over the 60 rounds 
    difficulty = ((round/NUMBER_OF_ROUNDS) * 1.33) + 1.70

    // generate a random size of circle to spawn: (10, 30, 50)
    sizes=[10, 30, 50]; 
    circleDiameter = sizes[Math.floor(Math.random() * 3)]; // Generate random from 0 to 2

    // distance from centre of the page - calculated from Fitt's law
    distance = ((Math.pow(2, difficulty))-1) * circleDiameter 

    // Generate random angle
    circleAngle =  Math.random() * 360; // Generate random angle from 0 to 360
    circleAngle = circleAngle * Math.PI / 180 // convert angle to radians
    
    // Convert angle and distance to cartesian coordinates
    x = distance * Math.cos(circleAngle)
    y = distance * Math.sin(circleAngle)
    
    // set the coordinates and size of the circle
    circle =  {
        x: x,
        y: y,
        diameter: circleDiameter,
        color: 'red'
    }
}

// Display instructions at the mouse position
function display_tooltip(tooltip, color) {
    context.font = "20px Arial";
    context.fillStyle = color;
    context.fillText(tooltip, mouse.x + WIDTH/2, mouse.y + HEIGHT/2);
}

// Display the current score and round number in the top corner
function display_stats() {
    context.font = "20px Arial";
    context.fillStyle = 'black';
    context.fillText("Round: " + round, 10, 20);
    context.fillText("Score: " + score, 10, 40);
}

// Detect when the mouse moves and update the mouse object coordinates
canvas.addEventListener("mousemove", function(event) {
    let rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left - WIDTH/2;
    mouse.y = event.clientY - rect.top - HEIGHT/2;
});

// Add event listener for mouse click event
canvas.addEventListener("click", function(event) {
    switch (gameState) {
        case GAMESTATE_PREROUND:
            // If the mouse is in the center circle, start the game
            if (mouseInCircle(centerCircle)) {
                gameState = GAMESTATE_WAITING;
                timeLeftToWait = Math.floor((Math.random() * 120) + 60);
            }
            break;

        case GAMESTATE_PLAYING:
            // If the mouse is in the target circle, increase the score and start the next round

            if (mouseInCircle(circle)) {
                score++; // increment score

                gameState = (round+1 < NUMBER_OF_ROUNDS)? GAMESTATE_PREROUND : GAMESTATE_GAMEOVER; // change game state

                // add new time difference to array
                arrayOfTimes.push(Math.round((new Date() - startTime)*1000)/1000); // rounded to 3dp
                arrayOfDifficulties.push(Math.round(difficulty*1000)/1000);
                arrayOfSizes.push(circleDiameter)

                round++; // increment round
            }
            break;
    }
});

// Check if mouse is inside a given circle object
function mouseInCircle(circle) {
    if (mouseDistance(circle.x, circle.y) <= circle.diameter/2) {
        return true;
    }
    return false;   
}

// Calculate the distance between the mouse and a given position 
function mouseDistance(x, y) {
    return Math.sqrt(Math.pow((mouse.x - x), 2) + Math.pow((mouse.y - y), 2))
}

// Draw a given circle object to the canvas
function draw_circle(circle) {
    x = circle.x;
    y = circle.y;
    diameter = circle.diameter;
    color = circle.color;

    x += WIDTH/2;
    y += HEIGHT/2;

    context.beginPath();
    context.arc(x, y, diameter / 2, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
}

//csv file is created and ready to download
// copied from the original reaction time test application
function saveToCsv(){
	var encodedUri, link;
	let csvContent = "data:text/csv;charset=utf-8,Reaction times in ms (visual), Difficulty, Circle Size\n";
	
    for (i=0; i<arrayOfTimes.length; i++){
        let row = arrayOfTimes[i] + ", " + arrayOfDifficulties[i] + ", " + arrayOfSizes[i];
        csvContent += row + "\r\n";
    }
	encodedUri = encodeURI(csvContent);
	
	link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "resultsVisual.csv");
	document.body.appendChild(link);
	link.click();
}

requestAnimationFrame(tick);
