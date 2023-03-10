const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

// The configuration object.
exports.root = {};

// The separator to use for defining locations.
exports.sep = '.';

// The separator to use for defining keys to locations when normalized.
exports.sepNormalized = '-';

// JSON.stringify() space value.
exports.jsonSpace = '\t';

// Array of listeners called when locations are read.
exports.processors = {
    set: [],
    get: []
};

// Object of locations and if they are currently being processed.
exports.processing = {};

// Returns the object that is the parent of the given location.
// Conf.getParent('a.b.c') === Conf.root['a']['b'].
function getParent(loc, obj, sep) {
    const locations = loc.split(sep);
    let curr = obj;
    locations.pop();
    locations.forEach(function(key) {
        if (key) {
            curr[key] = curr[key] || {};
            curr = curr[key];
        }
    });
    return curr;
}

const Conf = {
    root:          exports.root,
    sep:           exports.sep,
    sepNormalized: exports.sepNormalized,
    jsonSpace:     exports.jsonSpace,
    processors:    exports.processors,
    processing:    exports.processing
};

Conf.normalizeKey = function(key) {
    return key.replaceAll(this.sep, this.sepNormalized);
};

// Returns an array of [location, value] from the given n arguments.
// Conf.normalizeLocation('a', 'b', 'c', val) === ['a.b.c', val].
Conf.normalizeLocation = function(loc, val) {
    if (arguments.length > 2) {
        const args = Array.from(arguments);
        val = args.pop();
        loc = this.join(...args);
    }
    if (!loc) {
        loc = this.sep;
    }
    return [loc, val];
};

// Creates a location string from the given arguments.
// The value '<<' will go up a location.
// Conf.join('a.b', '<<', 'c') === 'a.c'.
Conf.join = function() {
    let keys = [];
    for (var i = 0; i < arguments.length; i++) {
        const parts = arguments[i].split(this.sep);
        parts.forEach((part) => {
            if (part === '<<') {
                keys.pop();
            } else if (part) {
                keys.push(part);
            }
        });
    }
    return keys.join(this.sep);
};

Conf.listen = {};

// Adds a listener function `fn` which is called when `match` is the last part of the Conf.set(loc, val) location string.
Conf.listen.set = (match, fn) => {
    if (!fn) {
        throw('First argument to `Conf.listen.set()` must be a string to match against.');
    }
    this.processors.set.push(function(loc, val) {
        if (match === '.' || loc.endsWith(match)) {
            fn(loc, val);
        }
    });
};

// Adds a listener function `fn` which is called when `match` is the last part of the Conf.get(loc) location string.
Conf.listen.get = (match, fn) => {
    if (!fn) {
        throw('First argument to `Conf.listen.get()` must be a string to match against.');
    }
    this.processors.get.push(function(loc, val) {
        if (match === '.' || loc.endsWith(match)) {
            fn(loc, val);
        }
    });
};

// Executes any listeners that match the given location.
Conf.process = function(action, loc, val) {
    const key = loc+action;
    if (this.processing[key]) {
        return;
    }
    this.processing[key] = true;
    for (var i = 0; i < this.processors[action].length; i++) {
        this.processors[action][i](loc, val);
    }
    this.processing[key] = false;
};

// Returns the last part of the location string.
// Conf.getKeyName('a.b.c') === 'c'.
Conf.getKeyName = function(loc) {
    return loc.split(this.sep).pop();
};

// Returns an array of locations which are direct descendants of the given `loc` location.
// Conf.root = {a:{b:{c:{foo: 1, bar: 2, baz: 3}}}}.
// Conf.getChildLocations('a.b.c') === ['a.b.c.foo', 'a.b.c.bar', 'a.b.c.baz'].
// Conf.getChildLocations('a.b.c', 'bar') === ['a.b.c.bar'].
Conf.getChildLocations = function(loc, match) {
    if (arguments.length > 2) {
        [loc, match] = this.normalizeLocation(...arguments);
    }
    if (!loc) {
        loc = this.sep;
    }
    let locations = [];
    const data = this.get(loc);
    if (typeof data === 'object') {
        Object.keys(data).forEach((key) => {
            if (!match || match === key)
                locations.push(this.join(loc, key));
        });
    }
    return locations;
};

// Same as getChildLocations() but recursive.
Conf.getDescendantLocations = function(loc, match) {
    if (arguments.length < 2) {
        throw('The second argument must be a "key" to match to any descendant keys.');
    }
    if (arguments.length > 2) {
        [loc, match] = this.normalizeLocation(...arguments);
    }
    let locations = [];
    this.getChildLocations(loc).forEach((location) => {
        if (location.startsWith(loc) && location.endsWith(match)) {
            locations.push(location);
        }
        locations = locations.concat(this.getDescendantLocations(location, match));
    });
    return locations;
};

// Returns the first parent location match of `match`.
// Conf.getAncestorLocation('a.b.c', 'b') === 'a.b'.
Conf.getAncestorLocation = function(loc, match) {
    if (arguments.length > 2) {
        [loc, match] = this.normalizeLocation(...arguments);
    }
    if (!loc) {
        return this.sep;
    }
    const locations = this.getChildLocations(loc, match);
    if (loc === this.sep && locations.length === 0) {
        return undefined;
    }
    if (locations.length === 1) {
        return locations[0];
    }
    return this.getAncestorLocation(loc, '<<', match);
};

