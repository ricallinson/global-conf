const assert = require('assert');
const Conf = require('../');

describe('Readme.md examples', function() {
    beforeEach(function() {
        Conf.root = {};
    });

    it('should access Conf.root', function() {
        Conf.root = {
            key:  'value',
            path: {
                separated: {
                    key: 'value'
                }
            }
        };
        assert.equal(Conf.get('key'), 'value');
        assert.equal(Conf.get('path.separated.key'), 'value');
        assert.equal(Conf.get('path.separated').key, 'value');
    });

    it('should set and get a non-existent value', function() {
        assert.equal(Conf.get('path.separated.other.key'), undefined);
        Conf.set('path.separated.other.key', 'value');
        assert.equal(Conf.get('path.separated.other.key'), 'value');
    });

    it('should set and get a non-existent value with multi location', function() {
        assert.equal(Conf.get('path.separated.other', 'key'), undefined);
        Conf.set('path', 'separated', 'other', 'key', 'value');
        assert.equal(Conf.get('path.separated', 'other.key'), 'value');
    });

    it('should set and get a non-existent value with multi location and a variable', function() {
        const loc = 'separated';
        Conf.set('path', loc, 'other', 'key', 'value');
        assert.equal(Conf.get('path', loc, 'other.key'), 'value');
    });

    it('should set and get a value by going up to a parent location', function() {
        Conf.set('path', 'key', 'value1');
        Conf.set('path', 'parent', 'key', 'value2');
        assert.equal(Conf.get('path', 'parent', '<<', 'key'), 'value1');
    });

    it('should set the `root` object, then get a value from that object via location', function() {
        Conf.set('.', { path: { separated: { key: 'value' } } });
        assert.equal(Conf.get('path', 'separated', 'key'), 'value');
    });

    it('should set the `root` object twice, then get the merged values', function() {
        Conf.set('.', { path: { separated: { key1: 'value1' } } });
        Conf.set('.', { path: { separated: { key2: 'value2' } } });
        assert.equal(Conf.get('path', 'separated', 'key1'), 'value1');
        assert.equal(Conf.get('path', 'separated', 'key2'), 'value2');
    });

    it('should set a value at location then get each object locations', function() {
        Conf.set('path.separated.key', 'value');
        assert.equal(Conf.get('path', 'separated', 'key'), 'value');
        assert.equal(Conf.get('path.separated').key, 'value');
        assert.equal(Conf.get('path').separated.key, 'value');
        assert.equal(Conf.get('.').path.separated.key, 'value');
    });

    it('should use setValue() and getValue()', function() {
        Conf.setValue('location', 'value');
        assert.equal(Conf.getValue('location'), 'value');
        Conf.setValue('.', { location: 'value' });
        assert.equal(Conf.getValue('location'), 'value');
        assert.equal(Conf.getValue('.').location, 'value');
    });

    it('should show how a listener works', () => {
        Conf.listen.get('for.some.key', function(loc, val) {
            console.log(`Location "${loc}" was read and returned "${val}".`);
        });
        Conf.get('for.some.key');
    });
});
