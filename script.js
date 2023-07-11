const c = document.getElementById("canvas");
const ctx = c.getContext("2d", {
    willReadFrequently: true
});
let speed_send = 250;
let video = null;
let green_count = 0;
let old_green_count = -1;
let red_count = 0;
let old_red_count = -1;
let letter_count = 0;
let blue_count = 0;
let old_blue_count = -1
let color_message = [""];
let old_time = 0;
let sending = false;
let message_length = 0;
let last_send = 0;
let sent_characters = 0;
let next_letter = 0;
let waiting = false;
let last_recieve = 0;

function main() {
    c.width = window.innerWidth * 0.7;
    c.height = window.innerHeight * 0.6;
    loop()
}

function setup_video() {
    if(video != null) {
        stop_camera();
        return;
    }
    video = document.getElementById('video')
    if(navigator.mediaDevices.getUserMedia) {
        let successCallback = function(stream) {
            video.srcObject = stream;
        }
        let errorCallBack = function(error) {
            //            console.log(error);
        }
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: {
                    ideal: 'environment'
                }
            }
        }).then(successCallback, errorCallBack);
    }
}

function loop() {
    let cur_time = Date.now();
    if(video != null) {
        ctx.drawImage(video, 0, 0, c.width, c.height);
    }
    if(sending && cur_time - last_send >= speed_send) {
        last_send = cur_time;
        flashMessageColors()
    } 

    if (waiting && cur_time - last_recieve >= 5000) {
        resetRecieved()
    }

    findRedPixels();
    requestAnimationFrame(loop);
}

function findRedPixels() {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    red_count = 0;
    green_count = 0;
    blue_count = 0;
    for(let x = 0; x < width; x++) {
        for(let y = 0; y < height; y++) {
            let red = imageData.data[y * width * 4 + x * 4 + 0];
            let green = imageData.data[y * width * 4 + x * 4 + 1];
            let blue = imageData.data[y * width * 4 + x * 4 + 2];
            if(red > green && red > blue) {
                red_count++
            } else if(green > red && green > blue) {
                green_count++
            } else {
                blue_count++
            }
        }
    }
    getPercentageOfColors()
}

function getPercentageOfColors() {
    if(blue_count / old_blue_count < 0.92 && waiting == true) {
        if(red_count / old_red_count > green_count / old_green_count) {
            color_message.push("1");
            letter_count++;
            document.getElementById("binaryrecieved").innerHTML += "1"
        } else {
            color_message.push("0");
            letter_count++
            document.getElementById("binaryrecieved").innerHTML += "0"
        }
        waiting = false;
        last_recieve = Date.now();
    } else if(blue_count / old_blue_count > 1) {
        waiting = true;
    }
    old_green_count = green_count
    old_red_count = red_count
    old_blue_count = blue_count
    if(letter_count % 8 == 0) {
        convertToPlainText()
    }
}

function convertToPlainText() {
    let rawbinary = "";
    let splitbinary = "";
    let plaintext = "";
    let textrecieved = document.getElementById("textrecieved");
    color_message.forEach(function(element) {
        rawbinary += element
    });
    splitbinary = rawbinary.replace(/(.{8})/g, '$1 ').trim();
    plaintext = splitbinary.split(" ").map(binary => parseInt(binary, 2)).map(decimal => String.fromCharCode(decimal)).join("");
    textrecieved.innerHTML += plaintext;
    if (textrecieved % 8 == 0) {
        textrecieved += " "
    }
    color_message = []
}

function convertPlaintextToBinary() {
    binarymessage = "";
    let originalstring = document.getElementById("message").value;
    let encoder = new TextEncoder();
    let encodedString = encoder.encode(originalstring);
    for(let i = 0; i < encodedString.length; i++) {
        binarymessage += ' ';
        binarymessage += encodedString[i].toString(2).padStart(8, '0');
    }
    convertBinaryToSpans()
}

function convertBinaryToSpans() {
    let output = document.getElementById("output-wrapper");
    while(output.hasChildNodes()) {
        output.removeChild(output.lastChild)
    }
    for(let i = 0; i < binarymessage.length; i++) {
        let numberspan = document.createElement("span");
        numberspan.innerHTML = binarymessage[i];
        numberspan.className = "number";
        output.appendChild(numberspan)
    }
    message_length = 0;
    sending = true;
}


function flashMessageColors() {
    let square = document.getElementById("body");
    let number_display = document.getElementsByClassName("number")
    next_letter++;
    if(next_letter % 2 == 0) {
        square.style.backgroundColor = "blue" // blue is the standby color before message is sent
        return;
    }
    if(sent_characters < binarymessage.length) { // if the amount of characters we've sent is less than the total amount of characters in the binary sequence
        if(binarymessage[sent_characters] == "0") {
            square.style.backgroundColor = "green"
        } else if(binarymessage[sent_characters] == "1") {
            square.style.backgroundColor = "red"
        }
        sent_characters++
        number_display[sent_characters - 1].style.color = "red" 
        console.log(sent_characters)
    } else {
        sending = false;
        square.style.backgroundColor = "blue";
    }
}

function start() {
    let output = document.getElementById("output-wrapper");
    document.getElementById("binaryrecieved").innerHTML = ""
    document.getElementById("textrecieved").innerHTML = ""
    binarymessage = []
    color_message = []
    sent_characters = 0
    letter_count = 0
    while(output.hasChildNodes()) {
        output.removeChild(output.lastChild)
    }
    convertPlaintextToBinary()
}

function resetRecieved() {
    document.getElementById("binaryrecieved").innerHTML = ""
    document.getElementById("textrecieved").innerHTML = ""
    color_message = []
    letter_count = 0
}

main();
setup_video();
last_recieve = Date.now()
