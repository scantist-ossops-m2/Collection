'use strict';

/*!
 * Collection
 * https://github.com/kobezzza/Collection
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Collection/blob/master/LICENSE
 */

import { tmpCycle } from '../consts/cache';
import { ws } from '../helpers/string';
import { STRUCT_OPT } from '../helpers/structs';
import { OBJECT_KEYS_NATIVE_SUPPORT } from '../consts/hacks';

const cbArgsList = [
	'el',
	'key',
	'data',
	'cbCtx'
];

const filterArgsList = [
	'el',
	'key',
	'data',
	'filterCtx'
];

/**
 * Compiles a cycle by the specified parameters
 *
 * @param {string} key - cache key
 * @param {!Object} p - compile parameters
 * @return {!Function}
 */
export function compileCycle(key, p) {
	const isMapSet = {'map': true, 'set': true}[p.type];
	const cantModI = (isMapSet && STRUCT_OPT) || (
		p.type !== 'array' && (
			(p.type === 'object' && (p.notOwn || !OBJECT_KEYS_NATIVE_SUPPORT)) ||
			(!p.reverse && (p.type !== 'object' || !OBJECT_KEYS_NATIVE_SUPPORT || p.notOwn))
		)
	);

	let iFn = ws`
		var 
			that = this,
			data = o.data,
			cb = o.cb,
			filters = o.filters,
			link = o.link,
			onIterationEnd = o.onIterationEnd,
			onComplete = o.onComplete;

		var
			wait = 0,
			onGlobalComplete,
			onGlobalError;

		var
			i = -1,
			j = 0,
			n = -1;

		var
			results = [],
			breaker = false,
			yielder = false,
			yieldVal;

		var
			timeStart,
			timeEnd,
			time = 0;

		var
			limit = 1,
			looper = 0;

		var
			length,
			f;

		var
			TRUE = this.TRUE,
			FALSE = this.FALSE,
			NULL = this.NULL;

		var
			el,
			key;

		var
			arr = [],
			$ = {};

		var info = {
			startIndex: ${p.startIndex},
			endIndex: ${p.endIndex},
			from: ${p.from},
			count: ${p.count},
			live: ${p.live},
			reverse: ${p.reverse},
			notOwn: ${p.notOwn},
			inverseFilter: ${p.inverseFilter},
			type: '${p.type}',
			thread: ${p.thread}
		};

		var ctx = {
			$: $,
			info: info,
			get result() {
				return p.result;
			},

			yield: function (opt_val) {
				if (${!p.thread}) {
					return false;
				}

				yielder = true;
				yieldVal = opt_val;

				return true;
			},

			get next() {
				if (${!p.thread}) {
					return false;
				}

				link.self.next();
				return true;
			},

			sleep: function (time, opt_test, opt_interval) {
				if (${!p.thread}) {
					return false;
				}

				ctx.yield();
				return new Promise(function (resolve, reject) {
					link.self.sleep = setTimeout(function () {
						if (opt_test) {
							try {
								var test = opt_test(ctx);

								if (test) {
									resolve();
									link.self.next();

								} else if (opt_interval) {
									ctx.sleep(time, opt_test, opt_interval).then(resolve, reject);
								}

							} catch (err) {
								reject(err);
								throw err;
							}

						} else {
							resolve();
							link.self.next();
						}
					}, time);
				});
			},

			wait: function (promise) {
				var thread = promise.thread;

				if (!thread || !thread.thread) {
					results.push(thread);

					if (!wait) {
						if (onGlobalComplete) {
							onGlobalComplete(results);
							onGlobalComplete = null;
						}

						results = [];
					}

					return false;
				}

				ctx.yield();
				wait++;

				var onComplete = thread.onComplete;
				thread.onComplete = function (res) {
					if (wait) {
						wait--;
					}

					results.push(res);
					that._stack.push(ctx);

					if (onComplete) {
						onComplete(res);
					}

					if (!wait) {
						yielder = false;
						if (onGlobalComplete) {
							onGlobalComplete(results);
							onGlobalComplete = null;
						}

						results = [];
						that._stack.pop();

						if (!yielder) {
							ctx.next;
						}

					} else {
						that._stack.pop();
					}
				};

				return promise.catch(function (err) {
					if (onGlobalError) {
						onGlobalError(err);
						onGlobalError = null;
					}
				});
			},

			get complete() {
				return new Promise(function (resolve, reject) {
					if (!wait) {
						resolve(that, results);
						results = [];
						return false;
					}

					onGlobalComplete = resolve;
					onGlobalError = reject;
				});
			},

			jump: function (val) {
				if (${cantModI}) {
					return false;
				}

				n = val - 1;
				return n;
			},

			i: function (val) {
				if (val === undefined) {
					return i;
				}
			
				if (${cantModI}) {
					return false;
				}

				n += val;
				return n;
			},

			get reset() {
				breaker = true;
				limit++;
				return true;
			},

			get break() {
				breaker = true;
				return true;
			}
		};

		var cbCtx = Object.create(ctx);
		cbCtx.length = o.cbLength;
		
		var filterCtx = Object.create(ctx);
		filterCtx.length = o.fLength;
	`;

	if (p.thread) {
		iFn += ws`
			ctx.thread = link.self;
			link.self.ctx = ctx;
		`;
	}

	const
		startIndex = p.startIndex || 0,
		endIndex = p.endIndex !== false ? p.endIndex + 1 : 0;

	const
		cbArgs = cbArgsList.slice(0, p.length ? p.cbArgs : cbArgsList.length),
		filterArgs = [];

	for (let i = 0; i < p.filter.length; i++) {
		filterArgs.push(filterArgsList.slice(0, p.length ? p.filterArgs[i] : filterArgsList.length));
	}

	const
		maxArgsLength = p.length ? Math.max.apply(null, [].concat(p.cbArgs, p.filterArgs)) : cbArgsList.length;

	if (p.from) {
		iFn += `var from = ${p.from};`;
	}

	let
		threadStart = '',
		threadEnd = '';

	if (p.thread) {
		threadStart = ws`
			if (timeStart == null) {
				that._stack.push(ctx);
				timeStart = new Date().valueOf();
			}
		`;

		threadEnd = ws`
			timeEnd = new Date().valueOf();
			time += timeEnd - timeStart;
			timeStart = timeEnd;

			if (time > this._priority[link.self.priority]) {
				that._stack.pop();
				yield n;
				time = 0;
				timeStart = null;
			}
		`;

	} else {
		iFn += 'that._stack.push(ctx);';
	}

	iFn += 'while (limit !== looper) {';

	switch (p.type) {
		case 'array':
			iFn += ws`
				var
					clone = data,
					dLength = data.length - 1;
			`;

			if (p.reverse) {
				iFn += 'clone = arr.slice.call(clone).reverse();';
			}

			if ((p.reverse || !p.live) && (startIndex || endIndex)) {
				iFn += ws`
					clone = arr.slice.call(clone, ${startIndex}, ${endIndex || 'data.length'});
				`;
			}

			if (!p.reverse && p.live) {
				iFn += ws`
					for (n = ${startIndex - 1}; ++n < clone.length;) {
						i = n;
				`;

				if (startIndex) {
					iFn += ws`
						if (n < ${startIndex}) {
							continue;
						}
					`;
				}

				if (endIndex) {
					iFn += ws`
						if (n > ${endIndex}) {
							break;
						};
					`;
				}

			} else {
				iFn += ws`
					length = clone.length;
					for (n = -1; ++n < length;) {
						i = n + ${startIndex};
				`;
			}

			if (maxArgsLength) {
				if (maxArgsLength > 1) {
					if (startIndex) {
						iFn += `key = ${p.reverse ? 'dLength - (' : ''} n + ${startIndex + (p.reverse ? ')' : '')};`;

					} else {
						iFn += `key = ${p.reverse ? 'dLength - ' : ''} n;`;
					}
				}

				iFn += 'el = clone[n];';
			}

			break;

		case 'object':
			if (p.reverse || (OBJECT_KEYS_NATIVE_SUPPORT && !p.notOwn)) {
				iFn += 'var tmpArray;';

				if (!p.notOwn && OBJECT_KEYS_NATIVE_SUPPORT && !p.thread) {
					iFn += 'tmpArray = Object.keys(data);';

				} else {
					iFn += 'tmpArray = [];';

					if (p.notOwn) {
						if (p.notOwn === -1) {
							iFn += ws`
								for (var key in data) {
									${threadStart}
									if (data.hasOwnProperty(key)) {
										continue;
									}

									tmpArray.push(key);
									${threadEnd}
								}
							`;

						} else {
							iFn += ws`
								for (var key in data) {
									${threadStart}
									tmpArray.push(key);
									${threadEnd}
								}
							`;
						}

					} else {
						iFn += ws`
							for (var key in data) {
								${threadStart}
								if (!data.hasOwnProperty(key)) {
									break;
								}

								tmpArray.push(key);
								${threadEnd}
							}
						`;
					}
				}

				if (p.reverse) {
					iFn += 'tmpArray.reverse();';
				}

				if (startIndex || endIndex) {
					iFn += `tmpArray = tmpArray.slice(${startIndex}, ${endIndex || 'tmpArray.length'});`;
				}

				iFn += ws`
					length = tmpArray.length;
					for (n = -1; ++n < length;) {
						key = tmpArray[n];

						if (key in data === false) {
							continue;
						}
						
						i = n + ${startIndex};
				`;

			} else {
				iFn += 'for (key in data) {';

				if (p.notOwn === false) {
					iFn += ws`
						if (!data.hasOwnProperty(key)) {
							break;
						}`
					;

				} else if (p.notOwn === -1) {
					iFn += ws`
						if (!data.hasOwnProperty(key)) {
							continue;
						}`
					;
				}

				iFn += ws`
					n++;
					i = n;
				`;

				if (startIndex) {
					iFn += ws`
						if (n < ${startIndex}) {
							continue;
						}
					`;
				}

				if (endIndex) {
					iFn += ws`
						if (n > ${endIndex}) {
							break;
						};
					`;
				}
			}

			if (maxArgsLength) {
				iFn += 'el = data[key];';
			}

			break;

		case 'map':
		case 'set':
		case 'generator':
		case 'iterator':
			if (isMapSet && STRUCT_OPT) {
				iFn += ws`
					var
						tmpArray = data._keys,
						skip = 0;
				`;

				if (!p.live && !p.reverse) {
					iFn += 'var size = data.size;';
				}

				if (!p.live) {
					iFn += 'tmpArray = tmpArray.slice();';
				}

				if (p.reverse) {
					if (p.live) {
						iFn += 'tmpArray = tmpArray.slice().reverse();';

					} else {
						iFn += 'tmpArray.reverse();';
					}
				}

				iFn += ws`
					length = tmpArray.length;
					for (n = ${startIndex - 1}; ++n < ${!p.reverse && p.live ? 'tmpArray.length' : 'length'};) {
						key = tmpArray[n];

						if (key === NULL) {
							skip++;
							continue;
						}

						i = n + skip;
				`;

				if (startIndex) {
					iFn += ws`
						if (i < ${startIndex}) {
							continue;
						}
					`;
				}

				if (endIndex) {
					iFn += ws`
						if (i > ${endIndex}) {
							break;
						};
					`;
				}

			} else {
				const gen = () => {
					if (isMapSet) {
						iFn += 'var cursor = data.keys();';

						if (!p.live && !p.reverse) {
							iFn += 'var size = data.size;';
						}

					} else if (p.type === 'generator') {
						iFn += 'var cursor = data();';

					} else {
						iFn += ws`
							var
								iteratorKey = typeof Symbol !== 'undefined' && Symbol.iterator,
								cursor;

							if ('next' in data) {
								cursor = data;

							} else {
								cursor = (iteratorKey ? data[iteratorKey]() : data['@@iterator'] && data['@@iterator']()) || data;
							}
						`;
					}
				};

				if (p.reverse) {
					gen();
					iFn += ws`
						var tmpArray = [];

						for (var step = cursor.next(); !step.done; step = cursor.next()) {
							${threadStart}
							tmpArray.push(step.value);
							${threadEnd}
						}

						tmpArray.reverse();
						var size = tmpArray.length;
					`;

					if (startIndex || endIndex) {
						iFn += `tmpArray = tmpArray.slice(${startIndex}, ${endIndex || 'tmpArray.length'});`;
					}

					iFn += ws`
						length = tmpArray.length;
						for (n = -1; ++n < length;) {
							${maxArgsLength ? 'key = tmpArray[n];' : ''}
							i = n + ${startIndex};
					`;

				} else {
					gen();

					iFn += ws`
						for (key = cursor.next(); !key.done; key = cursor.next()) {
							${maxArgsLength ? 'key = key.value;' : ''}
							n++;
							i = n;
					`;

					if (startIndex) {
						iFn += ws`
							if (n < ${startIndex}) {
								continue;
							}
						`;
					}

					if (endIndex) {
						iFn += ws`
							if (n > ${endIndex}) {
								break;
							};
						`;
					}
				}
			}

			if (maxArgsLength) {
				if (p.type === 'map') {
					iFn += 'el = data.get(key);';

				} else {
					iFn += 'el = key;';

					if (maxArgsLength > 1) {
						if (p.type === 'set') {
							iFn += 'key = null;';

						} else if (p.reverse) {
							iFn += 'key = size - i - 1;';

						} else {
							iFn += 'key = i;';
						}
					}
				}
			}

			break;
	}

	iFn += threadStart;

	if (p.count) {
		iFn += ws`
			if (j === ${p.count}) {
				break;
			}
		`;
	}

	if (p.filter.length) {
		iFn += 'if (';

		for (let i = 0; i < p.filter.length; i++) {
			iFn += `(${p.inverseFilter ? '!' : ''}(f = filters[${i}](${filterArgs[i]})) || f === ${p.inverseFilter ? 'FALSE' : 'TRUE'})`;
			if (i !== p.filter.length - 1) {
				iFn += '&&';
			}
		}

		iFn += ') {';
	}

	let tmp;
	if (p.mult) {
		if (p.return) {
			tmp = `if (cb(${cbArgs}) === FALSE) { breaker = true; }`;

		} else {
			tmp = `cb(${cbArgs});`;
		}

	} else {
		tmp = `cb(${cbArgs}); breaker = true;`;
	}

	if (p.count) {
		tmp += 'j++;';
	}

	if (p.from) {
		iFn += ws`
			if (from !== 0) {
				from--;

			} else {
				${tmp}
			}
		`;

	} else {
		iFn += tmp;
	}

	if (p.filter.length) {
		iFn += '}';
	}

	const yielder = ws`
		if (yielder) {
			that._stack.pop();
			yielder = false;

			if (link.self) {
				link.self.pause = true;

			} else {
				link.pause = true;
			}

			yield yieldVal;

			link.self.pause = false;
			delete link.pause;

			yieldVal = void 0;
			that._stack.push(ctx);
		}
	`;

	if (p.thread) {
		iFn += yielder;
	}

	if (!p.live && !p.reverse && isMapSet) {
		iFn += ws`
			size--;

			if (!size) {
				break;
			}
		`;
	}

	iFn += ws`
			if (breaker) {
				break;
			}

			${threadEnd}
		}

		breaker = false;
		looper++;

		if (onIterationEnd) {
			onIterationEnd(ctx);
		}
	`;

	if (p.thread) {
		iFn += yielder;
	}

	iFn += ws`
		}

		that._stack.pop();

		if (onComplete) {
			onComplete(p.result);
		}

		return p.result;
	`;

	if (p.thread) {
		tmpCycle[key] = eval(ws`(function *(o, p) { ${iFn} })`);

	} else {
		tmpCycle[key] = Function('o', 'p', iFn);
	}

	return tmpCycle[key];
}
