! function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
    return s
}({
    "./src/external-api/symphony-api.js": [function(require, module, exports) {
        require("@symphony/nexus-core");
        var source, listen = require("../messaging/listen"),
            remote = require("../messaging/remoteService"),
            util = (require("../messaging/source"), require("../messaging/util")),
            Q = require("q"),
            _ = require("underscore"),
            remoteServices = {};
        listen.registerHandlers({
            fire: function(source, data) {
                var service, method, args, result;
                if (!data.name) return void source.sendError(data, "no service specified");
                if (!data.method) return void source.sendError(data, "no method specified");
                if (service = remoteServices[data.name], void 0 === service) return void source.sendResponse(data, void 0);
                if (!service.firedRemotely) return void source.sendError(data, "service is unavailable");
                try {
                    method = data.method, args = data.args || [], result = service.firedRemotely(source, method, args), "disconnected" === method && (SYMPHONY.services.remove(data.name), delete remoteServices[data.name])
                } catch (e) {
                    console.log(e.stack), source.sendError(data, e.stack)
                }
                result && Q.isPromiseAlike(result) ? result.then(function(result) {
                    source.sendResponse(data, result)
                })["catch"](function(e) {
                    source.sendError(data, e.stack)
                }) : source.sendResponse(data, result)
            }
        }), SYMPHONY.remote = {
            hello: function(name) {
                var url = window.location.href,
                    parsedUrl = util.parseUrl(url),
                    handle = parsedUrl.parts.handle;
                return name || (name = "source-" + Date.now() + "-" + Math.floor(65535 * Math.random())), source = listen.newSource(window.parent, name, "*"), listen.addSource(source, name), source.send("hello", {
                    handle: handle
                })
            },
            register: function(name) {
                var service = SYMPHONY.services.subscribe(name);
                return service ? (void 0 === remoteServices[name] && (service = SYMPHONY.services.subscribe(name), remote.makeServiceRemotable(service), remoteServices[name] = service), service.attachSource(source), source.send("registerService", {
                    name: name,
                    methods: service.methods
                })) : Q(service)
            },
            subscribe: function(name) {
                return source.send("subscribeService", {
                    name: name
                }).then(function(response) {
                    if (response === !1) return !1;
                    var service = SYMPHONY.services.register(response.name);
                    return service.setType(response.methods), remote.makeServiceRemotable(service), service.attachSource(source), remoteServices[name] = service, service
                })
            }
        }, SYMPHONY.application = {
            register: function(name, servicesWanted, servicesSent) {
                var services = [];
                return servicesSent = servicesSent || [], _.each(servicesSent, function(name) {
                    var service = SYMPHONY.services.subscribe(name);
                    service && (void 0 === remoteServices[name] && (remote.makeServiceRemotable(service), remoteServices[name] = service), service.attachSource(source), services.push({
                        name: name,
                        methods: service.methods
                    }))
                }), source.send("registerApplication", {
                    name: name,
                    servicesWanted: servicesWanted,
                    servicesSent: services
                }).then(function(response) {
                    return _.each(response.services, function(service) {
                        var localService;
                        void 0 === remoteServices[service.name] && (localService = SYMPHONY.services.register(service.name), localService.setType(service.methods), remote.makeServiceRemotable(localService), remoteServices[service.name] = localService), localService = remoteServices[service.name], localService.attachSource(source)
                    }), response
                })
            },
            connect: function(name, servicesWant, servicesSent) {
                servicesSent = servicesSent || [];
                var services = [];
                return _.each(servicesSent, function(name) {
                    var service = SYMPHONY.services.subscribe(name);
                    service && (void 0 === remoteServices[service.name] && (service = SYMPHONY.services.subscribe(service.name), remote.makeServiceRemotable(service), remoteServices[service.name] = service), service.attachSource(source), services.push({
                        name: name,
                        methods: service.methods
                    }))
                }), source.send("connectApplication", {
                    name: name,
                    servicesWant: servicesWant,
                    servicesSent: services
                }).then(function(response) {
                    return _.each(response.services, function(service) {
                        var localService;
                        void 0 === remoteServices[service.name] && (localService = SYMPHONY.services.register(service.name), localService.setType(service.methods), remote.makeServiceRemotable(localService), remoteServices[service.name] = localService), localService = remoteServices[service.name], localService.attachSource(source)
                    }), response
                })
            },
            loadIFrame: function(id, url) {
                return source.send("loadIFrame", {
                    id: id,
                    url: url
                })
            }
        }, listen.start()
    }, {
        "../messaging/listen": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\listen.js",
        "../messaging/remoteService": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\remoteService.js",
        "../messaging/source": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\source.js",
        "../messaging/util": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\util.js",
        "@symphony/nexus-core": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\index.js",
        q: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\q\\q.js",
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\eventable.js": [function(require, module, exports) {
        SYMPHONY.eventable = {
            makeEventable: function(thing) {
                thing.eventer = SYMPHONY.services.makeAnonymousService(), thing.fire = thing.eventer.fire.bind(thing.eventer), thing.listen = thing.eventer.listen.bind(thing.eventer)
            }
        }
    }, {}],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\index.js": [function(require, module, exports) {
        require("./service.js"), require("./registry.js"), require("./eventable.js"), require("./start.js"), exports.util = require("./util"), SYMPHONY.registerService = SYMPHONY.services.register, SYMPHONY.subscribeService = SYMPHONY.services.subscribe, SYMPHONY.registerChannel = SYMPHONY.services.register, SYMPHONY.subscribeChannel = SYMPHONY.services.subscribe
    }, {
        "./eventable.js": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\eventable.js",
        "./registry.js": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\registry.js",
        "./service.js": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\service.js",
        "./start.js": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\start.js",
        "./util": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\util.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\registry.js": [function(require, module, exports) {
        (function(global) {
            function wrapFloatService(service) {
                var openerService = openerServices.subscribe(service.name),
                    oldFire = service.fire,
                    oldListen = service.listen,
                    listeners = [],
                    hdls = {};
                service.fire = function() {
                    var event = arguments[0];
                    if (openerService.createdByFloat || "start" !== event && "ready" !== event) {
                        var globalResult = openerService.fire.apply(openerService, arguments),
                            localResult = oldFire.apply(service, arguments);
                        return globalResult || localResult
                    }
                }, service.listen = function(name, cb) {
                    return listeners.indexOf(name) === -1 && (hdls[name] = openerService.listen(name, function() {
                        var params = Array.prototype.slice.call(arguments, 0);
                        params.unshift(name), oldFire.apply(service, params)
                    }), listeners.push(name)), oldListen.call(service, name, cb)
                }, service.close = function() {
                    openerService.createdByFloat ? openerServices.remove(service.name) : listeners.forEach(function(name) {
                        openerService.unlisten(name, hdls[name])
                    })
                }
            }

            function makeGlobalService(service) {
                var name = service.name;
                if (float) {
                    var openerService = openerServices.subscribe(service.name);
                    openerService ? (delete services[name], services[name] = new Service(name), service = services[name], service.setType(openerService.methods)) : (openerService = openerServices.register(service.name), openerService.createdByFloat = !0), wrapFloatService(service)
                }
            }
            var Service = require("./service.js"),
                SYMPHONY = {};
            "undefined" != typeof window && void 0 === window.SYMPHONY && (window.SYMPHONY = SYMPHONY), "undefined" != typeof module && void 0 === global.SYMPHONY && (global.SYMPHONY = SYMPHONY);
            var float = window && window.location.search.indexOf("floaterId=") !== -1,
                services = {},
                registryService = new Service("service-registry"),
                globalServices = [],
                openerServices = float && window.opener.SYMPHONY.services;
            float && window.addEventListener("beforeunload", function(event) {
                globalServices.forEach(function(name) {
                    var service = SYMPHONY.services.subscribe(name),
                        openerService = openerServices.subscribe(name);
                    service.close(), openerService.createdByFloat && openerServices.remove(name)
                })
            }), SYMPHONY.services = {
                listen: registryService.listen.bind(registryService),
                unlisten: registryService.unlisten.bind(registryService),
                fire: registryService.fire.bind(registryService),
                fireArgs: registryService.fireArgs.bind(registryService),
                register: function(name) {
                    return void 0 === services[name] && (services[name] = new Service(name)), registryService.fire("registered", name), services[name]
                },
                subscribe: function(name) {
                    return void 0 !== services[name] && services[name]
                },
                remove: function(name) {
                    void 0 !== services[name] && delete services[name]
                },
                broadcast: function(event) {
                    var passed = Array.prototype.slice.call(arguments, 1),
                        results = [];
                    for (var name in services) services.hasOwnProperty(name) && results.push(services[name].fireArgs(event, passed));
                    return SYMPHONY.services.fireArgs(event, passed), results
                },
                makeAnonymousService: function() {
                    return new Service("anon")
                },
                make: function(serviceName, thing, implements, eventable, isGlobal) {
                    thing.registryService = SYMPHONY.services.register(serviceName), implements = implements || [], implements.forEach(function(name) {
                        thing[name] ? thing.registryService.implement(name, thing[name].bind(thing)) : console.warn("cannot find", name, "in", serviceName)
                    }), eventable && (thing.fire = thing.registryService.callfire.bind(thing.registryService), thing.listen = thing.registryService.listen.bind(thing.registryService), thing.unlisten = thing.registryService.unlisten.bind(thing.registryService)), isGlobal && SYMPHONY.services.makeGlobal(serviceName)
                },
                makeGlobal: function(name) {
                    globalServices.indexOf(name) === -1 && (globalServices.push(name), makeGlobalService(services[name]))
                },
                isGlobal: function(name) {
                    return globalServices.indexOf(name) !== -1
                },
                reset: function() {
                    services = {}
                }
            }
        }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }, {
        "./service.js": "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\service.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\service.js": [function(require, module, exports) {
        function Service(name) {
            this.name = name, this.events = {}, this.reflectors = {}, this.eventId = 0, this.publish = this.callfire, this.subscribe = this.listen, this.unsubscribe = this.remove, this.unlisten = this.remove, this.invoke = this.callfire, this.invokeArgs = this.fireArgs, this.methods = []
        }
        Service.prototype = {
            setType: function(names) {
                names.forEach(function(name) {
                    this[name] = this.invoke.bind(this, name), this.methods.push(name)
                }, this)
            },
            callfire: function() {
                return this.fire.apply(this, arguments)
            },
            implementOne: function(name, callback) {
                var ename = name + "_e_",
                    eventList = this.events[ename];
                eventList || (this.listen(name, callback), this[name] = this.invoke.bind(this, name), this.methods.push(name))
            },
            implement: function(name, callback) {
                if ("string" == typeof name) return void this.implementOne(name, callback);
                var object = name;
                for (var name in object)
                    if (object.hasOwnProperty(name)) {
                        var callback = object[name];
                        this.implementOne(name, callback.bind(this))
                    }
            },
            listen: function(name, callback) {
                name += "_e_";
                var eventList = this.events[name];
                null == eventList && (eventList = {}, this.events[name] = eventList);
                var eventId = "event_" + this.eventId;
                return this.eventId++, eventList[eventId] = callback, eventId
            },
            remove: function(name, id) {
                name += "_e_";
                var eventList = this.events[name];
                null != eventList && ("" === id ? eventList = {} : delete eventList[id])
            },
            removeAll: function(name) {
                name += "_e_", this.events[name] = {}
            },
            getEventCount: function(name) {
                name += "_e_";
                var eventList = this.events[name];
                return null == eventList ? 0 : _.size(eventList)
            },
            fire: function(name) {
                name += "_e_";
                var passed = Array.prototype.slice.call(arguments, 1),
                    eventList = this.events[name],
                    result = void 0;
                if (null != eventList) {
                    for (var key in eventList)
                        if (eventList.hasOwnProperty(key)) {
                            var callback = eventList[key],
                                response = callback.apply(this, passed);
                            void 0 === result && void 0 !== response && (result = response)
                        }
                    return result
                }
            },
            fireArgs: function(name, params) {
                return params.unshift(name), result = this.fire.apply(this, params), params.shift(name), result
            },
            reflect: function(name, service) {
                var reflectors;
                this.reflectors[name] = this.reflectors[name] || [], reflectors = this.reflectors[name], reflectors.length || this.listen(name, onReflect.bind(this, name)), reflectors.push(service)
            },
            onReflect: function(name) {
                var params = Array.prototype.slice.call(arguments, 1),
                    services = this.reflectors[name];
                services && services.forEach(function(service) {
                    service.fireArgs(name, params)
                }, this)
            }
        }, module ? module.exports = Service : window.Service = Service
    }, {}],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\start.js": [function(require, module, exports) {
        var Q = require("q");
        SYMPHONY.start = function() {
            var promises = [],
                results = SYMPHONY.services.broadcast("start");
            return _.each(results, function(result) {
                Q.isPromise(result) && promises.push(result)
            }), Q.allSettled(promises).then(function() {
                return SYMPHONY.services.broadcast("ready"), !0
            })["catch"](function(e) {
                return console.error(e.stack), !1
            })
        }
    }, {
        q: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\q\\q.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\@symphony\\nexus-core\\src\\util.js": [function(require, module, exports) {
        var _ = require("underscore");
        exports.clone = function(value) {
            try {
                return JSON.parse(JSON.stringify(value))
            } catch (e) {
                return void console.log(e.stack)
            }
        }, exports.parseUrl = function(url) {
            var qs, parser = document.createElement("a");
            return parser.href = url, qs = parser.search, qs ? parser.parts = _.object(_.compact(_.map(qs.slice(1).split("&"), function(item) {
                if (item) return item.split("=")
            }))) : parser.parts = {}, parser
        }
    }, {
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\process\\browser.js": [function(require, module, exports) {
        function noop() {}
        var process = module.exports = {};
        process.nextTick = function() {
            var canSetImmediate = "undefined" != typeof window && window.setImmediate,
                canPost = "undefined" != typeof window && window.postMessage && window.addEventListener;
            if (canSetImmediate) return function(f) {
                return window.setImmediate(f)
            };
            if (canPost) {
                var queue = [];
                return window.addEventListener("message", function(ev) {
                        var source = ev.source;
                        if ((source === window || null === source) && "process-tick" === ev.data && (ev.stopPropagation(), queue.length > 0)) {
                            var fn = queue.shift();
                            fn()
                        }
                    }, !0),
                    function(fn) {
                        queue.push(fn), window.postMessage("process-tick", "*")
                    }
            }
            return function(fn) {
                setTimeout(fn, 0)
            }
        }(), process.title = "browser", process.browser = !0, process.env = {}, process.argv = [], process.on = noop, process.addListener = noop, process.once = noop, process.off = noop, process.removeListener = noop, process.removeAllListeners = noop, process.emit = noop, process.binding = function(name) {
            throw new Error("process.binding is not supported")
        }, process.cwd = function() {
            return "/"
        }, process.chdir = function(dir) {
            throw new Error("process.chdir is not supported")
        }
    }, {}],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\q\\q.js": [function(require, module, exports) {
        (function(process) {
            ! function(definition) {
                "use strict";
                if ("function" == typeof bootstrap) bootstrap("promise", definition);
                else if ("object" == typeof exports && "object" == typeof module) module.exports = definition();
                else if ("function" == typeof define && define.amd) define(definition);
                else if ("undefined" != typeof ses) {
                    if (!ses.ok()) return;
                    ses.makeQ = definition
                } else {
                    if ("undefined" == typeof window && "undefined" == typeof self) throw new Error("This environment was not anticipated by Q. Please file a bug.");
                    var global = "undefined" != typeof window ? window : self,
                        previousQ = global.Q;
                    global.Q = definition(), global.Q.noConflict = function() {
                        return global.Q = previousQ, this
                    }
                }
            }(function() {
                "use strict";

                function uncurryThis(f) {
                    return function() {
                        return call.apply(f, arguments)
                    }
                }

                function isObject(value) {
                    return value === Object(value)
                }

                function isStopIteration(exception) {
                    return "[object StopIteration]" === object_toString(exception) || exception instanceof QReturnValue
                }

                function makeStackTraceLong(error, promise) {
                    if (hasStacks && promise.stack && "object" == typeof error && null !== error && error.stack && error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1) {
                        for (var stacks = [], p = promise; p; p = p.source) p.stack && stacks.unshift(p.stack);
                        stacks.unshift(error.stack);
                        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
                        error.stack = filterStackString(concatedStacks)
                    }
                }

                function filterStackString(stackString) {
                    for (var lines = stackString.split("\n"), desiredLines = [], i = 0; i < lines.length; ++i) {
                        var line = lines[i];
                        isInternalFrame(line) || isNodeFrame(line) || !line || desiredLines.push(line)
                    }
                    return desiredLines.join("\n")
                }

                function isNodeFrame(stackLine) {
                    return stackLine.indexOf("(module.js:") !== -1 || stackLine.indexOf("(node.js:") !== -1
                }

                function getFileNameAndLineNumber(stackLine) {
                    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
                    if (attempt1) return [attempt1[1], Number(attempt1[2])];
                    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
                    if (attempt2) return [attempt2[1], Number(attempt2[2])];
                    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
                    return attempt3 ? [attempt3[1], Number(attempt3[2])] : void 0
                }

                function isInternalFrame(stackLine) {
                    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
                    if (!fileNameAndLineNumber) return !1;
                    var fileName = fileNameAndLineNumber[0],
                        lineNumber = fileNameAndLineNumber[1];
                    return fileName === qFileName && lineNumber >= qStartingLine && lineNumber <= qEndingLine
                }

                function captureLine() {
                    if (hasStacks) try {
                        throw new Error
                    } catch (e) {
                        var lines = e.stack.split("\n"),
                            firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2],
                            fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
                        if (!fileNameAndLineNumber) return;
                        return qFileName = fileNameAndLineNumber[0], fileNameAndLineNumber[1]
                    }
                }

                function deprecate(callback, name, alternative) {
                    return function() {
                        return "undefined" != typeof console && "function" == typeof console.warn && console.warn(name + " is deprecated, use " + alternative + " instead.", new Error("").stack), callback.apply(callback, arguments)
                    }
                }

                function Q(value) {
                    return value instanceof Promise ? value : isPromiseAlike(value) ? coerce(value) : fulfill(value)
                }

                function defer() {
                    function become(newPromise) {
                        resolvedPromise = newPromise, promise.source = newPromise, array_reduce(messages, function(undefined, message) {
                            Q.nextTick(function() {
                                newPromise.promiseDispatch.apply(newPromise, message)
                            })
                        }, void 0), messages = void 0, progressListeners = void 0
                    }
                    var resolvedPromise, messages = [],
                        progressListeners = [],
                        deferred = object_create(defer.prototype),
                        promise = object_create(Promise.prototype);
                    if (promise.promiseDispatch = function(resolve, op, operands) {
                            var args = array_slice(arguments);
                            messages ? (messages.push(args), "when" === op && operands[1] && progressListeners.push(operands[1])) : Q.nextTick(function() {
                                resolvedPromise.promiseDispatch.apply(resolvedPromise, args)
                            })
                        }, promise.valueOf = function() {
                            if (messages) return promise;
                            var nearerValue = nearer(resolvedPromise);
                            return isPromise(nearerValue) && (resolvedPromise = nearerValue), nearerValue
                        }, promise.inspect = function() {
                            return resolvedPromise ? resolvedPromise.inspect() : {
                                state: "pending"
                            }
                        }, Q.longStackSupport && hasStacks) try {
                        throw new Error
                    } catch (e) {
                        promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1)
                    }
                    return deferred.promise = promise, deferred.resolve = function(value) {
                        resolvedPromise || become(Q(value))
                    }, deferred.fulfill = function(value) {
                        resolvedPromise || become(fulfill(value))
                    }, deferred.reject = function(reason) {
                        resolvedPromise || become(reject(reason))
                    }, deferred.notify = function(progress) {
                        resolvedPromise || array_reduce(progressListeners, function(undefined, progressListener) {
                            Q.nextTick(function() {
                                progressListener(progress)
                            })
                        }, void 0)
                    }, deferred
                }

                function promise(resolver) {
                    if ("function" != typeof resolver) throw new TypeError("resolver must be a function.");
                    var deferred = defer();
                    try {
                        resolver(deferred.resolve, deferred.reject, deferred.notify)
                    } catch (reason) {
                        deferred.reject(reason)
                    }
                    return deferred.promise
                }

                function race(answerPs) {
                    return promise(function(resolve, reject) {
                        for (var i = 0, len = answerPs.length; i < len; i++) Q(answerPs[i]).then(resolve, reject)
                    })
                }

                function Promise(descriptor, fallback, inspect) {
                    void 0 === fallback && (fallback = function(op) {
                        return reject(new Error("Promise does not support operation: " + op))
                    }), void 0 === inspect && (inspect = function() {
                        return {
                            state: "unknown"
                        }
                    });
                    var promise = object_create(Promise.prototype);
                    if (promise.promiseDispatch = function(resolve, op, args) {
                            var result;
                            try {
                                result = descriptor[op] ? descriptor[op].apply(promise, args) : fallback.call(promise, op, args)
                            } catch (exception) {
                                result = reject(exception)
                            }
                            resolve && resolve(result)
                        }, promise.inspect = inspect, inspect) {
                        var inspected = inspect();
                        "rejected" === inspected.state && (promise.exception = inspected.reason), promise.valueOf = function() {
                            var inspected = inspect();
                            return "pending" === inspected.state || "rejected" === inspected.state ? promise : inspected.value
                        }
                    }
                    return promise
                }

                function when(value, fulfilled, rejected, progressed) {
                    return Q(value).then(fulfilled, rejected, progressed)
                }

                function nearer(value) {
                    if (isPromise(value)) {
                        var inspected = value.inspect();
                        if ("fulfilled" === inspected.state) return inspected.value
                    }
                    return value
                }

                function isPromise(object) {
                    return object instanceof Promise
                }

                function isPromiseAlike(object) {
                    return isObject(object) && "function" == typeof object.then
                }

                function isPending(object) {
                    return isPromise(object) && "pending" === object.inspect().state
                }

                function isFulfilled(object) {
                    return !isPromise(object) || "fulfilled" === object.inspect().state
                }

                function isRejected(object) {
                    return isPromise(object) && "rejected" === object.inspect().state
                }

                function resetUnhandledRejections() {
                    unhandledReasons.length = 0, unhandledRejections.length = 0, trackUnhandledRejections || (trackUnhandledRejections = !0)
                }

                function trackRejection(promise, reason) {
                    trackUnhandledRejections && ("object" == typeof process && "function" == typeof process.emit && Q.nextTick.runAfter(function() {
                        array_indexOf(unhandledRejections, promise) !== -1 && (process.emit("unhandledRejection", reason, promise), reportedUnhandledRejections.push(promise))
                    }), unhandledRejections.push(promise), reason && "undefined" != typeof reason.stack ? unhandledReasons.push(reason.stack) : unhandledReasons.push("(no stack) " + reason))
                }

                function untrackRejection(promise) {
                    if (trackUnhandledRejections) {
                        var at = array_indexOf(unhandledRejections, promise);
                        at !== -1 && ("object" == typeof process && "function" == typeof process.emit && Q.nextTick.runAfter(function() {
                            var atReport = array_indexOf(reportedUnhandledRejections, promise);
                            atReport !== -1 && (process.emit("rejectionHandled", unhandledReasons[at], promise), reportedUnhandledRejections.splice(atReport, 1))
                        }), unhandledRejections.splice(at, 1), unhandledReasons.splice(at, 1))
                    }
                }

                function reject(reason) {
                    var rejection = Promise({
                        when: function(rejected) {
                            return rejected && untrackRejection(this), rejected ? rejected(reason) : this
                        }
                    }, function() {
                        return this
                    }, function() {
                        return {
                            state: "rejected",
                            reason: reason
                        }
                    });
                    return trackRejection(rejection, reason), rejection
                }

                function fulfill(value) {
                    return Promise({
                        when: function() {
                            return value
                        },
                        get: function(name) {
                            return value[name]
                        },
                        set: function(name, rhs) {
                            value[name] = rhs
                        },
                        "delete": function(name) {
                            delete value[name]
                        },
                        post: function(name, args) {
                            return null === name || void 0 === name ? value.apply(void 0, args) : value[name].apply(value, args)
                        },
                        apply: function(thisp, args) {
                            return value.apply(thisp, args)
                        },
                        keys: function() {
                            return object_keys(value)
                        }
                    }, void 0, function() {
                        return {
                            state: "fulfilled",
                            value: value
                        }
                    })
                }

                function coerce(promise) {
                    var deferred = defer();
                    return Q.nextTick(function() {
                        try {
                            promise.then(deferred.resolve, deferred.reject, deferred.notify)
                        } catch (exception) {
                            deferred.reject(exception)
                        }
                    }), deferred.promise
                }

                function master(object) {
                    return Promise({
                        isDef: function() {}
                    }, function(op, args) {
                        return dispatch(object, op, args)
                    }, function() {
                        return Q(object).inspect()
                    })
                }

                function spread(value, fulfilled, rejected) {
                    return Q(value).spread(fulfilled, rejected)
                }

                function async(makeGenerator) {
                    return function() {
                        function continuer(verb, arg) {
                            var result;
                            if ("undefined" == typeof StopIteration) {
                                try {
                                    result = generator[verb](arg)
                                } catch (exception) {
                                    return reject(exception)
                                }
                                return result.done ? Q(result.value) : when(result.value, callback, errback)
                            }
                            try {
                                result = generator[verb](arg)
                            } catch (exception) {
                                return isStopIteration(exception) ? Q(exception.value) : reject(exception)
                            }
                            return when(result, callback, errback)
                        }
                        var generator = makeGenerator.apply(this, arguments),
                            callback = continuer.bind(continuer, "next"),
                            errback = continuer.bind(continuer, "throw");
                        return callback()
                    }
                }

                function spawn(makeGenerator) {
                    Q.done(Q.async(makeGenerator)())
                }

                function _return(value) {
                    throw new QReturnValue(value)
                }

                function promised(callback) {
                    return function() {
                        return spread([this, all(arguments)], function(self, args) {
                            return callback.apply(self, args)
                        })
                    }
                }

                function dispatch(object, op, args) {
                    return Q(object).dispatch(op, args)
                }

                function all(promises) {
                    return when(promises, function(promises) {
                        var pendingCount = 0,
                            deferred = defer();
                        return array_reduce(promises, function(undefined, promise, index) {
                            var snapshot;
                            isPromise(promise) && "fulfilled" === (snapshot = promise.inspect()).state ? promises[index] = snapshot.value : (++pendingCount, when(promise, function(value) {
                                promises[index] = value, 0 === --pendingCount && deferred.resolve(promises)
                            }, deferred.reject, function(progress) {
                                deferred.notify({
                                    index: index,
                                    value: progress
                                })
                            }))
                        }, void 0), 0 === pendingCount && deferred.resolve(promises), deferred.promise
                    })
                }

                function any(promises) {
                    if (0 === promises.length) return Q.resolve();
                    var deferred = Q.defer(),
                        pendingCount = 0;
                    return array_reduce(promises, function(prev, current, index) {
                        function onFulfilled(result) {
                            deferred.resolve(result)
                        }

                        function onRejected() {
                            pendingCount--, 0 === pendingCount && deferred.reject(new Error("Can't get fulfillment value from any promise, all promises were rejected."))
                        }

                        function onProgress(progress) {
                            deferred.notify({
                                index: index,
                                value: progress
                            })
                        }
                        var promise = promises[index];
                        pendingCount++, when(promise, onFulfilled, onRejected, onProgress)
                    }, void 0), deferred.promise
                }

                function allResolved(promises) {
                    return when(promises, function(promises) {
                        return promises = array_map(promises, Q), when(all(array_map(promises, function(promise) {
                            return when(promise, noop, noop)
                        })), function() {
                            return promises
                        })
                    })
                }

                function allSettled(promises) {
                    return Q(promises).allSettled()
                }

                function progress(object, progressed) {
                    return Q(object).then(void 0, void 0, progressed)
                }

                function nodeify(object, nodeback) {
                    return Q(object).nodeify(nodeback)
                }
                var hasStacks = !1;
                try {
                    throw new Error
                } catch (e) {
                    hasStacks = !!e.stack
                }
                var qFileName, QReturnValue, qStartingLine = captureLine(),
                    noop = function() {},
                    nextTick = function() {
                        function flush() {
                            for (var task, domain; head.next;) head = head.next, task = head.task, head.task = void 0, domain = head.domain, domain && (head.domain = void 0, domain.enter()), runSingle(task, domain);
                            for (; laterQueue.length;) task = laterQueue.pop(), runSingle(task);
                            flushing = !1
                        }

                        function runSingle(task, domain) {
                            try {
                                task()
                            } catch (e) {
                                if (isNodeJS) throw domain && domain.exit(), setTimeout(flush, 0), domain && domain.enter(), e;
                                setTimeout(function() {
                                    throw e
                                }, 0)
                            }
                            domain && domain.exit()
                        }
                        var head = {
                                task: void 0,
                                next: null
                            },
                            tail = head,
                            flushing = !1,
                            requestTick = void 0,
                            isNodeJS = !1,
                            laterQueue = [];
                        if (nextTick = function(task) {
                                tail = tail.next = {
                                    task: task,
                                    domain: isNodeJS && process.domain,
                                    next: null
                                }, flushing || (flushing = !0, requestTick())
                            }, "object" == typeof process && "[object process]" === process.toString() && process.nextTick) isNodeJS = !0, requestTick = function() {
                            process.nextTick(flush)
                        };
                        else if ("function" == typeof setImmediate) requestTick = "undefined" != typeof window ? setImmediate.bind(window, flush) : function() {
                            setImmediate(flush)
                        };
                        else if ("undefined" != typeof MessageChannel) {
                            var channel = new MessageChannel;
                            channel.port1.onmessage = function() {
                                requestTick = requestPortTick, channel.port1.onmessage = flush, flush()
                            };
                            var requestPortTick = function() {
                                channel.port2.postMessage(0)
                            };
                            requestTick = function() {
                                setTimeout(flush, 0), requestPortTick()
                            }
                        } else requestTick = function() {
                            setTimeout(flush, 0)
                        };
                        return nextTick.runAfter = function(task) {
                            laterQueue.push(task), flushing || (flushing = !0, requestTick())
                        }, nextTick
                    }(),
                    call = Function.call,
                    array_slice = uncurryThis(Array.prototype.slice),
                    array_reduce = uncurryThis(Array.prototype.reduce || function(callback, basis) {
                        var index = 0,
                            length = this.length;
                        if (1 === arguments.length)
                            for (;;) {
                                if (index in this) {
                                    basis = this[index++];
                                    break
                                }
                                if (++index >= length) throw new TypeError
                            }
                        for (; index < length; index++) index in this && (basis = callback(basis, this[index], index));
                        return basis
                    }),
                    array_indexOf = uncurryThis(Array.prototype.indexOf || function(value) {
                        for (var i = 0; i < this.length; i++)
                            if (this[i] === value) return i;
                        return -1
                    }),
                    array_map = uncurryThis(Array.prototype.map || function(callback, thisp) {
                        var self = this,
                            collect = [];
                        return array_reduce(self, function(undefined, value, index) {
                            collect.push(callback.call(thisp, value, index, self))
                        }, void 0), collect
                    }),
                    object_create = Object.create || function(prototype) {
                        function Type() {}
                        return Type.prototype = prototype, new Type
                    },
                    object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty),
                    object_keys = Object.keys || function(object) {
                        var keys = [];
                        for (var key in object) object_hasOwnProperty(object, key) && keys.push(key);
                        return keys
                    },
                    object_toString = uncurryThis(Object.prototype.toString);
                QReturnValue = "undefined" != typeof ReturnValue ? ReturnValue : function(value) {
                    this.value = value
                };
                var STACK_JUMP_SEPARATOR = "From previous event:";
                Q.resolve = Q, Q.nextTick = nextTick, Q.longStackSupport = !1, "object" == typeof process && process && process.env && process.env.Q_DEBUG && (Q.longStackSupport = !0), Q.defer = defer, defer.prototype.makeNodeResolver = function() {
                    var self = this;
                    return function(error, value) {
                        error ? self.reject(error) : arguments.length > 2 ? self.resolve(array_slice(arguments, 1)) : self.resolve(value)
                    }
                }, Q.Promise = promise, Q.promise = promise, promise.race = race, promise.all = all, promise.reject = reject, promise.resolve = Q, Q.passByCopy = function(object) {
                    return object
                }, Promise.prototype.passByCopy = function() {
                    return this
                }, Q.join = function(x, y) {
                    return Q(x).join(y)
                }, Promise.prototype.join = function(that) {
                    return Q([this, that]).spread(function(x, y) {
                        if (x === y) return x;
                        throw new Error("Can't join: not the same: " + x + " " + y)
                    })
                }, Q.race = race, Promise.prototype.race = function() {
                    return this.then(Q.race)
                }, Q.makePromise = Promise, Promise.prototype.toString = function() {
                    return "[object Promise]"
                }, Promise.prototype.then = function(fulfilled, rejected, progressed) {
                    function _fulfilled(value) {
                        try {
                            return "function" == typeof fulfilled ? fulfilled(value) : value
                        } catch (exception) {
                            return reject(exception)
                        }
                    }

                    function _rejected(exception) {
                        if ("function" == typeof rejected) {
                            makeStackTraceLong(exception, self);
                            try {
                                return rejected(exception)
                            } catch (newException) {
                                return reject(newException)
                            }
                        }
                        return reject(exception)
                    }

                    function _progressed(value) {
                        return "function" == typeof progressed ? progressed(value) : value
                    }
                    var self = this,
                        deferred = defer(),
                        done = !1;
                    return Q.nextTick(function() {
                        self.promiseDispatch(function(value) {
                            done || (done = !0, deferred.resolve(_fulfilled(value)))
                        }, "when", [function(exception) {
                            done || (done = !0, deferred.resolve(_rejected(exception)))
                        }])
                    }), self.promiseDispatch(void 0, "when", [void 0, function(value) {
                        var newValue, threw = !1;
                        try {
                            newValue = _progressed(value)
                        } catch (e) {
                            if (threw = !0, !Q.onerror) throw e;
                            Q.onerror(e)
                        }
                        threw || deferred.notify(newValue)
                    }]), deferred.promise
                }, Q.tap = function(promise, callback) {
                    return Q(promise).tap(callback)
                }, Promise.prototype.tap = function(callback) {
                    return callback = Q(callback), this.then(function(value) {
                        return callback.fcall(value).thenResolve(value)
                    })
                }, Q.when = when, Promise.prototype.thenResolve = function(value) {
                    return this.then(function() {
                        return value
                    })
                }, Q.thenResolve = function(promise, value) {
                    return Q(promise).thenResolve(value)
                }, Promise.prototype.thenReject = function(reason) {
                    return this.then(function() {
                        throw reason
                    })
                }, Q.thenReject = function(promise, reason) {
                    return Q(promise).thenReject(reason)
                }, Q.nearer = nearer, Q.isPromise = isPromise, Q.isPromiseAlike = isPromiseAlike, Q.isPending = isPending, Promise.prototype.isPending = function() {
                    return "pending" === this.inspect().state
                }, Q.isFulfilled = isFulfilled, Promise.prototype.isFulfilled = function() {
                    return "fulfilled" === this.inspect().state
                }, Q.isRejected = isRejected, Promise.prototype.isRejected = function() {
                    return "rejected" === this.inspect().state
                };
                var unhandledReasons = [],
                    unhandledRejections = [],
                    reportedUnhandledRejections = [],
                    trackUnhandledRejections = !0;
                Q.resetUnhandledRejections = resetUnhandledRejections, Q.getUnhandledReasons = function() {
                    return unhandledReasons.slice()
                }, Q.stopUnhandledRejectionTracking = function() {
                    resetUnhandledRejections(), trackUnhandledRejections = !1
                }, resetUnhandledRejections(), Q.reject = reject, Q.fulfill = fulfill, Q.master = master, Q.spread = spread, Promise.prototype.spread = function(fulfilled, rejected) {
                    return this.all().then(function(array) {
                        return fulfilled.apply(void 0, array)
                    }, rejected)
                }, Q.async = async, Q.spawn = spawn, Q["return"] = _return, Q.promised = promised, Q.dispatch = dispatch, Promise.prototype.dispatch = function(op, args) {
                    var self = this,
                        deferred = defer();
                    return Q.nextTick(function() {
                        self.promiseDispatch(deferred.resolve, op, args)
                    }), deferred.promise
                }, Q.get = function(object, key) {
                    return Q(object).dispatch("get", [key])
                }, Promise.prototype.get = function(key) {
                    return this.dispatch("get", [key])
                }, Q.set = function(object, key, value) {
                    return Q(object).dispatch("set", [key, value])
                }, Promise.prototype.set = function(key, value) {
                    return this.dispatch("set", [key, value])
                }, Q.del = Q["delete"] = function(object, key) {
                    return Q(object).dispatch("delete", [key])
                }, Promise.prototype.del = Promise.prototype["delete"] = function(key) {
                    return this.dispatch("delete", [key])
                }, Q.mapply = Q.post = function(object, name, args) {
                    return Q(object).dispatch("post", [name, args])
                }, Promise.prototype.mapply = Promise.prototype.post = function(name, args) {
                    return this.dispatch("post", [name, args])
                }, Q.send = Q.mcall = Q.invoke = function(object, name) {
                    return Q(object).dispatch("post", [name, array_slice(arguments, 2)])
                }, Promise.prototype.send = Promise.prototype.mcall = Promise.prototype.invoke = function(name) {
                    return this.dispatch("post", [name, array_slice(arguments, 1)])
                }, Q.fapply = function(object, args) {
                    return Q(object).dispatch("apply", [void 0, args])
                }, Promise.prototype.fapply = function(args) {
                    return this.dispatch("apply", [void 0, args])
                }, Q["try"] = Q.fcall = function(object) {
                    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)])
                }, Promise.prototype.fcall = function() {
                    return this.dispatch("apply", [void 0, array_slice(arguments)])
                }, Q.fbind = function(object) {
                    var promise = Q(object),
                        args = array_slice(arguments, 1);
                    return function() {
                        return promise.dispatch("apply", [this, args.concat(array_slice(arguments))])
                    }
                }, Promise.prototype.fbind = function() {
                    var promise = this,
                        args = array_slice(arguments);
                    return function() {
                        return promise.dispatch("apply", [this, args.concat(array_slice(arguments))])
                    }
                }, Q.keys = function(object) {
                    return Q(object).dispatch("keys", [])
                }, Promise.prototype.keys = function() {
                    return this.dispatch("keys", [])
                }, Q.all = all, Promise.prototype.all = function() {
                    return all(this)
                }, Q.any = any, Promise.prototype.any = function() {
                    return any(this)
                }, Q.allResolved = deprecate(allResolved, "allResolved", "allSettled"), Promise.prototype.allResolved = function() {
                    return allResolved(this)
                }, Q.allSettled = allSettled, Promise.prototype.allSettled = function() {
                    return this.then(function(promises) {
                        return all(array_map(promises, function(promise) {
                            function regardless() {
                                return promise.inspect()
                            }
                            return promise = Q(promise), promise.then(regardless, regardless)
                        }))
                    })
                }, Q.fail = Q["catch"] = function(object, rejected) {
                    return Q(object).then(void 0, rejected)
                }, Promise.prototype.fail = Promise.prototype["catch"] = function(rejected) {
                    return this.then(void 0, rejected)
                }, Q.progress = progress, Promise.prototype.progress = function(progressed) {
                    return this.then(void 0, void 0, progressed)
                }, Q.fin = Q["finally"] = function(object, callback) {
                    return Q(object)["finally"](callback)
                }, Promise.prototype.fin = Promise.prototype["finally"] = function(callback) {
                    return callback = Q(callback), this.then(function(value) {
                        return callback.fcall().then(function() {
                            return value
                        })
                    }, function(reason) {
                        return callback.fcall().then(function() {
                            throw reason
                        })
                    })
                }, Q.done = function(object, fulfilled, rejected, progress) {
                    return Q(object).done(fulfilled, rejected, progress)
                }, Promise.prototype.done = function(fulfilled, rejected, progress) {
                    var onUnhandledError = function(error) {
                            Q.nextTick(function() {
                                if (makeStackTraceLong(error, promise), !Q.onerror) throw error;
                                Q.onerror(error)
                            })
                        },
                        promise = fulfilled || rejected || progress ? this.then(fulfilled, rejected, progress) : this;
                    "object" == typeof process && process && process.domain && (onUnhandledError = process.domain.bind(onUnhandledError)), promise.then(void 0, onUnhandledError)
                }, Q.timeout = function(object, ms, error) {
                    return Q(object).timeout(ms, error)
                }, Promise.prototype.timeout = function(ms, error) {
                    var deferred = defer(),
                        timeoutId = setTimeout(function() {
                            error && "string" != typeof error || (error = new Error(error || "Timed out after " + ms + " ms"), error.code = "ETIMEDOUT"), deferred.reject(error)
                        }, ms);
                    return this.then(function(value) {
                        clearTimeout(timeoutId), deferred.resolve(value)
                    }, function(exception) {
                        clearTimeout(timeoutId), deferred.reject(exception)
                    }, deferred.notify), deferred.promise
                }, Q.delay = function(object, timeout) {
                    return void 0 === timeout && (timeout = object, object = void 0), Q(object).delay(timeout)
                }, Promise.prototype.delay = function(timeout) {
                    return this.then(function(value) {
                        var deferred = defer();
                        return setTimeout(function() {
                            deferred.resolve(value)
                        }, timeout), deferred.promise
                    })
                }, Q.nfapply = function(callback, args) {
                    return Q(callback).nfapply(args)
                }, Promise.prototype.nfapply = function(args) {
                    var deferred = defer(),
                        nodeArgs = array_slice(args);
                    return nodeArgs.push(deferred.makeNodeResolver()), this.fapply(nodeArgs).fail(deferred.reject), deferred.promise
                }, Q.nfcall = function(callback) {
                    var args = array_slice(arguments, 1);
                    return Q(callback).nfapply(args)
                }, Promise.prototype.nfcall = function() {
                    var nodeArgs = array_slice(arguments),
                        deferred = defer();
                    return nodeArgs.push(deferred.makeNodeResolver()), this.fapply(nodeArgs).fail(deferred.reject), deferred.promise
                }, Q.nfbind = Q.denodeify = function(callback) {
                    var baseArgs = array_slice(arguments, 1);
                    return function() {
                        var nodeArgs = baseArgs.concat(array_slice(arguments)),
                            deferred = defer();
                        return nodeArgs.push(deferred.makeNodeResolver()), Q(callback).fapply(nodeArgs).fail(deferred.reject), deferred.promise
                    }
                }, Promise.prototype.nfbind = Promise.prototype.denodeify = function() {
                    var args = array_slice(arguments);
                    return args.unshift(this), Q.denodeify.apply(void 0, args)
                }, Q.nbind = function(callback, thisp) {
                    var baseArgs = array_slice(arguments, 2);
                    return function() {
                        function bound() {
                            return callback.apply(thisp, arguments)
                        }
                        var nodeArgs = baseArgs.concat(array_slice(arguments)),
                            deferred = defer();
                        return nodeArgs.push(deferred.makeNodeResolver()), Q(bound).fapply(nodeArgs).fail(deferred.reject), deferred.promise
                    }
                }, Promise.prototype.nbind = function() {
                    var args = array_slice(arguments, 0);
                    return args.unshift(this), Q.nbind.apply(void 0, args)
                }, Q.nmapply = Q.npost = function(object, name, args) {
                    return Q(object).npost(name, args)
                }, Promise.prototype.nmapply = Promise.prototype.npost = function(name, args) {
                    var nodeArgs = array_slice(args || []),
                        deferred = defer();
                    return nodeArgs.push(deferred.makeNodeResolver()), this.dispatch("post", [name, nodeArgs]).fail(deferred.reject), deferred.promise
                }, Q.nsend = Q.nmcall = Q.ninvoke = function(object, name) {
                    var nodeArgs = array_slice(arguments, 2),
                        deferred = defer();
                    return nodeArgs.push(deferred.makeNodeResolver()), Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject), deferred.promise
                }, Promise.prototype.nsend = Promise.prototype.nmcall = Promise.prototype.ninvoke = function(name) {
                    var nodeArgs = array_slice(arguments, 1),
                        deferred = defer();
                    return nodeArgs.push(deferred.makeNodeResolver()), this.dispatch("post", [name, nodeArgs]).fail(deferred.reject), deferred.promise
                }, Q.nodeify = nodeify, Promise.prototype.nodeify = function(nodeback) {
                    return nodeback ? void this.then(function(value) {
                        Q.nextTick(function() {
                            nodeback(null, value)
                        })
                    }, function(error) {
                        Q.nextTick(function() {
                            nodeback(error)
                        })
                    }) : this
                }, Q.noConflict = function() {
                    throw new Error("Q.noConflict only works when Q is used as a global")
                };
                var qEndingLine = captureLine();
                return Q
            })
        }).call(this, require("_process"))
    }, {
        _process: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\process\\browser.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js": [function(require, module, exports) {
        (function() {
            function createReduce(dir) {
                function iterator(obj, iteratee, memo, keys, index, length) {
                    for (; index >= 0 && index < length; index += dir) {
                        var currentKey = keys ? keys[index] : index;
                        memo = iteratee(memo, obj[currentKey], currentKey, obj)
                    }
                    return memo
                }
                return function(obj, iteratee, memo, context) {
                    iteratee = optimizeCb(iteratee, context, 4);
                    var keys = !isArrayLike(obj) && _.keys(obj),
                        length = (keys || obj).length,
                        index = dir > 0 ? 0 : length - 1;
                    return arguments.length < 3 && (memo = obj[keys ? keys[index] : index], index += dir), iterator(obj, iteratee, memo, keys, index, length)
                }
            }

            function createPredicateIndexFinder(dir) {
                return function(array, predicate, context) {
                    predicate = cb(predicate, context);
                    for (var length = getLength(array), index = dir > 0 ? 0 : length - 1; index >= 0 && index < length; index += dir)
                        if (predicate(array[index], index, array)) return index;
                    return -1
                }
            }

            function createIndexFinder(dir, predicateFind, sortedIndex) {
                return function(array, item, idx) {
                    var i = 0,
                        length = getLength(array);
                    if ("number" == typeof idx) dir > 0 ? i = idx >= 0 ? idx : Math.max(idx + length, i) : length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                    else if (sortedIndex && idx && length) return idx = sortedIndex(array, item), array[idx] === item ? idx : -1;
                    if (item !== item) return idx = predicateFind(slice.call(array, i, length), _.isNaN), idx >= 0 ? idx + i : -1;
                    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir)
                        if (array[idx] === item) return idx;
                    return -1
                }
            }

            function collectNonEnumProps(obj, keys) {
                var nonEnumIdx = nonEnumerableProps.length,
                    constructor = obj.constructor,
                    proto = _.isFunction(constructor) && constructor.prototype || ObjProto,
                    prop = "constructor";
                for (_.has(obj, prop) && !_.contains(keys, prop) && keys.push(prop); nonEnumIdx--;) prop = nonEnumerableProps[nonEnumIdx], prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop) && keys.push(prop)
            }
            var root = this,
                previousUnderscore = root._,
                ArrayProto = Array.prototype,
                ObjProto = Object.prototype,
                FuncProto = Function.prototype,
                push = ArrayProto.push,
                slice = ArrayProto.slice,
                toString = ObjProto.toString,
                hasOwnProperty = ObjProto.hasOwnProperty,
                nativeIsArray = Array.isArray,
                nativeKeys = Object.keys,
                nativeBind = FuncProto.bind,
                nativeCreate = Object.create,
                Ctor = function() {},
                _ = function(obj) {
                    return obj instanceof _ ? obj : this instanceof _ ? void(this._wrapped = obj) : new _(obj)
                };
            "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.8.3";
            var optimizeCb = function(func, context, argCount) {
                    if (void 0 === context) return func;
                    switch (null == argCount ? 3 : argCount) {
                        case 1:
                            return function(value) {
                                return func.call(context, value)
                            };
                        case 2:
                            return function(value, other) {
                                return func.call(context, value, other)
                            };
                        case 3:
                            return function(value, index, collection) {
                                return func.call(context, value, index, collection)
                            };
                        case 4:
                            return function(accumulator, value, index, collection) {
                                return func.call(context, accumulator, value, index, collection)
                            }
                    }
                    return function() {
                        return func.apply(context, arguments)
                    }
                },
                cb = function(value, context, argCount) {
                    return null == value ? _.identity : _.isFunction(value) ? optimizeCb(value, context, argCount) : _.isObject(value) ? _.matcher(value) : _.property(value)
                };
            _.iteratee = function(value, context) {
                return cb(value, context, 1 / 0)
            };
            var createAssigner = function(keysFunc, undefinedOnly) {
                    return function(obj) {
                        var length = arguments.length;
                        if (length < 2 || null == obj) return obj;
                        for (var index = 1; index < length; index++)
                            for (var source = arguments[index], keys = keysFunc(source), l = keys.length, i = 0; i < l; i++) {
                                var key = keys[i];
                                undefinedOnly && void 0 !== obj[key] || (obj[key] = source[key])
                            }
                        return obj
                    }
                },
                baseCreate = function(prototype) {
                    if (!_.isObject(prototype)) return {};
                    if (nativeCreate) return nativeCreate(prototype);
                    Ctor.prototype = prototype;
                    var result = new Ctor;
                    return Ctor.prototype = null, result
                },
                property = function(key) {
                    return function(obj) {
                        return null == obj ? void 0 : obj[key]
                    }
                },
                MAX_ARRAY_INDEX = Math.pow(2, 53) - 1,
                getLength = property("length"),
                isArrayLike = function(collection) {
                    var length = getLength(collection);
                    return "number" == typeof length && length >= 0 && length <= MAX_ARRAY_INDEX
                };
            _.each = _.forEach = function(obj, iteratee, context) {
                iteratee = optimizeCb(iteratee, context);
                var i, length;
                if (isArrayLike(obj))
                    for (i = 0, length = obj.length; i < length; i++) iteratee(obj[i], i, obj);
                else {
                    var keys = _.keys(obj);
                    for (i = 0, length = keys.length; i < length; i++) iteratee(obj[keys[i]], keys[i], obj)
                }
                return obj
            }, _.map = _.collect = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, results = Array(length), index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    results[index] = iteratee(obj[currentKey], currentKey, obj)
                }
                return results
            }, _.reduce = _.foldl = _.inject = createReduce(1), _.reduceRight = _.foldr = createReduce(-1), _.find = _.detect = function(obj, predicate, context) {
                var key;
                if (key = isArrayLike(obj) ? _.findIndex(obj, predicate, context) : _.findKey(obj, predicate, context), void 0 !== key && key !== -1) return obj[key]
            }, _.filter = _.select = function(obj, predicate, context) {
                var results = [];
                return predicate = cb(predicate, context), _.each(obj, function(value, index, list) {
                    predicate(value, index, list) && results.push(value)
                }), results
            }, _.reject = function(obj, predicate, context) {
                return _.filter(obj, _.negate(cb(predicate)), context)
            }, _.every = _.all = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (!predicate(obj[currentKey], currentKey, obj)) return !1
                }
                return !0
            }, _.some = _.any = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; index < length; index++) {
                    var currentKey = keys ? keys[index] : index;
                    if (predicate(obj[currentKey], currentKey, obj)) return !0
                }
                return !1
            }, _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
                return isArrayLike(obj) || (obj = _.values(obj)), ("number" != typeof fromIndex || guard) && (fromIndex = 0), _.indexOf(obj, item, fromIndex) >= 0
            }, _.invoke = function(obj, method) {
                var args = slice.call(arguments, 2),
                    isFunc = _.isFunction(method);
                return _.map(obj, function(value) {
                    var func = isFunc ? method : value[method];
                    return null == func ? func : func.apply(value, args)
                })
            }, _.pluck = function(obj, key) {
                return _.map(obj, _.property(key))
            }, _.where = function(obj, attrs) {
                return _.filter(obj, _.matcher(attrs))
            }, _.findWhere = function(obj, attrs) {
                return _.find(obj, _.matcher(attrs))
            }, _.max = function(obj, iteratee, context) {
                var value, computed, result = -(1 / 0),
                    lastComputed = -(1 / 0);
                if (null == iteratee && null != obj) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; i < length; i++) value = obj[i], value > result && (result = value)
                } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                    computed = iteratee(value, index, list), (computed > lastComputed || computed === -(1 / 0) && result === -(1 / 0)) && (result = value, lastComputed = computed)
                });
                return result
            }, _.min = function(obj, iteratee, context) {
                var value, computed, result = 1 / 0,
                    lastComputed = 1 / 0;
                if (null == iteratee && null != obj) {
                    obj = isArrayLike(obj) ? obj : _.values(obj);
                    for (var i = 0, length = obj.length; i < length; i++) value = obj[i], value < result && (result = value)
                } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                    computed = iteratee(value, index, list), (computed < lastComputed || computed === 1 / 0 && result === 1 / 0) && (result = value, lastComputed = computed)
                });
                return result
            }, _.shuffle = function(obj) {
                for (var rand, set = isArrayLike(obj) ? obj : _.values(obj), length = set.length, shuffled = Array(length), index = 0; index < length; index++) rand = _.random(0, index), rand !== index && (shuffled[index] = shuffled[rand]), shuffled[rand] = set[index];
                return shuffled
            }, _.sample = function(obj, n, guard) {
                return null == n || guard ? (isArrayLike(obj) || (obj = _.values(obj)), obj[_.random(obj.length - 1)]) : _.shuffle(obj).slice(0, Math.max(0, n))
            }, _.sortBy = function(obj, iteratee, context) {
                return iteratee = cb(iteratee, context), _.pluck(_.map(obj, function(value, index, list) {
                    return {
                        value: value,
                        index: index,
                        criteria: iteratee(value, index, list)
                    }
                }).sort(function(left, right) {
                    var a = left.criteria,
                        b = right.criteria;
                    if (a !== b) {
                        if (a > b || void 0 === a) return 1;
                        if (a < b || void 0 === b) return -1
                    }
                    return left.index - right.index
                }), "value")
            };
            var group = function(behavior) {
                return function(obj, iteratee, context) {
                    var result = {};
                    return iteratee = cb(iteratee, context), _.each(obj, function(value, index) {
                        var key = iteratee(value, index, obj);
                        behavior(result, value, key)
                    }), result
                }
            };
            _.groupBy = group(function(result, value, key) {
                _.has(result, key) ? result[key].push(value) : result[key] = [value]
            }), _.indexBy = group(function(result, value, key) {
                result[key] = value
            }), _.countBy = group(function(result, value, key) {
                _.has(result, key) ? result[key]++ : result[key] = 1
            }), _.toArray = function(obj) {
                return obj ? _.isArray(obj) ? slice.call(obj) : isArrayLike(obj) ? _.map(obj, _.identity) : _.values(obj) : []
            }, _.size = function(obj) {
                return null == obj ? 0 : isArrayLike(obj) ? obj.length : _.keys(obj).length
            }, _.partition = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                var pass = [],
                    fail = [];
                return _.each(obj, function(value, key, obj) {
                    (predicate(value, key, obj) ? pass : fail).push(value)
                }), [pass, fail]
            }, _.first = _.head = _.take = function(array, n, guard) {
                if (null != array) return null == n || guard ? array[0] : _.initial(array, array.length - n)
            }, _.initial = function(array, n, guard) {
                return slice.call(array, 0, Math.max(0, array.length - (null == n || guard ? 1 : n)))
            }, _.last = function(array, n, guard) {
                if (null != array) return null == n || guard ? array[array.length - 1] : _.rest(array, Math.max(0, array.length - n))
            }, _.rest = _.tail = _.drop = function(array, n, guard) {
                return slice.call(array, null == n || guard ? 1 : n)
            }, _.compact = function(array) {
                return _.filter(array, _.identity)
            };
            var flatten = function(input, shallow, strict, startIndex) {
                for (var output = [], idx = 0, i = startIndex || 0, length = getLength(input); i < length; i++) {
                    var value = input[i];
                    if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                        shallow || (value = flatten(value, shallow, strict));
                        var j = 0,
                            len = value.length;
                        for (output.length += len; j < len;) output[idx++] = value[j++]
                    } else strict || (output[idx++] = value)
                }
                return output
            };
            _.flatten = function(array, shallow) {
                return flatten(array, shallow, !1)
            }, _.without = function(array) {
                return _.difference(array, slice.call(arguments, 1))
            }, _.uniq = _.unique = function(array, isSorted, iteratee, context) {
                _.isBoolean(isSorted) || (context = iteratee, iteratee = isSorted, isSorted = !1), null != iteratee && (iteratee = cb(iteratee, context));
                for (var result = [], seen = [], i = 0, length = getLength(array); i < length; i++) {
                    var value = array[i],
                        computed = iteratee ? iteratee(value, i, array) : value;
                    isSorted ? (i && seen === computed || result.push(value), seen = computed) : iteratee ? _.contains(seen, computed) || (seen.push(computed), result.push(value)) : _.contains(result, value) || result.push(value)
                }
                return result
            }, _.union = function() {
                return _.uniq(flatten(arguments, !0, !0))
            }, _.intersection = function(array) {
                for (var result = [], argsLength = arguments.length, i = 0, length = getLength(array); i < length; i++) {
                    var item = array[i];
                    if (!_.contains(result, item)) {
                        for (var j = 1; j < argsLength && _.contains(arguments[j], item); j++);
                        j === argsLength && result.push(item)
                    }
                }
                return result
            }, _.difference = function(array) {
                var rest = flatten(arguments, !0, !0, 1);
                return _.filter(array, function(value) {
                    return !_.contains(rest, value)
                })
            }, _.zip = function() {
                return _.unzip(arguments)
            }, _.unzip = function(array) {
                for (var length = array && _.max(array, getLength).length || 0, result = Array(length), index = 0; index < length; index++) result[index] = _.pluck(array, index);
                return result
            }, _.object = function(list, values) {
                for (var result = {}, i = 0, length = getLength(list); i < length; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
                return result
            }, _.findIndex = createPredicateIndexFinder(1), _.findLastIndex = createPredicateIndexFinder(-1), _.sortedIndex = function(array, obj, iteratee, context) {
                iteratee = cb(iteratee, context, 1);
                for (var value = iteratee(obj), low = 0, high = getLength(array); low < high;) {
                    var mid = Math.floor((low + high) / 2);
                    iteratee(array[mid]) < value ? low = mid + 1 : high = mid
                }
                return low
            }, _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex), _.lastIndexOf = createIndexFinder(-1, _.findLastIndex), _.range = function(start, stop, step) {
                null == stop && (stop = start || 0, start = 0), step = step || 1;
                for (var length = Math.max(Math.ceil((stop - start) / step), 0), range = Array(length), idx = 0; idx < length; idx++, start += step) range[idx] = start;
                return range
            };
            var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
                if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
                var self = baseCreate(sourceFunc.prototype),
                    result = sourceFunc.apply(self, args);
                return _.isObject(result) ? result : self
            };
            _.bind = function(func, context) {
                if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                if (!_.isFunction(func)) throw new TypeError("Bind must be called on a function");
                var args = slice.call(arguments, 2),
                    bound = function() {
                        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
                    };
                return bound
            }, _.partial = function(func) {
                var boundArgs = slice.call(arguments, 1),
                    bound = function() {
                        for (var position = 0, length = boundArgs.length, args = Array(length), i = 0; i < length; i++) args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
                        for (; position < arguments.length;) args.push(arguments[position++]);
                        return executeBound(func, bound, this, this, args)
                    };
                return bound
            }, _.bindAll = function(obj) {
                var i, key, length = arguments.length;
                if (length <= 1) throw new Error("bindAll must be passed function names");
                for (i = 1; i < length; i++) key = arguments[i], obj[key] = _.bind(obj[key], obj);
                return obj
            }, _.memoize = function(func, hasher) {
                var memoize = function(key) {
                    var cache = memoize.cache,
                        address = "" + (hasher ? hasher.apply(this, arguments) : key);
                    return _.has(cache, address) || (cache[address] = func.apply(this, arguments)), cache[address]
                };
                return memoize.cache = {}, memoize
            }, _.delay = function(func, wait) {
                var args = slice.call(arguments, 2);
                return setTimeout(function() {
                    return func.apply(null, args)
                }, wait)
            }, _.defer = _.partial(_.delay, _, 1), _.throttle = function(func, wait, options) {
                var context, args, result, timeout = null,
                    previous = 0;
                options || (options = {});
                var later = function() {
                    previous = options.leading === !1 ? 0 : _.now(), timeout = null, result = func.apply(context, args), timeout || (context = args = null)
                };
                return function() {
                    var now = _.now();
                    previous || options.leading !== !1 || (previous = now);
                    var remaining = wait - (now - previous);
                    return context = this, args = arguments, remaining <= 0 || remaining > wait ? (timeout && (clearTimeout(timeout), timeout = null), previous = now, result = func.apply(context, args), timeout || (context = args = null)) : timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining)), result
                }
            }, _.debounce = function(func, wait, immediate) {
                var timeout, args, context, timestamp, result, later = function() {
                    var last = _.now() - timestamp;
                    last < wait && last >= 0 ? timeout = setTimeout(later, wait - last) : (timeout = null, immediate || (result = func.apply(context, args), timeout || (context = args = null)))
                };
                return function() {
                    context = this, args = arguments, timestamp = _.now();
                    var callNow = immediate && !timeout;
                    return timeout || (timeout = setTimeout(later, wait)), callNow && (result = func.apply(context, args), context = args = null), result
                }
            }, _.wrap = function(func, wrapper) {
                return _.partial(wrapper, func)
            }, _.negate = function(predicate) {
                return function() {
                    return !predicate.apply(this, arguments)
                }
            }, _.compose = function() {
                var args = arguments,
                    start = args.length - 1;
                return function() {
                    for (var i = start, result = args[start].apply(this, arguments); i--;) result = args[i].call(this, result);
                    return result
                }
            }, _.after = function(times, func) {
                return function() {
                    if (--times < 1) return func.apply(this, arguments)
                }
            }, _.before = function(times, func) {
                var memo;
                return function() {
                    return --times > 0 && (memo = func.apply(this, arguments)), times <= 1 && (func = null), memo
                }
            }, _.once = _.partial(_.before, 2);
            var hasEnumBug = !{
                    toString: null
                }.propertyIsEnumerable("toString"),
                nonEnumerableProps = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];
            _.keys = function(obj) {
                if (!_.isObject(obj)) return [];
                if (nativeKeys) return nativeKeys(obj);
                var keys = [];
                for (var key in obj) _.has(obj, key) && keys.push(key);
                return hasEnumBug && collectNonEnumProps(obj, keys), keys
            }, _.allKeys = function(obj) {
                if (!_.isObject(obj)) return [];
                var keys = [];
                for (var key in obj) keys.push(key);
                return hasEnumBug && collectNonEnumProps(obj, keys), keys
            }, _.values = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, values = Array(length), i = 0; i < length; i++) values[i] = obj[keys[i]];
                return values
            }, _.mapObject = function(obj, iteratee, context) {
                iteratee = cb(iteratee, context);
                for (var currentKey, keys = _.keys(obj), length = keys.length, results = {}, index = 0; index < length; index++) currentKey = keys[index], results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
                return results
            }, _.pairs = function(obj) {
                for (var keys = _.keys(obj), length = keys.length, pairs = Array(length), i = 0; i < length; i++) pairs[i] = [keys[i], obj[keys[i]]];
                return pairs
            }, _.invert = function(obj) {
                for (var result = {}, keys = _.keys(obj), i = 0, length = keys.length; i < length; i++) result[obj[keys[i]]] = keys[i];
                return result
            }, _.functions = _.methods = function(obj) {
                var names = [];
                for (var key in obj) _.isFunction(obj[key]) && names.push(key);
                return names.sort()
            }, _.extend = createAssigner(_.allKeys), _.extendOwn = _.assign = createAssigner(_.keys), _.findKey = function(obj, predicate, context) {
                predicate = cb(predicate, context);
                for (var key, keys = _.keys(obj), i = 0, length = keys.length; i < length; i++)
                    if (key = keys[i], predicate(obj[key], key, obj)) return key
            }, _.pick = function(object, oiteratee, context) {
                var iteratee, keys, result = {},
                    obj = object;
                if (null == obj) return result;
                _.isFunction(oiteratee) ? (keys = _.allKeys(obj), iteratee = optimizeCb(oiteratee, context)) : (keys = flatten(arguments, !1, !1, 1), iteratee = function(value, key, obj) {
                    return key in obj
                }, obj = Object(obj));
                for (var i = 0, length = keys.length; i < length; i++) {
                    var key = keys[i],
                        value = obj[key];
                    iteratee(value, key, obj) && (result[key] = value)
                }
                return result
            }, _.omit = function(obj, iteratee, context) {
                if (_.isFunction(iteratee)) iteratee = _.negate(iteratee);
                else {
                    var keys = _.map(flatten(arguments, !1, !1, 1), String);
                    iteratee = function(value, key) {
                        return !_.contains(keys, key)
                    }
                }
                return _.pick(obj, iteratee, context)
            }, _.defaults = createAssigner(_.allKeys, !0), _.create = function(prototype, props) {
                var result = baseCreate(prototype);
                return props && _.extendOwn(result, props), result
            }, _.clone = function(obj) {
                return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
            }, _.tap = function(obj, interceptor) {
                return interceptor(obj), obj
            }, _.isMatch = function(object, attrs) {
                var keys = _.keys(attrs),
                    length = keys.length;
                if (null == object) return !length;
                for (var obj = Object(object), i = 0; i < length; i++) {
                    var key = keys[i];
                    if (attrs[key] !== obj[key] || !(key in obj)) return !1
                }
                return !0
            };
            var eq = function(a, b, aStack, bStack) {
                if (a === b) return 0 !== a || 1 / a === 1 / b;
                if (null == a || null == b) return a === b;
                a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
                var className = toString.call(a);
                if (className !== toString.call(b)) return !1;
                switch (className) {
                    case "[object RegExp]":
                    case "[object String]":
                        return "" + a == "" + b;
                    case "[object Number]":
                        return +a !== +a ? +b !== +b : 0 === +a ? 1 / +a === 1 / b : +a === +b;
                    case "[object Date]":
                    case "[object Boolean]":
                        return +a === +b
                }
                var areArrays = "[object Array]" === className;
                if (!areArrays) {
                    if ("object" != typeof a || "object" != typeof b) return !1;
                    var aCtor = a.constructor,
                        bCtor = b.constructor;
                    if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return !1
                }
                aStack = aStack || [], bStack = bStack || [];
                for (var length = aStack.length; length--;)
                    if (aStack[length] === a) return bStack[length] === b;
                if (aStack.push(a), bStack.push(b), areArrays) {
                    if (length = a.length, length !== b.length) return !1;
                    for (; length--;)
                        if (!eq(a[length], b[length], aStack, bStack)) return !1
                } else {
                    var key, keys = _.keys(a);
                    if (length = keys.length, _.keys(b).length !== length) return !1;
                    for (; length--;)
                        if (key = keys[length], !_.has(b, key) || !eq(a[key], b[key], aStack, bStack)) return !1
                }
                return aStack.pop(), bStack.pop(), !0
            };
            _.isEqual = function(a, b) {
                return eq(a, b)
            }, _.isEmpty = function(obj) {
                return null == obj || (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) ? 0 === obj.length : 0 === _.keys(obj).length)
            }, _.isElement = function(obj) {
                return !(!obj || 1 !== obj.nodeType)
            }, _.isArray = nativeIsArray || function(obj) {
                return "[object Array]" === toString.call(obj)
            }, _.isObject = function(obj) {
                var type = typeof obj;
                return "function" === type || "object" === type && !!obj
            }, _.each(["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"], function(name) {
                _["is" + name] = function(obj) {
                    return toString.call(obj) === "[object " + name + "]"
                }
            }), _.isArguments(arguments) || (_.isArguments = function(obj) {
                return _.has(obj, "callee")
            }), "function" != typeof /./ && "object" != typeof Int8Array && (_.isFunction = function(obj) {
                return "function" == typeof obj || !1
            }), _.isFinite = function(obj) {
                return isFinite(obj) && !isNaN(parseFloat(obj))
            }, _.isNaN = function(obj) {
                return _.isNumber(obj) && obj !== +obj
            }, _.isBoolean = function(obj) {
                return obj === !0 || obj === !1 || "[object Boolean]" === toString.call(obj)
            }, _.isNull = function(obj) {
                return null === obj
            }, _.isUndefined = function(obj) {
                return void 0 === obj
            }, _.has = function(obj, key) {
                return null != obj && hasOwnProperty.call(obj, key)
            }, _.noConflict = function() {
                return root._ = previousUnderscore, this
            }, _.identity = function(value) {
                return value
            }, _.constant = function(value) {
                return function() {
                    return value
                }
            }, _.noop = function() {}, _.property = property, _.propertyOf = function(obj) {
                return null == obj ? function() {} : function(key) {
                    return obj[key]
                }
            }, _.matcher = _.matches = function(attrs) {
                return attrs = _.extendOwn({}, attrs),
                    function(obj) {
                        return _.isMatch(obj, attrs)
                    }
            }, _.times = function(n, iteratee, context) {
                var accum = Array(Math.max(0, n));
                iteratee = optimizeCb(iteratee, context, 1);
                for (var i = 0; i < n; i++) accum[i] = iteratee(i);
                return accum
            }, _.random = function(min, max) {
                return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
            }, _.now = Date.now || function() {
                return (new Date).getTime()
            };
            var escapeMap = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#x27;",
                    "`": "&#x60;"
                },
                unescapeMap = _.invert(escapeMap),
                createEscaper = function(map) {
                    var escaper = function(match) {
                            return map[match]
                        },
                        source = "(?:" + _.keys(map).join("|") + ")",
                        testRegexp = RegExp(source),
                        replaceRegexp = RegExp(source, "g");
                    return function(string) {
                        return string = null == string ? "" : "" + string, testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
                    }
                };
            _.escape = createEscaper(escapeMap), _.unescape = createEscaper(unescapeMap), _.result = function(object, property, fallback) {
                var value = null == object ? void 0 : object[property];
                return void 0 === value && (value = fallback), _.isFunction(value) ? value.call(object) : value
            };
            var idCounter = 0;
            _.uniqueId = function(prefix) {
                var id = ++idCounter + "";
                return prefix ? prefix + id : id
            }, _.templateSettings = {
                evaluate: /<%([\s\S]+?)%>/g,
                interpolate: /<%=([\s\S]+?)%>/g,
                escape: /<%-([\s\S]+?)%>/g
            };
            var noMatch = /(.)^/,
                escapes = {
                    "'": "'",
                    "\\": "\\",
                    "\r": "r",
                    "\n": "n",
                    "\u2028": "u2028",
                    "\u2029": "u2029"
                },
                escaper = /\\|'|\r|\n|\u2028|\u2029/g,
                escapeChar = function(match) {
                    return "\\" + escapes[match]
                };
            _.template = function(text, settings, oldSettings) {
                !settings && oldSettings && (settings = oldSettings), settings = _.defaults({}, settings, _.templateSettings);
                var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
                    index = 0,
                    source = "__p+='";
                text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                    return source += text.slice(index, offset).replace(escaper, escapeChar), index = offset + match.length, escape ? source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" : interpolate ? source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" : evaluate && (source += "';\n" + evaluate + "\n__p+='"), match
                }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                try {
                    var render = new Function(settings.variable || "obj", "_", source)
                } catch (e) {
                    throw e.source = source, e
                }
                var template = function(data) {
                        return render.call(this, data, _)
                    },
                    argument = settings.variable || "obj";
                return template.source = "function(" + argument + "){\n" + source + "}", template
            }, _.chain = function(obj) {
                var instance = _(obj);
                return instance._chain = !0, instance
            };
            var result = function(instance, obj) {
                return instance._chain ? _(obj).chain() : obj
            };
            _.mixin = function(obj) {
                _.each(_.functions(obj), function(name) {
                    var func = _[name] = obj[name];
                    _.prototype[name] = function() {
                        var args = [this._wrapped];
                        return push.apply(args, arguments), result(this, func.apply(_, args))
                    }
                })
            }, _.mixin(_), _.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    var obj = this._wrapped;
                    return method.apply(obj, arguments), "shift" !== name && "splice" !== name || 0 !== obj.length || delete obj[0],
                        result(this, obj)
                }
            }), _.each(["concat", "join", "slice"], function(name) {
                var method = ArrayProto[name];
                _.prototype[name] = function() {
                    return result(this, method.apply(this._wrapped, arguments))
                }
            }), _.prototype.value = function() {
                return this._wrapped
            }, _.prototype.valueOf = _.prototype.toJSON = _.prototype.value, _.prototype.toString = function() {
                return "" + this._wrapped
            }, "function" == typeof define && define.amd && define("underscore", [], function() {
                return _
            })
        }).call(this)
    }, {}],
    "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\listen.js": [function(require, module, exports) {
        function wrapSourceFloat(name, source) {
            return name ? floatingSources[name] ? floatingSources[name] : (floatingSources[name] = {
                postMessage: function(payload, origin) {
                    source.postMessage(JSON.parse(payload), origin)
                }
            }, floatingSources[name]) : source
        }

        function wrapParentSource(name, source) {
            if (!name) return source;
            if (parentSources[name]) return parentSources[name];
            var oldpm = source.postMessage;
            return parentSources[name] = {
                postMessage: function(payload, origin) {
                    oldpm(JSON.stringify(payload), origin)
                }
            }, parentSources[name]
        }

        function redirectedMessage(event) {
            event.data = JSON.parse(event.data), event.data.command && "hello" === event.data.command && delete parentSources[event.data.sourceName], event.source = wrapParentSource(event.data.sourceName, event.source), receiveMessage(event)
        }

        function receiveMessage(event) {
            if (event.data && event.data.command) {
                var data = util.clone(event.data);
                return "hello" === data.command ? void 0 === data.sourceName ? void event.source.postMessage({
                    command: "response",
                    status: "FAIL",
                    error: "No source name given",
                    responseId: data.responseId
                }, "*") : sources[data.sourceName] ? void event.source.postMessage({
                    command: "response",
                    status: "FAIL",
                    error: "Source name collision",
                    responseId: data.responseId
                }, "*") : (sources[data.sourceName] = new Source(event.source, data.sourceName, event.origin, data.payload.handle, event.listenWindow), sources[data.sourceName].listen("disconnected", onSourceDisconnected.bind(this, data.sourceName)), _.each(handlers, function(handler, command) {
                    sources[data.sourceName].registerHandler(command, handler)
                }), void event.source.postMessage({
                    command: "response",
                    status: "OK",
                    sourceName: data.sourceName,
                    payload: {
                        theme: util.getV1ThemeObject(themeName, themeSize),
                        themeV2: util.getV2ThemeObject(themeName, themeSize)
                    },
                    responseId: data.responseId,
                    pod: env.POD_ID
                }, "*")) : void(sources[data.sourceName] ? sources[data.sourceName].receive(data, event.origin) : event.source.postMessage({
                    command: "response",
                    status: "FAIL",
                    error: "No source name given",
                    responseId: data.responseId
                }, "*"))
            }
        }

        function onSourceDisconnected(name) {
            delete sources[name]
        }
        window.floatPumpMessage = redirectedMessage;
        var themeName, themeSize, Source = require("./source"),
            util = require("./util"),
            _ = require("underscore"),
            sources = {},
            handlers = {};
        exports.registerHandlers = function(inHandlers) {
            _.each(inHandlers, function(handler, command) {
                handlers[command] = handler
            })
        }, exports.start = function() {
            window.addEventListener("message", receiveMessage, !1)
        };
        var floatingSources = {};
        exports.redirect = function() {
            window.addEventListener("message", function(event) {
                if (window.opener && window.opener.floatPumpMessage && event.data && event.data.command) {
                    "hello" === event.data.command && delete floatingSources[event.data.sourceName];
                    var e = {
                        data: event.data && JSON.stringify(event.data),
                        origin: event.origin,
                        source: wrapSourceFloat(event.data.sourceName, event.source),
                        listenWindow: window
                    };
                    window.opener.floatPumpMessage(e)
                }
            }, !1)
        };
        var parentSources = {};
        exports.addSource = function(source, name) {
            sources[name] = source
        }, exports.removeSource = function(source) {
            delete sources[source.name]
        }, exports.newSource = function(source, name, origin) {
            var result = new Source(source, name, origin);
            return _.each(handlers, function(handler, command) {
                result.registerHandler(command, handler)
            }), result
        }, exports.setUserId = function(id) {
            userId = id
        }, exports.setTheme = function(name, size) {
            themeName = name, themeSize = size
        }
    }, {
        "./source": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\source.js",
        "./util": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\util.js",
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\remoteService.js": [function(require, module, exports) {
        var Q = require("q"),
            _ = require("underscore");
        exports.makeServiceRemotable = function(service) {
            function remoteFire(source, method, args) {
                return source.send("fire", {
                    name: service.xlat || service.name,
                    method: method,
                    args: args
                }).timeout(500)
            }

            function onDisconnected(disconnectedSource) {
                var pos = _.findIndex(service.sources, function(source) {
                    return source.name === disconnectedSource.name
                });
                pos !== -1 && service.sources.splice(pos, 1)
            }
            var fire = service.fire;
            service.sources = [], service.attachSource = function(source) {
                service.sources.push(source), source.listen("disconnected", onDisconnected.bind(this, source))
            }, service.fire = function(method) {
                var args = Array.prototype.slice.call(arguments, 1),
                    promises = [],
                    result = fire.apply(service, [method].concat(args));
                return _.each(service.sources, function(source) {
                    promises.push(remoteFire(source, method, args))
                }), result || 0 === promises.length ? result : Q.all(promises).then(function(results) {
                    var result = _.find(results, function(result) {
                        return void 0 !== result
                    });
                    return Q(result)
                })
            }, service.firedRemotely = function(firedSource, method, args) {
                var promises = [];
                _.each(service.sources, function(source) {
                    firedSource && source.name === firedSource.name || promises.push(remoteFire(source, method, args))
                });
                var result = fire.apply(service, [method].concat(args));
                return 0 === promises.length ? result : (promises.unshift(Q(result)), Q.allSettled(promises).then(function(results) {
                    var result = _.find(results, function(result) {
                        return "fulfilled" === result.state && void 0 !== result.value
                    });
                    return Q(result && result.value)
                }))
            }
        }
    }, {
        q: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\q\\q.js",
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\source.js": [function(require, module, exports) {
        function Source(sourceWindow, sourceName, origin, handle, listenWindow) {
            this.events = SYMPHONY.services.makeAnonymousService(), this.source = sourceWindow, this.name = sourceName, this.origin = origin, this.handlers = {}, this.pending = {}, this.services = [], this.listen = this.events.listen.bind(this.events), this.fire = this.events.fire.bind(this.events), LOG && console.log("new Source", this.name, document.location.href), handle && (listenWindow ? listenWindow.SYMPHONY.services.listen("closing", this.disconnect.bind(this)) : watchSources[this.name] = this)
        }
        var Q = require("q"),
            util = require("./util"),
            _ = require("underscore"),
            LOG = (window.MutationObserver || window.WebKitMutationObserver, !1),
            watchSources = {};
        setInterval(function() {
            _.each(watchSources, function(source) {
                try {
                    source.source.parent || (source.disconnect(), delete watchSources[source.name])
                } catch (e) {
                    source.disconnect(), delete watchSources[source.name]
                }
            })
        }, 500), Source.prototype = {
            makeResponseId: function() {
                return _.uniqueId("response_")
            },
            registerHandler: function(command, handler) {
                this.handlers[command] = handler
            },
            send: function(command, payload) {
                payload && (payload = util.clone(payload));
                var responseId = this.makeResponseId();
                this.pending[responseId] = Q.defer();
                var response = util.clone({
                    command: command,
                    sourceName: this.name,
                    responseId: responseId,
                    payload: payload
                });
                LOG && console.log("send", command, this.name, payload, responseId, document.location.href);
                try {
                    return this.source.postMessage ? (this.source.postMessage(response, "*"), this.pending[responseId].promise) : (delete this.pending[responseId], Q(void 0))
                } catch (e) {
                    return delete this.pending[responseId], Q(void 0)
                }
            },
            sendError: function(data, error) {
                LOG && console.log("sendError", data, error, document.location.href), this.source.postMessage && this.source.postMessage({
                    command: "response",
                    status: "FAIL",
                    sourceName: this.name,
                    error: error,
                    responseId: data.responseId
                }, "*")
            },
            sendResponse: function(data, payload) {
                LOG && console.log("sendResponse", data, payload, document.location.href);
                try {
                    this.source.postMessage({
                        command: "response",
                        status: "OK",
                        sourceName: this.name,
                        payload: payload,
                        responseId: data.responseId
                    }, "*")
                } catch (e) {
                    console.log(e.stack), this.source.postMessage({
                        command: "response",
                        status: "OK",
                        sourceName: this.name,
                        payload: {},
                        responseId: data.responseId
                    }, "*")
                }
            },
            receive: function(data, origin) {
                LOG && console.log("recieve", this.name, data, document.location.href), origin !== this.origin && "*" !== this.origin && this.sendError(data, "invalid origin"), "response" === data.command ? "OK" !== data.status ? (this.pending[data.responseId].reject(new Error(data.error)), delete this.pending[data.responseId]) : (this.pending[data.responseId].resolve(data.payload), delete this.pending[data.responseId]) : this.handlers[data.command] && (data.payload.responseId = data.responseId, this.handlers[data.command](this, data.payload))
            },
            addService: function(service) {
                this.services.push(service)
            },
            validSource: function(spec) {
                var parsed = util.parseUrl(this.origin),
                    hostname = parsed.hostname;
                return hostname.slice(-spec.length) === spec
            },
            disconnect: function() {
                _.each(this.services, function(service) {
                    service.fire("disconnected"), SYMPHONY.services.remove(service.name)
                }, this), this.fire("disconnected"), this.observer && this.observer.disconnect()
            },
            onChanged: function() {
                this.disconnect()
            }
        }, module.exports = Source
    }, {
        "./util": "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\util.js",
        q: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\q\\q.js",
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }],
    "C:\\dev\\NEXUS\\packages\\applications\\src\\messaging\\util.js": [function(require, module, exports) {
        function getV1Theme(theme) {
            return {
                dark: "dark",
                light: "light",
                "dark-contrast": "dark",
                "light-contrast": "light"
            }[theme]
        }

        function getV2Theme(theme) {
            return theme
        }
        var _ = require("underscore");
        exports.clone = function(value) {
            try {
                return JSON.parse(JSON.stringify(value))
            } catch (e) {
                return void console.log(e.stack)
            }
        }, exports.parseUrl = function(url) {
            var qs, parser = document.createElement("a");
            return parser.href = url, qs = parser.search, qs ? parser.parts = _.object(_.compact(_.map(qs.slice(1).split("&"), function(item) {
                if (item) return item.split("=")
            }))) : parser.parts = {}, parser
        }, exports.getV1ThemeObject = function(name, size) {
            return {
                name: getV1Theme(name),
                size: size || "normal"
            }
        }, exports.getV2ThemeObject = function(name, size) {
            return {
                name: getV2Theme(name),
                size: size || "normal",
                classes: ["dark", "light", "small", "xsmall", "normal", "large", "dark-contrast", "light-contrast"]
            }
        }
    }, {
        underscore: "C:\\dev\\NEXUS\\packages\\applications\\node_modules\\underscore\\underscore.js"
    }]
}, {}, ["./src/external-api/symphony-api.js"]);