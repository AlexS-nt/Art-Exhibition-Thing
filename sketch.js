let handPose;
let hands = [];
let pinch = [];
let pinch_pairs = new Map();
let saved_hands = new Map();
let lines = [];

let count = 0;
let size = [1280, 960];
let scale_ = [size[0] / 640, size[1] / 480];

function Vec2(x,y){return new Vector2(x,y)};class Vector2{constructor(x,y){this.x=x;this.y=y;}}

class HandPair {
    constructor (thumb, other) {
        this.thumb = thumb;
        this.other = other;
        this.do_math();
        return this;
    }

    do_math() {
        this.off = Vec2(
            Math.abs(this.thumb.x - this.other.x),
            Math.abs(this.thumb.y - this.other.y)
        )
        this.dist_sqr = this.off.x * this.off.x + this.off.y * this.off.y
        this.middle = Vec2(
            (this.thumb.x + this.other.x) / 2,
            (this.thumb.y + this.other.y) / 2
        )
        if (this.dist_sqr < Math.pow(45 * scale_[0], 2)) {
            this.pinching = true
        } else {
            this.pinching = false;
        }
    }
}

class Hand {
    constructor(hand) {
        this.hand = hand
        this.keypoints = this.hand.keypoints;
        this.count = count;
        this.thumb = this.keypoints[4];
        this.point = this.keypoints[8];
        this.middle = this.keypoints[12];
        this.ring = this.keypoints[16];
        this.point_thumb = new HandPair(this.thumb, this.point);
        this.middle_thumb = new HandPair(this.thumb, this.middle);
        this.ring_thumb = new HandPair(this.thumb, this.ring);
        this.root = this.keypoints[0];
        this.pos = Vec2(this.root.x, this.root.y);
        return this
    }

    update(hand) {
        this.hand = hand
        this.keypoints = this.hand.keypoints;
        this.count = count;
        this.thumb = this.keypoints[4];
        this.point = this.keypoints[8];
        this.middle = this.keypoints[12];
        this.ring = this.keypoints[16];
        this.point_thumb = new HandPair(this.thumb, this.point);
        this.middle_thumb = new HandPair(this.thumb, this.middle);
        this.ring_thumb = new HandPair(this.thumb, this.ring);
        this.root = this.keypoints[0];
        this.pos = Vec2(this.root.x, this.root.y);
        return this
    }
}


function gotHands(results) {
  // Save the output to the hands variable
  hands = results;
  //console.log([hands, connections])
}

function preload() {
    handPose = ml5.handPose();
}

function setup() {
    createCanvas(size[0], size[1]);
    video = createCapture(VIDEO);
    video.size(size[0], size[1]);
    video.flipped = true;
    video.hide();

    handPose.detectStart(video, gotHands);
}

function draw() {
    count++;
    image(video, 0, 0, width, height);
    translate(width, 0)
    scale(-1, 1)
    for (let i = 0; i < hands.length; i++) {
        let hand = new Hand(hands[i])
        let dist_min = Math.pow(100 * scale_[0], 2);
        let id_ = -1;
        let id_max = 0;
        saved_hands.forEach((currhand, key) => {

            let posc = currhand.pos;
            let posh = hand.pos;
            let off = Vec2(
                Math.abs(posc.x - posh.x),
                Math.abs(posc.y - posh.y)
            );

            let cdist = (off.x * off.x + off.y * off.y);
            if (cdist < dist_min) {
                dist_min = cdist;
                id_ = key;
            }
            if (id_max < key) {
                id_max = key;
            }
        })
        if (id_ == -1) {
            saved_hands.set(int(id_max) + 1, hand);
        } else {
            saved_hands.set(id_, hand)
        }

        fill(0, 255, 0)
        noStroke();
        circle(hand.point.x, hand.point.y, 10 * scale_[0])
        circle(hand.thumb.x, hand.thumb.y, 10 * scale_[0])
        
        fill(255, 0, 0)
        circle(hand.point_thumb.middle.x, hand.point_thumb.middle.y, 25 * scale_[0])

        /*for (let j = 0; j < hand.keypoints.length; j++) {
            let keypoint = hand.keypoints[j];
            fill(0, 255, 0);
            noStroke();
            circle(keypoint.x, keypoint.y, 10);
        }*/
    }
    pinch = []

    saved_hands.forEach((hand, key) => {

        if (hand.count < count - 10) {
            saved_hands.delete(key);
            return
        }

        if (hand.point_thumb.pinching) {
            pinch.push(key)
        }

        fill(0, 0, 255);
        if (hand.point_thumb.pinching) {
            fill(0, 255, 255);
        }
        noStroke();
        circle(hand.root.x, hand.root.y, 50 * scale_[0] * (1 - hand.hand.keypoints3D[0].z))
        fill(0, 0, 0)
        textSize(16 * scale_[0])
        text(key, hand.root.x, hand.root.y)
    })

    let pinch_temp = []

    while (pinch.length > 0) {
        let pinch1 = pinch.pop()
        
        pinch_temp.push(pinch1);

        let hand1 = saved_hands.get(pinch1);
        for (let i = 0; i < pinch.length; i++) {
            let pinch2 = pinch[i];
            let hand2 = saved_hands.get(pinch2);

            let poff = Vec2(
                Math.abs(hand1.point_thumb.middle.x - hand2.point_thumb.middle.x),
                Math.abs(hand1.point_thumb.middle.y - hand2.point_thumb.middle.y)
            )

            let pdist = Math.pow(poff.x, 2) + Math.pow(poff.y, 2);
            if (pdist < pow(100 * scale_[0], 2)) {
                if (pinch1 < pinch2) {
                    pinch_pairs.set(pinch1, pinch2)
                } else {
                    pinch_pairs.set(pinch2, pinch1)
                }
            }
        }
    }

    pinch = pinch_temp;
    pinch_pairs.forEach((k1, k0) => {
        console.log(k1, k0, pinch_pairs)
        stroke(255, 0, 0)
        strokeWeight(32);
        if (saved_hands.get(k0) == undefined || saved_hands.get(k1) == undefined) {
            pinch_pairs.delete(k0)
            return
        }
        if (saved_hands.get(k0).point_thumb.pinching & saved_hands.get(k1).point_thumb.pinching) {
            line(saved_hands.get(k0).point_thumb.middle.x, saved_hands.get(k0).point_thumb.middle.y, saved_hands.get(k1).point_thumb.middle.x, saved_hands.get(k1).point_thumb.middle.y);
        } else {
            pinch_pairs.delete(k0);
            lines.push([saved_hands.get(k0).point_thumb.middle.x, saved_hands.get(k0).point_thumb.middle.y, saved_hands.get(k1).point_thumb.middle.x, saved_hands.get(k1).point_thumb.middle.y]);
            return
        }
    })

    for (let i = 0; i < lines.length; i++) {
        let k = lines[i];
        stroke(0, 255, 0)
        strokeWeight(16);
        line(k[0], k[1], k[2], k[3])
    }
}