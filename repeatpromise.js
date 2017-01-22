/**
 * Created by Masayuki Nii (nii@msyk.net) on 2017/01/22.
 * License: MIT License.
 */

function RepeatPromise(repeatTimes, storeId, parentResolve, parentCatch, repeatTask, postTask, condition, debug) {
    this.repeatTimes = repeatTimes;
    this.storeId = storeId;
    this._parentResolve = parentResolve;
    this._parentCatch = parentCatch;
    this._repeatTask = repeatTask;
    this._postTask = postTask;
    this._condition = condition;
    this.debug = !!debug;
    this.debug = true;
}

RepeatPromise.prototype.repeatTask = function (closure) {
    this._repeatTask = closure;
    return this;
};

RepeatPromise.prototype.postTask = function (closure) {
    this._postTask = closure;
    return this;
};

RepeatPromise.prototype.conditionTask = function (closure) {
    this._condition = closure;
    return this;
};

RepeatPromise.prototype.repeat = function () {
    this.repeatImpl(0);
};

RepeatPromise.prototype.repeatImpl = function (counter) {
    if (this._condition && !this._condition(this, counter, this.repeatTimes)) {
        this._parentResolve ? this._parentResolve(this) : false;
        return;
    }
    var conditionResult = true;
    if (this._condition) {
        conditionResult = this._condition(this, counter, this.repeatTimes);
    }
    if (!(conditionResult && counter < this.repeatTimes)) {
        this._parentResolve ? this._parentResolve(this) : false;
        return;
    }
    var self = this;
    new Promise(function (resolve, reject) {
        if (self.debug) {
            console.log("Promise start");
        }
        self._repeatTask ? self._repeatTask(self, counter, resolve, reject) : false;
    }).then(function (value) {
        if (self.debug) {
            console.log("Promise then");
        }
        self._postTask ? self._postTask(self, counter, value) : false;
        counter++;
        self.repeatImpl(counter);
    }).catch(function (reason) {
        if (self.debug) {
            console.log("Promise catch: " + reason);
        }
        this._parentCatch ? this._parentCatch(reason) : false;
    });
};

RepeatPromise.prototype.setData = function (key, value) {
    if (!RepeatPromiseDataStore[this.storeId]) {
        RepeatPromiseDataStore[this.storeId] = {};
    }
    RepeatPromiseDataStore[this.storeId][key] = value;
};

RepeatPromise.prototype.getData = function (key) {
    if (!RepeatPromiseDataStore[this.storeId]) {
        RepeatPromiseDataStore[this.storeId] = {};
    }
    if (RepeatPromiseDataStore[this.storeId][key]) {
        return RepeatPromiseDataStore[this.storeId][key];
    }
    return 0;
};

RepeatPromise.prototype.clearDataStore = function () {
    RepeatPromiseDataStore[this.storeId] = {};
};

var RepeatPromiseDataStore = {};