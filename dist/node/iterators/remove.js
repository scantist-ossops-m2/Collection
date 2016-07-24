'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

var _core = require('../core');

var _base = require('../consts/base');

var _types = require('../helpers/types');

var _link = require('../helpers/link');

var _gcc = require('../helpers/gcc');

/**
 * Removes elements from the collection by the specified condition/link
 *
 * @see Collection.prototype.forEach
 * @param {($$CollectionFilter|$$CollectionBase|$$CollectionLink)=} [opt_filter] - link, function filter or an array of functions
 * @param {?$$CollectionBase=} [opt_params] - additional parameters
 * @return {($$CollectionReport|!Promise<$$CollectionReport>)}
 */
_core.Collection.prototype.remove = function (opt_filter, opt_params) {
	let p = opt_params || {};

	if (!(0, _types.isFunction)(opt_filter) && ((0, _types.isArray)(opt_filter) && !(0, _types.isFunction)(opt_filter[1]) || opt_filter != null && typeof opt_filter !== 'object')) {
		return (0, _link.byLink)(this.data, opt_filter, { delete: true });
	}

	if (!(0, _types.isArray)(opt_filter) && !(0, _types.isFunction)(opt_filter)) {
		p = opt_filter || p;
		opt_filter = null;
	}

	this._filter(p, opt_filter);
	p = (0, _gcc.any)(Object.assign(Object.create(this.p), p));

	const type = (0, _types.getType)(this.data, p.use);

	if ({ 'iterator': true, 'generator': true }[type]) {
		throw new TypeError('Incorrect data type');
	}

	const mult = p.mult !== false,
	      res = [],
	      splice = [].splice;

	if (mult) {
		p.result = res;
	} else {
		p.result = {
			notFound: true,
			result: false,
			key: undefined,
			value: undefined
		};
	}

	let fn;
	switch (type) {
		case 'map':
			fn = (value, key, data) => {
				data.delete(key);
				const o = {
					result: !data.has(key),
					key,
					value
				};

				if (mult) {
					res.push(o);
				} else {
					p.result = o;
				}
			};

			break;

		case 'set':
			fn = (value, key, data) => {
				data.delete(value);
				const o = {
					result: !data.has(value),
					key: null,
					value
				};

				if (mult) {
					res.push(o);
				} else {
					p.result = o;
				}
			};

			break;

		case 'array':
			if (p.reverse) {
				fn = (value, key, data) => {
					splice.call(data, key, 1);
					const o = {
						result: data[key] !== value,
						key,
						value
					};

					if (mult) {
						res.push(o);
					} else {
						p.result = o;
					}
				};
			} else {
				let rm = 0;
				if (p.live) {
					fn = (value, key, data, ctx) => {
						splice.call(data, key, 1);
						ctx.i(-1);
						const o = {
							result: data[key] !== value,
							key: key + rm,
							value
						};

						if (mult) {
							res.push(o);
						} else {
							p.result = o;
						}

						rm++;
					};
				} else {
					fn = (value, key, data, ctx) => {
						const ln = ctx.length();
						const f = length => {
							if (rm === length) {
								return false;
							}

							splice.call(data, key, 1);
							ctx.i(-1);

							const o = {
								result: data[key] !== value,
								key: key + rm,
								value
							};

							if (mult) {
								res.push(o);
							} else {
								p.result = o;
							}

							rm++;
						};

						if ((0, _types.isNumber)(ln)) {
							f(ln);
						} else {
							return ctx.wait(ln).then(f, fn[_base.ON_ERROR]);
						}
					};
				}
			}

			break;

		default:
			fn = (value, key, data) => {
				delete data[key];
				const o = {
					result: key in data === false,
					key,
					value
				};

				if (mult) {
					res.push(o);
				} else {
					p.result = o;
				}
			};
	}

	const returnVal = (0, _gcc.any)(this.forEach((0, _gcc.any)(fn), p));

	if (returnVal !== this) {
		return returnVal;
	}

	return p.result;
};