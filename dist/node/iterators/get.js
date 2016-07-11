'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

var _core = require('../core');

var _link = require('../helpers/link');

var _types = require('../helpers/types');

var _gcc = require('../helpers/gcc');

var _link2 = require('../other/link');

//#endif

/**
 * Searches elements in a collection by the specified condition/link.
 * The method returns an array of found elements or an element (if mult = false)
 *
 * @see Collection.prototype.forEach
 * @param {($$CollectionFilter|$$CollectionBase|$$CollectionLink)=} [opt_filter] - link, function filter or an array of functions
 * @param {?$$CollectionBase=} [opt_params] - additional parameters
 * @return {(?|!Array|!Promise<(?|!Array)>)}
 */
_core.Collection.prototype.get = function (opt_filter, opt_params) {
	let p = (0, _gcc.any)(opt_params || {});

	//#if link

	if ((0, _link.isLink)(opt_filter) || !(0, _types.isFunction)(opt_filter) && ((0, _types.isArray)(opt_filter) && !(0, _types.isFunction)(opt_filter[1]) || opt_filter != null && typeof opt_filter !== 'object')) {
		const tmp = (0, _link2.byLink)(this.data, opt_filter);
		p.onComplete && p.onComplete(tmp);
		return tmp;
	}

	//#endif

	if (!(0, _types.isArray)(opt_filter) && !(0, _types.isFunction)(opt_filter)) {
		p = opt_filter || p;
		opt_filter = null;
	}

	let action;
	if (p.mult !== false && this.p.mult !== false) {
		const res = p.result = [];
		action = el => res.push(el);
	} else {
		action = el => p.result = el;
	}

	p.filter = [].concat(p.filter || [], opt_filter || []);

	const returnVal = (0, _gcc.any)(this.forEach((0, _gcc.any)(action), p));

	if (returnVal !== this) {
		return returnVal;
	}

	return p.result;
};

//#if link