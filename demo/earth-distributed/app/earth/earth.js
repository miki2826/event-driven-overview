'use strict';

angular.module('myApp.earth', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/earth', {
            templateUrl: 'earth/earth.html',
            controller: 'EarthCtrl'
        });
    }])

    .controller('EarthCtrl', ['$scope', 'chronosjsCourierSupervisor', function ($scope, chronosjsCourierSupervisor) {
        createHomers(chronosjsCourierSupervisor);

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

        var intervalId;
        function publishAngle() {
            clearTimeout(intervalId);

            var data = getAngle(sunImage);
            $scope.deg = data;
            $scope.$apply();
            chronosjsCourierSupervisor.applyAll("trigger", {
                appName: "EarthCtrl",
                eventName: "rotation",
                data: data
            });

            intervalId = setTimeout(publishAngle, 200);
        }

        intervalId = setTimeout(publishAngle, 200);
    }]);



function createHomers(chronosjsCourierSupervisor) {
    var widgetUrl = getCrossDomainWidgetUrl();
    chronosjsCourierSupervisor.createCourier({
        id: "homer1",
        url: widgetUrl + "homer_frame.html",
        top: "0px",
        left: "0px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "marge",
        url: widgetUrl  + "marge_frame.html",
        top: "50%",
        left: "0px",
        marginTop: "-50px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "bart",
        url: widgetUrl + "bart_frame.html",
        bottom: "0px",
        left: "0px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "maggie",
        url: widgetUrl + "maggie_frame.html",
        top: "0px",
        left: "50%",
        marginLeft: "-50px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "lisa",
        url: widgetUrl + "lisa_frame.html",
        bottom: "0px",
        left: "50%",
        marginLeft: "-50px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "willie",
        url: widgetUrl + "willie_frame.html",
        top: "0px",
        right: "0px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "barney",
        url: widgetUrl + "barney_frame.html",
        top: "50%",
        right: "0px",
        marginTop: "-50px"
    });

    chronosjsCourierSupervisor.createCourier({
        id: "grampa",
        url: widgetUrl + "grampa_frame.html",
        bottom: "0px",
        right: "0px"
    });
}

function getCrossDomainWidgetUrl() {
    var current = window.location.hostname.toLowerCase();
    var parts = window.location.pathname.split("/");
    var different;

    if (-1 !== current.indexOf("localhost")) {
        different = window.location.protocol + "//127.0.0.1";
    }
    else if (-1 !== current.toLowerCase().indexOf("127.0.0.1")) {
        different = window.location.protocol + "//localhost";
    }
    else if (-1 !== current.toLowerCase().indexOf("webyoda.github.io")) {
        if (-1 !== window.location.protocol.toLowerCase().indexOf("https:")) {
            different = "http://" + current;
        }
        else {
            different = "https://" + current;
        }
    }
    else {
        different = window.location.protocol + "//" + current;
    }

    return different + (0 < window.location.port.length ? ":" + window.location.port : "") + (-1 !== (parts[1] && parts[1].indexOf("app")) ? "/app" : "/" + parts[1] + "/demo/earth-distributed/app") + "/components/simpson/";
}
