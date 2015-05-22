'use strict';

angular.module('myApp.ui-homer', [])

    .directive('homerImage', ['lpEventChannel', function (lpEventChannel) {
        return {
            template: '<image ng-src="img/{{source}}.jpg" class="homer"></image>',
            restrict: "EAC",
            link: function (scope, elm, attrs) {
                var center = {
                    x: window.screen.width / 2,
                    y: window.screen.availHeight / 2
                };

                function inRange(limitA, limitB, num) {
                    return num <= Math.max(limitA,limitB) && num > Math.min(limitA,limitB);
                }

                function understandAngle(angle) {
                    var rect = elm[0].getBoundingClientRect();
                    var deltaY = center.y - rect.top;
                    var deltaX = center.x - rect.left;
                    var homerAngleComparedToCenter = Math.round(Math.atan2(deltaX, deltaY) * (180 / Math.PI));

                    if (homerAngleComparedToCenter < 0) {
                        homerAngleComparedToCenter = 360 + homerAngleComparedToCenter;
                    }

                    var isSecondQuadrant = (homerAngleComparedToCenter - 180 > 0);
                    var limit = isSecondQuadrant ? (homerAngleComparedToCenter - 180) : (360 - homerAngleComparedToCenter + 180)

                    if (inRange(limit, homerAngleComparedToCenter, angle)) {
                        if (scope.source !== "homer_awake" && isSecondQuadrant) {
                            scope.source = "homer_awake";
                        } else if (scope.source !== "homer_sleepy" && !isSecondQuadrant) {
                            scope.source = "homer_sleepy";
                        }
                    } else {
                        if (scope.source !== "homer_sleepy" && isSecondQuadrant) {
                            scope.source = "homer_sleepy";
                        } else if (scope.source !== "homer_awake" && !isSecondQuadrant) {
                            scope.source = "homer_awake";
                        }
                    }
                }

                lpEventChannel.bind({
                    appName: "EarthCtrl",
                    eventName: "rotation",
                    func: understandAngle,
                    async: true
                });

                scope.source = attrs.default;
            }
        };

    }]);
