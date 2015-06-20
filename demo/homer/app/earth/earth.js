'use strict';

angular.module('myApp.earth', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/earth', {
            templateUrl: 'earth/earth.html',
            controller: 'EarthCtrl'
        });
    }])

    .controller('EarthCtrl', ['$scope', 'Chronos.Channels', function ($scope, chronosjsChannel) {

        function getAngle(el) {
            var st = window.getComputedStyle(el, null);
            var tr = st.getPropertyValue("-webkit-transform") ||
                st.getPropertyValue("-moz-transform") ||
                st.getPropertyValue("-ms-transform") ||
                st.getPropertyValue("-o-transform") ||
                st.getPropertyValue("transform");


            var values = tr.split('(')[1].split(')')[0].split(',');
            var a = values[0];
            var b = values[1];
            var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));

            if (angle < 0) {
                angle = 360 + angle;
            }

            return angle;
        }

        var sunImage = document.querySelector('.sun');
        $scope.deg = getAngle(sunImage);

        var intervalId;
        function publishAngle() {
            clearTimeout(intervalId);

            var data = getAngle(sunImage);
            $scope.deg = data;
            $scope.$apply();
            chronosjsChannel.trigger({
                appName: "EarthCtrl",
                eventName: "rotation",
                data: data
            });

            intervalId = setTimeout(publishAngle, 200);
        }

        intervalId = setTimeout(publishAngle, 100);

    }]);
