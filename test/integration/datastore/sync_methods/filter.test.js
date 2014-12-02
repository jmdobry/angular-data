describe('DS.filter(resourceName[, params][, options])', function () {
  function errorPrefix(resourceName) {
    return 'DS.filter(' + resourceName + '[, params][, options]): ';
  }

  beforeEach(startInjector);

  it('should throw an error when method pre-conditions are not met', function () {
    assert.throws(function () {
      DS.filter('does not exist');
    }, DS.errors.NonexistentResourceError, errorPrefix('does not exist') + 'does not exist is not a registered resource!');

    angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        assert.throws(function () {
          DS.filter('post', key);
        }, DS.errors.IllegalArgumentError, errorPrefix('post') + 'params: Must be an object!');
      }
    });

    DS.inject('post', p1);

    angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
      if (key) {
        assert.throws(function () {
          DS.filter('post', {}, key);
        }, DS.errors.IllegalArgumentError, errorPrefix('post') + 'options: Must be an object!');
      }
    });

    DS.filter('post');
  });
  it('should return an empty array if the query has never been made before', function () {
    $httpBackend.expectGET('http://test.angular-cache.com/posts?where=%7B%22author%22:%7B%22%3D%3D%22:%22John%22%7D%7D').respond(200, [p1]);

    assert.deepEqual(angular.toJson(DS.filter('post', {
      where: {
        author: {
          '==': 'John'
        }
      }
    }, { loadFromServer: true })), angular.toJson([]), 'should be an empty array');

    assert.deepEqual(angular.toJson(DS.filter('post', {
      where: {
        author: {
          '==': 'John'
        }
      }
    }, { loadFromServer: true })), angular.toJson([]), 'should still be an empty array because the request is pending');

    $httpBackend.flush();

    assert.deepEqual(angular.toJson(DS.filter('post', {
      where: {
        author: {
          '==': 'John'
        }
      }
    })), angular.toJson([
      p1
    ]), 'should no longer be empty');
  });
  it('should correctly apply "where" predicates', function () {
    assert.doesNotThrow(function () {
      DS.inject('post', p1);
      DS.inject('post', p2);
      DS.inject('post', p3);
      DS.inject('post', p4);
      DS.inject('post', p5);
    }, Error, 'should not throw an error');

    assert.equal(lifecycle.beforeInject.callCount, 5);
    assert.equal(lifecycle.afterInject.callCount, 5);

    var params = {
      author: 'John'
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1]), 'should default a string to "=="');

    params = {
      author: 'Adam',
      id: 9
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p5]), 'should default a string to "=="');

    params = {
      where: {
        author: 'John'
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1]), 'should default a string to "=="');

    params.where.author = {
      '==': 'John'
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1]), 'should accept normal "==" clause');

    params.where.author = {
      '===': null
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([]), 'should accept normal "===" clause');

    params.where.author = {
      '!=': 'John'
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3, p4, p5]), 'should accept normal "!=" clause');

    params.where = {
      age: {
        '>': 31
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p3, p4, p5]), 'should accept normal ">" clause');

    params.where = {
      age: {
        '>=': 31
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3, p4, p5]), 'should accept normal ">=" clause');

    params.where = {
      age: {
        '<': 31
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1]), 'should accept normal "<" clause');

    params.where = {
      age: {
        '>': 30,
        '<': 33
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3]), 'should accept dual "<" and ">" clause');

    params.where = {
      age: {
        '|>': 30,
        '|<': 33
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4, p5]), 'should accept or "<" and ">" clause');

    params.where = {
      age: {
        '|<=': 31
      },
      author: {
        '|==': 'Adam'
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p4, p5]), 'should accept or "<=" and "==" clause');

    params.where = {
      age: {
        '<=': 31
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2]), 'should accept normal "<=" clause');

    params.where = {
      age: {
        'in': [30, 33]
      },
      author: {
        'in': ['John', 'Sally', 'Adam']
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p4, p5]), 'should accept normal "in" clause');

    params.where = {
      author: {
        'in': 'oh'
      }
    };

    assert.deepEqual(JSON.stringify(DS.filter('post', params)), JSON.stringify([p1]), 'should accept normal "in" clause with a string');

    params.where = {
      author: {
        'notIn': 'oh'
      }
    };

    assert.deepEqual(JSON.stringify(DS.filter('post', params)), JSON.stringify([p2, p3, p4, p5]), 'should accept normal "notIn" clause with a string');

    params.where = {
      author: {
        '|in': 'oh',
        '|notIn': 'dam'
      }
    };

    assert.deepEqual(JSON.stringify(DS.filter('post', params)), JSON.stringify([p1, p2, p3]), 'should accept or "in" and "notIn" clause with a string');

    params.where = {
      age: {
        '|in': [31]
      },
      id: {
        '|in': [8]
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p4]), 'should accept and/or clause');

    params.where = {
      id: {
        'notIn': [8]
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p5]), 'should accept notIn clause');

    params.where = { age: { garbage: 'should have no effect' } };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4, p5]), 'should return all elements');
  });
  it('should correctly apply "orderBy" predicates', function () {
    assert.doesNotThrow(function () {
      DS.inject('post', p1);
      DS.inject('post', p2);
      DS.inject('post', p3);
      DS.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      orderBy: 'age'
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4]), 'should accept a single string and sort in ascending order for numbers');

    params.orderBy = 'author';

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p4, p1, p3, p2]), 'should accept a single string and sort in ascending for strings');

    params.orderBy = [
      ['age', 'DESC']
    ];

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p4, p3, p2, p1]), 'should accept an array of an array and sort in descending for numbers');

    params.orderBy = [
      ['author', 'DESC']
    ];

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3, p1, p4]), 'should accept an array of an array and sort in descending for strings');

    params.orderBy = ['age'];

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4]), 'should accept an array of a string and sort in ascending for numbers');

    params.orderBy = ['author'];

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p4, p1, p3, p2]), 'should accept an array of a string and sort in ascending for strings');
  });
  it('should correctly apply "skip" predicates', function () {
    assert.doesNotThrow(function () {
      DS.inject('post', p1);
      DS.inject('post', p2);
      DS.inject('post', p3);
      DS.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      skip: 1
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3, p4]), 'should skip 1');

    params.skip = 2;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p3, p4]), 'should skip 2');

    params.skip = 3;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p4]), 'should skip 3');

    params.skip = 4;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([]), 'should skip 4');
  });
  it('should correctly apply "limit" predicates', function () {
    assert.doesNotThrow(function () {
      DS.inject('post', p1);
      DS.inject('post', p2);
      DS.inject('post', p3);
      DS.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      limit: 1
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1]), 'should limit to 1');

    params.limit = 2;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2]), 'should limit to 2');

    params.limit = 3;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3]), 'should limit to 3');

    params.limit = 4;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4]), 'should limit to 4');
  });
  it('should correctly apply "limit" and "skip" predicates together', function () {
    assert.doesNotThrow(function () {
      DS.inject('post', p1);
      DS.inject('post', p2);
      DS.inject('post', p3);
      DS.inject('post', p4);
    }, Error, 'should not throw an error');

    var params = {
      limit: 1,
      skip: 1
    };

    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2]), 'should limit to 1 and skip 2');

    params.limit = 2;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p2, p3]), 'should limit to 2 and skip 1');

    params.skip = 2;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p3, p4]), 'should limit to 2 and skip 2');

    params.limit = 1;
    params.skip = 3;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p4]), 'should limit to 1 and skip 3');

    params.limit = 8;
    params.skip = 0;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4]), 'should return all items');

    params.limit = 1;
    params.skip = 5;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([]), 'should return nothing if skip if greater than the number of items');

    params.limit = 8;
    delete params.skip;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([p1, p2, p3, p4]), 'should return all items');

    delete params.limit;
    params.skip = 5;
    assert.deepEqual(angular.toJson(DS.filter('post', params)), angular.toJson([]), 'should return nothing if skip if greater than the number of items');
  });
  it('should allow custom filter function', function () {
    DS.defineResource({
      name: 'Comment',
      defaultFilter: function (collection, resourceName, params, options) {
        var filtered = collection;
        var where = params.where;
        filtered = this.utils.filter(filtered, function (attrs) {
          return attrs.author === where.author.EQUALS || attrs.age % where.age.MOD === 1;
        });
        return filtered;
      }
    });
    assert.doesNotThrow(function () {
      DS.inject('Comment', p1);
      DS.inject('Comment', p2);
      DS.inject('Comment', p3);
      DS.inject('Comment', p4);
    }, Error, 'should not throw an error');

    var params = {
      where: {
        author: {
          'EQUALS': 'John'
        },
        age: {
          'MOD': 30
        }
      }
    };

    assert.deepEqual(angular.toJson(DS.filter('Comment', params)), angular.toJson([p1, p2]), 'should keep p1 and p2');
  });
  it('should work with multiple orderBy', function () {
    var items = [
      { id: 1, test: 1, test2: 1 },
      { id: 2, test: 2, test2: 2 },
      { id: 3, test: 3, test2: 3 },
      { id: 4, test: 1, test2: 4 },
      { id: 5, test: 2, test2: 5 },
      { id: 6, test: 3, test2: 6 },
      { id: 7, test: 1, test2: 1 },
      { id: 8, test: 2, test2: 2 },
      { id: 9, test: 3, test2: 3 },
      { id: 10, test: 1, test2: 4 },
      { id: 11, test: 2, test2: 5 },
      { id: 12, test: 3, test2: 6 }
    ];
    var params = {};

    Post.inject(items);

    params.orderBy = [
      ['test', 'DESC'],
      ['test2', 'ASC'],
      ['id', 'ASC']
    ];

    var posts = Post.filter(params);

    assert.deepEqual(JSON.stringify(posts), JSON.stringify([
      items[2],
      items[8],
      items[5],
      items[11],
      items[1],
      items[7],
      items[4],
      items[10],
      items[0],
      items[6],
      items[3],
      items[9]
    ]));

    params.orderBy = [
      ['test', 'DESC'],
      ['test2', 'ASC'],
      ['id', 'DESC']
    ];

    posts = Post.filter(params);

    assert.deepEqual(JSON.stringify(posts), JSON.stringify([
      items[8],
      items[2],
      items[11],
      items[5],
      items[7],
      items[1],
      items[10],
      items[4],
      items[6],
      items[0],
      items[9],
      items[3]
    ]));
  });
});
