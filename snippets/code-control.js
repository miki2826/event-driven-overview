var code = document.getElementsByName("source");
var index = code.length;
function draw() {
    if (0 < index) {
        var snippet = code[(code.length - (index--))];
        Rainbow.color(snippet.innerHTML, snippet.getAttribute("lang") || "javascript", function(highlighted_code) {
            document.getElementById("code").innerHTML += highlighted_code;
        });
    }
}

document.onkeydown = function(e) {
    if (40 === e.keyCode || 40 === e.which) {
        draw();
    }
};

setTimeout(function() {
    draw();
}, 1000);
