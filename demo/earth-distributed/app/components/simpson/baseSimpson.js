var courier = new window.LPPostMessageCourier();
var startPosition;
var center = {
    x: window.screen.width / 2,
    y: window.screen.availHeight / 2
};

function initPosition(pos) {
    startPosition = pos;
}

function understandAngle(angle) {
    if (startPosition) {
        var elm = document.querySelector(".simpson");
        var deltaY = center.y - startPosition.top;
        var deltaX = startPosition.left - center.x;
        var homerAngleComparedToCenter = Math.round(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

        if (homerAngleComparedToCenter < 0) {
            homerAngleComparedToCenter = 360 + homerAngleComparedToCenter;
        }

        var isSecondHalf = (homerAngleComparedToCenter - 180 > 0);
        var limit = isSecondHalf ? (homerAngleComparedToCenter - 180) : (homerAngleComparedToCenter + 180);

        if (inRange(limit, homerAngleComparedToCenter, angle)) {
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
    appName: "EarthCtrl",
    eventName: "rotation",
    func: understandAngle,
    async: true
});

courier.bind({
    appName: "CourierSupervisor",
    eventName: "position",
    func: initPosition,
    async: true
});
