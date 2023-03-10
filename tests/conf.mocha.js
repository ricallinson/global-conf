const path = require('path');
const assert = require('assert');
const Conf = require('../');

describe('Conf.clone() & Conf.merge()', function() {
    beforeEach(function() {
        Conf.root = {
            obj: {
                parent: {
                    child: {
                        val: 'foo'
                    }
                }
            },
            types: {
                arr:  ['foo', 'bar', 'baz'],
                str:  'Foo, bar, baz.',
                int:  10,
                func: function() {
                    return 'foo';
                }
            }
        };
    });

    it('should clone the `root` to `root.clone`', function() {
        Conf.set('clone', Conf.clone(Conf.root));
        Conf.set('obj.parent.child.val', '');
        Conf.set('types.arr', []);
        Conf.set('types.str', '');
        Conf.set('types.int', 0);
        Conf.set('types.func', null);
        assert.equal(Conf.get('clone.obj.parent.child.val'), 'foo');
        assert.equal(Conf.get('clone.types.arr')[0], 'foo');
        assert.equal(Conf.get('clone.types.str'), 'Foo, bar, baz.');
        assert.equal(Conf.get('clone.types.int'), 10);
        assert.equal(Conf.get('clone.types.func')(), 'foo');
    });

    it('should merge the empty object over `root` and store as `root.merge`', function() {
        Conf.set('merge', Conf.merge({}, Conf.root));
        Conf.set('obj.parent.child.val', '');
        Conf.set('types.arr', []);
        Conf.set('types.str', '');
        Conf.set('types.int', 0);
        Conf.set('types.func', null);
        assert.equal(Conf.get('merge.obj.parent.child.val'), 'foo');
        assert.equal(Conf.get('merge.types.arr')[0], 'foo');
        assert.equal(Conf.get('merge.types.str'), 'Foo, bar, baz.');
        assert.equal(Conf.get('merge.types.int'), 10);
        assert.equal(Conf.get('merge.types.func')(), 'foo');
    });

    it('should merge the populated object over `root` and store the returned new object as `root.merge`', function() {
        const populated = {
            obj: {
                parent: {
                    child: {
                        val: 'foo'
                    }
                }
            },
            arr:  ['foo', 'bar', 'baz'],
            str:  'Foo, bar, baz.',
            int:  10,
            func: function() {
                return 'foo';
            }
        };
        Conf.set('merge', Conf.merge(Conf.root, populated));
        Conf.set('obj.parent.child.val', '');
        Conf.set('types.arr', []);
        Conf.set('types.str', '');
        Conf.set('types.int', 0);
        Conf.set('types.func', null);
        assert.equal(Conf.get('merge.obj.parent.child.val'), 'foo');
        assert.equal(Conf.get('merge.types.arr')[0], 'foo');
        assert.equal(Conf.get('merge.types.str'), 'Foo, bar, baz.');
        assert.equal(Conf.get('merge.types.int'), 10);
        assert.equal(Conf.get('merge.types.func')(), 'foo');
    });

    it('should merge the populated object over `root` `inPlace`', function() {
        const populated = {
            obj: {
                parent: {
                    child: {
                        val: 'foo'
                    }
                }
            },
            arr:  ['foo', 'bar', 'baz'],
            str:  'Foo, bar, baz.',
            int:  10,
            func: function() {
                return 'foo';
            }
        };
        Conf.set('merge', Conf.merge(Conf.root, populated, true));
        Conf.set('obj.parent.child.val', '');
        Conf.set('types.arr', []);
        Conf.set('types.str', '');
        Conf.set('types.int', 0);
        Conf.set('types.func', null);
        assert.equal(Conf.get('merge.obj.parent.child.val'), '');
        assert.equal(Conf.get('merge.types.arr').length, 0);
        assert.equal(Conf.get('merge.types.str'), '');
        assert.equal(Conf.get('merge.types.int'), 0);
        assert.equal(Conf.get('merge.types.func'), null);
    });

    it('should merge the populated object with different keys over `root` and store the returned new object as `root.merge`', function() {
        const populated = {
            obj: {
                parent: {
                    child: {
                        valNew: 'foo'
                    }
                }
            },
            types: {
                arrNew:  ['foo', 'bar', 'baz'],
                strNew:  'Foo, bar, baz.',
                intNew:  10,
                funcNew: function() {
                    return 'foo';
                }
            }
        };
        Conf.set('merge', Conf.merge(Conf.root, populated));
        assert.equal(Conf.get('merge.obj.parent.child.val'), 'foo');
        assert.equal(Conf.get('merge.types.arr')[0], 'foo');
        assert.equal(Conf.get('merge.types.str'), 'Foo, bar, baz.');
        assert.equal(Conf.get('merge.types.int'), 10);
        assert.equal(Conf.get('merge.types.func')(), 'foo');
        assert.equal(Conf.get('merge.obj.parent.child.valNew'), 'foo');
        assert.equal(Conf.get('merge.types.arrNew')[0], 'foo');
        assert.equal(Conf.get('merge.types.strNew'), 'Foo, bar, baz.');
        assert.equal(Conf.get('merge.types.intNew'), 10);
        assert.equal(Conf.get('merge.types.funcNew')(), 'foo');
    });
});

