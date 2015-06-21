var courier = new window.Chronos.PostMessageCourier();
var startPosition;
var deltaY;
var deltaX;
var widgetAngleComparedToCenter;
var isSecondHalf;
var limit;

function initPosition(pos) {
    startPosition = pos.start;
    deltaY = pos.center.y - startPosition.top;
    deltaX = startPosition.left - pos.center.x;
    widgetAngleComparedToCenter = Math.round(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

    if (widgetAngleComparedToCenter < 0) {
        widgetAngleComparedToCenter = 360 + widgetAngleComparedToCenter;
    }

    isSecondHalf = (widgetAngleComparedToCenter - 180 > 0);
    limit = isSecondHalf ? (widgetAngleComparedToCenter - 180) : (widgetAngleComparedToCenter + 180);
}

function understandAngle(angle) {
    if (startPosition) {
        var elm = document.querySelector(".simpson");

        if (inRange(limit, widgetAngleComparedToCenter, angle)) {
            if (elm.src !== "../../img/" + window.awakeImageName && isSecondHalf) {
                elm.src = "../../img/" + window.awakeImageName;
            } else if (elm.src !== "../../img/" + window.sleepImageName && !isSecondHalf) {
                elm.src = "../../img/" + window.sleepImageName;
            }
        } else {
            if (elm.src !== "../../img/" + window.sleepImageName && isSecondHalf) {
                elm.src = "../../img/" + window.sleepImageName;
            } else if (elm.src !== "../../img/" + window.awakeImageName && !isSecondHalf) {
                elm.src = "../../img/" + window.awakeImageName;
            }
        }
    }
}

function inRange(limitA, limitB, num) {
    return num <= Math.max(limitA,limitB) && num > Math.min(limitA,limitB);
}

courier.bind({
    appName: "configure",
    eventName: "position",
    func: initPosition,
    async: true
});

courier.bind({
    appName: "earth",
    eventName: "rotation",
    func: understandAngle,
    async: true
});
