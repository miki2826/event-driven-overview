// Full list of configuration options available here:
// https://github.com/hakimel/reveal.js#configuration
var queryHash = Reveal.getQueryHash();
Reveal.initialize({
    // Display controls in the bottom right corner
    controls: true,

    // Display a presentation progress bar
    progress: true,

    // Display the page number of the current slide
    slideNumber: "c / t",

    // Push each slide change to the browser history
    history: true,

    // Enable keyboard shortcuts for navigation
    keyboard: true,

    // Enable the slide overview mode
    overview: true,

    // Vertical centering of slides
    center: true,

    // Enables touch navigation on devices with touch input
    touch: true,

    // Loop the presentation
    loop: false,

    // Change the presentation direction to be RTL
    rtl: false,

    // Turns fragments on and off globally
    fragments: true,

    // Flags if the presentation is running in an embedded mode,
    // i.e. contained within a limited portion of the screen
    embedded: false,

    // Number of milliseconds between automatically proceeding to the
    // next slide, disabled when set to 0, this value can be overwritten
    // by using a data-autoslide attribute on your slides
    autoSlide: 0,

    // Stop auto-sliding after user input
    autoSlideStoppable: true,

    // Enable slide navigation via mouse wheel
    mouseWheel: false,

    // Hides the address bar on mobile devices
    hideAddressBar: true,

    // Opens links in an iframe preview overlay
    previewLinks: false,

    theme: queryHash.theme || "moon", //"sky", //"solarized", //"beige", // available themes are in /css/theme

    // Transition style
    transition: queryHash.transition || "linear", // default/cube/page/concave/zoom/linear/fade/none

    // Transition speed
    transitionSpeed: "default", // default/fast/slow

    // Transition style for full page slide backgrounds
    backgroundTransition: "slide", // default/none/slide/concave/convex/zoom

    // Number of slides away from the current that are visible
    viewDistance: 50,
    dataBackground: "#2ba056",

    // Parallax scrolling
    //parallaxBackgroundImage: "https://s3.amazonaws.com/hakim-static/reveal-js/reveal-parallax-1.jpg",
    //parallaxBackgroundSize: "2100px 900px",
    //parallaxBackgroundImage: "http://lh4.ggpht.com/-uKJwuofWfq8/UVrQZNEB7-I/AAAAAAAAAvA/PSHn17VmD1g/image_thumb%25255B1%25255D.png?imgmax=800",
    //parallaxBackgroundSize: "1600px 900px",

//	multiplex: {
//		// Example values. To generate your own, see the socket.io server instructions.
//		secret: "13981818338918672164", // Obtained from the socket.io server. Gives this (the master) control of the presentation
//		id: "d95282adc96a09f1", // Obtained from socket.io server
//		url: "ln.itkoren.com:1948" // Location of socket.io server
//	},

    // Optional libraries used to extend on reveal.js
    dependencies: [
        // and if you want speaker notes
        {
            src: "//gh.itkoren.com/revealular/reveal.js/lib/js/classList.js", condition: function () {
            return !document.body.classList;
        }
        },

        {
            src: "//gh.itkoren.com/revealular/reveal.js/plugin/highlight/highlight.js",
            async: true,
            callback: function () {
                hljs.initHighlightingOnLoad();
            }
        },
        {
            src: "//gh.itkoren.com/revealular/reveal.js/plugin/zoom-js/zoom.js", async: true, condition: function () {
            return !!document.body.classList;
        }
        },
        // { src: "//gh.itkoren.com/revealular/reveal.js/plugin/search/search.js", async: true, condition: function() { return !!document.body.classList; } },
        {
            src: "./plugin/notes/notes.js", async: true, condition: function () {
            return !!document.body.classList;
        }
        },

        // Browser Console Speaker Notes
        {
            src: "//gh.itkoren.com/revealular/js/console-notes.js", async: true, condition: function () {
            return !!document.body.classList;
        }
        }
    ]
});

setTimeout(function () {
    var style = document.getElementById("dynamic-style");
    style.textContent = "\
\
.reveal pre {\
    margin: 1px;\
    padding: 1px 20px;\
}";
}, 1000);

var codes = document.getElementsByClassName("code");
for (var i = 0; i < codes.length; i++) {
    codes[i].innerText = document.getElementById(codes[i].id.replace("_snippet", "")).innerHTML;
}

revealjscodemirror.codemirrorify({
    lineNumbers: false,
    styleActiveLine: true,
    matchBrackets: true,
    scrollbarStyle: "null",
    theme: "xq-dark"
});

//
var dateThrottler = (new Date()).getTime();
window.addEventListener("keyup", function () {
    if (4000 < (((new Date()).getTime() - dateThrottler))) {
        var videos = document.getElementsByClassName("video");
        setTimeout(function () {
            for (var i = 0; i < videos.length; i++) {
                videos[i].pause();
                videos[i].currentTime = "0";
                videos[i].play();
            }
            dateThrottler = (new Date()).getTime();
        }, 500);
    }
}, false);
/*
.body {\
 data-background:#2ba056\
}\*/
