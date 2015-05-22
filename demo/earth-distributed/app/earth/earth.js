'use strict';

angular.module('myApp.earth', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/earth', {
            templateUrl: 'earth/earth.html',
            controller: 'EarthCtrl'
        });
    }])

    .controller('EarthCtrl', ['$scope', 'CourierManager', function ($scope, CourierManager) {
        createHomers(CourierManager);

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
            var c = values[2];
            var d = values[3];

            var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));

            if (angle < 0) {
                angle = 360 + angle;
            }

            return angle;
        }

        var sunImage = document.querySelector('.sun');
        $scope.deg = getAngle(sunImage);

        setInterval(function () {
            var data = getAngle(sunImage);
            $scope.deg = data;
            $scope.$apply();
            CourierManager.applyAll("trigger", {
                appName: "EarthCtrl",
                eventName: "rotation",
                data: data
            });
        }, 100);

    }]);


function createHomers(CourierManager) {
    CourierManager.createCourier({
        id: "homer1",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "0px",
        left: "0px"
    });

    CourierManager.createCourier({
        id: "homer2",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "350px",
        left: "0px"
    });

    CourierManager.createCourier({
        id: "homer3",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "700px",
        left: "0px"
    });

    CourierManager.createCourier({
        id: "homer4",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "0px",
        left: "720px"
    });

    CourierManager.createCourier({
        id: "homer5",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "700px",
        left: "720px"
    });

    CourierManager.createCourier({
        id: "homer6",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "0px",
        left: "1290px"
    });

    CourierManager.createCourier({
        id: "homer7",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "350px",
        left: "1290px"
    });

    CourierManager.createCourier({
        id: "homer8",
        url: "http://127.0.0.1:8000/app/components/homer/homer_frame.html",
        top: "700px",
        left: "1290px"
    });
}
