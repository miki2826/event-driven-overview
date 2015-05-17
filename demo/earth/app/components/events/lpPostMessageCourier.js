;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpEventsUtil", ["exports"], function (exports) {
            if (!namespace.lpEventsUtil) {
                factory(root, namespace);
            }

            return namespace.lpEventsUtil;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.lpEventsUtil) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    else {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    function getListeners(lstnrs, eventName, appName) {
        var callBacks = [];
        if (lstnrs[eventName] && lstnrs[eventName].length) {
            for (var i = 0; i < lstnrs[eventName].length; i++) {
                if ((!appName || "*" === lstnrs[eventName][i].appName) ||//generic event // &&
                    lstnrs[eventName][i].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs[eventName][i]);
                }
            }
        }
        if (lstnrs["*"]) {
            for (var k = 0; k < lstnrs["*"].length; k++) {
                if ((!appName || "*" === lstnrs["*"][k].appName) ||//generic event // &&
                    lstnrs["*"][k].appName === appName) {//Specific events for a named instance
                    callBacks.push(lstnrs["*"][k]);
                }
            }
        }
        return callBacks;
    }

    function log(msg, level, app) {
        if (root.lpTag && "function" === typeof root.lpTag.log) {
            root.lpTag.log(msg, level, app);
        }
    }

    /**
     * var eventObj = {
     *   unbindObj: unbindObj,
     *   attrName: "eventName",
     *   loggerName: "Events",
     *   lstnrs: {}
     * };
     */
    function unbind(eventObj) {
        var cmdName = eventObj.unbindObj[eventObj.attrName];
        var unBound = false;
        var updatedListeners;

        if (!eventObj.unbindObj) {
            log("CMD listen id not spec for unbind", "ERROR", eventObj.loggerName);
            return null;
        }

        if (typeof eventObj.unbindObj === "string") {//Data is of type commandId
            return _unregister(eventObj.lstnrs, eventObj.unbindObj);
        }
        else if (!eventObj.unbindObj.func && !eventObj.unbindObj.context && !eventObj.unbindObj.appName) {//No data passed in to help us find unbind
            return false;
        }

        var listeners = eventObj.lstnrs;
        if (cmdName) {
            listeners = {};
            listeners[cmdName] = eventObj.lstnrs[cmdName];
        }
        for (var key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                if (listeners[key] && listeners[key].length) {
                    updatedListeners = _unbind(listeners[key], eventObj.unbindObj.func, eventObj.unbindObj.context, eventObj.unbindObj.appName);
                    if (updatedListeners.length !== listeners[key].length) {
                        eventObj.lstnrs[key] = updatedListeners;
                        unBound = true;
                    }
                }
            }
        }
        return unBound;
    }

    /**
     * Clones objects and properties (everything except functions)
     * @param cloneObj - the object we want to clone
     * @return {Object}
     */
    function cloneEventData(cloneObj) {
        var resultObj = {};
        if (cloneObj.constructor === Object) {//If this is an object
            for (var key in cloneObj) {
                //noinspection JSUnfilteredForInLoop
                if (cloneObj.hasOwnProperty(key) && cloneObj[key] !== null && cloneObj[key] !== undefined) {//Make sure we have some data that's object specific
                    //noinspection JSUnfilteredForInLoop
                    if (typeof cloneObj[key] === "object" && cloneObj[key].constructor !== Array) {
                        //noinspection JSUnfilteredForInLoop
                        resultObj[key] = cloneEventData(cloneObj[key]);
                    }
                    else { //noinspection JSUnfilteredForInLoop
                        if (cloneObj[key].constructor === Array) {
                            //noinspection JSUnfilteredForInLoop
                            resultObj[key] = cloneObj[key].slice(0) || [];
                        }
                        else { //noinspection JSUnfilteredForInLoop
                            if (typeof cloneObj[key] !== "function") {
                                //noinspection JSUnfilteredForInLoop
                                resultObj[key] = cloneObj[key] !== null && cloneObj[key] !== undefined ? cloneObj[key] : "";
                            }
                        }
                    }
                }
            }
        } else {//Return copy of Array or primitive type in case of no Object
            if (cloneObj.constructor === Array) {
                resultObj = cloneObj.slice(0) || [];
            }
            else if (typeof cloneObj !== "function") {
                resultObj = cloneObj;
            }
        }
        return resultObj;
    }

    function hasFired(fired, app, evName) {
        if ((typeof (evName) === "undefined" || evName === "*") && app === "*") {
            return fired;
        }
        var firedEvents = [];
        for (var n = 0; n < fired.length; n++) {
            if (fired[n].eventName === evName || evName === "*") {
                if ((app && app === fired[n].appName) ||//For events specific to a caller
                    (!fired[n].appName || fired[n].appName === "*") || app === "*") { //For all events that don't have a specific appName
                    firedEvents.push(fired[n]);
                }
            }
        }
        return firedEvents;
    }

    /**
     * Stores events so we can later ask for them, can be set to a limited store by defaults on instantiation
     * @param data = {
     *  triggerData: triggerData,
     *  eventBufferLimit: eventBufferLimit,
     *  attrName: attrName,
     *  fired: fired,
     *  index: index
     * }
     */
    function storeEventData(data) {
        //noinspection JSUnresolvedVariable
        if (data.eventBufferLimit === 0 || (data.triggerData.data && !!data.triggerData.data.doNotStore)) {//No events should be stored or this event should not be stored
            data = null;
            return;
        }
        var firedEventData = {eventName: data.triggerData[data.attrName], appName: data.triggerData.appName};
        firedEventData.data = data.triggerData.passDataByRef ? data.triggerData.data : cloneEventData(data.triggerData.data);
        if (data.eventBufferLimit > 0) {//Limiting Array size to what was decided on creation
            if (data.index >= data.eventBufferLimit) {
                data.index = 0;
            }
            data.fired[data.index] = firedEventData;
            data.index++;
        }
        else {//All events should be stored
            data.fired.push(firedEventData);
        }
        data = null;
    }

    function _unregister(lstnrs, eventId) {
        var unBound = false;
        if (!eventId) {
            log("Ev listen id not spec for unregister", "ERROR", "Events");
            return null;
        }
        for (var eventName in lstnrs) {
            if (lstnrs.hasOwnProperty(eventName)) {
                for (var i = 0; i < lstnrs[eventName].length; i++) {
                    if (lstnrs[eventName][i].id == eventId) {
                        lstnrs[eventName].splice(i, 1);
                        log("Ev listen=" + eventId + " and name=" + eventName + " unregister", "DEBUG", "Events");
                        unBound = true;
                        break;
                    }
                }
            }
        }
        if (!unBound) {
            log("Ev listen not found " + eventId + " unregister", "DEBUG", "Events");
        }
        return unBound;
    }

    /**
     * The actual unbinding of the callbacks from the events mechanism
     * @param listeners - the array of listeners that match this query
     * @param func - the function we want to unbind
     * @param context - the context we want to unbind
     * @param appName - the specific appName we want to unbind (UID)
     * @return {Array} - the new array of listeners we want to use
     */
    function _unbind(listeners, func, context, appName) {
        var newListeners = [];
        if (listeners && listeners.length) {
            for (var i = 0; i < listeners.length; i++) {
                try {
                    var sameFunc = (!context && listeners[i].func === func);//If this fits the function and no context was passed
                    var sameContext = (!func && context && listeners[i].context === context);//If this fits the context and no function was passed
                    var sameFuncAndContext = (func && context && listeners[i].func === func && listeners[i].context === context);//if this fits the function and context
                    var hasSameAppName = (appName && appName === listeners[i].appName);//If we're unbinding a specific appName
                    var hasGlobalAppName = (listeners[i].appName === "*");//If we're unbinding a general appName
                    if ((sameFunc || sameContext || sameFuncAndContext)) {
                        if (hasSameAppName || hasGlobalAppName) {
                            continue;//This is a callback to remove
                        }
                        if (sameContext) {
                            continue;
                        }
                    }
                    else if (!func && !context && hasSameAppName) {//This should only happen if nothing but an appName was passed in
                        continue;//This is a callback to remove
                    }
                    newListeners.push(listeners[i]);//This is callbacks we keep
                } catch (err) {
                    log("Error in unbind e=" + err.message, "ERROR", "Events");
                }
            }
        }
        return newListeners;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.lpEventsUtil = exports.lpEventsUtil || {
        getListeners: getListeners,
        log: log,
        unbind: unbind,
        hasFired: hasFired,
        cloneEventData: cloneEventData,
        storeEventData: storeEventData
    };
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpEvents", ["exports", "lpEventsUtil"], function (exports, evUtil) {
            if (!namespace.LPEvents) {
                factory(root, namespace, namespace.lpEventsUtil);
            }

            return namespace.LPEvents;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPEvents) {
            factory(root, namespace, namespace.lpEventsUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"));
    }
    else {
        /**
         * @depend ./util/lpEventsUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil);
    }
}(this, function (root, exports, evUtil) {
    "use strict";

    function LPEvents(defaults) {
        var appName = "Events",
            attrName = "eventName",
            eventId = 0,
            lstnrs = {},
            fired = [],
            prefix = "evId_",
            indexer = 0,
            cloneData,
            eventBufferLimit;

        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This registers to an event only once, if it has fired the bind will be removed
         * @param data
         * @return {*}
         */
        function once(data) {
            if (data) {
                data.triggerOnce = true;
                return bind(data);
            } else {
                return null;
            }
        }

        /**
         * This function allows registering for events with the following structure:
         * @param app = {
         *   eventName: string that is the name of the event that will be triggered like 'click'
         *   aSync: boolean flag if this call back is called synchronously when the event fires, or after we queue all the listeners
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   triggerOnce: this is for listening only to the first trigger of this event
         *   } || app = app name
         *
         * @param ev = event name
         * @param fn = callback function
         * @return {*}
         */
        function bind(app, ev, fn) {
            var evData = app;

            if ("string" === typeof app) {
                evData = {
                    appName: app,
                    eventName: ev,
                    func: fn
                };
            }

            if (!evData.eventName || !evData.func || ("function" !== typeof evData.func && evData.func.constructor !== Array)) {
                evUtil.log("Ev listen has invalid params: evName=[" + evData.eventName + "]", "ERROR", "Events");
                return null;
            }
            if (evData.func.constructor === Array) {
                var evIds = [], cloneEvent, cloneId;
                for (var i = 0; i < evData.func.length; i++) {
                    cloneEvent = evUtil.cloneEventData(evData);
                    cloneEvent.func = evData.func[i];
                    cloneId = bind(cloneEvent);
                    evIds.push(cloneId);
                }
                return evIds;
            }
            var evId = prefix + (eventId++);
            var newObj = {
                id: evId,
                func: evData.func,
                context: evData.context || null,
                aSync: evData.aSync ? true : false,
                appName: evData.appName || "*",
                triggerOnce: evData.triggerOnce || false
            };
            lstnrs[evData.eventName] = lstnrs[evData.eventName] || [];
            lstnrs[evData.eventName].push(newObj);
            evUtil.log("Ev listen rgstr: evName=[" + evData.eventName + "] aSync=" + newObj.aSync + " appName=" + newObj.name, "DEBUG", "Events");
            evData = null;
            app = null;
            return evId;
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * eventName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - eventId
         * @return {Boolean}
         */
        function unbind(unbindObj) {
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: lstnrs
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app = {
         *  eventName: the name of the event you want to know about, if this is not passed it returns all the fired events data
         *  appName: the name of the app that fired the event
         * } || app name
         * @param evName = event name
         * @return {Array}
         */
        function hasFired(app, evName) {
            return evUtil.hasFired(fired, app, evName);
        }

        /**
         * This publishes/triggers an event
         * @param app = {
         *  eventName - the name of the event triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  } || app name
         *  @param evName = event name
         *  @param data = event data
         * @return {*}
         */
        function trigger(app, evName, data) {
            var triggerData = app;
            if ("string" === typeof app) {
                triggerData = {
                    eventName: evName,
                    appName: app,
                    data: data
                };
            }
            if (!triggerData || typeof (triggerData.eventName) === "undefined") {
                evUtil.log("Ev name not spec for publish", "ERROR", "Events");
                triggerData = null;
                return null;
            }
            triggerData.passDataByRef = triggerData.passDataByRef || !cloneData;
            _storeEventData(triggerData);

            var callBacks = evUtil.getListeners(lstnrs, triggerData.eventName, triggerData.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var eventData = triggerData.passDataByRef ? triggerData.data : evUtil.cloneEventData(triggerData.data);//Clone the event data if there was not an explicit request to passByRef
                    var eventInformation = {appName: triggerData.appName, eventName: triggerData.eventName};
                    var callBack = callBacks[j];
                    if (callBack.aSync || (eventData && eventData.aSync)) {
                        setTimeout(_createCallBack(callBack, eventData, eventInformation), 0);
                    } else {
                        _createCallBack(callBack, eventData, eventInformation)();
                    }
                }
            }
            triggerData = null;
            return (callBacks.length > 0);
        }

        //------------------- Private methods ------------------------------//

        function _createCallBack(callBack, callBackEventData, triggerInformation) {
            return function () {
                try {
                    callBack.func.call(callBack.context, callBackEventData, triggerInformation);
                    callBackEventData = null;//Delete local pointer
                    if (callBack.triggerOnce) {
                        unbind(callBack);
                    }
                    callBack = null;
                } catch (err) {
                    //noinspection JSUnresolvedVariable
                    evUtil.log("Error executing " + triggerInformation.eventName + " eventId: " + callBack.id + "e=" + err.message, "ERROR", "Events");
                }
            };
        }

        /**
         * Stores events so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }


        this.once = once;
        this.hasFired = hasFired;
        this.trigger = trigger;
        this.publish = trigger;
        this.bind = bind;
        this.register = bind;
        this.unbind = unbind;
        this.unregister = unbind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPEvents = exports.LPEvents || LPEvents;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpCommandUtil", ["exports", "lpEventsUtil"], function (exports, evUtil) {
            if (!namespace.lpCommandUtil) {
                factory(root, namespace, namespace.lpEventsUtil);
            }

            return namespace.lpCommandUtil;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.lpCommandUtil) {
            factory(root, namespace, namespace.lpEventsUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"));
    }
    else {
        /**
         * @depend ./lpEventsUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil);
    }
}(this, function (root, exports, evUtil) {
    "use strict";

    /**
     * var cmdObj = {
     *   cmd: cmd,
     *   attrName: "cmdName",
     *   loggerName: "Commands",
     *   prefix: "_somePrefix",
     *   id: commandId,
     *   lstnrs: {}
     * };
     */
    function bind(cmdObj) {
        var cmdName = cmdObj.cmd[cmdObj.attrName];

        if (!cmdName || !cmdObj.cmd.func || "function" !== typeof cmdObj.cmd.func || !valid(cmdObj.cmd, cmdName)) {
            evUtil.log("comply: has invalid params: command=[" + cmdName + "]", "ERROR", cmdObj.loggerName);
            return null;
        }
        if (cmdObj.lstnrs[cmdName] && cmdObj.lstnrs[cmdName].length) {
            evUtil.log("comply: cannot comply because command already exist command=" + cmdName, "ERROR", cmdObj.loggerName);
            return null;
        }
        var cmdId = cmdObj.prefix + (cmdObj.id++);
        var newObj = {
            id: cmdId,
            func: cmdObj.cmd.func,
            context: cmdObj.cmd.context || null,
            appName: cmdObj.cmd.appName
        };

        cmdObj.lstnrs[cmdName] = cmdObj.lstnrs[cmdName] || [];
        cmdObj.lstnrs[cmdName].push(newObj);
        evUtil.log("Cmd comply: evName=[" + cmdName + "] appName=" + newObj.appName, "DEBUG", cmdObj.loggerName);
        return cmdId;
    }

    function valid(cmd, name) {
        return !((name && name === "*") || (cmd.appName && cmd.appName === "*"));
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.lpCommandUtil = exports.lpCommandUtil || {
        bind: bind,
        valid: valid
    };
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpCommands", ["exports", "lpEventsUtil", "lpCommandUtil"], function (exports, evUtil, cmdUtil) {
            if (!namespace.lpCommands) {
                factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
            }

            return namespace.LPCommands;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.lpCommands) {
            factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"), require("util/lpCommandUtil"));
    }
    else {
        /**
         * @depend ./util/lpEventsUtil.js
         * @depend ./util/lpCommandUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
    }
}(this, function (root, exports, evUtil, cmdUtil) {
    "use strict";

    function LPCommands(defaults) {
        var appName = "Commands",
            attrName = "cmdName",
            commandId = 0,
            commands = {},
            fired = [],
            prefix = "cmdId_",
            indexer = 0,
            cloneData,
            eventBufferLimit;

        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param cmd = {
         *   cmdName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function comply(cmd) {
            return cmdUtil.bind({
                cmd: cmd,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: commandId,
                lstnrs: commands
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * cmdName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - commandId
         * @return {Boolean} - has stopped complying.
         */
        function stopComplying(unbindObj) {
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: commands
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param cmdName = command name
         * @return {Array}
         */
        function hasFired(app, cmdName) {
            return evUtil.hasFired(fired, app, cmdName);
        }

        /**
         * This triggers a command
         * @param cmd = {
         *  cmdName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *
         * @param cb - optional callback to notify when finished
         * @return {*}
         */
        function command(cmd, cb) {
            if (!cmd || typeof (cmd.cmdName) === "undefined" || !cmdUtil.valid(cmd, cmd.cmdName)) {
                evUtil.log("CMD name not spec for command", "ERROR", "Commands");
                return null;
            }
            cmd.passDataByRef = cmd.passDataByRef || !cloneData;
            _storeEventData(cmd);
            if (!commands[cmd.cmdName]) {
                return false;
            }
            var callBacks = evUtil.getListeners(commands, cmd.cmdName, cmd.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var cmdData = cmd.passDataByRef ? cmd.data : evUtil.cloneEventData(cmd.data);//Clone the event data if there was not an explicit request to passByRef
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            callBack.func.call(callBack.context, cmdData, cb);
                        } else {
                            callBack.func.call(callBack.context, cmdData);
                        }
                        cmdData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " +cmd.cmdName + " commandId: " + callBack.id + "e=" + e.message, "ERROR", "Commands");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + cmd.cmdName + " commandId: " + callBack.id + "e=" + err.message, "ERROR", "Commands");
                    }
                }
            }
            return (callBacks.length > 0);
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores commands so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }

        this.hasFired = hasFired;
        this.comply = comply;
        this.stopComplying = stopComplying;
        this.command = command;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPCommands = exports.LPCommands || LPCommands;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpReqres", ["exports", "lpEventsUtil", "lpCommandUtil"], function (exports, evUtil, cmdUtil) {
            if (!namespace.LPReqRes) {
                factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
            }

            return namespace.LPReqRes;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPReqRes) {
            factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("util/lpEventsUtil"), require("util/lpCommandUtil"));
    }
    else {
        /**
         * @depend ./util/lpEventsUtil.js
         * @depend ./util/lpCommandUtil.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.lpEventsUtil, namespace.lpCommandUtil);
    }
}(this, function (root, exports, evUtil, cmdUtil) {
    function LPReqRes(defaults) {
        var appName = "ReqRes",
            attrName = "reqName",
            requestId = 0,
            requests = {},
            fired = [],
            prefix = "reqId_",
            indexer = 0,
            cloneData,
            eventBufferLimit;

        cloneData = (defaults && typeof defaults.cloneEventData === "boolean" ? defaults.cloneEventData : false);
        eventBufferLimit = (defaults && !isNaN(defaults.eventBufferLimit) ? defaults.eventBufferLimit : -1);

        /**
         * This function allows registering for command with the following structure:
         * @param req = {
         *   reqName: string that is the name of the event that will be triggered like 'get'
         *   appName: string that specifies an added identifier for multiple instances of the same event name (click by button1, click by button 2)
         *   func: function - the callback function which the event data will be passed to
         *   context: the context which the event data will be run with
         *   }
         *
         * @return {String} - command Id.
         */
        function reply(req) {
            return cmdUtil.bind({
                cmd: req,
                attrName: attrName,
                loggerName: appName,
                prefix: prefix,
                id: requestId,
                lstnrs: requests
            });
        }

        /**
         * This function allows unbinding according to a permutation of the three parameters
         * @param unbindObj
         * reqName - the eventName you want to unbind
         * func - the pointer to the function you want to unbind
         * context - the context you want to unbind
         * appName - the specific appName we want to unbind
         * OR - requestId
         * @return {Boolean} - has stopped complying.
         */
        function stopReplying(unbindObj) {
            return evUtil.unbind({
                unbindObj: unbindObj,
                attrName: attrName,
                loggerName: appName,
                lstnrs: requests
            });
        }

        /**
         * firedEventData can pass two request parameters
         * @param app name
         * @param reqName = command name
         * @return {Array}
         */
        function hasFired(app, reqName) {
            return evUtil.hasFired(fired, app, reqName);
        }

        /**
         * This triggers a command
         * @param req = {
         *  reqName - the name of the command triggered
         *  appName - optional specifies the identifier it is bound to
         *  passDataByRef: boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         *  data - optional event parameters to be passed to the listeners
         *  }
         *  @param cb - optional callback to notify when finished
         * @return {*}
         */
        function request(req, cb) {
            var ret;
            if (!req || typeof (req.reqName) === "undefined" || !cmdUtil.valid(req, req.reqName)) {
                evUtil.log("request: name not spec for command", "ERROR", "ReqRes");
                throw new Error("Invalid request object");
            }
            req.passDataByRef = req.passDataByRef || !cloneData;
            _storeEventData(req);
            if (!requests[req.reqName]) {
                return ret; //return undefined
            }
            var callBacks = evUtil.getListeners(requests, req.reqName, req.appName);

            if (callBacks.length > 0) {
                for (var j = 0; j < callBacks.length; j++) {
                    var reqData = req.passDataByRef ? req.data : evUtil.cloneEventData(req.data);//Clone the event data if there was not an explicit request to passByRef
                    var requestInformation = {appName: req.appName, reqName: req.reqName};
                    var callBack = callBacks[j];

                    try {
                        if ("function" === typeof cb) {
                            ret = callBack.func.call(callBack.context, reqData, cb);
                        } else {
                            ret = callBack.func.call(callBack.context, reqData);
                        }
                        reqData = null;//Delete local pointer
                        callBack = null;
                    } catch (err) {
                        if ("function" === typeof cb) {
                            try {
                                cb(err);
                            } catch (e) {
                                evUtil.log("Error executing callback on error, " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + e.message, "ERROR", "ReqRes");
                            }
                        }
                        //noinspection JSUnresolvedVariable
                        evUtil.log("Error executing " + requestInformation.reqName + " requestId: " + callBack.id + "e=" + err.message, "ERROR", "ReqRes");
                    }
                }
            }
            return ret;
        }

        //------------------- Private methods ------------------------------//

        /**
         * Stores requests so we can later ask for them, can be set to a limited store by defaults on instantiation
         * @param triggerData
         */
        function _storeEventData(triggerData) {
            evUtil.storeEventData({
                triggerData: triggerData,
                eventBufferLimit: eventBufferLimit,
                attrName: attrName,
                fired: fired,
                index: indexer
            });
        }

        this.hasFired = hasFired;
        this.request = request;
        this.reply = reply;
        this.stopReplying = stopReplying;

    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPReqRes = exports.LPReqRes || LPReqRes;
}));

