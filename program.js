/**
 * Created by msyk on 2017/01/21.
 */

var urls = [
    "https://server.msyk.net/index.html",
    "https://server.msyk.net/10m.txt",
    "https://server.msyk.net/10m.txt",
    "https://server.msyk.net/10m.txt",
    "https://server.msyk.net/10m.txt",
    "https://server.msyk.net/10m.txt",
    "https://server.msyk.net/10m.txt"
];

/* ==============================================================================
 * Repeating synchronized communication task.
 */
function accessSync() {
    var index, request, total = 0;
    for (index = 0; index < urls.length && total < 100000; index++) {
        console.log("Start: ", urls[index]);
        request = new XMLHttpRequest();
        request.open("post", urls[index], false);
        request.send();
        console.log(urls[index], request.responseText.length);
        total += request.responseText.length;
    }
    return total;
}

/* ==============================================================================
 * Repeating with Promise task.
 */
function accessAsync1() {
    var repeatTimes = 3;
    repeatTask1(0, repeatTimes);
}

function repeatTask1(counter, repeatTimes) {
    new Promise(function (resolve, reject) {
        console.log("Start: ", counter, urls[counter]);
        resolve();
    }).then(function () {
        counter++;
        if (counter < repeatTimes) {
            repeatTask1(counter, repeatTimes);
        }
    });
}

/* ==============================================================================
 * Repeating asynchronized communication task.
 */
function accessAsync2() {
    var repeatTimes = 3;
    total = 0;
    repeatTask2(0, repeatTimes);
}

var total;
var dataStore = {};

function repeatTask2(counter, repeatTimes) {
    new Promise(function (resolve, reject) {
        console.log("#Start: ", urls[counter]);
        var request = new XMLHttpRequest();
        request.open("post", urls[counter]);
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("#", urls[counter], request.responseText.length);
                    total += request.responseText.length;
                    resolve();
                } else {
                    reject();
                }
            }
        };
        request.send();
    }).then(function () {
        counter++;
        if (counter < repeatTimes && total < 30000000) {
            repeatTask2(counter, repeatTimes);
        }
    });
}

/* ==============================================================================
 * Repeating asynchronized communication task with shared data.
 */
function accessAsync3() {
    var repeatTimes = 3;
    total = 0;
    repeatTask3(0, repeatTimes, "test1");
}

function repeatTask3(counter, repeatTimes, storeId) {
    if (counter == 0) {
        dataStore[storeId] = {total: 0};
    }
    new Promise(function (resolve, reject) {
        console.log("%Start: ", urls[counter]);
        var request = new XMLHttpRequest();
        request.open("post", urls[counter]);
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("%", urls[counter], request.responseText.length);
                    dataStore[storeId]["total"] += request.responseText.length;
                    resolve();
                } else {
                    reject();
                }
            }
        };
        request.send();
    }).then(function () {
        counter++;
        if (counter < repeatTimes && dataStore[storeId]["total"] < 30000000) {
            repeatTask3(counter, repeatTimes, storeId);
        }
    });
}

/* ==============================================================================
 * Repeating asynchronized communication task as double loops.
 */
function accessAsync4() {
    total = 0;
    repeatTask4(0, 4, "test1");
}

function repeatTask4(counter, repeatTimes) {
    var totalCount = 4;
    new Promise(function (resolve, reject) {
        console.log("&&&&&& Start: ", counter);
        subRepeatTask4(0, totalCount, "test1", resolve, reject);
    }).then(function () {
        counter++;
        if (counter < repeatTimes) {
            repeatTask4(counter, totalCount);
        }
    }).catch(function (reason) {
        console.log("&&&&&& Promise.catch", reason);
    });
}

function subRepeatTask4(counter, repeatTimes, storeId, parentResolve, parentCatch) {
    if (counter == 0) {
        dataStore[storeId] = {total: 0};
    }
    new Promise(function (resolve, reject) {
        console.log("%Start: ", urls[counter]);
        var request = new XMLHttpRequest();
        request.open("post", urls[counter]);
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("%", urls[counter], request.responseText.length);
                    resolve(request);
                } else {
                    reject(request);
                }
            }
        };
        request.send();
    }).then(function (value) {
        console.log("% Promise.then", value);

        dataStore[storeId]["total"] += value.responseText.length;

        counter++;
        if (counter < repeatTimes && dataStore[storeId]["total"] < 20000000) {
            subRepeatTask4(counter, repeatTimes, storeId, parentResolve, parentCatch);
        } else {
            parentResolve();
        }
    }).catch(function (reason) {
        console.log("% Promise.catch", reason);
        parentCatch();
    });

}

/* ==============================================================================
 * Repeating asynchronized communication task with multiple loop function.
 */
function accessAsync5() {
    dataStore["test2"] = {};
    repeatTask(0, 3, "test2", null, null,
        function (counter, storeId, resolve, reject) {
            console.log("Level1:", counter);
            repeatTask(0, 4, "test2", resolve, reject,
                function (counter, storeId, resolve, reject) {
                    console.log("Level2:", counter);
                    resolve(); // or reject();
                },
                null, null);
        },
        null, null);
}

