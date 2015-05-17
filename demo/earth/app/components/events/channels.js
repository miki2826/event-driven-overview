angular.module('myApp.channels', [])
.factory('lpEventChannel', function ($window) {
    var channels = new $window.LPEventChannel();

    return channels;
});