// Just a very dumb proxy wrapper to unify
// all events mechanisms inside a single
// channel proxy wrapper
;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpEventChannel", ["exports", "lpEvents", "lpCommands", "lpReqres"], function (exports, LPEvents, LPCommands, LPReqRes) {
            if (!namespace.LPEventChannel) {
                factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
            }

            return namespace.LPEventChannel;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPEventChannel) {
            factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports, require("./lpEvents"), require("./lpCommands"), require("./lpReqres"));
    }
    else {
        /**
         * @depend ./lpEvents.js
         * @depend ./lpCommands.js
         * @depend ./lpReqres.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPEvents, namespace.LPCommands, namespace.LPReqRes);
    }
}(this, function (root, exports, LPEvents, LPCommands, LPReqRes) {
    function LPEventChannel(options) {

        options = options || {};

        var events = options.events || new LPEvents();
        var commands = options.commands || new LPCommands();
        var reqres = options.reqres || new LPReqRes();


        this.once = events.once;
        this.hasFiredEvents = events.hasFired;
        this.trigger = events.trigger;
        this.publish = events.publish;
        this.bind = events.bind;
        this.register = events.register;
        this.unbind = events.unbind;
        this.unregister = events.unregister;
        this.hasFiredCommands = commands.hasFired;
        this.comply = commands.comply;
        this.stopComplying = commands.stopComplying;
        this.command = commands.command;
        this.hasFiredReqres = reqres.hasFired;
        this.request = reqres.request;
        this.reply = reqres.reply;
        this.stopReplying = reqres.stopReplying;

    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPEventChannel = exports.LPEventChannel || LPEventChannel;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpCircuitBreaker", ["exports"], function (exports) {
            if (!namespace.LPCircuitBreaker) {
                factory(root, namespace);
            }

            return namespace.LPCircuitBreaker;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPCircuitBreaker) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    else {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    /*jshint validthis:true */
    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    var STATE = {
        OPEN: 0,
        HALF_OPEN: 1,
        CLOSED: 2
    };

    /**
     * @type {{FAILURE: string, SUCCESS: string, TIMEOUT: string, OUTAGE: string}}
     * Measure types for each slide
     */
    var MEASURE = {
        FAILURE: "failure",
        SUCCESS: "success",
        TIMEOUT: "timeout",
        OUTAGE: "outage"
    };

    /**
     * LPCircuitBreaker constructor
     * @constructor
     * @param {Object} [options] the configuration options for the instance
     * @param {Number} [options.timeWindow = 30000] - the time window that will be used for state calculations
     * @param {Number} [options.slidesNumber = 10] - the number of slides that the time window will be split to (a slide is a sliding unit that is added/remove from the time window)
     * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
     * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements
     * @param {Function} [options.onopen] - handler for open
     * @param {Function} [options.onclose] - handler for close
     */
    function LPCircuitBreaker(options) {
        // For forcing new keyword
        if (false === (this instanceof LPCircuitBreaker)) {
            return new LPCircuitBreaker(options);
        }

        this.initialize(options);
    }

    LPCircuitBreaker.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} [options] the configuration options for the instance
         * @param {Number} [options.timeWindow = 30000] - the time window that will be used for state calculations
         * @param {Number} [options.slidesNumber = 10] - the number of slides that the time window will be split to (a slide is a sliding unit that is added/remove from the time window)
         * @param {Number} [options.tolerance = 50] - the tolerance before opening the circuit in percentage
         * @param {Number} [options.calibration = 5] - the calibration of minimum calls before starting to validate measurements
         * @param {Function} [options.onopen] - handler for open
         * @param {Function} [options.onclose] - handler for close
         */
        function initialize(options) {
            if (!this.initialized) {
                options = options || {};

                this.timeWindow = !isNaN(options.timeWindow) && 0 < options.timeWindow ? parseInt(options.timeWindow, 10) : 30000;
                this.slidesNumber = !isNaN(options.slidesNumber) && 0 < options.slidesNumber ? parseInt(options.slidesNumber, 10) : 10;
                this.tolerance = !isNaN(options.tolerance) && 0 < options.tolerance ? parseInt(options.tolerance, 10) : 50;
                this.calibration = !isNaN(options.calibration) && 0 < options.calibration ? parseInt(options.calibration, 10) : 5;

                this.onopen = ("function" === typeof options.onopen) ? options.onopen : function() {};
                this.onclose = ("function" === typeof options.onclose) ? options.onclose : function() {};

                this.slides = [_createSlide.call(this)];
                this.state = STATE.CLOSED;

                this.initialized = true;

                _startTicking.call(this);
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} command - the command to run via the circuit
         * @param {Function} [fallback] - the fallback to run when circuit is opened
         */
        function run(command, fallback) {
            if (isOpen.call(this)) {
                _fallback.call(this, fallback || function() {});
                return false;
            }
            else {
                return _execute.call(this, command);
            }
        }

        /**
         * Method for forcing the circuit to open
         */
        function open() {
            this.forced = this.state;
            this.state = STATE.OPEN;
        }

        /**
         * Method for forcing the circuit to close
         */
        function close() {
            this.forced = this.state;
            this.state = STATE.CLOSED;
        }

        /**
         * Method for resetting the forcing
         */
        function reset() {
            this.state = this.forced;
            this.forced = void 0;
        }

        /**
         * Method for checking whether the circuit is open
         */
        function isOpen() {
            return STATE.OPEN === this.state;
        }

        /**
         * Method for calculating the needed metrics based on all calculation slides
         */
        function calculate() {
            var total = 0;
            var error = 0;
            var percent;

            for (var i = 0, l = this.slides.length; i < l; i++) {
                var slide = this.slides[i];
                var errors = (slide[MEASURE.FAILURE] + slide[MEASURE.TIMEOUT]);

                error += errors;
                total += (errors + slide[MEASURE.SUCCESS]);
            }

            percent = (error / (total > 0 ? total : 1)) * 100;

            return {
                total: total,
                error: error,
                percent: percent
            };
        }

        /**
         * Method for the timer tick which manages the slides
         * @private
         */
        function _tick() {
            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (this.slides.length > this.slidesNumber) {
                this.slides.shift();
            }

            this.slideIndex++;

            if (this.slideIndex > this.slidesNumber) {
                this.slideIndex = 0;

                if (isOpen.call(this)) {
                    this.state = STATE.HALF_OPEN;
                }
            }

            this.slides.push(_createSlide.call(this));

            if (this.slides.length > this.slidesNumber) {
                this.slides.shift();
            }

            this.timer = setTimeout(_tick.bind(this), this.slidingWindow);
        }

        /**
         * Method for starting the timer and creating the metrics slides for calculations
         * @private
         */
        function _startTicking() {
            this.slideIndex = 0;
            this.slidingWindow = this.timeWindow / this.slidesNumber;

            if (this.timer) {
                clearTimeout(this.timer);
            }

            this.timer = setTimeout(_tick.bind(this), this.slidingWindow);
        }

        /**
         * Method for creating a single metrics slide for calculations
         * @private
         */
        function _createSlide() {
            var slide = {};

            slide[MEASURE.FAILURE] = 0;
            slide[MEASURE.SUCCESS] = 0;
            slide[MEASURE.TIMEOUT] = 0;
            slide[MEASURE.OUTAGE] = 0;

            return slide;
        }

        /**
         * Method for retrieving the last metrics slide for calculations
         * @private
         */
        function _getLastSlide() {
            return this.slides[this.slides.length - 1];
        }

        /**
         * Method for adding a calculation measure for a command
         * @param {LPCircuitBreaker.MEASURE} prop - the measurement property (success, error, timeout)
         * @param {Object} status - the status of the command (A single command can only be resolved once and represent a single measurement)
         * @private
         */
        function _measure(prop, status) {
            return function() {
                if (status.done) {
                    return;
                }

                var slide = _getLastSlide.call(this);
                slide[prop]++;

                if ("undefined" === typeof this.forced) {
                    _updateState.call(this);
                }

                status.done = true;
            };
        }

        /**
         * Method for executing a command via the circuit and counting the needed metrics
         * @param {Function} command - the command to run via the circuit
         * @private
         */
        function _execute(command) {
            var result;
            var status = {
                done: false
            };
            var success = _measure(MEASURE.SUCCESS, status).bind(this);
            var failure = _measure(MEASURE.FAILURE, status).bind(this);
            var timeout = _measure(MEASURE.TIMEOUT, status).bind(this);

            try {
                result = command(success, failure, timeout);
            }
            catch(ex) {
                failure();
                return false;
            }

            return result;
        }

        /**
         * Method for executing a command fallback via the circuit and counting the needed metrics
         * @param {Function} fallback - the command fallback to run via the circuit
         * @private
         */
        function _fallback(fallback) {
            try {
                fallback();
            }
            catch(ex) {}

            var slide = _getLastSlide.call(this);
            slide[MEASURE.OUTAGE]++;
        }

        /**
         * Method for updating the circuit state based on the last command or existing metrics
         * @private
         */
        function _updateState() {
            var metrics = calculate.call(this);

            if (STATE.HALF_OPEN === this.state) {
                var lastCommandFailed = !_getLastSlide.call(this)[MEASURE.SUCCESS] && 0 < metrics.error;

                if (lastCommandFailed) {
                    this.state = STATE.OPEN;
                }
                else {
                    this.state = STATE.CLOSED;
                    this.onclose(metrics);
                }
            }
            else {
                var toleranceDeviation = metrics.percent > this.tolerance;
                var calibrationDeviation = metrics.total > this.calibration;
                var deviation = calibrationDeviation && toleranceDeviation;

                if (deviation) {
                    this.state = STATE.OPEN;
                    this.onopen(metrics);
                }
            }
        }

        return {
            initialize: initialize,
            run: run,
            close: close,
            open: open,
            reset: reset,
            isOpen: isOpen,
            calculate: calculate,
            bind: bind
        };
    }());

    /**
     * @type {{OPEN: number, HALF_OPEN: number, CLOSED: number}}
     * State representation for the circuit
     */
    LPCircuitBreaker.STATE = STATE;

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
    function bind(object) {
        /*jshint validthis:true */
        var args;
        var fn;

        if ("function" !== typeof this) {
            // Closest thing possible to the ECMAScript 5
            // Internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        args = Array.prototype.slice.call(arguments, 1);
        fn = this;

        function Empty() {}

        function bound() {
            return fn.apply(this instanceof Empty && object ? this : object,
                args.concat(Array.prototype.slice.call(arguments)));
        }

        Empty.prototype = this.prototype;
        bound.prototype = new Empty();

        return bound;
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPCircuitBreaker = exports.LPCircuitBreaker || LPCircuitBreaker;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpTtlCache", ["exports"], function (exports) {
            if (!namespace.LPTtlCache) {
                factory(root, namespace);
            }

            return namespace.LPTtlCache;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPTtlCache) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" === typeof exports) {
        // CommonJS
        factory(root, exports);
    }
    else {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    /*jshint validthis:true */

    /**
     * LPTtlCache constructor
     * @constructor
     * @param {Object} [options] - the configuration options for the instance
     * @param {Number} [options.max] - optional max items in cache
     * @param {Number} [options.ttl] - optional TTL for each cache item
     * @param {Number} [options.interval] - optional interval for eviction loop
     * @param {Function} [options.ontimeout] - optional global handler for timeout of items in cache
     */
    function LPTtlCache(options) {
        // For forcing new keyword
        if (false === (this instanceof LPTtlCache)) {
            return new LPTtlCache(options);
        }

        this.initialize(options);
    }

    LPTtlCache.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} [options] - the configuration options for the instance
         * @param {Number} [options.max] - optional max items in cache
         * @param {Number} [options.ttl] - optional TTL for each cache item
         * @param {Number} [options.interval] - optional interval for eviction loop
         * @param {Function} [options.ontimeout] - optional global handler for timeout of items in cache - return false if you want the item to not be deleted after ttl
         */
        function initialize(options) {
            if (!this.initialized) {
                options = options || {};

                this.cache = {};                                                                                           // Objects cache
                this.length = 0;                                                                                           // Amount of items in cache
                this.max = !isNaN(options.max) && 0 < options.max ? parseInt(options.max, 10) : 0;                         // Maximum items in cache - 0 for unlimited
                this.ttl = !isNaN(options.ttl) && 0 < options.ttl ? parseInt(options.ttl, 10) : 0;                         // Time to leave for items (this can be overidden for specific items using the set method - 0 for unlimited
                this.interval = !isNaN(options.interval) && 0 < options.interval ? parseInt(options.interval, 10) : 1000;  // Interval for running the eviction loop
                this.ontimeout = "function" === typeof options.ontimeout ? options.ontimeout : function () {
                };              // Callback for timeout of items
                this.initialized = true;
                _evict.call(this);
            }
        }

        /**
         * Method for getting an item from the cache
         * @param {String} key - the key for the item
         * @param {Boolean} [pop = false] - a boolean flag indicating whether to also pop/remove the item from cache
         * @returns {Object} the item from cache
         */
        function get(key, pop) {
            var item = pop ? remove.call(this, key) : this.cache && this.cache[key] && this.cache[key].item;
            return item;
        }

        /**
         * Method for setting an item to the cache
         * @param {String} key - the key for the item to be cached
         * @param {Object} item - the item to cache
         * @param {Number} [ttl] - the time to live for the item inside the cache
         * @param {Function} [callback] - optional callback to be called on item timeout - return false if you want the item to not be deleted after ttl
         */
        function set(key, item, ttl, callback) {
            return _insert.call(this, key, item, ttl, callback);
        }

        /**
         * Method for removing an item from the cache
         * @param {String} key - the key for the item to be removed
         * @returns {Object} the item that was removed from cache
         */
        function remove(key) {
            var item = this.cache && this.cache[key] && this.cache[key].item;

            if (item) {
                this.cache[key].item = null;
                this.cache[key].callback = null;
                this.cache[key].timeout = null;
                this.cache[key] = null;
                delete this.cache[key];
                this.length--;
            }

            return item;
        }

        /**
         * Method for removing all items from the cache
         */
        function removeAll() {
            if (this.length) {
                for (var key in this.cache) {
                    if (this.cache.hasOwnProperty(key)) {
                        remove.call(this, key);
                    }
                }
            }
        }

        /**
         * Method for rejecting the promise
         * @param key - the key for the item to be cached
         * @param item - the item to cache
         * @param ttl - the time to live for the item inside the cache
         * @param callback - optional callback to be called on item timeout
         * @returns {Boolean} indication whether the item had been added to the cache or not (since the cache is full)
         * @private
         */
        function _insert(key, item, ttl, callback) {
            var eviction;
            var timeout;

            if (0 === this.max || this.length < this.max) {
                eviction = (!isNaN(ttl) && 0 <= ttl ? parseInt(ttl, 10) : this.ttl);

                this.cache[key] = {
                    item: item
                };

                this.length++;

                if (eviction) {
                    timeout = (new Date()).getTime() + eviction;
                    this.cache[key].timeout = timeout;
                }

                if ("function" === typeof callback) {
                    this.cache[key].callback = callback;
                }
                if (eviction && (this.cache[key].callback || "function" === typeof this.ontimeout)) {
                    _evict.call(this);
                }

                return true;
            }
            else {
                return false;
            }
        }

        /**
         * Method for evicting expired items from the cache
         * @private
         */
        function _evict() {
            var callback;
            var item;
            var cbRes;
            var timeoutRes;

            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (this.length) {
                for (var key in this.cache) {
                    if (this.cache.hasOwnProperty(key) && this.cache[key].timeout && this.cache[key].timeout <= (new Date()).getTime()) {
                        item = this.cache[key].item;
                        callback = this.cache[key].callback;

                        if (callback) {
                            cbRes = callback(key, item);
                        }

                        if (this.ontimeout) {
                            timeoutRes = this.ontimeout(key, item);
                        }

                        // Now remove it
                        if (cbRes !== false && timeoutRes !== false) {
                            remove.call(this, key);
                        }
                    }
                }
            }

            this.timer = setTimeout(_evict.bind(this), this.interval);
        }

        return {
            initialize: initialize,
            get: get,
            set: set,
            remove: remove,
            removeAll: removeAll
        };
    }());

