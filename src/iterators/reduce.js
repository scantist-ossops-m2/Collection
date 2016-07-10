'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

import { Collection } from '../core';
import { FN_LENGTH } from '../consts/base';
import { isArray, isFunction } from '../helpers/types';
import { any } from '../helpers/gcc';

/**
 * Reduces the collection by the specified condition
 *
 * @see Collection.prototype.forEach
 * @param {$$CollectionReduceCb} cb - callback function
 * @param {?=} [opt_initialValue] - initial value
 * @param {($$CollectionFilter|$$CollectionBase)=} [opt_filter] - function filter or an array of functions
 * @param {?$$CollectionBase=} [opt_params] - additional parameters
 * @return {(?|!Promise)}
 */
Collection.prototype.reduce = function (cb, opt_initialValue, opt_filter, opt_params) {
	let p = any(opt_params || {});
	if (!isArray(opt_filter) && !isFunction(opt_filter)) {
		p = opt_filter || p;
		opt_filter = null;
	}

	p.result = opt_initialValue;
	p.filter = opt_filter;

	fn[FN_LENGTH] = cb.length - 1;
	function fn(el) {
		if (opt_initialValue == null) {
			p.result = el;
			opt_initialValue = true;

		} else {
			p.result = cb.apply(null, [p.result].concat([].slice.call(arguments)));
		}
	}

	const
		returnVal = any(this.forEach(fn, p));

	if (returnVal !== this) {
		return returnVal;
	}

	return p.result;
};
