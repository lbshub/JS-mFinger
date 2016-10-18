/**
 * LBS mFinger 
 * Date: 2016-03-20
 * ========================================================
 * el 手势对象(一个字符串的CSS选择器或者元素对象)
 * 配置选项
 * opts.stop 是否阻止冒泡 默认true
 * opts.prevent 是否取消默认行为 默认true
 * opts.tap 执行单击事件函数
 * opts.doubleTap 执行双击事件函数
 * opts.longTap 执行长按事件函数
 * opts.pressMove 执行移动事件函数
 * opts.swipe 执行滑动事件函数
 * opts.pinch 执行缩放事件函数
 * opts.rotate 执行旋转事件函数
 * ========================================================
 * 实例方法
 * this.$on(type, fn) 增加一个手势事件函数
 * this.$off(type, fn) 移除一个手势事件函数
 * ========================================================
 * 手势事件类型 (type)
 * tap (单击)
 * doubleTap (双击)
 * longTap (长按)
 * pressMove (移动) (e.deltaX e.deltaY)
 * swipe (滑动) (e.direction e.deltaX e.deltaY)
 * pinch (缩放) (e.ratio) 
 * rotate (旋转) (e.angle)
 * ========================================================
 **/

(function(window, document) {
	'use strict';

	var utils = (function() {

		function on(el, type, fn) {
			return el.addEventListener(type, fn, false);
		}

		// 获取滑动方向 点1(x1, y1) 点2(x2, y2)
		function getDirection(x1, y1, x2, y2) {
			var x = x1 - x2,
				y = y1 - y2;
			return Math.abs(x) >= Math.abs(y) ? (x > 0 ? 'left' : 'right') : (y > 0 ? 'up' : 'down');
		}

		// 获取两点距离 点1(x1, y1) 点2(x2, y2) 
		// x = x2 - x1  y = y2 - y1
		function getDistance(x, y) {
			return Math.sqrt(x * x + y * y);
		}

		// 获取旋转角度 
		// 点1(x1, y1) 点2(x2, y2)  
		// v1.x = x1(变化后) - x1(变化前)
		// v1.y = y1(变化后) - y1(变化前)
		// v2.x v2.y类似v1
		function getRotateAngle(v1, v2) {
			var dir = v1.x * v2.y - v2.x * v1.y;
			var mr = getDistance(v1.x, v1.y) * getDistance(v2.x, v2.y);
			if (mr === 0) return 0;
			var dot = v1.x * v2.x + v1.y * v2.y;
			var r = dot / mr;
			if (r > 1) r = 1;
			if (r < -1) r = -1;
			return Math.acos(r) * (dir > 0 ? -1 : 1) * 180 / Math.PI;
		}

		return {
			on: on,
			getDirection: getDirection,
			getDistance: getDistance,
			getRotateAngle: getRotateAngle
		};
	}());

	var mFinger = function(el, opts) {
		this.el = typeof el === 'string' ? document.querySelector(el) : el;
		opts = opts || {};
		this.stop = opts.stop === false ? false : true;
		this.prevent = opts.prevent === false ? false : true;

		this.tap = opts.tap || function() {};
		this.doubleTap = opts.doubleTap || function() {};
		this.longTap = opts.longTap || function() {};
		this.pressMove = opts.pressMove || function() {};
		this.swipe = opts.swipe || function() {};
		this.pinch = opts.pinch || function() {};
		this.rotate = opts.rotate || function() {};

		this._events = {};
		this.touchVector = null;
		this.touchDistance = 0;
		this.previousTouchTime = 0;
		this.previousTouchPoint = null;
		this.tapTimeout = null;
		this.longTapTimeout = null;
		this.initScale = 1;

		utils.on(this.el, 'touchstart', this._start.bind(this));
		utils.on(this.el, 'touchmove', this._move.bind(this));
		utils.on(this.el, 'touchend', this._end.bind(this));
		utils.on(this.el, 'touchcancel', this._end.bind(this));

		this._init();
	};
	mFinger.prototype = {
		_init: function() {
			this.$on('tap', this.tap);
			this.$on('doubleTap', this.doubleTap);
			this.$on('longTap', this.longTap);
			this.$on('pressMove', this.pressMove);
			this.$on('swipe', this.swipe);
			this.$on('pinch', this.pinch);
			this.$on('rotate', this.rotate);
		},
		_start: function(e) {
			if (!e.touches) return;
			if (this.stop) e.stopPropagation();
			if (this.prevent) e.preventDefault();
			this._clearLongTapTimeout();
			this._reset();
			this.startTime = Date.now();
			this.startX = e.touches[0].pageX;
			this.startY = e.touches[0].pageY;
			if (e.touches.length > 1) {
				// 记录向量(x, y)初始值
				this.touchVector = {
					x: e.touches[1].pageX - this.startX,
					y: e.touches[1].pageY - this.startY
				};
				this.touchDistance = utils.getDistance(this.touchVector.x, this.touchVector.y);
			} else {
				this.longTapTimeout = setTimeout(function() {
					// 触发 long tap(长按)
					this._trigger('longTap', e);
				}.bind(this), 750);

				if (this.previousTouchPoint) {
					//2次touchstart 距离要小于10 时时间间隔小于250ms
					if (Math.abs(this.startX - this.previousTouchPoint.startX) < 10 &&
						Math.abs(this.startY - this.previousTouchPoint.startY) < 10 &&
						this.startTime - this.previousTouchTime < 250) {
						this.isDoubleTap = true;
					}
				}
				//保存上一次touchstart的时间和位置信息
				this.previousTouchTime = this.startTime;
				this.previousTouchPoint = {
					startX: this.startX,
					startY: this.startY
				};
			}
		},
		_move: function(e) {
			if (!e.touches) return;
			if (this.stop) e.stopPropagation();
			if (this.prevent) e.preventDefault();
			this._clearLongTapTimeout();
			var moveX = e.touches[0].pageX;
			var moveY = e.touches[0].pageY;
			if (e.touches.length > 1) {
				if (this.touchVector !== null) {
					var vector = {
						x: e.touches[1].pageX - moveX,
						y: e.touches[1].pageY - moveY
					};
					var distance = utils.getDistance(vector.x, vector.y);
					if (this.touchDistance > 0) {
						var pinchScale = distance / this.touchDistance;
						e.ratio = pinchScale - this.initScale;
						// 触发 pinch(缩放) 传入缩放比率属性(ratio) scale关键字不能使用##safari
						this._trigger('pinch', e);
						this.initScale = pinchScale;
					}
					var angle = utils.getRotateAngle(vector, this.touchVector);
					e.angle = angle;
					// 触发 rotate(旋转) 传入角度属性(angle)
					this._trigger('rotate', e);
					this.touchVector.x = vector.x;
					this.touchVector.y = vector.y;
				}
			} else {
				this.deltaX = this.moveX === null ? 0 : moveX - this.moveX;
				this.deltaY = this.moveY === null ? 0 : moveY - this.moveY;
				e.deltaX = this.deltaX;
				e.deltaY = this.deltaY;
				// 触发 pressMove (移动) 传入移动差值属性(deltaX deltaY)
				this._trigger('pressMove', e);
			}
			this.moveX = moveX;
			this.moveY = moveY;
		},
		_end: function(e) {
			if (!e.changedTouches) return;
			var timestamp = Date.now();
			this._clearLongTapTimeout();
			if ((this.moveX !== null && Math.abs(this.moveX - this.startX) > 10) || (this.moveY !== null && Math.abs(this.moveY - this.startY) > 10)) {
				// 手指移动的位移要大于10像素
				// 手指和屏幕的接触时间要小于300毫秒
				if (timestamp - this.startTime < 300) {
					e.deltaX = this.deltaX;
					e.deltaY = this.deltaY;
					e.direction = utils.getDirection(this.startX, this.startY, this.moveX, this.moveY);
					// 触发 swipe(滑动) 传入差值属性(deltaX deltaY) 方向属性(direction)
					this._trigger('swipe', e);
				}
			} else {
				if (timestamp - this.startTime > 500) return;
				if (!!this.isDoubleTap) {
					this.isDoubleTap = false;
					this.tapTimeout && clearTimeout(this.tapTimeout);
					// 触发 double tap(双击)
					this._trigger('doubleTap', e);
				} else {
					this.tapTimeout = setTimeout(function() {
						// 触发 tap(单击)
						this._trigger('tap', e);
					}.bind(this), 250);
				}
			}
		},
		_reset: function() {
			this.moveX = null;
			this.moveY = null;
			this.deltaX = 0;
			this.deltaY = 0;
		},
		_clearLongTapTimeout: function() {
			this.longTapTimeout && clearTimeout(this.longTapTimeout);
		},
		_trigger: function(type) {
			if (!this._events[type]) return;
			var i = 0,
				l = this._events[type].length;
			if (!l) return;
			for (; i < l; i++) {
				this._events[type][i].apply(this, [].slice.call(arguments, 1));
			}
		},
		$on: function(type, fn) {
			if (!this._events[type]) this._events[type] = [];
			this._events[type].push(fn);
		},
		$off: function(type, fn) {
			if (!this._events[type]) return;
			var index = this._events[type].indexOf(fn);
			if (index > -1) {
				this._events[type].splice(index, 1);
			}
		}
	};
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('mFinger', [], function() {
			return mFinger;
		});
	} else {
		window.mFinger = mFinger;
	}
})(window, document);