// attach properties to the exports object to define
// the exported module properties.
    exports.LPTtlCache = exports.LPTtlCache || LPTtlCache;
}))
;


;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessageUtilities", ["exports"], function (exports) {
            if (!namespace.LPPostMessageUtilities) {
                factory(root, namespace);
            }

            return namespace.LPPostMessageUtilities;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageUtilities) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    var SEQUENCE_FORMAT = "_xxxxxx-4xxx-yxxx";

    /**
     * This function was added because of incompatibility between the JSON.stringify and Prototype.js library
     * When a customer uses Prototype.js library, It overrides the Array.prototype.toJSON function of the native JSON
     * uses. This causes arrays to be double quoted and Shark to fail on those SDEs.
     * The function accepts a value and uses the native JSON.stringify
     * Can throw an exception (same as JSON.stringify).
     * @returns {String} the strigified object
     */
    function stringify() {
        var stringified;
        var toJSONPrototype;

        if ("function" === typeof Array.prototype.toJSON) {
            toJSONPrototype = Array.prototype.toJSON;
            Array.prototype.toJSON = void 0;

            try {
                stringified = JSON.stringify.apply(null, arguments);
            }
            catch (ex) {
                Array.prototype.toJSON = toJSONPrototype;
                throw ex;
            }

            Array.prototype.toJSON = toJSONPrototype;
        }
        else {
            stringified = JSON.stringify.apply(null, arguments);
        }

        return stringified;
    }

    /**
     * Method to identify whether the browser supports passing object references to postMessage API
     * @returns {Boolean} whether the browser supports passing object references to postMessage API
     */
    function hasPostMessageObjectsSupport() {
        var hasObjectsSupport = true;
        try {
            root.postMessage({
                toString:function() {
                    hasObjectsSupport = false;
                }
            }, "*");
        }
        catch(ex) {}

        return hasObjectsSupport;
    }


    /**
     * Method to create a unique sequence
     * @param {String} format - the format for the unique name eg. xxxxx-xx4xxx-yxxxx
     * @returns {String} the unique iFrame name
     */
    function createUniqueSequence(format) {
        return format && format.replace(/[xy]/g, function(chr) {
                var rnd = Math.random() * 16 | 0;
                var val = chr === "x" ? rnd : (rnd & 0x3 | 0x8);

                return val.toString(16);
            });
    }

    /**
     * Method to validate and parse an input number
     * @param {Number} input - the input value to parse
     * @param {Number} defaultValue - the default value to return in case of invalid input
     * @returns {Number} the number to return
     */
    function parseNumber(input, defaultValue) {
        return !isNaN(input) && 0 < input ? parseInt(input, 10) : defaultValue;
    }

    /**
     * Method to validate and parse a function reference
     * @param {Function} input - the input value to parse
     * @param {Function|Boolean} defaultValue - the default value to return in case of invalid input or true for empty function
     * @returns {Function} the function to return
     */
    function parseFunction(input, defaultValue) {
        return (("function" === typeof input) ? input : (true === defaultValue ? function() {} : defaultValue));
    }

    /**
     * Function to extract the host domain from any URL
     * @param {String} url - the url to resolve the host for
     * @param {Object} [win] - the window to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @returns {String} the host
     */
    function getHost(url, win, top) {
        var domainRegEx = new RegExp(/(http{1}s{0,1}?:\/\/)([^\/\?]+)(\/?)/ig);
        var matches;
        var domain;
        var frame;

        if (url && 0 === url.indexOf("http")) {
            matches = domainRegEx.exec(url);
        }
        else { // This is a partial url so we assume it's relative, this is mainly nice for tests
            frame = top ? (win.top || (win.contentWindow && win.contentWindow.parent) || window) : win;
            return frame.location.protocol + "//" + frame.location.host;
        }

        if (matches && 3 <= matches.length && "" !== matches[2]) {
            domain = matches[1].toLowerCase() + matches[2].toLowerCase(); // 0 - full match 1- HTTPS 2- domain
        }

        return domain;
    }

    /**
     * Method to resolve the needed origin
     * @param {Object} [target] - the target to resolve the host for
     * @param {Boolean} [top] - boolean indication for using helper of the top window if needed
     * @returns {String} the origin for the target
     */
    function resolveOrigin(target, top) {
        var origin;
        var url;
        var param;

        try {
            url = target && target.contentWindow && "undefined" !== typeof Window && !(target instanceof Window) && target.getAttribute && target.getAttribute("src");
        }
        catch(ex) {}

        try {
            if (!url) {
                url = getURLParameter("lpHost");

                if (!url) {
                    param = getURLParameter("hostParam");

                    if (param) {
                        url = getURLParameter(param);
                    }
                }
            }

            if (!url) {
                url = document.referrer;
            }

            if (url) {
                url = decodeURIComponent(url);
            }

            origin = getHost(url, target, top);
        }
        catch(ex) {
            log("Cannot parse origin", "ERROR", "PostMessageUtilities");
        }

        return origin || "*";
    }

    /**
     * Method to retrieve a url parameter from querystring by name
     * @param {String} name - the name of the parameter
     * @returns {String} the url parameter value
     */
    function getURLParameter(name) {
        return decodeURIComponent((new RegExp("[?|&]" + name + "=" + "([^&;]+?)(&|#|;|$)").exec(document.location.search) || [void 0, ""])[1].replace(/\+/g, "%20")) || null;
    }

    /**
     * Method to delay a message execution (async)
     * @param {Function} method - the function to delay
     * @param {Number} [milliseconds] - optional milliseconds to delay or false to run immediately
     */
    function delay(method, milliseconds) {
        if ("undefined" !== typeof setImmediate && (isNaN(milliseconds) || 0 >= milliseconds)) {
            setImmediate(method);
        }
        else if (false === milliseconds) {
            method();
        }
        else {
            setTimeout(method, (isNaN(milliseconds) || 0 >= milliseconds) ? 0 : parseInt(milliseconds, 10));
        }
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function addEventListener(element, event, callback) {
        if (element.addEventListener) {
            element.addEventListener(event, callback, false);
        }
        else {
            element.attachEvent("on" + event, callback);
        }

        return function() {
            removeEventListener(element, event, callback);
        };
    }

    /**
     * Method to add DOM events listener to an element
     * @param {Object} element - the element we're binding to
     * @param {String} event - the event we want to bind
     * @param {Function} callback - the function to execute
     */
    function removeEventListener(element, event, callback) {
        if (element.removeEventListener) {
            element.removeEventListener(event, callback, false);
        }
        else {
            element.detachEvent("on" + event, callback);
        }
    }

    /**
     * Method to implement a simple logging based on lptag
     * @param {String} msg - the message to log
     * @param {String} level - the logging level of the message
     * @param {String} app - the app which logs
     */
    function log(msg, level, app) {
        if (root.lpTag && "function" === typeof root.lpTag.log) {
            root.lpTag.log(msg, level, app);
        }
    }

    /**
     * Method to polyfill bind native functionality in case it does not exist
     * Based on implementation from:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
     * @param {Object} object - the object to bind to
     * @returns {Function} the bound function
     */
    function bind(object) {
        /*jshint validthis:true */
        var args;
        var fn;

        if ("function" !== typeof this) {
            // Closest thing possible to the ECMAScript 5
            // Internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        args = Array.prototype.slice.call(arguments, 1);
        fn = this;

        function Empty() {}

        function bound() {
            return fn.apply(this instanceof Empty && object ? this : object,
                args.concat(Array.prototype.slice.call(arguments)));
        }

        Empty.prototype = this.prototype;
        bound.prototype = new Empty();

        return bound;
    }

    if (!Function.prototype.bind) {
        Function.prototype.bind = bind;
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessageUtilities = exports.LPPostMessageUtilities || {
        SEQUENCE_FORMAT: SEQUENCE_FORMAT,
        stringify: stringify,
        hasPostMessageObjectsSupport: hasPostMessageObjectsSupport,
        createUniqueSequence: createUniqueSequence,
        parseNumber: parseNumber,
        parseFunction: parseFunction,
        getHost: getHost,
        resolveOrigin: resolveOrigin,
        getURLParameter: getURLParameter,
        delay: delay,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        log: log,
        bind: bind
    };
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessageChannelPolyfill", ["exports", "lpPostMessageUtilities"], function (exports, LPPostMessageUtilities) {
            if (!namespace.LPPostMessageChannelPolyfill) {
                factory(root, namespace, namespace.LPPostMessageUtilities);
            }

            return namespace.LPPostMessageChannelPolyfill;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageChannelPolyfill) {
            factory(root, namespace, namespace.LPPostMessageUtilities);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./lpPostMessageUtilities.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPPostMessageUtilities);
    }
}(this, function (root, exports, LPPostMessageUtilities) {
    "use strict";

    /*jshint validthis:true */
    var PORT_PREFIX = "LPPort_";

    /**
     * LPPostMessageChannelPolyfill constructor
     * @constructor
     * @param {Object} target - The DOM node of the target iframe or window
     * @param {Object} [options] the configuration options for the instance
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     */
    function LPPostMessageChannelPolyfill(target, options) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessageChannelPolyfill)) {
            return new LPPostMessageChannelPolyfill(target, options);
        }

        this.initialize(target, options);
    }

    LPPostMessageChannelPolyfill.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} target - The DOM node of the target iframe or window
         * @param {Object} [options] the configuration options for the instance
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         */
        function initialize(target, options) {
            if (!this.initialized) {
                options = options || {};

                this.target = target || root.top;
                this.hosted = this.target === root || this.target === root.top;
                this.portId = LPPostMessageUtilities.createUniqueSequence(PORT_PREFIX + LPPostMessageUtilities.SEQUENCE_FORMAT);
                this.serialize = LPPostMessageUtilities.parseFunction(options.serialize, LPPostMessageUtilities.stringify);
                this.deserialize = LPPostMessageUtilities.parseFunction(options.deserialize, JSON.parse);

                this.initialized = true;
            }
        }

        /**
         * Method for posting the message to the target
         * @param {Object} message - the message to be post
         */
        function postMessage(message) {
            var wrapped;
            var parsed;
            var origin = _getOrigin.call(this);
            var receiver = this.target;

            if (message) {
                try {
                    if (!this.hosted) {
                        receiver = this.target.contentWindow;
                    }
                    wrapped = _wrapMessage.call(this, message);
                    parsed = this.serialize(wrapped);
                    receiver.postMessage(parsed, origin);
                }
                catch(ex) {
                    LPPostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannelPolyfill");
                    return false;
                }
            }
        }

        /**
         * Method for receiving the incoming message
         * @param {Object} event - the event object on message
         */
        function receive(event) {
            var message;
            if ("function" === typeof this.onmessage) {
                message = _unwrapMessage.call(this, event);
                return this.onmessage(message);
            }
        }

        /**
         * Method for getting the origin to be used
         * @private
         */
        function _getOrigin() {
            if (!this.origin) {
                this.origin = LPPostMessageUtilities.resolveOrigin(this.target);
            }

            return this.origin;
        }

        /**
         * Method for wrapping the outgoing message with port and id
         * @param {Object} message - the message to be wrapped
         * @returns {Object} the wrapped message
         * @private
         */
        function _wrapMessage(message) {
            return {
                port: this.portId,
                message: message
            };
        }

        /**
         * Method for unwrapping the incoming message from port and id
         * @param {Object} event - the event object on message
         * @returns {Object} the unwrapped message
         * @private
         */
        function _unwrapMessage(event) {
            var msgObject;

            if (event && event.data) {
                try {
                    msgObject = this.deserialize(event.data);

                    if (msgObject.port && 0 === msgObject.port.indexOf(PORT_PREFIX)) {
                        return {
                            origin: event.origin,
                            data: msgObject.message
                        };
                    }
                }
                catch (ex) {
                    LPPostMessageUtilities.log("Error while trying to deserialize the message", "ERROR", "PostMessageChannelPolyfill");
                }
            }

            return msgObject || event;
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            receive: receive
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessageChannelPolyfill = exports.LPPostMessageChannelPolyfill || LPPostMessageChannelPolyfill;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessageChannel", ["exports", "lpPostMessageUtilities", "lpPostMessageChannelPolyfill"], function (exports, LPPostMessageUtilities, LPPostMessageChannelPolyfill) {
            if (!namespace.LPPostMessageChannel) {
                factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPPostMessageChannelPolyfill);
            }

            return namespace.LPPostMessageChannel;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageChannel) {
            factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPPostMessageChannelPolyfill);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./lpPostMessageUtilities.js
         * @depend ./lpPostMessageChannelPolyfill.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPPostMessageChannelPolyfill);
    }
}(this, function (root, exports, LPPostMessageUtilities, LPPostMessageChannelPolyfill) {
    "use strict";

    /*jshint validthis:true */
    var IFRAME_PREFIX = "LPFRM";
    var TOKEN_PREFIX = "LPTKN";
    var HANSHAKE_PREFIX = "HNDSK";
    var DEFAULT_CONCURRENCY = 100;
    var DEFAULT_HANDSHAKE_RETRY_INTERVAL = 5000;
    var DEFAULT_HANDSHAKE_RETRY_ATTEMPTS = 3;
    var DEFAULT_BODY_LOAD_DELAY = 100;

    /**
     * LPPostMessageChannel constructor
     * @constructor
     * @param {Object} options the configuration options for the instance
     * @param {Object} options.target - the target iframe or iframe configuration
     * @param {String} [options.target.url] - the url to load
     * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
     * @param {String} [options.target.style] - the CSS style to apply
     * @param {String} [options.target.style.width] width of iframe
     * @param {String} [options.target.style.height] height of iframe
     *          .....
     * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
     * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
     * @param {Object} [options.target.context] - optional context for the callback
     * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
     * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
     * @param {Object} [options.onready.context] - optional context for the callback
     * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
     * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
     * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
     * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
     * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
     * @param {Function} onmessage - the handler for incoming messages
     */
    function LPPostMessageChannel(options, onmessage) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessageChannel)) {
            return new LPPostMessageChannel(options, onmessage);
        }

        this.initialize(options, onmessage);
    }

    LPPostMessageChannel.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} options the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded {
         * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.onready.context] - optional context for the callback
         * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
         * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
         * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
         * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
         * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
         * @param {Function} onmessage - the handler for incoming messages
         */
        function initialize(options, onmessage) {
            var handleMessage;
            var handler;
            var initiated;

            /**
             * Method for handling the initial handler binding for needed event listeners
             * @param {Object} event - the event object on message
             */
            function _handleMessage(event) {
                var handshake;
                var previous;

                if (event.ports && 0 < event.ports.length) {
                    this.receiver = event.ports[0];

                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }
                    }

                    this.receiver.start();

                    // Swap Listeners
                    previous = this.removeListener.bind(this);
                    this.removeListener = LPPostMessageUtilities.addEventListener(this.receiver, "message", handler);
                    previous();

                    if (this.hosted && !this.ready) {
                        handshake = true;
                    }
                }
                else {
                    if (_isHandshake.call(this, event)) {
                        if (!this.token) {
                            this.token = event.data;
                        }

                        if (this.hosted && !this.ready) {
                            handshake = true;
                        }
                    }
                    else if (this.token) {
                        this.receiver.receive.call(this.receiver, event);
                    }
                }

                if (handshake) {
                    this.receiver.postMessage(HANSHAKE_PREFIX + this.token);
                    _onReady.call(this);
                }
            }

            if (!this.initialized) {
                this.hosted = false;
                this.messageQueue = [];

                options = options || {};

                this.serialize = LPPostMessageUtilities.parseFunction(options.serialize, LPPostMessageUtilities.stringify);
                this.deserialize = LPPostMessageUtilities.parseFunction(options.deserialize, JSON.parse);
                this.targetOrigin = options.targetOrigin;
                this.maxConcurrency = LPPostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY);
                this.handshakeInterval = LPPostMessageUtilities.parseNumber(options.handshakeInterval, DEFAULT_HANDSHAKE_RETRY_INTERVAL);
                this.handshakeAttempts = LPPostMessageUtilities.parseNumber(options.handshakeAttempts, DEFAULT_HANDSHAKE_RETRY_ATTEMPTS);
                this.hostParam = options.hostParam;
                this.channel = "undefined" !== typeof options.channel ? options.channel : _getChannelUrlIndicator();
                this.useObjects = options.useObjects;
                this.onready = _wrapReadyCallback(options.onready, options.target).bind(this);
                this.removeDispose = options.removeDispose;

                handler = _wrapMessageHandler(onmessage).bind(this);

                this.channelFactory = _hookupMessageChannel.call(this, handler);

                // No Iframe - We are inside it (hosted) initialized by the host/container
                if (!options.target || (options.target !== root || options.target === root.top) && "undefined" !== typeof Window && options.target instanceof Window) {
                    this.hosted = true;
                    this.target = options.target || root.top;
                }
                else if (options.target.contentWindow) { // We've got a reference to an "external" iframe
                    this.target = options.target;
                }
                else if (options.target.url) { // We've got the needed configuration for creating an iframe
                    this.targetUrl = options.target.url;
                    this.targetOrigin = this.targetOrigin || LPPostMessageUtilities.getHost(options.target.url);
                }

                if (!this.hosted) {
                    this.token = LPPostMessageUtilities.createUniqueSequence(TOKEN_PREFIX + LPPostMessageUtilities.SEQUENCE_FORMAT);
                }

                if (this.targetUrl) { // We've got the needed configuration for creating an iframe
                    this.loading = true;
                    this.targetContainer = options.target.container || document.body;
                    this.target = _createIFrame.call(this, options.target, this.targetContainer);
                }

                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.receiver = new LPPostMessageChannelPolyfill(this.target, {
                        serialize: this.serialize,
                        deserialize: this.deserialize
                    });
                    this.receiver.onmessage = handler;
                }

                if (this.hosted || !_isNativeMessageChannelSupported.call(this)) {
                    handleMessage = _handleMessage.bind(this);
                    this.removeListener = LPPostMessageUtilities.addEventListener(root, "message", handleMessage);
                }
                else if (_isNativeMessageChannelSupported.call(this)) {
                    this.channelFactory();
                }

                if (this.target && !this.loading && !this.ready) {
                    try {
                        initiated = _handshake.call(this);
                    }
                    catch(ex) {
                        initiated = false;
                    }

                    if (!initiated) {
                        // Fallback to pure postMessage
                        this.channel = false;
                        this.receiver = new LPPostMessageChannelPolyfill(this.target, {
                            serialize: this.serialize,
                            deserialize: this.deserialize
                        });
                        this.receiver.onmessage = handler;

                        if (!this.hosted) {
                            handleMessage = _handleMessage.bind(this);
                            this.removeListener = LPPostMessageUtilities.addEventListener(root, "message", handleMessage);
                        }

                        _handshake.call(this);
                    }

                    this.handshakeAttempts--;

                    LPPostMessageUtilities.delay(function() {
                        if (!this.hosted && !this.ready) {
                            _addLoadHandler.call(this, this.target);
                            this.timer = LPPostMessageUtilities.delay(_handshake.bind(this, this.handshakeInterval), this.handshakeInterval);
                        }
                    }.bind(this));
                }

                this.initialized = true;
            }
        }

        /**
         * Method for disposing the object
         */
        function dispose() {
            if (!this.disposed) {
                if (this.removeListener) {
                    this.removeListener.call(this);
                    this.removeListener = void 0;
                }

                if (this.targetUrl && this.target || this.removeDispose) {
                    try {
                        if (this.targetContainer) {
                            this.targetContainer.removeChild(this.target);
                        }
                        else {
                            document.body.removeChild(this.target);
                        }
                    }
                    catch(ex) {
                        LPPostMessageUtilities.log("Error while trying to remove the iframe from the container", "ERROR", "PostMessageChannel");
                    }
                }

                this.messageQueue.length = 0;
                this.messageQueue = void 0;
                this.channel = void 0;
                this.onready = void 0;
                this.disposed = true;
            }
        }

        /**
         * Method to post the message to the target
         * @param {Object} message - the message to post
         * @param {Object} [target] - optional target for post
         * @param {Boolean} [force = false] - force post even if not ready
         */
        function postMessage(message, target, force) {
            var consumer;
            var parsed;

            if (!this.disposed) {
                try {
                    if (message) {
                        if (this.ready || force) {
                            // Post the message
                            consumer = target || this.receiver;
                            parsed = _prepareMessage.call(this, message);
                            consumer.postMessage(parsed);
                            return true;
                        }
                        else if (this.maxConcurrency >= this.messageQueue.length) {
                            // Need to delay/queue messages till target is ready
                            this.messageQueue.push(message);
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                }
                catch(ex) {
                    LPPostMessageUtilities.log("Error while trying to post the message", "ERROR", "PostMessageChannel");
                    return false;
                }
            }
        }

        /**
         * Method to prepare the message for posting to the target
         * @param message
         * @returns {*}
         * @private
         */
        function _prepareMessage(message) {
            _tokenize.call(this, message);
            return this.serialize(message);
        }

        /**
         * Method to get url indication for using message channel or polyfill
         * @returns {Boolean} indication for message channel usage
         * @private
         */
        function _getChannelUrlIndicator() {
            if ("true" === LPPostMessageUtilities.getURLParameter("lpPMCPolyfill")) {
                return false;
            }
        }

        /**
         * Method to create and hookup message channel factory for further use
         * @param {Function} onmessage - the message handler to be used with the channel
         * @private
         */
        function _hookupMessageChannel(onmessage) {
            return function() {
                this.channel = new MessageChannel();
                this.receiver = this.channel.port1;
                this.dispatcher = this.channel.port2;
                this.receiver.onmessage = onmessage;
                this.neutered = false;
            }.bind(this);
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _tokenize(message) {
            if (this.token) {
                message.token = this.token;
            }
        }

        /**
         * Method for applying the token if any on the message
         * @param {Object} message - the message to be tokenize
         * @private
         */
        function _validateToken(message) {
            return (message && message.token === this.token);
        }

        /**
         * Method to validate whether an event is for handshake
         * @param {Object} event - the event object on message
         * @private
         */
        function _isHandshake(event) {
            return (event && event.data && "string" === typeof event.data && (0 === event.data.indexOf(TOKEN_PREFIX) || (HANSHAKE_PREFIX + this.token) === event.data));
        }

        /**
         * Method for wrapping the callback of iframe ready
         * @param {Function} [onready] - the handler for iframe ready
         * @param {Object} [target] - the target iframe configuration
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapReadyCallback(onready, target) {
            return function callback(err) {
                if (target && "function" === typeof target.callback) {
                    target.callback.call(target.context, err, this.target);
                }
                if (onready) {
                    if ("function" === typeof onready) {
                        onready(err, this.target);
                    }
                    else if ("function" === typeof onready.callback) {
                        onready.callback.call(onready.context, err, this.target);
                    }
                }
            };
        }

        /**
         * Method for wrapping the handler of the postmessage for parsing
         * @param {Function} onmessage - the handler for incoming messages to invoke
         * @returns {Function} handler function for messages
         * @private
         */
        function _wrapMessageHandler(onmessage) {
            return function handle(message) {
                var msgObject;

                if (!message.origin || "*" === message.origin ||  this.targetOrigin === message.origin) {
                    if (_isHandshake.call(this, message) && !this.hosted && !this.ready) {
                        _onReady.call(this);
                    }
                    else {
                        try {
                            msgObject = this.deserialize(message.data);

                            if (_validateToken.call(this, msgObject)) {
                                return onmessage && onmessage(msgObject);
                            }
                        }
                        catch (ex) {
                            msgObject = message.data || message;
                            LPPostMessageUtilities.log("Error while trying to handle the message", "ERROR", "PostMessageChannel");
                        }

                        return msgObject || message;
                    }
                }
            };
        }

        /**
         * Method to check whether the browser supports MessageChannel natively
         * @returns {Boolean} support flag
         * @private
         */
        function _isNativeMessageChannelSupported() {
            return false !== this.channel && "undefined" !== typeof MessageChannel && "undefined" !== typeof MessagePort;
        }

        /**
         * Method to hookup the initial "handshake" between the two parties (window and iframe) So they can start their communication
         * @param {Number} retry - retry in milliseconds
         * @returns {Boolean} indication if handshake initiated
         * @private
         */
        function _handshake(retry) {
            if (this.timer) {
                clearTimeout(this.timer);
            }

            if (!this.ready) {
                if (!_isNativeMessageChannelSupported.call(this)) {
                    this.targetOrigin = this.targetOrigin || LPPostMessageUtilities.resolveOrigin(this.target) || "*";
                }

                if (!this.hosted) {
                    if (_isNativeMessageChannelSupported.call(this)) {
                        try {
                            if (this.neutered) {
                                this.channelFactory();
                            }
                            this.target.contentWindow.postMessage(this.token, this.targetOrigin, [ this.dispatcher ]);
                            this.neutered = true;
                        }
                        catch(ex) {
                            return false;
                        }
                    }
                    else {
                        this.target.contentWindow.postMessage(this.token, this.targetOrigin);
                    }
                }
            }

            if (!this.ready && retry) {
                if (0 < this.handshakeAttempts) {
                    this.handshakeAttempts--;
                    this.timer = LPPostMessageUtilities.delay(_handshake.bind(this, retry), retry);
                }
                else {
                    this.onready(new Error("Loading: Operation Timeout!"));
                }
            }

            return true;
        }

        /**
         * Method to mark ready, and process queued/waiting messages if any
         * @private
         */
        function _onReady() {
            if (!this.ready) {
                this.ready = true;

                // Process queued messages if any
                if (this.messageQueue && this.messageQueue.length) {
                    LPPostMessageUtilities.delay(function() {
                        var message;
                        var parsed;

                        if (this.ready) {
                            while (this.messageQueue && this.messageQueue.length) {
                                message = this.messageQueue.shift();
                                try {
                                    parsed = _prepareMessage.call(this, message);
                                    this.receiver.postMessage(parsed);
                                }
                                catch(ex) {
                                    LPPostMessageUtilities.log("Error while trying to post the message from queue", "ERROR", "PostMessageChannel");
                                }
                            }

                            // Invoke the callback for ready
                            this.onready();
                        }
                    }.bind(this));
                }
                else {
                    // Invoke the callback for ready
                    this.onready();
                }
            }
        }

        /**
         * Method to enable running a callback once the document body is ready
         * @param {Object} [options] Configuration options
         * @param {Function} options.onready - the callback to run when ready
         * @param {Object} [options.doc = root.document] - document to refer to
         * @param {Number} [options.delay = 0] - milliseconds to delay the execution
         * @private
         */
        function _waitForBody(options) {
            options = options || {};
            var onready = options.onready;
            var doc = options.doc || root.document;
            var delay = options.delay;

            function _ready() {
                if (doc.body) {
                    onready();
                }
                else {
                    LPPostMessageUtilities.delay(_ready, delay || DEFAULT_BODY_LOAD_DELAY);
                }
            }

            LPPostMessageUtilities.delay(_ready, delay || false);
        }

        /**
         * Creates an iFrame in memory and sets the default attributes except the actual URL
         * Does not attach to DOM at this point
         * @param {Object} options a passed in configuration options
         * @param {String} options.url - the url to load,
         * @param {String} [options.style] - the CSS style to apply
         * @param {String} [options.style.width] width of iframe
         * @param {String} [options.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true),
         * @param {Function} [options.callback] - a callback to invoke after the iframe had been loaded,
         * @param {Object} [options.context] - optional context for the callback
         * @param {Object} [container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @returns {Element} the attached iFrame element
         * @private
         */
        function _createIFrame(options, container) {
            var frame = document.createElement("IFRAME");
            var name = LPPostMessageUtilities.createUniqueSequence(IFRAME_PREFIX + LPPostMessageUtilities.SEQUENCE_FORMAT);
            var delay = options.delayLoad;

            frame.setAttribute("id", name);
            frame.setAttribute("name", name);
            frame.setAttribute("tabindex", "-1");       // To prevent it getting focus when tabbing through the page
            frame.setAttribute("aria-hidden", "true");  // To prevent it being picked up by screen-readers
            frame.setAttribute("title", "");            // Adding an empty title at AT&Ts insistence
            frame.setAttribute("role", "presentation"); // Adding a presentation role http://yahoodevelopers.tumblr.com/post/59489724815/easy-fixes-to-common-accessibility-problems
            frame.setAttribute("allowTransparency", "true");

            if (options.style) {
                for (var attr in options.style) {
                    if (options.style.hasOwnProperty(attr)) {
                        frame.style[attr] = options.style[attr];
                    }
                }
            }
            else {
                frame.style.width = "0px";
                frame.style.height = "0px";
                frame.style.position = "absolute";
                frame.style.top = "-1000px";
                frame.style.left = "-1000px";
            }

            // Append and hookup after load
            _waitForBody({
                delay: delay,
                onready: function() {
                    (container || document.body).appendChild(frame);
                    _addLoadHandler.call(this, frame);
                    _setIFrameLocation.call(this, frame, options.url, (false !== options.bust));
                }.bind(this)
            });

            return frame;
        }

        /**
         * Add load handler for the iframe to make sure it is loaded
         * @param {Object} frame - the actual DOM iframe
         * @private
         */
        function _addLoadHandler(frame) {
            LPPostMessageUtilities.addEventListener(frame, "load", function() {
                this.loading = false;

                _handshake.call(this, this.handshakeInterval);
            }.bind(this));
        }

        /**
         * Sets the iFrame location using a cache bust mechanism,
         * making sure the iFrame is actually loaded and not from cache
         * @param {Object} frame - the iframe DOM object
         * @param {String} src - the source url for the iframe
         * @param {Boolean} bust - flag to indicate usage of cache buster when loading the iframe
         * @private
         */
        function _setIFrameLocation(frame, src, bust){
            src += (0 < src.indexOf("?") ? "&" : "?");

            if (bust) {
                src += "bust=";
                src += (new Date()).getTime() + "&";
            }

            src += ((this.hostParam ? "hostParam=" + this.hostParam + "&" + this.hostParam + "=" : "lpHost=") + encodeURIComponent(LPPostMessageUtilities.getHost(void 0, frame, true)));

            if (!_isNativeMessageChannelSupported.call(this)) {
                src += "&lpPMCPolyfill=true";
            }

            if (false === this.useObjects) {
                src += "&lpPMDeSerialize=true";
            }

            frame.setAttribute("src", src);
        }

        return {
            initialize: initialize,
            postMessage: postMessage,
            dispose: dispose
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessageChannel = LPPostMessageChannel;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessagePromise", ["exports"], function (exports) {
            if (!namespace.LPPostMessagePromise) {
                factory(root, namespace);
            }

            return namespace.LPPostMessagePromise;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessagePromise) {
            factory(root, namespace);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace);
    }
}(this, function (root, exports) {
    "use strict";

    /*jshint validthis:true */
    var ACTION_TYPE = {
        RESOLVE: "resolve",
        REJECT: "reject",
        PROGRESS: "progress"
    };

    /**
     * LPPostMessagePromise constructor
     * @constructor
     * @param {Function} [executor] - optional method to be invoked during initialization that will have
     *                   arguments of resolve and reject according to ES6 Promise A+ spec
     */
    function LPPostMessagePromise(executer) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessagePromise)) {
            return new LPPostMessagePromise(executer);
        }

        this.initialize(executer);
    }

    LPPostMessagePromise.prototype = (function () {
        /**
         * Method for initialization
         * @param {Function} [executor] - optional method to be invoked during initialization that will have
         *                   arguments of resolve and reject according to ES6 Promise A+ spec
         *
         */
        function initialize(executor) {
            if (!this.initialized) {
                this.queue = [];
                this.actions = {
                    resolve: resolve.bind(this),
                    reject: reject.bind(this),
                    progress: progress.bind(this)
                };

                // Option to pass executor method
                if ("function" === typeof executor) {
                    executor.call(this, this.actions.resolve, this.actions.reject);
                }
                this.initialized = true;
            }
        }

        /**
         * Method for assigning a defer execution
         * Code waiting for this promise uses this method
         * @param {Function} onresolve - the resolve callback
         * @param {Function} onreject - the reject callback
         * @param {Function} onprogress - the onprogress handler
         */
        function then(onresolve, onreject, onprogress) {
            // Queue the calls to then()
            this.queue.push({
                resolve: onresolve,
                reject: onreject,
                progress: onprogress
            });
        }

        /**
         * Method for resolving the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function resolve(data) {
            _complete.call(this, ACTION_TYPE.RESOLVE, data);
        }

        /**
         * Method for rejecting the promise
         * @param {Object} [data] - the data to pass the resolve callback
         */
        function reject(data) {
            _complete.call(this, ACTION_TYPE.REJECT, data);
        }

        /**
         * Method for calling the progress handler
         * @param {Object} [status] - the status to pass the progress handler
         */
        function progress(status) {
            _completeQueue.call(this, ACTION_TYPE.PROGRESS, status);
        }

        /**
         * Method for calling all queued handlers with a specified type to complete the queue
         * @param {LPPostMessagePromise.ACTION_TYPE} type - the type of handlers to invoke
         * @param {Object} [arg] - the arg to pass the handler handler
         * @param {Boolean} empty - a flag to indicate whether the queue should be empty after completion
         * @private
         */
        function _completeQueue(type, arg, empty) {
            var i = 0;
            var item = this.queue[i++];

            while (item) {
                if (item[type]) {
                    item[type].call(this, arg);
                }
                item = this.queue[i++];
            }

            if (empty) {
                // Clear
                this.queue.length = 0;
            }
        }

        /**
         * Method for completing the promise (resolve/reject)
         * @param {LPPostMessagePromise.ACTION_TYPE} type - resolve/reject
         * @param {Object} [arg] - the data to pass the handler
         * @private
         */
        function _complete(type, arg) {
            // Sync/Override then()
            var action = this.actions[type];

            // Override then to invoke the needed action
            this.then = function (resolve, reject) {
                if (action) {
                    action.call(this, arg);
                }
            }.bind(this);

            // Block multiple calls to resolve or reject by overriding
            this.resolve = this.reject = function () {
                throw new Error("This Promise instance had already been completed.");
            };

            // Block progress by overriding with false result
            this.progress = function () {
                return false;
            };

            // Complete all waiting (async) queue
            _completeQueue.call(this, type, arg, true);

            // Clean
            delete this.queue;
        }

        return {
            initialize: initialize,
            then: then,
            resolve: resolve,
            reject: reject,
            progress: progress
        };
    }());

    /**
     * Method for polyfilling Promise support if not exist
     */
    LPPostMessagePromise.polyfill = function() {
        if (!root.Promise) {
            root.Promise = LPPostMessagePromise;
        }
    };

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessagePromise = exports.LPPostMessagePromise || LPPostMessagePromise;
}));

