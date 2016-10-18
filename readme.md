# JS-mFinger 
简单的手势事件封装

### 5种单指：
* tap (单击)
* doubleTap (双击)
* longTap (长按)
* pressMove (移动) (e.deltaX e.deltaY)
* swipe (滑动) (e.direction e.deltaX e.deltaY)

### 2种双指：
* pinch (缩放) (e.ratio) 
* rotate (旋转) (e.angle)

### 使用：
```js
var finger = new mFinger('.wrapper', {
	tap: function(e) {
		console.log('单击了1')
	},
	doubleTap: function(e) {
		console.log('双击了1')
	},
	longTap: function(e) {
		console.log('长按了1')
	},
	pressMove: function(e) {
		console.log('移动了1')
	},
	swipe: function(e) {
		console.log('滑动了1')
	},
	pinch: function(e) {
		console.log('缩放了1')
	},
	rotate: function(e) {
		console.log('旋转了1')
	}
});
```

### 或者这样...
```js
var finger = new mFinger('.wrapper');
finger.$on('tap', function(e) {
	console.log('单击了2')
});
finger.$on('doubleTap', function(e) {
	console.log('双击了2')
});
finger.$on('longTap', function(e) {
	console.log('长按了2')
});
finger.$on('pressMove', function(e) {
	console.log('移动了2')
});
finger.$on('swipe', function(e) {
	console.log('滑动了2')
	// console.log( e.direction + ' deltaX: '+ e.deltaX + ' deltaY: ' + e.deltaY)
});
finger.$on('pinch', function(e) {
	console.log('缩放了2')
	// console.log('缩放了' + e.ratio ); 
});
finger.$on('rotate', function(e) {
	console.log('旋转了2')
	// console.log('旋转了' + e.angle ); 
});
```
