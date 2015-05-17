'use strict';

angular.module('myApp.ui-homer', [])

    .directive('homerImage', ['lpEventChannel', function (lpEventChannel) {
        return {
            template: '<image ng-src="img/{{source}}.jpg" class="homer"></image>',
            restrict: "EAC",
            link: function (scope, elm, attrs) {
                var center = {
                    x: window.screen.width / 2,
                    y: window.screen.height / 2
                };

                function understandAngle(angle) {
                    var rect = elm[0].getBoundingClientRect();
                    var deltaY = center.y - rect.top;
                    var deltaX = center.x - rect.left;
                    var startAngle = Math.round(Math.atan2(deltaY, deltaX) * (180/Math.PI));
                    console.log(startAngle);
                    if (startAngle < 0) {
                        startAngle = 360 + startAngle;
                    }
                    startAngle += 50;

                    if (angle > startAngle && angle < startAngle + 180) {
                        if (scope.source !== "homer_awake") {
                            scope.source = "homer_awake";
                        }
                    } else {
                        if (scope.source !== "homer_sleepy") {
                            scope.source = "homer_sleepy";
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