;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessageMapper", ["exports", "lpPostMessageUtilities"], function (exports, LPPostMessageUtilities) {
            if (!namespace.LPPostMessageMapper) {
                factory(root, namespace, namespace.LPPostMessageUtilities);
            }

            return namespace.LPPostMessageMapper;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageMapper) {
            factory(root, namespace, namespace.LPPostMessageUtilities);
        }
        //</lptag>
    }
    else if ("object" !== typeof exports) {
        /**
         * @depend ./lpPostMessageUtilities.js
         */
        // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPPostMessageUtilities);
    }
}(this, function (root, exports, LPPostMessageUtilities) {
    "use strict";

    /*jshint validthis:true */

    /**
     * LPPostMessageMapper constructor
     * @constructor
     * @param {LPEventChannel} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the LPEventChannel API)
     */
    function LPPostMessageMapper(eventChannel) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessageMapper)) {
            return new LPPostMessageMapper(eventChannel);
        }

        this.initialize(eventChannel);
    }

    LPPostMessageMapper.prototype = (function () {
        /**
         * Method for initialization
         * @param {LPPostMessageChannel} [eventChannel] - the event channel on which events/commands/requests will be bind/triggered (must implement the LPEventChannel API)
         */
        function initialize(eventChannel) {
            if (!this.initialized) {
                this.eventChannel = eventChannel;

                this.initialized = true;
            }
        }

        /**
         * Method mapping the message to the correct event on the event channel and invoking it
         * @param {Object} message - the message to be mapped
         * @returns {Function} the handler function to invoke on the event channel
         */
        function toEvent(message) {
            if (message) {
                if (message.error) {
                    LPPostMessageUtilities.log("Error on message: " + message.error, "ERROR", "PostMessageMapper");
                    return function() {
                        return message;
                    };
                }
                else {
                    return _getMappedMethod.call(this, message);
                }
            }
        }

        /**
         * Method mapping the method call on the event aggregator to a message which can be posted
         * @param {String} id - the id for the call
         * @param {String} name - the name of the method
         * optional additional method arguments
         * @returns {Object} the mapped method
         */
        function toMessage(id, name) {
            return {
                method: {
                    id: id,
                    name: name,
                    args: Array.prototype.slice.call(arguments, 2)
                }
            };
        }

        /**
         * Method getting the mapped method on the event channel after which it can be invoked
         * @param {Object} message - the message to be mapped
         * optional additional method arguments
         * @return {Function} the function to invoke on the event channel
         * @private
         */
        function _getMappedMethod(message) {
            var method = message && message.method;
            var id = method && method.id;
            var name = method && method.name;
            var args = method && method.args;
            var eventChannel = this.eventChannel;

            return function() {
                if (eventChannel && eventChannel[name]) {
                    return eventChannel[name].apply(eventChannel, args);
                }
                else {
                    LPPostMessageUtilities.log("No channel exists", "ERROR", "PostMessageMapper");
                }
            };
        }

        return {
            initialize: initialize,
            toEvent: toEvent,
            toMessage: toMessage
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessageMapper = exports.LPPostMessageMapper || LPPostMessageMapper;
}));

