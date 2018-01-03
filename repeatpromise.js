/**
 * Created by Masayuki Nii (nii@msyk.net) on 2017/01/22.
 * License: MIT License.
 */

class RepeatPromise {
    constructor(repeatTimes, parentResolve, parentCatch, repeatTask, postTask, afterRepeatTask, condition, debug) {
        this.repeatTimes = repeatTimes;
        this._parentResolve = parentResolve;
        this._parentCatch = parentCatch;
        this._repeatTask = repeatTask;
        this._postTask = postTask;
        this._afterRepeatTask = afterRepeatTask;
        this._condition = condition;
        this.isFinishRepeat = false;
        this.debug = !!debug;
        this.debug = true;
    }

    repeat() {
        this.repeatImpl(0);
        return this;
    }

    repeatImpl(counter) {
        // if (this._condition && !this._condition(counter, this.repeatTimes)) {
        //     this._parentResolve ? this._parentResolve(this) : false;
        //     return;
        // }
        let conditionResult = true;
        if (this._condition) {
            conditionResult = this._condition(counter, this.repeatTimes);
        }
        if (!(conditionResult && counter < this.repeatTimes)) {
            this.isFinishRepeat = true;
            this._afterRepeatTask ? this._afterRepeatTask() : false;
            this._parentResolve ? this._parentResolve(this) : false;
            return;
        }
        const self = this;
        new Promise(function (resolve, reject) {
            if (self.debug) {
                console.log("Promise start");
            }
            self._repeatTask ? self._repeatTask(counter, resolve, reject) : false;
        }).then(function (value) {
            if (self.debug) {
                console.log("Promise then");
            }
            self._postTask ? self._postTask(counter, value) : false;
            counter++;
            self.repeatImpl(counter);
        }).catch(function (reason) {
            if (self.debug) {
                console.log("Promise catch: " + reason);
            }
            self._parentCatch ? self._parentCatch(reason) : false;
        });
    }

    repeatTask(closure) {
        this._repeatTask = closure;
        return this;
    }

    postTask(closure) {
        this._postTask = closure;
        return this;
    }

    conditionTask(closure) {
        this._condition = closure;
        return this;
    }

    afterRepeatTask(closure) {
        this._afterRepeatTask = closure;
        if (this.isFinishRepeat) {
            this._afterRepeatTask();
        }
        return this;
    }

    static getData(key) {
        if (repeatPromiseDataStore[key] !== undefined) {
            return repeatPromiseDataStore[key];
        }
        return null;
    }

    static setData(key, value) {
        repeatPromiseDataStore[key] = value;
    }

    static clearDataStore() {
        repeatPromiseDataStore = {};
    }

}

const repeatPromiseDataStore = {};

class ConditionalPromise {
    constractor(param) {
        this.param = param;
        conditionalProcess();
    }

    conditionalProcess() {
        var i, item;
        for item of this.param{
            if (item.if()) {
                new Promise((resolve, reject) => {
                    if(item.execute) {
                        item.execute(resolve, reject);
                    } else {
                        resolve();
                    }
                }).then((value) => {
                    item.postTask?item.postTask(value):false;
                }).catch(() => {
                    item.catchTask?item.catchTask():false;
                });
            }
        }
    }

}