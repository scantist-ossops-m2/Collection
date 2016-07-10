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
import { isLink } from '../helpers/link';
import { getType, isFunction, isArray } from '../helpers/types';
import { any } from '../helpers/gcc';

//#if link
import { byLink } from '../other/link';
//#endif

/**
 * Sets a new value for collection elements by the specified condition/link
 *
 * @see Collection.prototype.forEach
 * @param {(?|$$CollectionCb)} value - new value (function will execute)
 * @param {($$CollectionFilter|$$Collection_set|$$CollectionLink)=} filter - link, function filter or an array of functions
 * @param {?$$Collection_set=} [opt_params] - additional parameters:
 *
 *   *) [key] - key (null for array.push) of a new element (if search elements nof found)
 *   *) [create = true] - if false, in the absence of the requested property will be thrown an exception, otherwise it will be created
 *
 * @return {({result, key, value}|!Array<{result, key, value}>|!Promise<(({result, key, value}|!Array<{result, key, value}>)>)}
 */
Collection.prototype.set = function (value, filter, opt_params) {
	let p = any(opt_params || {});

	const
		{data} = this;

	if (
		isLink(filter) ||
		!isFunction(filter) && (
			isArray(filter) && !isFunction(filter[1]) ||
			filter != null && typeof filter !== 'object'
		)

	) {
		const tmp = byLink(data, filter, {value, create: p.create !== false, error: true});
		p.onComplete && p.onComplete(tmp);
		return tmp;
	}

	if (!isArray(filter) && !isFunction(filter)) {
		p = filter || p;
		filter = null;
	}

	const
		type = getType(data, p.use),
		isFunc = isFunction(value);

	const
		mult = p.mult !== false,
		report = [];

	if (mult) {
		p.result = report;
	}

	let action;
	if (isFunc) {
		switch (type) {
			case 'map':
				action = function (el, key, data) {
					const
						res = value.apply(null, arguments);

					let
						status = res === undefined;

					if (res !== undefined && data.get(key) !== res) {
						data.set(key, res);
						status = data.get(key) === res;
					}

					const o = {
						key,
						value: el,
						result: status
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};

				break;

			case 'set':
				action = function (el, key, data) {
					const
						res = value.apply(null, arguments);

					let
						status = res === undefined;

					if (res !== undefined && !data.has(res)) {
						data.delete(el);
						data.add(res);
						status = data.has(res);
					}

					const o = {
						key: null,
						value: el,
						result: status
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};

				break;

			default:
				action = function (el, key, data) {
					const
						res = value.apply(null, arguments);

					let
						status = res === undefined;

					if (res !== undefined && data[key] !== res) {
						data[key] = res;
						status = data[key] === res;
					}

					const o = {
						key,
						value: el,
						result: status
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};
		}

		action[FN_LENGTH] = action.length > value.length ? action.length : value.length;

	} else {
		switch (type) {
			case 'map':
				action = (el, key, data) => {
					let result = false;
					if (data.get(key) !== value) {
						data.set(key, value);
						result = data.get(key) === value;
					}

					const o = {
						key,
						value: el,
						result
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};

				break;

			case 'set':
				action = (el, key, data) => {
					let result = false;
					if (!data.has(value)) {
						data.delete(el);
						data.add(value);
						result = data.has(value);
					}

					const o = {
						key: null,
						value: el,
						result
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};

				break;

			default:
				action = (el, key, data) => {
					let result = false;
					if (data[key] !== value) {
						data[key] = value;
						result = data[key] === value;
					}

					const o = {
						key,
						value: el,
						result
					};

					if (mult) {
						report.push(o);

					} else {
						p.result = o;
					}
				};
		}
	}

	const
		{onIterationEnd} = p;

	p.filter = filter;
	p.onIterationEnd = (ctx) => {
		if ((!p.result || !p.result.length) && 'key' in p) {
			if (p.key == null && isArray(data)) {
				p.key = data.length;
			}

			byLink(data, p.key, {
				value: isFunc ? value(undefined, undefined, data, ctx) : value,
				create: p.create !== false
			});
		}

		onIterationEnd && onIterationEnd(ctx);
	};

	const
		returnVal = any(this.forEach(action, p));

	if (returnVal !== this) {
		return returnVal;
	}

	return p.result;
};
