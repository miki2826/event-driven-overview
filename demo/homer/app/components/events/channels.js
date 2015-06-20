angular.module('myApp.chronos', [])
.factory('Chronos.Channels', function ($window) {
    var channels = new $window.Chronos.Channels();

    return channels;
});