// Returns the value at `loc` location.
Conf.getValue = function(loc) {
    if (loc === this.sep) {
        return this.root;
    }
    const parent = getParent(loc, this.root, this.sep);
    const key = this.getKeyName(loc);
    this.process('get', loc, parent[key]);
    return parent[key];
};

// Returns the value at `loc` location after Conf.join() of any arguments.
Conf.get = function(loc) {
    if (arguments.length > 1) {
        loc = this.join(...arguments);
    }
    return this.getValue(loc);
};

// Used to trigger listener processing on the given `loc` location.
// Alias for Conf.get().
Conf.touch = function(loc) {
    this.get(...arguments);
};

// Adds or replaces the given `val` at the given `loc` location.
Conf.setValue = function(loc, val) {
    if (loc === this.sep) {
        this.root = this.merge(this.root, val);
        return;
    }
    const parent = getParent(loc, this.root, this.sep);
    const key = this.getKeyName(loc);
    parent[key] = val;
};

// Adds or replaces the given `val` at the given `loc` location after Conf.normalizeLocation() of any arguments.
// If the current value and the given value are both of type `Object` the new value will be merged onto the current value.
Conf.set = function(loc, val) {
    if (arguments.length > 2) {
        [loc, val] = this.normalizeLocation(...arguments);
    }
    if (loc === this.sep) {
        this.root = this.merge(this.root, val);
        return;
    }
    const parent = getParent(loc, this.root, this.sep);
    const key = this.getKeyName(loc);
    if (typeof val === 'object' && !Array.isArray(val) && typeof parent[key] === 'object') {
        val = this.merge(parent[key], val);
    }
    parent[key] = val;
    this.process('set', loc, val);
};

// Inserts to the given `loc` location the data from `file` after Conf.normalizeLocation() of any arguments.
// If the file is serialized data it will be de-serialized and attached as an a JS data type (i.e. string, array, object).
// It replaces the current value if there was one.
// Supported formats are YAML (`.yml`,`.yaml`) or JSON (`.json`).
Conf.load = function(loc, file) {
    if (arguments.length > 2) {
        [loc, file] = this.normalizeLocation(...arguments);
    }
    if (!fs.existsSync(file)) {
        throw(`No file found at ${file}`);
    }
    let obj;
    switch (path.extname(file)) {
    case '.json':
        obj = require(file);
        break;
    case '.yml':
    case '.yaml':
        obj = YAML.parse(fs.readFileSync(file, 'utf8'));
        break;
    default:
        obj = fs.readFileSync(file, 'utf8');
    }
    this.set(loc, obj);
};

// Appends the given `val` to  `loc` location after Conf.normalizeLocation() of any arguments.
// Supported types are Any to Undefined, String to String, Array to Array.
// An unsupported type or a type mismatch will throw.
Conf.append = function(loc, val) {
    if (arguments.length > 2) {
        [loc, val] = this.normalizeLocation(...arguments);
    }
    const oldVal = this.get(loc);
    if (typeof oldVal === 'undefined') {
        this.set(loc, val);
        return;
    }
    if(typeof oldVal === 'string' && typeof val === 'string') {
        this.set(loc, oldVal + val);
        return;
    }
    if(Array.isArray(oldVal) && Array.isArray(val)) {
        this.set(loc, oldVal.concat(val));
        return;
    }
    throw('Only types Array and String can be appended to.');
};

// Deletes the given `loc` location after Conf.join() of any arguments using `delete`.
Conf.remove = function(loc) {
    if (arguments.length > 1) {
        loc = this.join(...arguments);
    }
    const parent = getParent(loc, this.root, this.sep);
    const key = this.getKeyName(loc);
    delete parent[key];
};

// Returns a copy of the value at the given `loc` location after Conf.join() of any arguments.
Conf.copy = function(loc) {
    if (arguments.length > 1) {
        loc = this.join(...arguments);
    }
    return this.clone(this.get(loc));
};

// Returns a deep clone of the the given `val` value.
Conf.clone = function(val) {
    var newVal;
    if (!val || typeof val !== 'object') {
        return val;
    }
    if (Array.isArray(val)) {
        newVal = [];
        for (var i = 0, j = val.length; i < j; i += 1) {
            newVal[i] = this.clone(val[i]);
        }
        return newVal;
    }
    newVal = {};
    for (const [key, value] of Object.entries(val)) {
        newVal[key] = this.clone(value);
    }
    return newVal;
};

// Merges the `from` object over the `to` object and returns a new object.
// If the third argument of `inPlace` is `true` then the merge will applied to the given `to` object.
Conf.merge = function(to, from, inPlace) {
    let newObj = inPlace ? to : this.clone(to);
    for (const [key, value] of Object.entries(from)) {
        if (Array.isArray(value)) {
            newObj[key] = this.clone(value);
        } else if (typeof to[key] === 'object') {
            newObj[key] = this.merge(to[key], value);
        } else {
            newObj[key] = this.clone(value);
        }
    }
    return newObj;
};

// Returns a JSON serialized string of Conf.root.
Conf.toJson = function() {
    return JSON.stringify(this.root, null, this.jsonSpace);
};

// Returns a YAML serialized string of Conf.root.
Conf.toYaml = function() {
    return YAML.stringify(this.root);
};

module.exports = Conf;
