angular.module('myApp.channels', [])
    .factory('chronosjsCourierSupervisor', function ($window) {
        var chronosjsCourierSupervisor = (function() {

            var couriers = {};

            function createCourier(options) {
                var target = {
                    url: options.url,
                    bust: false,
                    style: {
                        width: "100px",
                        height: "100px",
                        position: "fixed",
                        border: "0",
                        top: options.top,
                        left: options.left,
                        right: options.right,
                        bottom: options.bottom,
                        marginLeft: options.marginLeft,
                        marginTop: options.marginTop
                    },
                    callback: function (err, iframe) {
                        if (err) {
                            couriers[options.id] = null;
                            delete couriers[options.id];
                        } else {
                            var rec = iframe.getBoundingClientRect();
                            couriers[options.id].trigger({
                                appName: "CourierSupervisor",
                                eventName: "position",
                                data: {
                                    top: Math.floor(rec.top),
                                    left: Math.floor(rec.left)
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
