'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

exports.__esModule = true;
exports.Collection = Collection;
exports.P = P;
exports.default = $C;

var _gcc = require('./helpers/gcc');

var _types = require('./helpers/types');

/**
 * Collection constructor
 *
 * @constructor
 * @implements {$$Collection}
 * @param {$$CollectionType} obj
 */
function Collection(obj) {
	this._init();

	if ((0, _types.isString)(obj)) {
		this.data = obj.split('');
	} else if ((0, _types.isNumber)(obj)) {
		if (isFinite(obj)) {
			this.data = new Array(obj);
		} else {
			let done = false,
			    value;

			this.p.use = 'for of';
			this.data = {
				next: () => ({ done, value }),

				throw(err) {
					throw err;
				},

				return: v => {
					done = true;
					value = v;
				}
			};
		}
	} else {
		this.data = (0, _gcc.any)(obj || []);
	}
}

/**
 * @private
 * @return {!Object}
 */
Collection.prototype._init = function () {
	const old = this.p;
	this.p = new P();
	return old;
};

/** @constructor */
function P() {
	Object.assign(this, {
		mult: true,
		count: false,
		from: false,
		startIndex: false,
		endIndex: false,
		reverse: false,
		inverseFilter: false,
		withDescriptor: false,
		notOwn: false,
		live: false,
		async: false,
		thread: false,
		length: true,
		parallel: false,
		race: false,
		filter: []
	}, $C.config);
}

Object.assign($C, { config: {} });

/**
 * Library version
 * @const
 */
Collection.prototype.VERSION = [6, 6, 2];

/**
 * Creates an instance of Collection
 * @param {$$CollectionType} obj
 */
function $C(obj) {
	return new Collection(obj);
}