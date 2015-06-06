angular.module('myApp.chronos', [])
    .factory('Chronos.CourierSupervisor', function ($window) {
        var CourierSupervisor = (function() {

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
                                    start: {
                                        top: Math.floor(rec.top),
                                        left: Math.floor(rec.left)
                                    },
                                    center: {
                                        x: Math.floor(document.body.scrollWidth / 2),
                                        y: Math.floor(document.body.scrollHeight / 2)
                                    }
                                }
                            })
                        }
                    }
                };
                couriers[options.id] = $window.Chronos.PostMessageCourier({
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


        return CourierSupervisor;
    });
