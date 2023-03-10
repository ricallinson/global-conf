# global-conf

This module provides a configuration API for [Node.js](https://nodejs.org/) projects.
It is basically a convenience wrapper for using a "global" JS object without having to make existence checks all the time.

## Basic API

```js
const Config = require('global-conf');
```

### "locations"

The module *Config* uses a JS object to store all its given key/values.
This can be accessed directly via `Config.root` should one need to do so.
Nested `keys` are referenced by a `.` separated string, much like you would do in your JS code.

```js
Config.root = {
	key: 'value',
	path: {
		separated: {
			key: 'value'
		}
	}
};
Config.root.key; // "value"
Config.root.path.separated.key; // "value"
Config.root.path; // {separated:{key:"value"}}
```

Using the `Config` API you would do much the same to access the values above.

```js
Config.get('key'); // "value"
Config.get('path.separated.key'); // "value"
Config.get('path'); // {separated:{key:"value"}}
```

These strings are known as `locations`.
Unlike a standard JS object, the corresponding data structure does NOT have to exist when being located.

```js
Config.get('path.separated.other.key'); // undefined
Config.set('path.separated.other.key', 'value');
Config.get('path.separated.other.key'); // "value"
```

Both `Config.set()` and `Config.get()` allow for the location to be described with many arguments.
In the case of `Config.set()`, the last argument is always the `value` to be set.

```js
Config.get('path.separated.other', 'key'); // undefined
Config.set('path', 'separated', 'other', 'key', 'value');
Config.get('path.separated', 'other.key'); // "value"
```

This alternative API can be useful for two reasons.
The first is when you have variables that reference a `key`.
It's much simpler to have them as an argument rather than constructing template literals. 

```js
const loc = 'separated';
Config.set('path', loc, 'other', 'key', 'value');
Config.get('path', loc, 'other.key'); // "value"
```

The second, and powerful reason, is to navigate your configuration structure.
Using the reserved location `<<`, it tells `Config` to go up to the parent object when locating a value.

```js
Config.set('path', 'key', 'value1');
Config.set('path', 'parent', 'key', 'value2');
Config.get('path', 'parent', '<<', 'key'); // "value1"
```

### Config.set(...location, value)

The basics of setting a single value.

```js
Config.set('key', 'value');
```

Result when calling `Config.toYaml()`.

```yaml
key: value
```

Setting a single value in a non-existent JS object.
Using the separator `.`, you can set values in JS objects if that object exists or not.
Alternatively you can provide many arguments to define the location.
The last argument is always the value to be set.

```js
Config.set('path.separated.key', 'value');
Config.set('path', 'separated', 'key', 'value');
```

Result when calling `Config.toYaml()`.

```yaml
path:
  separated:
  	key: value
```

The above could also be achieved by passing a JS object as the value.

```js
Config.set('.', {path:{separated:{key:'value'}}});
```

In this scenario the value is not simply replaced by the new value.
When a JS object is passed as a value to `set` it will be merged with the existing object should one already exist.

```js
Config.set('.', {path:{separated:{key1:'value1'}}});
Config.set('.', {path:{separated:{key2:'value2'}}});
```

Result when calling `Config.toYaml()`.

```yaml
path:
  separated:
  	key1: value1
  	key2: value2
```

This is also true should the given `location` of `set` result in the same outcome.

```js
Config.set('path.separated.key1', 'value1');
Config.set('path', 'separated', 'key2', 'value2');
```

**IMPORTANT**: Arrays and Strings will be replaced with the value provided by `set`.
If you wish to combine an object of type `array` or `string` use `Config.append()`.

### Config.get(...location)

With a similar interface to `Config.set()`, `Config.get()` provides the API for retrieving values.

```js
Config.set('key', 'value');
Config.get('key'); // "value"
```

Examples of `get` combination calls.

```js
Config.set('path.separated.key', 'value');
Config.get('path', 'separated', 'key'); // "value"
Config.get('path.separated'); // {key:"value"}
Config.get('path'); // {separated:{key:"value"}}
Config.get('.'); // {path:{separated:{key:"value"}}}
```

### Config.setValue(location, value)

This function will add or replace the value referenced by the given `location`.
It bypasses all convenience features of `Config.Set()`.

```js
Config.setValue('location', 'value');
Config.setValue('.', {location: 'value'});
```

### Config.getValue(location)

This function will retrieve the value referenced by the given `location`.
It bypasses all convenience features of `Config.get()`.

```js
Config.getValue('location');
Config.getValue('.'); // {location:"value"}
```

## Listener API

You can "listen" for `Config.get()` and `Config.getValue()` requests for a location.
How this works is by providing a function which will be executed each time a request is made for a location that matches.

The location given to "listen" on is matched if the requested location ends with the given match location.

### Config.listen.set(location, function(location, value){})

A simple listener is shown below.

```js
const Config = require('global-conf');

Config.listen.set('for.some.key', function(loc, val) {
    console.log(`Location "${loc}" was read and returned "${val}".`);
});
```

When a call to `Config.set('for.some.key')` happens the listener outputs a message to the console.

```
% Location "for.some.key" was read and returned "undefined".
```

### Config.listen.get(location, function(location, value){})

A simple listener is shown below.

```js
const Config = require('global-conf');

Config.listen.get('for.some.key', function(loc, val) {
    console.log(`Location "${loc}" was read and returned "${val}".`);
});
```

When a call to `Config.get('for.some.key')` happens the listener outputs a message to the console.

```
% Location "for.some.key" was read and returned "undefined".
```

### Config.touch(...location)

An alias for `Config.get()`.

Use this method when you want to have semantic meaning in your code.
That being you want to trigger listeners but you are not expecting a value.

## Helper API

### Config.append(...location, value)
### Config.remove(...location)
### Config.copy(...location)
### Config.clone(value)
### Config.merge(to, from, inPlace)

## Convenience API

### Config.load(...location, file)
### Config.toJson()
### Config.toYaml()

## Locations API

### Config.join(...location)
### Config.getKeyName(location)
### Config.getChildLocations(...location, match)
### Config.getDescendantLocations(...location, match)
### Config.getAncestorLocation(...location, match)
