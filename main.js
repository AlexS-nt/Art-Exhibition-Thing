

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body   = Matter.Body,
    Vector = Matter.Vector,
    Events = Matter.Events,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);
var ground = Bodies.rectangle(width / 2, height + 30, width * 2, 60, { isStatic: true });

const circle = Bodies.circle(0, 0, 10, { isStatic: true, isSensor: true })

// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground, circle]);

// create runner
var runner = Runner.create();



var canvas = document.createElement('canvas'),
    context = canvas.getContext('2d');


var render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false
        }
    });

var mouse = Matter.Mouse.create(render.canvas),
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.05,
                render: {
                    visible: true
                }
            }
        });
Matter.Mouse.clearSourceEvents(mouse)
var p = document.getElementById("mouse")

Composite.add(engine.world, mouseConstraint)

var targetedObject;



render.mouse = mouse
// run the engine
Render.run(render)
Runner.run(runner, engine);