/**
 * LIMITATIONS:
 * 1) Only supports browsers which implements postMessage API and have native JSON implementation (IE8+, Chrome, FF, Safari, Opera, IOS, Opera Mini, Android)
 * 2) IE9-, FF & Opera Mini does not support MessageChannel and therefore we fallback to using basic postMessage.
 *    This makes the communication opened to any handler registered for messages on the same origin.
 * 3) All passDataByRef flags (in LPEventChannel) are obviously ignored
 * 4) In case the browser does not support passing object using postMessage (IE8+, Opera Mini), and no special serialize/deserialize methods are supplied to LPPostMessageCourier,
 *    All data is serialized using JSON.stringify/JSON.parse which means that Object data is limited to JSON which supports types like:
 *    strings, numbers, null, arrays, and objects (and does not allow circular references).
 *    Trying to serialize other types, will result in conversion to null (like Infinity or NaN) or to a string (Dates)
 *    that must be manually deserialized on the other side
 * 5) When Iframe is managed outside of LPPostMessageCourier (passed by reference to the constructor),
 *    a targetOrigin option is expected to be passed to the constructor, and a query parameter with the name "lphost" is expected on the iframe url (unless the LPPostMessageCourier
 *    at the iframe side, had also been initialized with a valid targetOrigin option)
 */
