angular.module('myApp.channels', [])
    .factory('chronosjsCourierSupervisor', function ($window, $log) {
        var chronosjsCourierSupervisor = (function() {

            var couriers = {};

            function createCourier(options) {
                var target = {
                    url: options.url,
                    bust: false,
                    style: {
                        width: "130px",
                        height: "130px",
                        position: "fixed",
                        border: "0",
                        top: options.top,
                        left: options.left,
                        right: options.right,
                        bottom: options.bottom
                    },
                    callback: function (err) {
                        $log.log("initialized iframe url=" + options.url + "with err=" + JSON.stringify(err));
                        if (err) {
                            couriers[options.id] = null;
                            delete couriers[options.id];
                        } else {
                            couriers[options.id].trigger({
                                appName: "CourierSupervisor",
                                eventName: "position",
                                data: {
                                    top: parseInt(options.top, 10),
                                    left: parseInt(options.left, 10) > 0 ? parseInt(options.left, 10) : 0
                                }
                            })
                        }
                    }
                };
                couriers[options.id] = $window.LPPostMessageCourier({
                    target: target
                });
            }

            function getCourier(id) {
                return couriers[id];
            }

            function applyAll(fnName, options) {
                for (var courier in couriers) {
                    if (courier && couriers.hasOwnProperty(courier)) {
                        couriers[courier][fnName](options);
                    }
                }
            }

            return {
                createCourier: createCourier,
                getCourier: getCourier,
                applyAll: applyAll
            };

        })();


        return chronosjsCourierSupervisor;
    });
