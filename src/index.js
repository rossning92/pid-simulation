import * as Matter from "matter-js";
import * as dat from "dat.gui";
import p5 from "p5";
import * as Controller from "node-pid-controller";

const ARROW_SCALE = 2000.0;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GROUND_Y = 1000;
const PID_PARAM_SCALE = 0.001;

let ctr = new Controller();

var guiData = {
  targetY: GROUND_Y / 2,
  k_p: 0.6,
  k_d: 0.05,
  k_i: 0.1,
};

let force = { x: 0, y: 0 };

// const gui = new dat.GUI();
// console.log("Hello webpack!");

const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;

// create an engine
var engine = Engine.create();
const gravityVec = { x: 0, y: 0.01 };
engine.world.gravity.scale = gravityVec.y;

// var boxB = Bodies.rectangle(450, 50, 80, 80);
var ground = Bodies.rectangle(CANVAS_WIDTH / 2, GROUND_Y, CANVAS_WIDTH, 20, {
  isStatic: true,
});

function createImage(str) {
  let drawing = document.createElement("canvas");

  drawing.width = "150";
  drawing.height = "150";

  let ctx = drawing.getContext("2d");

  ctx.fillStyle = "blue";
  //ctx.fillRect(0, 0, 150, 150);
  ctx.beginPath();
  ctx.arc(75, 75, 20, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "20pt sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(str, 75, 85);
  // ctx.strokeText("Canvas Rocks!", 5, 130);

  return drawing.toDataURL("image/png");
}

// let head = Bodies.circle(20, 10, 40, {
//   render: {
//     sprite: {
//       texture: createImage("helldddo"),
//     },
//   },
// });

const drone = Bodies.rectangle(CANVAS_WIDTH / 2, GROUND_Y / 2, 100, 50, {
  render: {
    strokeStyle: "#ffffff",
    sprite: {
      texture: "./drone.png",
    },
  },
});
drone.frictionAir = 0.1;

// add all of the bodies to the world
World.add(engine.world, [ground, drone]);

// run the engine
Engine.run(engine);

// // create a renderer
// var render = Render.create({
//   element: document.body,
//   engine: engine,
//   options: {
//     width: canvasWidth,
//     height: canvasHeight,
//     background: "#0f0f13",
//     showAngleIndicator: false,
//     wireframes: false,
//   },
// });

// //run the renderer
// Render.run(render);

// Events.on(render, "afterRender", function (event) {
//   var ctx = render.context;
//   ctx.font = "10px 'Cabin Sketch'";
//   ctx.fillStyle = "red";
//   ctx.fillText("THROW OBJECT HERE", 150, obj.targetHeight);
// });

Events.on(engine, "beforeUpdate", function (event) {
  var engine = event.source;

  // apply random forces every 5 secs
  // if (event.timestamp % 5000 < 50) shakeScene(engine);

  //

  ctr.k_p = guiData.k_p * PID_PARAM_SCALE;
  ctr.k_i = guiData.k_i * PID_PARAM_SCALE;
  ctr.k_d = guiData.k_d * PID_PARAM_SCALE;

  {
    const err = guiData.targetY - drone.position.y;
    let input = -ctr.update(err);
    input = Math.min(0, input);

    force = { x: 0, y: input };
    Body.applyForce(drone, drone.position, force);
  }
});

var gui = new dat.GUI();
gui.add(guiData, "k_p").min(0).max(1);
gui.add(guiData, "k_i").min(0).max(1);
gui.add(guiData, "k_d").min(0).max(0.1);

// const mouse = Matter.Mouse.create(render.canvas);
// const mouseConstraint = Matter.MouseConstraint.create(engine, {
//   mouse: mouse,
//   constraint: {
//     // allow bodies on mouse to rotate
//     angularStiffness: 0,
//     render: {
//       visible: false,
//     },
//   },
// });
// Events.on(mouseConstraint, "mousedown", (event) => {
//   // console.log(event);
//   // console.log(mouse.position);
//   obj.targetHeight = mouse.position.y;
// });

// ---

function drawVertices(p, vertices) {
  p.beginShape();
  for (var i = 0; i < vertices.length; i++) {
    p.vertex(vertices[i].x, vertices[i].y);
  }
  p.endShape();
}

// draw an arrow for a vector at a given base position
function drawArrow(p, origin, vec, { color = "white" } = {}) {
  vec = p.createVector(vec.x, vec.y);

  p.push();
  p.stroke(color);
  p.strokeWeight(6);
  p.fill(color);
  p.translate(origin.x, origin.y);
  p.line(0, 0, vec.x, vec.y);
  p.rotate(vec.heading());
  let arrowSize = 16;
  p.translate(vec.mag() - arrowSize, 0);
  p.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  p.pop();
}

function pixelsToMeters(x) {
  return (GROUND_Y - x) / 10;
}

var textAlpha = 0;

const sketch = (p) => {
  var img;

  // Setup function
  // ======================================
  p.setup = () => {
    let canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    img = p.loadImage("drone.png");
    p.imageMode(p.CENTER);
    p.rectMode(p.CENTER);
  };

  // Draw function
  // ======================================
  p.draw = () => {
    p.textFont("Noto Sans SC");
    p.background("#111");
    p.rect(0, 0, 100, 100);

    p.background(0);

    // Show PID parameters
    p.text(
      `Kp=${guiData.k_p.toFixed(2)}  Ki=${guiData.k_i.toFixed(
        2
      )}  Kd=${guiData.k_d.toFixed(2)}`,
      100,
      100
    );

    p.fill(255);
    // drawVertices(p, drone.vertices);
    // drawVertices(boxB.vertices);
    p.image(img, drone.position.x, drone.position.y);

    p.fill(128);
    drawVertices(p, ground.vertices);

    if (guiData.targetY < GROUND_Y) {
      // Show target height
      textAlpha = Math.min(255, textAlpha + 10);
      p.fill(255, 255, 255, textAlpha);
      p.rect(CANVAS_WIDTH / 2, guiData.targetY, CANVAS_WIDTH, 4);
      p.text(
        `目标高度 (Target Height): ${pixelsToMeters(guiData.targetY)}m`,
        CANVAS_WIDTH / 2 + 200,
        guiData.targetY - 10
      );

      // Show error
      const ERROR_ARROW_X = CANVAS_HEIGHT / 4;
      const errorVec = p.createVector(0, guiData.targetY - drone.position.y);
      drawArrow(p, { x: ERROR_ARROW_X, y: drone.position.y }, errorVec, {
        color: "red",
      });
      drawArrow(
        p,
        { x: ERROR_ARROW_X, y: drone.position.y + errorVec.y },
        errorVec.mult(-1),
        {
          color: "red",
        }
      );
      p.fill("red");
      p.text(
        "误差 (error)",
        ERROR_ARROW_X + 10,
        drone.position.y - errorVec.y * 0.5
      );
    }

    // gravity
    drawArrow(
      p,
      drone.position,
      p.createVector(gravityVec.x, gravityVec.y).mult(drone.mass * ARROW_SCALE)
    );
    p.textSize(40);
    p.fill(255);
    p.text("g", drone.position.x + 10, drone.position.y + 50);

    // Show push force
    p.fill("yellow");
    if (Math.abs(force.y) > 0) {
      drawArrow(
        p,
        drone.position,
        p.createVector(force.x, force.y).mult(ARROW_SCALE),
        { color: "yellow" }
      );
      p.text("F", drone.position.x + 10, drone.position.y - 50);
    }
  };

  p.mousePressed = () => {
    guiData.targetY = Math.min(GROUND_Y, p.mouseY);
    // ctr.setTarget(0);
    textAlpha = 0;
  };
};

new p5(sketch);

document.querySelector("body").style.margin = "0";