function repeatTask(counter, repeatTimes, storeId, parentResolve, parentCatch, preTask, postTask, condition) {
    if (!dataStore[storeId]) {
        dataStore[storeId] = {};
    }
    if (condition && !condition(counter, storeId, repeatTimes)) {
        return;
    }
    var conditionResult = true;
    if (condition) {
        conditionResult = condition(counter, storeId, repeatTimes);
    }
    if (!(conditionResult && counter < repeatTimes)) {
        parentResolve ? parentResolve() : false;
        return;
    }
    new Promise(function (resolve, reject) {
        console.log("Promise start");
        preTask ? preTask(counter, storeId, resolve, reject) : false;
    }).then(function (value) {
        console.log("Promise then");
        postTask ? postTask(counter, storeId, value) : false;
        counter++;
        repeatTask(counter, repeatTimes, storeId, parentResolve, parentCatch, preTask, postTask, condition);
    }).catch(function (reason) {
        console.log("Promise catch: " + reason);
        parentCatch ? parentCatch(reason) : false;
    });
}

/* ==============================================================================
 * Repeating simple Promise task with multiple loop function.
 */
function accessAsync6() {
    repeatTask(0, 3, "test2", null, null,
        function (counter, storeId, resolve1, reject1) {
            dataStore[storeId]["Level1"] = counter;
            repeatTask(0, 4, "test2", resolve1, reject1,
                function (counter, storeId, resolve2, reject2) {
                    dataStore[storeId]["Level2"] = counter;
                    repeatTask(0, 4, "test2", resolve2, reject2,
                        function (counter, storeId, resolve, reject) {
                            console.log("indices:", dataStore[storeId]["Level1"], dataStore[storeId]["Level2"], counter);
                            resolve(); // or reject();
                        },
                        null, null);
                },
                null, null);
        },
        null, null);
}

/* ==============================================================================
 * Repeating asynchronized communication task with multiple loops.
 */
function accessAsync7() {
    dataStore["test2"] = {};
    dataStore["test2"]["total"] = 0;
    repeatTask(0, 3, "test2", null, null,
        function (counter, storeId, resolve1, reject1) {
            dataStore[storeId]["Level1"] = counter;
            repeatTask(0, 4, "test2", resolve1, reject1,
                function (counter, storeId, resolve2, reject2) {
                    dataStore[storeId]["Level2"] = counter;
                    repeatTask(0, 3, "test2", resolve2, reject2, preTask, postTask, conditionTask);
                },
                null, null);
        },
        null, null);
}

// -----------------------------------------------------------------
function preTask(counter, storeId, resolve, reject) {
    console.log("indices:", dataStore[storeId]["Level1"], dataStore[storeId]["Level2"], counter);
    try {
        var index = /*dataStore[storeId]["Level1"] * 3 + dataStore[storeId]["Level2"] * 4 +*/ counter;
        var request = new XMLHttpRequest();
        request.open("post", urls[index]);
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("%", urls[index], request.responseText.length);
                    dataStore[storeId]["total"] += request.responseText.length;
                    resolve();
                } else {
                    reject();
                }
            }
        };
        request.send();
    } catch (e) {
        reject(e);
    }
}

function conditionTask(counter, storeId, repeatTimes) {
    return dataStore[storeId]["total"] < 40000000;
}

function postTask(counter, storeId, value) {

}

/* ==============================================================================
 * Repeating simple Promise communication task with RepeatPromise class.
 */
function accessAsync8() {
    var storeIdMaster = "id";
    // dataStore[storeIdMaster] = {};
    //
    new RepeatPromise(3, storeIdMaster, null, null).repeatTask(
        function (repeatPromise, counter, resolve1, reject1) {
            repeatPromise.setData("Level1", counter);
            //
            new RepeatPromise(5, storeIdMaster, resolve1, reject1).repeatTask(
                function (repeatPromise, counter, resolve2, reject2) {
                    repeatPromise.setData("Level2", counter);
                    //
                    new RepeatPromise(4, storeIdMaster, resolve2, reject2).repeatTask(
                        function (repeatPromise, counter, resolve, reject) {
                            console.log("indices:",
                                repeatPromise.getData("Level1"),
                                repeatPromise.getData("Level2"), counter);
                            resolve(); // or reject();
                        }).repeat();
                }).repeat();
        }).repeat();
}

/* ==============================================================================
 * Repeating asynchronized communication task RepeatPromise class.
 */
function accessAsync9() {
    var storeIdMaster = "id";
    // dataStore[storeIdMaster] = {total: 0};
    //
    new RepeatPromise(3, storeIdMaster, null, null).repeatTask(
        function (repeatPromise, counter, resolve1, reject1) {
            repeatPromise.setData("Level1", counter);
            //
            new RepeatPromise(5, storeIdMaster, resolve1, reject1).repeatTask(
                function (repeatPromise, counter, resolve2, reject2) {
                    repeatPromise.setData("Level2", counter);
                    //
                    new RepeatPromise(4, storeIdMaster, resolve2, reject2)
                        .repeatTask(repeatingTask)
                        .postTask(postRepeatTask)
                        .conditionTask(conditionRepeatTask)
                        .repeat();
                }).repeat();
        }).repeat();
}

function repeatingTask(repeatPromise, counter, resolve, reject) {
    console.log("indices:", repeatPromise.getData("Level1"), repeatPromise.getData("Level2"), counter);
    try {
        var index = repeatPromise.getData("Level1") * 3 + repeatPromise.getData("Level2") * 4 + counter;
        var request = new XMLHttpRequest();
        request.open("post", urls[index]);
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log("%", urls[index], request.responseText.length);
                    repeatPromise.setData("total",
                        repeatPromise.getData("total") + request.responseText.length);
                    resolve();
                } else {
                    reject();
                }
            }
        };
        request.send();
    } catch (e) {
        reject(e);
    }
}

function conditionRepeatTask(repeatPromise, counter, repeatTimes) {
    return repeatPromise.getData("total") < 60000000;
}

function postRepeatTask(repeatPromise, counter, value) {
    console.log("% postRepeatTask", counter);
}


