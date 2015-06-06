angular.module('myApp.channels', [])
.factory('chronosjsChannel', function ($window) {
    var chronosjsChannel = new $window.Chronos.Channels();

    return chronosjsChannel;
});