describe('Conf', function() {

    beforeEach(function() {
        Conf.root = {};
    });

    it('should return an object', function() {
        assert.equal(typeof Conf.root, 'object');
    });

    it ('return a new location', function() {
        assert.equal(Conf.join('foo', 'bar'), 'foo.bar');
        assert.equal(Conf.join('foo', '.', 'bar', '', 'baz'), 'foo.bar.baz');
        assert.equal(Conf.join('foo', 'bar', '<<'), 'foo');
    });

    it('should return the key', function() {
        assert.equal(Conf.getKeyName('base.path.key1'), 'key1');
    });

    it('should normalizeKey', function() {
        assert.equal(Conf.normalizeKey('foo.bar.baz'), 'foo-bar-baz');
    });

    it('should normalizeLocation', function() {
        const loc = Conf.normalizeLocation('base.path', 'val');
        assert.equal(loc[0], 'base.path');
        assert.equal(loc[1], 'val');
    });

    it('should normalizeLocation with multi location', function() {
        const loc = Conf.normalizeLocation('base', 'path', 'val');
        assert.equal(loc[0], 'base.path');
        assert.equal(loc[1], 'val');
    });

    it('should setValue and get value', function() {
        Conf.setValue('top', 'value');
        assert.equal(Conf.get('top'), 'value');
    });

    it('should setValue and get nested value', function() {
        Conf.setValue('top.of.obj', 'value');
        assert.equal(Conf.get('top.of.obj'), 'value');
    });

    it('should set and get value from single location', function() {
        Conf.set('top', 'value');
        Conf.set('topper', 'foo');
        assert.equal(Conf.get('top'), 'value');
        assert.equal(Conf.get('topper'), 'foo');
    });

    it('should set and get value', function() {
        Conf.set('base.path.key3', 'value');
        assert.equal(Conf.get('base.path.key3'), 'value');
    });

    it('should set object and get value', function() {
        Conf.set('base.path.key4', { value: 'foo' });
        assert.equal(Conf.get('base.path.key4.value'), 'foo');
    });

    it('should set object and get value using several arguments', function() {
        Conf.set('base.path.key4', { value: 'foo' });
        assert.equal(Conf.get('base', 'path.key4', 'value'), 'foo');
    });

    it('should set object using several arguments and get value', function() {
        Conf.set('base', 'path', 'key4', { value: 'foo' });
        assert.equal(Conf.get('base.path.key4.value'), 'foo');
    });

    it('should set object and then set a second object', function() {
        Conf.set('base', 'path', 'obj', { key1: 'foo' });
        Conf.set('base', 'path', 'obj', { key2: 'bar' });
        assert.equal(Conf.get('base.path.obj.key1'), 'foo');
        assert.equal(Conf.get('base.path.obj.key2'), 'bar');
    });

    it('should set, get, and remove value', function() {
        Conf.set('base', 'value');
        assert.equal(Conf.get('base'), 'value');
        Conf.remove('base');
        assert.equal(Conf.get('base'), undefined);
    });

    it('should set, get, and remove value with multi location', function() {
        Conf.set('base', 'remove', 'value');
        assert.equal(Conf.get('base', 'remove'), 'value');
        Conf.remove('base', 'remove');
        assert.equal(Conf.get('base', 'remove'), undefined);
    });

    it('should append even when no key exists', function() {
        Conf.append('string', 'value');
        assert.equal(Conf.get('string'), 'value');
    });

    it('should append with multi location even when no key exists', function() {
        Conf.append('string', 'bar', 'value');
        assert.equal(Conf.get('string', 'bar'), 'value');
    });

    it('should set a string and then append to it', function() {
        Conf.set('string', 'foo');
        Conf.append('string', 'bar');
        assert.equal(Conf.get('string'), 'foobar');
    });

    it('should set a string with multi location and then append to it', function() {
        Conf.set('string', 'append', 'foo');
        Conf.append('string', 'append', 'bar');
        assert.equal(Conf.get('string', 'append'), 'foobar');
    });

    it('should set an array and then append to it', function() {
        Conf.set('array', ['foo']);
        Conf.append('array', ['bar']);
        assert.equal(Conf.get('array')[0], 'foo');
        assert.equal(Conf.get('array')[1], 'bar');
    });

    it('should set an array with multi location and then append to it', function() {
        Conf.set('array', 'append', ['foo']);
        Conf.append('array', 'append', ['bar']);
        assert.equal(Conf.get('array', 'append')[0], 'foo');
        assert.equal(Conf.get('array', 'append')[1], 'bar');
    });

    it('should set an object and then append a string to it', function() {
        Conf.set('object', { 'foo': 1 });
        assert.throws(() => {
            Conf.append('object', 'string');
        }, (err) => {
            if (err) {
                return true;
            }
            return false;
        });
    });

    it('should set an object with multi location and then append a string to it', function() {
        Conf.set('object', 'append', { 'foo': 1 });
        assert.throws(() => {
            Conf.append('object', 'append', 'string');
        }, (err) => {
            if (err) {
                return true;
            }
            return false;
        });
    });

    it('should load JSON and get value', function() {
        Conf.load('base.json', path.join(__dirname, '/fixtures/sample.json'));
        assert.equal(Conf.get('base.json.key'), 'value');
    });

    it('should load JSON and get value with multi location', function() {
        Conf.load('base', 'json', path.join(__dirname, '/fixtures/sample.json'));
        assert.equal(Conf.get('base', 'json', 'key'), 'value');
    });

    it('should load YAML (.yml) and get value', function() {
        Conf.load('base.yml', path.join(__dirname, '/fixtures/sample.yml'));
        assert.equal(Conf.get('base.yml.key'), 'value');
    });

    it('should load YAML (.yaml) and get value', function() {
        Conf.load('base.yaml', path.join(__dirname, '/fixtures/sample.yaml'));
        assert.equal(Conf.get('base.yaml.key'), 'value');
    });

    it('should load text (.txt) and get value', function() {
        Conf.load('base.txt', path.join(__dirname, '/fixtures/sample.txt'));
        assert.equal(Conf.get('base.txt'), 'key=value\n');
    });

    it('should throw as the file does not exist', function() {
        assert.throws(() => {
            Conf.load('base.null', path.join(process.cwd(), './libs/conf/fixtures/sample.null'));
        }, (err) => {
            if (err) {
                return true;
            }
            return false;
        });
    });

    it('should set and copy value', function() {
        Conf.set('base.path.key5', 'value');
        const test = Conf.copy('base.path');
        Conf.set('base.path.key5', 'noValue');
        assert.equal(test.key5, 'value');
    });

    it('should set and copy value using multiple location arguments', function() {
        Conf.set('base.path', 'json', 'value');
        const test2 = Conf.copy('base', 'path');
        Conf.set('base.json', 'noValue');
        assert.equal(test2.json, 'value');
    });

    it('should set and copy an array value', function() {
        Conf.set('base.path.arr', ['foo', 'bar']);
        const test = Conf.copy('base.path');
        Conf.set('base.path.arr', ['noValue']);
        assert.equal(test.arr[0], 'foo');
        assert.equal(test.arr[1], 'bar');
    });

    it('getAncestorLocation should return undefined if nothing matches', () => {
        const ans = Conf.getAncestorLocation('asdfasdf');
        assert.equal(ans, undefined);
    });

    it('should throw if getDescendantLocations does not get the proper arguments', () => {
        assert.throws(() => {
            Conf.getDescendantLocations();
        }, (err) => {
            if (err === 'The second argument must be a "key" to match to any descendant keys.') {
                return true;
            }
            return false;
        });
    });

    it('should throw if second argument to listen.get() is missing', () => {
        assert.throws(() => {
            Conf.listen.get();
        }, (err) => {
            if (err === 'First argument to `Conf.listen.get()` must be a string to match against.') {
                return true;
            }
            return false;
        });
    });

    it('should change the value being set when get is called', function() {
        Conf.listen.get('base.listener1', function(loc, val) {
            Conf.set(loc, val + 1);
        });
        Conf.set('base.listener1', 1);
        assert.equal(Conf.get('base.listener1'), 2);
    });

    it('should change the value being set when touch is called', function() {
        Conf.listen.get('base.listener2', function(loc, val) {
            Conf.set(loc, val + 1);
        });
        Conf.set('base.listener2', 1);
        Conf.touch('base.listener2');
        assert.equal(Conf.root.base.listener2, 2);
    });

    it('should not recursively process a listener if the location is read while the listener is executing', () => {
        Conf.listen.get('base.listener3', function(loc, val) {
            Conf.set(loc, Conf.get(loc) + 1);
        });
        Conf.set('base.listener3', 1);
        assert.equal(Conf.get('base.listener3'), 2);
    });

    it('should throw if second argument to listen.set() is missing', () => {
        assert.throws(() => {
            Conf.listen.set();
        }, (err) => {
            if (err === 'First argument to `Conf.listen.set()` must be a string to match against.') {
                return true;
            }
            return false;
        });
    });

    it('should change the value being set when set is called', function() {
        Conf.listen.set('base.listener4', function(loc, val) {
            Conf.set(loc, val + 1);
        });
        Conf.set('base.listener4', 1);
        assert.equal(Conf.get('base.listener4'), 2);
    });

    it('should not recursively process a listener if the location is read while the listener is executing', () => {
        Conf.listen.set('base.listener5', function(loc, val) {
            Conf.set(loc, Conf.get(loc) + 1);
        });
        Conf.set('base.listener5', 1);
        assert.equal(Conf.get('base.listener5'), 2);
    });

    it('should return all child locations', function() {
        Conf.set('children.one', 1);
        Conf.set('children.two', 2);
        Conf.set('children.three.key', 3);
        const locs = Conf.getChildLocations('children');
        assert.equal(locs.length, 3);
    });

    it('should return all child location matching keys', function() {
        Conf.set('children.one', 1);
        Conf.set('children.three.two', 2);
        Conf.set('children.three.key', 3);
        const locs = Conf.getChildLocations('children', 'three', 'two');
        assert.equal(locs.length, 1);
    });

    it('should ', function() {
        Conf.set('children.one', 1);
        Conf.set('children.three.two', 2);
        Conf.set('children.three.key', 3);
        const locs = Conf.getChildLocations(undefined, 'two');
        assert.equal(locs.length, 0);
    });

    it('should ', function() {
        Conf.set('children.one', 1);
        Conf.set('children.three.two', 2);
        Conf.set('children.three.key', 3);
        const locs = Conf.getChildLocations(undefined, 'children');
        assert.equal(locs.length, 1);
    });

    it('should return all descendant location matching key', function() {
        Conf.set('descendant.one.key', 1);
        Conf.set('descendant.three.two', 2);
        Conf.set('descendant.three.deep.nest.key', 3);
        const locs = Conf.getDescendantLocations('descendant', 'three', 'key');
        assert.equal(locs.length, 1);
    });

    it('should return all child locations', function() {
        Conf.set('children.one', {});
        Conf.set('children.one.two', {});
        Conf.set('children.one.two.three', 3);
        assert.equal(Conf.getAncestorLocation('children.one.two.three', 'one'), 'children.one');
    });

    it('should return all child locations', function() {
        Conf.set('children.one', {});
        Conf.set('children.one.two', {});
        Conf.set('children.one.two.three', 3);
        assert.equal(Conf.getAncestorLocation(undefined, 'one'), '.');
    });

    it('should return all child locations', function() {
        Conf.set('children.one', {});
        Conf.set('children.one.two', {});
        Conf.set('children.one.two.three', 3);
        assert.equal(Conf.getAncestorLocation(undefined, 'children'), '.');
    });

    it('should return JSON', () => {
        Conf.root = { top: 'value' };
        const json = Conf.toJson();
        assert.equal(json, '{\n\t"top": "value"\n}');
    });

    it('should return JSON with no spaces', () => {
        Conf.jsonSpace = null;
        Conf.root = { top: 'value' };
        const json = Conf.toJson();
        assert.equal(json, '{"top":"value"}');
    });

    it('should return YAML', () => {
        Conf.root = { top: 'value' };
        const yaml = Conf.toYaml();
        assert.equal(yaml, 'top: value\n');
    });

    it ('tests bad locations get resolved', function() {
        Conf.setValue('.not.a.valid..location.', 'value');
        assert.equal(Conf.getValue('.not.a.valid..location.'), 'value');
    });

});
