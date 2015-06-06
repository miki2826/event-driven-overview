'use strict';

angular.module('myApp.ui-homer', [])

    .directive('homerImage', ['Chronos.Channels', function (chronosChannels) {
        return {
            template: '<image ng-src="img/{{source}}.jpg" class="homer"></image>',
            restrict: "EAC",
            link: function (scope, elm, attrs) {
                var center = {
                    x: document.body.scrollWidth / 2,
                    y: document.body.scrollHeight / 2
                };
                var rect = elm[0].getBoundingClientRect();
                var deltaY = center.y - rect.top;
                var deltaX = rect.left - center.x;
                var homerAngleComparedToCenter = Math.round(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

                if (homerAngleComparedToCenter < 0) {
                    homerAngleComparedToCenter = 360 + homerAngleComparedToCenter;
                }

                var isSecondHalf = (homerAngleComparedToCenter - 180 > 0);
                var limit = isSecondHalf ? (homerAngleComparedToCenter - 180) : (360 - homerAngleComparedToCenter + 180);

                function inRange(limitA, limitB, num) {
                    return num <= Math.max(limitA,limitB) && num > Math.min(limitA,limitB);
                }

                function understandAngle(angle) {
                    if (inRange(limit, homerAngleComparedToCenter, angle)) {
                        if (scope.source !== "homer_awake" && isSecondHalf) {
                            scope.source = "homer_awake";
                        } else if (scope.source !== "homer_sleepy" && !isSecondHalf) {
                            scope.source = "homer_sleepy";
                        }
                    } else {
                        if (scope.source !== "homer_sleepy" && isSecondHalf) {
                            scope.source = "homer_sleepy";
                        } else if (scope.source !== "homer_awake" && !isSecondHalf) {
                            scope.source = "homer_awake";
                        }
                    }
                }

                chronosChannels.bind({
                    appName: "EarthCtrl",
                    eventName: "rotation",
                    func: understandAngle,
                    async: true
                });

                scope.source = attrs.default;
            }
        };

    }]);
