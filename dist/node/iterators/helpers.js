'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

exports.__esModule = true;
exports.isThread = isThread;

var _core = require('../core');

var _types = require('../helpers/types');

var _gcc = require('../helpers/gcc');

/**
 * Appends a filter to the operation
 *
 * @param {...($$CollectionFilter|Array<$$CollectionFilter>|undefined)} filter - function filter
 * @return {!Collection}
 */
_core.Collection.prototype.filter = function (filter) {
	let args = [];
	for (let i = 0; i < arguments.length; i++) {
		const el = arguments[i];

		if (el) {
			args = args.concat(el);
		}
	}

	this.p.filter = this.p.filter.concat.apply(this.p.filter, args);
	return this;
};

/**
 * Appends a filter to the operation
 *
 * @private
 * @param {...?} filter - function filter
 * @return {!Collection}
 */
_core.Collection.prototype._filter = function (filter) {
	let args = [];
	for (let i = 0; i < arguments.length; i++) {
		let el = arguments[i];

		if (i === 0) {
			if (!el || !el.filter) {
				continue;
			}

			el = [el.filter, delete el.filter][0];
		}

		if (el) {
			args = args.concat(el);
		}
	}

	this.p.filter = this.p.filter.concat.apply(this.p.filter, args);
	return this;
};

/**
 * @param {?} p
 * @return {?}
 */
function isThread(p) {
	if (p.hasOwnProperty('priority') || p.onChunk) {
		p.thread = true;
	}

	return p;
}

/**
 * @private
 * @param {?} p
 * @return {!Collection}
 */
_core.Collection.prototype._isThread = function (p) {
	isThread(p);
	return this;
};

/**
 * Marks the operation as thread
 *
 * @param {(?string|$$CollectionThreadCb)=} [opt_priority] - thread priority (low, normal, hight, critical)
 * @param {?$$CollectionThreadCb=} [opt_onChunk] - callback function for chunks
 * @return {!Collection}
 */
_core.Collection.prototype.thread = function (opt_priority, opt_onChunk) {
	if ((0, _types.isFunction)(opt_priority)) {
		opt_onChunk = (0, _gcc.any)(opt_priority);
		opt_priority = null;
	}

	this.p.thread = true;

	if (opt_priority) {
		this.p.priority = opt_priority;
	}

	if (opt_onChunk) {
		this.p.onChunk = opt_onChunk;
	}

	return this;
};

/**
 * Sets .startIndex for the operation
 *
 * @param {number} value - source value
 * @return {!Collection}
 */
_core.Collection.prototype.start = function (value) {
	this.p.startIndex = value;
	return this;
};

/**
 * Sets .endIndex for the operation
 *
 * @param {number} value - source value
 * @return {!Collection}
 */
_core.Collection.prototype.end = function (value) {
	this.p.endIndex = value;
	return this;
};

/**
 * Sets .from for the operation
 *
 * @param {number} value - source value
 * @return {!Collection}
 */
_core.Collection.prototype.from = function (value) {
	this.p.from = value;
	return this;
};

/**
 * Sets .count for the operation
 *
 * @param {number} value - source value
 * @return {!Collection}
 */
_core.Collection.prototype.count = function (value) {
	this.p.count = value;
	return this;
};

Object.defineProperties(_core.Collection.prototype, /** @lends {Collection.prototype} */{
	one: {
		/**
   * Sets .mult to false for the operation
   * @return {!Collection}
   */
		get() {
			this.p.mult = false;
			return this;
		}
	},

	inverse: {
		/**
   * Sets .inverseFilter to true for the operation
   * @return {!Collection}
   */
		get() {
			this.p.inverseFilter = true;
			return this;
		}
	},

	reverse: {
		/**
   * Sets .reverse to true for the operation
   * @return {!Collection}
   */
		get() {
			this.p.reverse = true;
			return this;
		}
	}
});