// TODO: Add Support for target management when there is a problem that requires re-initialization of the target
;(function (root, factory) {
    "use strict";

    var namespace;

    function getNamespace() {
        //<lptag>
        if (root.lpTag) {
            root.lpTag.channel = root.lpTag.channel || {};

            return root.lpTag.channel;
        }
        //</lptag>
        return root;
    }

    if ("function" === typeof define && define.amd) {
        // Browser globals
        namespace = getNamespace();

        // AMD. Register as an anonymous module.
        define("lpPostMessageCourier", ["exports", "lpPostMessageUtilities", "lpEventChannel", "lpTtlCache", "lpCircuitBreaker", "lpPostMessageChannel", "lpPostMessagePromise", "lpPostMessageMapper"], function (exports, LPPostMessageUtilities, LPEventChannel, LPTtlCache, LPCircuitBreaker, LPPostMessageChannel, LPPostMessagePromise, LPPostMessageMapper) {
            if (!namespace.LPPostMessageCourier) {
                factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPEventChannel, namespace.LPTtlCache, namespace.LPCircuitBreaker, namespace.LPPostMessageChannel, namespace.LPPostMessagePromise, namespace.LPPostMessageMapper);
            }

            return namespace.LPPostMessageCourier;
        });

        //<lptag>
        if (root.lpTag && root.lpTag.taglets && !namespace.LPPostMessageCourier) {
            factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPEventChannel, namespace.LPTtlCache, namespace.LPCircuitBreaker, namespace.LPPostMessageChannel, namespace.LPPostMessagePromise, namespace.LPPostMessageMapper);
        }
        //</lptag>
    }
    /**
     * @depend ../lpEventChannel.js
     * @depend ./lpCircuitBreaker.js
     * @depend ../../node_modules/lp-ttl-cache/src/lpTtlCache.js
     * @depend ./lpPostMessageUtilities.js
     * @depend ./lpPostMessageChannel.js
     * @depend ./lpPostMessagePromise.js
     * @depend ./lpPostMessageMapper.js
     */
    else if ("object" !== typeof exports) {
            // Browser globals
        namespace = getNamespace();
        factory(root, namespace, namespace.LPPostMessageUtilities, namespace.LPEventChannel, namespace.LPTtlCache, namespace.LPCircuitBreaker, namespace.LPPostMessageChannel, namespace.LPPostMessagePromise, namespace.LPPostMessageMapper);
    }
}(this, function (root, exports, LPPostMessageUtilities, LPEventChannel, LPTtlCache, LPCircuitBreaker, LPPostMessageChannel, LPPostMessagePromise, LPPostMessageMapper) {
    "use strict";

    /*jshint validthis:true */
    var MESSAGE_PREFIX = "LPMSG_";
    var ACTION_TYPE = {
        TRIGGER: "trigger",
        COMMAND: "command",
        REQUEST: "request",
        RETURN: "return"
    };
    var DEFAULT_TIMEOUT = 30 * 1000;
    var DEFAULT_CONCURRENCY = 100;
    var DEFAULT_MESSURE_TIME = 30 * 1000;
    var DEFAULT_MESSURE_TOLERANCE = 30;
    var DEFAULT_MESSURE_CALIBRATION = 10;
    var CACHE_EVICTION_INTERVAL = 1000;

    /**
     * LPPostMessageCourier constructor
     * @constructor
     * @param {Object} options - the configuration options for the instance
     * @param {Object} options.target - the target iframe or iframe configuration
     * @param {String} [options.target.url] - the url to load
     * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
     * @param {String} [options.target.style] - the CSS style to apply
     * @param {String} [options.target.style.width] width of iframe
     * @param {String} [options.target.style.height] height of iframe
     *          .....
     * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
     * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
     * @param {Object} [options.target.context] - optional context for the callback
     * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
     * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
     * @param {Object} [options.onready.context] - optional context for the callback
     * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
     * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
     * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
     * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
     * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
     * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
     * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
     * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
     * @param {Function} onmessage - the handler for incoming messages
     * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
     * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
     * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
     * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
     * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
     * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
     * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
     *
     * @example
     * var courier = new lpTag.channel.LPPostMessageCourier({
     *     target: {
     *         url: "http://localhost/lpEvents/debug/courier.frame.html",
     *         style: {
     *             width: "100px",
     *             height: "100px"
     *         }
     *     }
     * });
     */
    function LPPostMessageCourier(options) {
        // For forcing new keyword
        if (false === (this instanceof LPPostMessageCourier)) {
            return new LPPostMessageCourier(options);
        }

        this.initialize(options);
    }

    LPPostMessageCourier.prototype = (function () {
        /**
         * Method for initialization
         * @param {Object} options - the configuration options for the instance
         * @param {Object} options.target - the target iframe or iframe configuration
         * @param {String} [options.target.url] - the url to load
         * @param {Object} [options.target.container] - the container in which the iframe should be created (if not supplied, document.body will be used)
         * @param {String} [options.target.style] - the CSS style to apply
         * @param {String} [options.target.style.width] width of iframe
         * @param {String} [options.target.style.height] height of iframe
         *          .....
         * @param {Boolean} [options.target.bust = true] - optional flag to indicate usage of cache buster when loading the iframe (default to true)
         * @param {Function} [options.target.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.target.context] - optional context for the callback
         * @param {Function|Object} [options.onready] - optional data for usage when iframe had been loaded
         * @param {Function} [options.onready.callback] - a callback to invoke after the iframe had been loaded
         * @param {Object} [options.onready.context] - optional context for the callback
         * @param {Boolean} [options.removeDispose] - optional flag for removal of the iframe on dispose
         * @param {Function} [options.serialize = JSON.stringify] - optional serialization method for post message
         * @param {Function} [options.deserialize = JSON.parse] - optional deserialization method for post message
         * @param {String} [options.targetOrigin] optional targetOrigin to be used when posting the message (must be supplied in case of external iframe)
         * @param {Number} [options.maxConcurrency = 100] - optional maximum concurrency that can be managed by the component before dropping
         * @param {Number} [options.handshakeInterval = 5000] - optional handshake interval for retries
         * @param {Number} [options.handshakeAttempts = 3] - optional number of retries handshake attempts
         * @param {String} [options.hostParam] - optional parameter of the host parameter name (default is lpHost)
         * @param {Function} onmessage - the handler for incoming messages
         * @param {Object} [options.eventChannel] - optional events channel to be used (if not supplied, a new one will be created OR optional events, optional commands, optional reqres to be used
         * @param {Number} [options.timeout = 30000] - optional milliseconds parameter for waiting before timeout to responses (default is 30 seconds)
         * @param {Number} [options.messureTime = 30000] - optional milliseconds parameter for time measurement indicating the time window to apply when implementing the internal fail fast mechanism (default is 30 seconds)
         * @param {Number} [options.messureTolerance = 30] - optional percentage parameter indicating the tolerance to apply on the measurements when implementing the internal fail fast mechanism (default is 30 percents)
         * @param {Number} [options.messureCalibration = 10] optional numeric parameter indicating the calibration of minimum calls before starting to validate measurements when implementing the internal fail fast mechanism (default is 10 calls)
         * @param {Function} [options.ondisconnect] - optional disconnect handler that will be invoked when the fail fast mechanism disconnects the component upon to many failures
         * @param {Function} [options.onreconnect] - optional reconnect handler that will be invoked when the fail fast mechanism reconnects the component upon back to normal behaviour
         */
        function initialize(options) {
            var mapping;
            var onmessage;
            var messureTime;

            if (!this.initialized) {
                options = options || {};

                this.useObjects = false === options.useObjects ? options.useObjects : _getUseObjectsUrlIndicator();
                if ("undefined" === typeof this.useObjects) {
                    // Defaults to true
                    this.useObjects = true;
                }
                options.useObjects = this.useObjects;

                // Define the serialize/deserialize methods to be used
                if ("function" !== typeof options.serialize || "function" !== typeof options.deserialize) {
                    if (this.useObjects && LPPostMessageUtilities.hasPostMessageObjectsSupport()) {
                        this.serialize = _de$serializeDummy;
                        this.deserialize = _de$serializeDummy;
                    }
                    else {
                        this.serialize = LPPostMessageUtilities.stringify;
                        this.deserialize = JSON.parse;
                    }

                    options.serialize = this.serialize;
                    options.deserialize = this.deserialize;
                }
                else {
                    this.serialize = options.serialize;
                    this.deserialize = options.deserialize;
                }

                // Grab the event channel and initialize a new mapper
                this.eventChannel = options.eventChannel || new LPEventChannel({
                    events: options.events,
                    commands: options.commands,
                    reqres: options.reqres
                });
                this.mapper = new LPPostMessageMapper(this.eventChannel);

                // Bind the mapping method to the mapper
                mapping = this.mapper.toEvent.bind(this.mapper);
                // Create the message handler which uses the mapping method
                onmessage = _createMessageHandler(mapping).bind(this);

                // Initialize a message channel with the message handler
                this.messageChannel = new LPPostMessageChannel(options, onmessage);

                this.callbackCache = new LPTtlCache({
                    max: LPPostMessageUtilities.parseNumber(options.maxConcurrency, DEFAULT_CONCURRENCY),
                    ttl: LPPostMessageUtilities.parseNumber(options.timeout, DEFAULT_TIMEOUT),
                    interval: CACHE_EVICTION_INTERVAL
                });

                messureTime = LPPostMessageUtilities.parseNumber(options.messureTime, DEFAULT_MESSURE_TIME);
                this.circuit = new LPCircuitBreaker({
                    timeWindow: messureTime,
                    slidesNumber: Math.ceil(messureTime / 100),
                    tolerance: LPPostMessageUtilities.parseNumber(options.messureTolerance, DEFAULT_MESSURE_TOLERANCE),
                    calibration: LPPostMessageUtilities.parseNumber(options.messureCalibration, DEFAULT_MESSURE_CALIBRATION),
                    onopen: LPPostMessageUtilities.parseFunction(options.ondisconnect, true),
                    onclose: LPPostMessageUtilities.parseFunction(options.onreconnect, true)
                });

                // Dumb Proxy methods
                this.once = this.eventChannel.once;
                this.hasFiredEvents = this.eventChannel.hasFiredEvents;
                this.bind = this.eventChannel.bind;
                this.register = this.eventChannel.register;
                this.unbind = this.eventChannel.unbind;
                this.unregister = this.eventChannel.unregister;
                this.hasFiredCommands = this.eventChannel.hasFiredCommands;
                this.comply = this.eventChannel.comply;
                this.stopComplying = this.eventChannel.stopComplying;
                this.hasFiredReqres = this.eventChannel.hasFiredReqres;
                this.reply = this.eventChannel.reply;
                this.stopReplying = this.eventChannel.stopReplying;
                this.initialized = true;
            }
        }

        /**
         * Method to get the member instance of the message channel
         * @returns {LPPostMessageChannel} the member message channel
         */
        function getMessageChannel() {
            return this.messageChannel;
        }

        /**
         * Method to get the member instance of the event channel
         * @returns {LPEvents} the member event channel
         */
        function getEventChannel() {
            return this.eventChannel;
        }

        /**
         * Method to trigger event via post message
         * @link lpTag.channel.LPEvents#trigger
         * @param {Object|String} options - Configuration object or app name
         * @param {String} [options.eventName] - the name of the event triggered
         * @param {String} [options.appName] - optional specifies the identifier it is bound to
         * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         * @param {Object} [options.data] - optional event parameters to be passed to the listeners
         * @param {String|Boolean} [evName] - the name of the event triggered || [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
         * @param {Object} [data] - optional event parameters to be passed to the listeners
         * @param {Boolean} [noLocal] - optional boolean flag indicating whether to trigger the event on the local event channel too
         * @returns {*}
         *
         * @example
         * courier.trigger({
         *     appName: "frame",
         *     eventName: "got_it",
         *     data: 2
         * });
         */
        function trigger() {
            if (!this.disposed) {
                var args = Array.prototype.slice.apply(arguments);

                // We are looking for a "noLocal" param which can only be second or forth
                // And only if its value is true, we will not trigger the event on the local event channel
                if (!((2 === arguments.length || 4 === arguments.length) &&
                    true === arguments[arguments.length - 1])) {
                    this.eventChannel.trigger.apply(this.eventChannel, args);
                }

                return _postMessage.call(this, args, ACTION_TYPE.TRIGGER);
            }
        }

        /**
         * Method to trigger a command via post message
         * @link lpTag.channel.LPCommands#command
         * @param {Object|String} options - Configuration object or app name
         * @param {String} [options.cmdName] - the name of the command triggered
         * @param {String} [options.appName] - optional specifies the identifier it is bound to
         * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         * @param {Object} [options.data] - optional event parameters to be passed to the listeners
         * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
         * @returns {*}
         *
         * @example
         * courier.command({
         *     appName: "frame",
         *     cmdName: "expect",
         *     data: data
         * }, function(err) {
         *     if (err) {
         *         console.log("Problem invoking command");
         *     }
         * });
         */
        function command() {
            if (!this.disposed) {
                var args = Array.prototype.slice.apply(arguments);
                return _postMessage.call(this, args, ACTION_TYPE.COMMAND);
            }
        }

        /**
         * Method to trigger a request via post message
         * @link lpTag.channel.LPReqRes#request
         * @param {Object|String} options - Configuration object or app name
         * @param {String} [options.reqName] - the name of the request triggered
         * @param {String} [options.appName] - optional specifies the identifier it is bound to
         * @param {Boolean} [options.passDataByRef = false] - boolean flag whether this callback will get the reference information of the event or a copy (this allows control of data manipulation)
         * @param {Object} [options.data] - optional event parameters to be passed to the listeners
         * @param {Function} [callback] - optional callback method to be triggered when the command had finished executing
         * @return {*}
         *
         * @example
         * courier.request({
         *     appName: "iframe",
         *     reqName: "Ma Shlomha?",
         *     data: data
         * }, function(err, data) {
         *      if (err) {
         *          console.log("Problem invoking request");
	     *          return;
	     *      }
         *
         *      // Do Something with data
         * });
         */
        function request() {
            if (!this.disposed) {
                var args = Array.prototype.slice.apply(arguments);
                return _postMessage.call(this, args, ACTION_TYPE.REQUEST);
            }
        }

        /**
         * Method for disposing the object
         */
        function dispose() {
            if (!this.disposed) {
                this.messageChannel.dispose();
                this.messageChannel = void 0;
                this.eventChannel = void 0;
                this.mapper = void 0;
                this.callbackCache = void 0;
                this.circuit = void 0;
                this.disposed = true;
            }
        }

        /**
         * Method to get url indication for using serialization/deserialization
         * @returns {Boolean} indication for serialization/deserialization usage
         * @private
         */
        function _getUseObjectsUrlIndicator() {
            var deserialize = LPPostMessageUtilities.getURLParameter("lpPMDeSerialize");

            if ("true" === deserialize) {
                return false;
            }
        }

        /**
         * Just a dummy serialization/deserialization method for browsers supporting objects with postMessage API
         * @param {Object} object - the object to (NOT) serialize/deserialize.
         * @returns {Object} The same object
         */
        function _de$serializeDummy(object) {
            return object;
        }

        /**
         * Method for posting the message via the circuit breaker
         * @param {Array} args - the arguments for the message to be processed.
         * @param {String} name - name of type of command.
         * @private
         */
        function _postMessage(args, name) {
            return this.circuit.run(function(success, failure, timeout) {
                var message = _prepare.call(this, args, name, timeout);

                if (message) {
                    try {
                        var initiated = this.messageChannel.postMessage.call(this.messageChannel, message);

                        if (false === initiated) {
                            failure();
                        }
                        else {
                            success();
                        }
                    }
                    catch (ex) {
                        failure();
                    }
                }
                else {
                    // Cache is full, as a fail fast mechanism, we should not continue
                    failure();
                }
            }.bind(this));
        }

        /**
         * Method for posting the returned message via the circuit breaker
         * @param {Object} message - the message to post.
         * @param {bject} [target] - optional target for post.
         * @private
         */
        function _returnMessage(message, target) {
            return this.circuit.run(function(success, failure) {
                try {
                    var initiated = this.messageChannel.postMessage.call(this.messageChannel, message, target);

                    if (false === initiated) {
                        failure();
                    }
                    else {
                        success();
                    }
                }
                catch (ex) {
                    failure();
                }
            }.bind(this));
        }

        /**
         * Method for preparing the message to be posted via the postmessage and caching the callback to be called if needed
         * @param {Array} args - the arguments to pass to the message mapper
         * @param {String} name - the action type name (trigger, command, request)
         * @param {Function} [ontimeout] - the ontimeout measurement handler
         * @returns {Function} handler function for messages
         * @private
         */
        function _prepare(args, name, ontimeout) {
            var method;
            var ttl;
            var id = LPPostMessageUtilities.createUniqueSequence(MESSAGE_PREFIX + name + LPPostMessageUtilities.SEQUENCE_FORMAT);

            args.unshift(id, name);

            if (_isTwoWay(name)) {
                if (1 < args.length && "function" === typeof args[args.length - 1]) {
                    method = args.pop();
                }
                else if (2 < args.length && !isNaN(args[args.length - 1]) && "function" === typeof args[args.length - 2]) {
                    ttl = parseInt(args.pop(), 10);
                    method = args.pop();
                }

                if (method) {
                    if (!this.callbackCache.set(id, method, ttl, function(id, callback) {
                        ontimeout();
                        _handleTimeout.call(this, id, callback);
                    }.bind(this))) {
                        // Cache is full, as a fail fast mechanism, we will not continue
                        return void 0;
                    }
                }
            }

            return this.mapper.toMessage.apply(this.mapper, args);
        }

        /**
         * Method for checking two way communication for action
         * @param {LPPostMessageCourier.ACTION_TYPE} action - the action type name
         * @returns {Boolean} flag to indicate whether the action is two way (had return call)
         * @private
         */
        function _isTwoWay(action) {
            return ACTION_TYPE.REQUEST === action || ACTION_TYPE.COMMAND === action;
        }

        /**
         * Method for handling timeout of a cached callback
         * @param {String} id - the id of the timed out callback
         * @param {Function} callback - the callback object from cache
         * @private
         */
        function _handleTimeout(id, callback) {
            // Handle timeout
            if (id && "function" === typeof callback) {
                try {
                    callback.call(null, new Error("Callback: Operation Timeout!"));
                }
                catch (ex) {
                    LPPostMessageUtilities.log("Error while trying to handle the timeout using the callback", "ERROR", "PostMessageCourier");
                }
            }
        }

        /**
         * Method for wrapping the handler of the postmessage for parsing
         * @param {Object} mapping - the handler for incoming messages to invoke which maps the message to event
         * @returns {Function} handler function for messages
         * @private
         */
        function _createMessageHandler(mapping) {
            return function handle(message) {
                var handler;
                var result;
                var params;
                var retMsg;
                var id;
                var name;
                var args;
                var callback;

                if (message) {
                    id = message.method && message.method.id;
                    name = message.method && message.method.name;
                    args = message.method && message.method.args;

                    // In case the message is a return value from a request/response call
                    // It is marked as a "return" message and we need to call the supplied cached callback
                    if (ACTION_TYPE.RETURN === name) {
                        callback = this.callbackCache.get(id, true);
                        if ("function" === typeof callback) {
                            // First try to parse the first parameter in case the error is an object
                            if (args && args.length && args[0] && "Error" === args[0].type && "string" === typeof args[0].message) {
                                args[0] = new Error(args[0].message);
                            }

                            try {
                                callback.apply(null, args);
                            }
                            catch (ex) {
                                LPPostMessageUtilities.log("Error while trying to handle the returned message from request/command", "ERROR", "PostMessageCourier");
                            }
                        }
                    }
                    else {
                        // Call the mapping method to receive the handling method on the event channel
                        // Invoke the handling method
                        try {
                            if (_isTwoWay(name)) {
                                if (args.length) {
                                    args.push(function (err, result) {
                                        var error = err;

                                        // In case of Error Object, create a special object that can be parsed
                                        if (err instanceof Error) {
                                            error = {
                                                type: "Error",
                                                message: err.message
                                            };
                                        }

                                        // Call the mapping method to receive the message structure
                                        params = [id, ACTION_TYPE.RETURN, error];

                                        if (ACTION_TYPE.REQUEST === name) {
                                            params.push(result);
                                        }

                                        retMsg = this.mapper.toMessage.apply(this.mapper, params);

                                        // Post the message
                                        _returnMessage.call(this, retMsg, message.source);
                                    }.bind(this));
                                }
                            }

                            handler = mapping(message);
                            result = handler && handler();
                        }
                        catch (ex) {
                            LPPostMessageUtilities.log("Error while trying to invoke the handler on the events channel", "ERROR", "PostMessageCourier");

                            if (_isTwoWay(name)) {
                                params = [id, ACTION_TYPE.RETURN, { error: ex.toString() }];
                                retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                _returnMessage.call(this, retMsg, message.source);
                            }
                        }

                        // In case the method is two way and returned a result
                        if (_isTwoWay(name) && "undefined" !== typeof result) {
                            // If the result is async (promise) we need to defer the execution of the results data
                            if (("undefined" !== typeof Promise && result instanceof Promise) || result instanceof LPPostMessagePromise) {
                                // Handle async using promises
                                result.then(function(data) {
                                    params = [id, ACTION_TYPE.RETURN, null];

                                    if (ACTION_TYPE.REQUEST === name) {
                                        params.push(data);
                                    }

                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    _returnMessage.call(this, retMsg, message.source);
                                }.bind(this), function(data) {
                                    params = [id, ACTION_TYPE.RETURN, data];

                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                    _returnMessage.call(this, retMsg, message.source);
                                }.bind(this));
                            }
                            else {
                                if (result.error) {
                                    params = [id, ACTION_TYPE.RETURN, result];

                                    // Call the mapping method to receive the message structure
                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                }
                                else {
                                    params = [id, ACTION_TYPE.RETURN, null];

                                    if (ACTION_TYPE.REQUEST === name) {
                                        params.push(result);
                                    }

                                    // Call the mapping method to receive the message structure
                                    retMsg = this.mapper.toMessage.apply(this.mapper, params);
                                }

                                // Post the message
                                _returnMessage.call(this, retMsg, message.source);
                            }
                        }
                    }
                }
            };
        }

        return {
            initialize: initialize,
            getMessageChannel: getMessageChannel,
            getEventChannel: getEventChannel,
            trigger: trigger,
            publish: trigger,
            command: command,
            request: request,
            dispose: dispose
        };
    }());

    // attach properties to the exports object to define
    // the exported module properties.
    exports.LPPostMessageCourier = exports.LPPostMessageCourier || LPPostMessageCourier;
}));
