angular.module('myApp.channels', [])
.factory('chronosjsChannel', function ($window) {
    var chronosjsChannel = new $window.LPEventChannel();

    return chronosjsChannel;
});
