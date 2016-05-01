"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromIds = exports.fromClasses = exports.fromClass = exports.fromBacon = exports.config = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _baconjs = require("baconjs");

var _baconjs2 = _interopRequireDefault(_baconjs);

var _ramda = require("ramda");

var _ramda2 = _interopRequireDefault(_ramda);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Lifting

var config = exports.config = {
  onError: function onError(e) {
    throw e;
  }
};

var nullDispose = { dispose: null };
var nullState = { dispose: null, rendered: null };

var common = {
  getInitialState: function getInitialState() {
    return nullState;
  },
  tryDispose: function tryDispose() {
    var dispose = this.state.dispose;

    if (dispose) dispose();
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    this.trySubscribe(nextProps);
  },
  componentWillMount: function componentWillMount() {
    this.trySubscribe(this.props);
  },
  shouldComponentUpdate: function shouldComponentUpdate(np, ns) {
    return ns.rendered !== this.state.rendered;
  },
  componentWillUnmount: function componentWillUnmount() {
    this.tryDispose();
    this.setState(nullState);
  },
  render: function render() {
    return this.state.rendered;
  }
};

var toProperty = function toProperty(obs) {
  return obs instanceof _baconjs2.default.EventStream ? obs.toProperty() : obs;
};

var FromBacon = _react2.default.createClass(_extends({}, common, {
  trySubscribe: function trySubscribe(_ref) {
    var _this = this;

    var bacon = _ref.bacon;

    this.tryDispose();

    this.setState({ dispose: bacon.subscribe(function (ev) {
        if (ev.hasValue()) {
          _this.setState({ rendered: ev.value() });
        } else if (ev.isError()) {
          config.onError(ev.error);
        } else {
          _this.setState(nullDispose);
        }
      }) });
  }
}));

var fromBacon = exports.fromBacon = function fromBacon(bacon) {
  return _react2.default.createElement(FromBacon, { bacon: bacon });
};

var combineAsArray = function combineAsArray(obs) {
  return obs.length === 1 ? obs[0].map(function (x) {
    return [x];
  }) : _baconjs2.default.combineAsArray(obs);
};

var FromClass = _react2.default.createClass(_extends({}, common, {
  trySubscribe: function trySubscribe(_ref2) {
    var _this2 = this;

    var props = _ref2.props;

    this.tryDispose();

    var vals = {};
    var obsKeys = [];
    var obsStreams = [];

    for (var key in props) {
      var val = props[key];
      var keyOut = "mount" === key ? "ref" : key;
      if (val instanceof _baconjs2.default.Observable) {
        obsKeys.push(keyOut);
        obsStreams.push(val);
      } else if ("children" === key && val instanceof Array && val.find(function (c) {
        return c instanceof _baconjs2.default.Observable;
      })) {
        obsKeys.push(keyOut);
        obsStreams.push(_baconjs2.default.combineAsArray(val));
      } else {
        vals[keyOut] = val;
      }
    }

    this.setState({ dispose: combineAsArray(obsStreams).subscribe(function (ev) {
        if (ev.hasValue()) {
          var obsVals = ev.value();
          var _props = {};
          var children = null;
          for (var _key in vals) {
            var _val = vals[_key];
            if ("children" === _key) {
              children = _val;
            } else {
              _props[_key] = _val;
            }
          }
          for (var i = 0, n = obsKeys.length; i < n; ++i) {
            var _key2 = obsKeys[i];
            var _val2 = obsVals[i];
            if ("children" === _key2) {
              children = _val2;
            } else {
              _props[_key2] = _val2;
            }
          }
          _this2.setState({ rendered: _react2.default.createElement(_this2.props.Class, _props, children) });
        } else if (ev.isError()) {
          config.onError(ev.error);
        } else {
          _this2.setState(nullDispose);
        }
      }) });
  }
}));

var fromClass = exports.fromClass = function fromClass(Class) {
  return function (props) {
    return _react2.default.createElement(FromClass, { Class: Class, props: props });
  };
};

var fromClasses = exports.fromClasses = function fromClasses(classes) {
  var result = {};
  for (var k in classes) {
    result[k] = fromClass(classes[k]);
  }return result;
};

var fromIds = exports.fromIds = function fromIds(ids, fromId) {
  return ids.scan([{}, []], function (_ref3, ids) {
    var _ref4 = _slicedToArray(_ref3, 1);

    var oldIds = _ref4[0];

    var newIds = {};
    var newVs = Array(ids.length);
    for (var i = 0, n = ids.length; i < n; ++i) {
      var id = ids[i];
      var k = id.toString();
      if (k in newIds) newVs[i] = newIds[k];else newIds[k] = newVs[i] = k in oldIds ? oldIds[k] : fromId(id);
    }
    return [newIds, newVs];
  }).map(function (s) {
    return s[1];
  });
};

function B() {
  var _arguments = arguments;

  var n = arguments.length;
  if (1 === n) {
    var _ret = function () {
      var fn = _arguments[0];
      return {
        v: function v() {
          for (var _len = arguments.length, xs = Array(_len), _key3 = 0; _key3 < _len; _key3++) {
            xs[_key3] = arguments[_key3];
          }

          return B.apply(undefined, [fn].concat(xs));
        }
      };
    }();

    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
  } else {
    for (var i = 0; i < n; ++i) {
      var x = arguments[i];
      var c = x && x.constructor;
      if (c === Object || c === Array) arguments[i] = _baconjs2.default.combineTemplate(x);
    }
    if (2 === n) {
      if (arguments[0] instanceof _baconjs2.default.Observable) return toProperty(arguments[0]).map(arguments[1]).skipDuplicates(_ramda2.default.equals);
      if (arguments[1] instanceof _baconjs2.default.Observable) return toProperty(arguments[1]).map(arguments[0]).skipDuplicates(_ramda2.default.equals);
    }
    return _baconjs2.default.combineWith.apply(_baconjs2.default, arguments).skipDuplicates(_ramda2.default.equals);
  }
}

exports.default = B;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9iYWNvbi5yZWFjdC5iYXNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7O0FBSU8sSUFBTSwwQkFBUztBQUNwQixXQUFTLG9CQUFLO0FBQUMsVUFBTSxDQUFOO0FBQVE7QUFESCxDQUFmOztBQUlQLElBQU0sY0FBYyxFQUFDLFNBQVMsSUFBVixFQUFwQjtBQUNBLElBQU0sWUFBWSxFQUFDLFNBQVMsSUFBVixFQUFnQixVQUFVLElBQTFCLEVBQWxCOztBQUVBLElBQU0sU0FBUztBQUNiLGlCQURhLDZCQUNLO0FBQ2hCLFdBQU8sU0FBUDtBQUNELEdBSFk7QUFJYixZQUphLHdCQUlBO0FBQUEsUUFDSixPQURJLEdBQ08sS0FBSyxLQURaLENBQ0osT0FESTs7QUFFWCxRQUFJLE9BQUosRUFDRTtBQUNILEdBUlk7QUFTYiwyQkFUYSxxQ0FTYSxTQVRiLEVBU3dCO0FBQ25DLFNBQUssWUFBTCxDQUFrQixTQUFsQjtBQUNELEdBWFk7QUFZYixvQkFaYSxnQ0FZUTtBQUNuQixTQUFLLFlBQUwsQ0FBa0IsS0FBSyxLQUF2QjtBQUNELEdBZFk7QUFlYix1QkFmYSxpQ0FlUyxFQWZULEVBZWEsRUFmYixFQWVpQjtBQUM1QixXQUFPLEdBQUcsUUFBSCxLQUFnQixLQUFLLEtBQUwsQ0FBVyxRQUFsQztBQUNELEdBakJZO0FBa0JiLHNCQWxCYSxrQ0FrQlU7QUFDckIsU0FBSyxVQUFMO0FBQ0EsU0FBSyxRQUFMLENBQWMsU0FBZDtBQUNELEdBckJZO0FBc0JiLFFBdEJhLG9CQXNCSjtBQUNQLFdBQU8sS0FBSyxLQUFMLENBQVcsUUFBbEI7QUFDRDtBQXhCWSxDQUFmOztBQTJCQSxJQUFNLGFBQWEsU0FBYixVQUFhO0FBQUEsU0FDakIsZUFBZSxrQkFBTSxXQUFyQixHQUFtQyxJQUFJLFVBQUosRUFBbkMsR0FBc0QsR0FEckM7QUFBQSxDQUFuQjs7QUFHQSxJQUFNLFlBQVksZ0JBQU0s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QUEyQyxjQUEzQyxDQUEwRCxnQkFBRSxNQUE1RCxDQUFQO0FBQ0YsVUFBSSxVQUFVLENBQVYsYUFBd0Isa0JBQU0sVUFBbEMsRUFDRSxPQUFPLFdBQVcsVUFBVSxDQUFWLENBQVgsRUFBeUIsR0FBekIsQ0FBNkIsVUFBVSxDQUFWLENBQTdCLEVBQTJDLGNBQTNDLENBQTBELGdCQUFFLE1BQTVELENBQVA7QUFDSDtBQUNELFdBQU8sa0JBQU0sV0FBTixDQUFrQixLQUFsQixvQkFBK0IsU0FBL0IsRUFBMEMsY0FBMUMsQ0FBeUQsZ0JBQUUsTUFBM0QsQ0FBUDtBQUNEO0FBQ0Y7O2tCQUVjLEMiLCJmaWxlIjoiYmFjb24ucmVhY3QuYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCYWNvbiBmcm9tIFwiYmFjb25qc1wiXG5pbXBvcnQgUiAgICAgZnJvbSBcInJhbWRhXCJcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIlxuXG4vLyBMaWZ0aW5nXG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIG9uRXJyb3I6IGUgPT4ge3Rocm93IGV9XG59XG5cbmNvbnN0IG51bGxEaXNwb3NlID0ge2Rpc3Bvc2U6IG51bGx9XG5jb25zdCBudWxsU3RhdGUgPSB7ZGlzcG9zZTogbnVsbCwgcmVuZGVyZWQ6IG51bGx9XG5cbmNvbnN0IGNvbW1vbiA9IHtcbiAgZ2V0SW5pdGlhbFN0YXRlKCkge1xuICAgIHJldHVybiBudWxsU3RhdGVcbiAgfSxcbiAgdHJ5RGlzcG9zZSgpIHtcbiAgICBjb25zdCB7ZGlzcG9zZX0gPSB0aGlzLnN0YXRlXG4gICAgaWYgKGRpc3Bvc2UpXG4gICAgICBkaXNwb3NlKClcbiAgfSxcbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhuZXh0UHJvcHMpIHtcbiAgICB0aGlzLnRyeVN1YnNjcmliZShuZXh0UHJvcHMpXG4gIH0sXG4gIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB0aGlzLnRyeVN1YnNjcmliZSh0aGlzLnByb3BzKVxuICB9LFxuICBzaG91bGRDb21wb25lbnRVcGRhdGUobnAsIG5zKSB7XG4gICAgcmV0dXJuIG5zLnJlbmRlcmVkICE9PSB0aGlzLnN0YXRlLnJlbmRlcmVkXG4gIH0sXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMudHJ5RGlzcG9zZSgpXG4gICAgdGhpcy5zZXRTdGF0ZShudWxsU3RhdGUpXG4gIH0sXG4gIHJlbmRlcigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5yZW5kZXJlZFxuICB9XG59XG5cbmNvbnN0IHRvUHJvcGVydHkgPSBvYnMgPT5cbiAgb2JzIGluc3RhbmNlb2YgQmFjb24uRXZlbnRTdHJlYW0gPyBvYnMudG9Qcm9wZXJ0eSgpIDogb2JzXG5cbmNvbnN0IEZyb21CYWNvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgLi4uY29tbW9uLFxuICB0cnlTdWJzY3JpYmUoe2JhY29ufSkge1xuICAgIHRoaXMudHJ5RGlzcG9zZSgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtkaXNwb3NlOiBiYWNvbi5zdWJzY3JpYmUoZXYgPT4ge1xuICAgICAgaWYgKGV2Lmhhc1ZhbHVlKCkpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cmVuZGVyZWQ6IGV2LnZhbHVlKCl9KVxuICAgICAgfSBlbHNlIGlmIChldi5pc0Vycm9yKCkpIHtcbiAgICAgICAgY29uZmlnLm9uRXJyb3IoZXYuZXJyb3IpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldFN0YXRlKG51bGxEaXNwb3NlKVxuICAgICAgfVxuICAgIH0pfSlcbiAgfVxufSlcblxuZXhwb3J0IGNvbnN0IGZyb21CYWNvbiA9IGJhY29uID0+XG4gIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRnJvbUJhY29uLCB7YmFjb259KVxuXG5jb25zdCBjb21iaW5lQXNBcnJheSA9IG9icyA9PlxuICBvYnMubGVuZ3RoID09PSAxID8gb2JzWzBdLm1hcCh4ID0+IFt4XSkgOiBCYWNvbi5jb21iaW5lQXNBcnJheShvYnMpXG5cbmNvbnN0IEZyb21DbGFzcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgLi4uY29tbW9uLFxuICB0cnlTdWJzY3JpYmUoe3Byb3BzfSkge1xuICAgIHRoaXMudHJ5RGlzcG9zZSgpXG5cbiAgICBjb25zdCB2YWxzID0ge31cbiAgICBjb25zdCBvYnNLZXlzID0gW11cbiAgICBjb25zdCBvYnNTdHJlYW1zID0gW11cblxuICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICBjb25zdCB2YWwgPSBwcm9wc1trZXldXG4gICAgICBjb25zdCBrZXlPdXQgPSBcIm1vdW50XCIgPT09IGtleSA/IFwicmVmXCIgOiBrZXlcbiAgICAgIGlmICh2YWwgaW5zdGFuY2VvZiBCYWNvbi5PYnNlcnZhYmxlKSB7XG4gICAgICAgIG9ic0tleXMucHVzaChrZXlPdXQpXG4gICAgICAgIG9ic1N0cmVhbXMucHVzaCh2YWwpXG4gICAgICB9IGVsc2UgaWYgKFwiY2hpbGRyZW5cIiA9PT0ga2V5ICYmXG4gICAgICAgICAgICAgICAgIHZhbCBpbnN0YW5jZW9mIEFycmF5ICYmXG4gICAgICAgICAgICAgICAgIHZhbC5maW5kKGMgPT4gYyBpbnN0YW5jZW9mIEJhY29uLk9ic2VydmFibGUpKSB7XG4gICAgICAgIG9ic0tleXMucHVzaChrZXlPdXQpXG4gICAgICAgIG9ic1N0cmVhbXMucHVzaChCYWNvbi5jb21iaW5lQXNBcnJheSh2YWwpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsc1trZXlPdXRdID0gdmFsXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZGlzcG9zZTogY29tYmluZUFzQXJyYXkob2JzU3RyZWFtcykuc3Vic2NyaWJlKGV2ID0+IHtcbiAgICAgIGlmIChldi5oYXNWYWx1ZSgpKSB7XG4gICAgICAgIGNvbnN0IG9ic1ZhbHMgPSBldi52YWx1ZSgpXG4gICAgICAgIGNvbnN0IHByb3BzID0ge31cbiAgICAgICAgbGV0IGNoaWxkcmVuID0gbnVsbFxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB2YWxzKSB7XG4gICAgICAgICAgY29uc3QgdmFsID0gdmFsc1trZXldXG4gICAgICAgICAgaWYgKFwiY2hpbGRyZW5cIiA9PT0ga2V5KSB7Y2hpbGRyZW4gPSB2YWx9IGVsc2Uge3Byb3BzW2tleV0gPSB2YWx9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaT0wLCBuPW9ic0tleXMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgICAgICAgIGNvbnN0IGtleSA9IG9ic0tleXNbaV1cbiAgICAgICAgICBjb25zdCB2YWwgPSBvYnNWYWxzW2ldXG4gICAgICAgICAgaWYgKFwiY2hpbGRyZW5cIiA9PT0ga2V5KSB7Y2hpbGRyZW4gPSB2YWx9IGVsc2Uge3Byb3BzW2tleV0gPSB2YWx9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7cmVuZGVyZWQ6IFJlYWN0LmNyZWF0ZUVsZW1lbnQodGhpcy5wcm9wcy5DbGFzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuKX0pXG4gICAgICB9IGVsc2UgaWYgKGV2LmlzRXJyb3IoKSkge1xuICAgICAgICBjb25maWcub25FcnJvcihldi5lcnJvcilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUobnVsbERpc3Bvc2UpXG4gICAgICB9XG4gICAgfSl9KVxuICB9XG59KVxuXG5leHBvcnQgY29uc3QgZnJvbUNsYXNzID1cbiAgQ2xhc3MgPT4gcHJvcHMgPT4gUmVhY3QuY3JlYXRlRWxlbWVudChGcm9tQ2xhc3MsIHtDbGFzcywgcHJvcHN9KVxuXG5leHBvcnQgY29uc3QgZnJvbUNsYXNzZXMgPSBjbGFzc2VzID0+IHtcbiAgY29uc3QgcmVzdWx0ID0ge31cbiAgZm9yIChjb25zdCBrIGluIGNsYXNzZXMpXG4gICAgcmVzdWx0W2tdID0gZnJvbUNsYXNzKGNsYXNzZXNba10pXG4gIHJldHVybiByZXN1bHRcbn1cblxuZXhwb3J0IGNvbnN0IGZyb21JZHMgPSAoaWRzLCBmcm9tSWQpID0+IGlkcy5zY2FuKFt7fSwgW11dLCAoW29sZElkc10sIGlkcykgPT4ge1xuICBjb25zdCBuZXdJZHMgPSB7fVxuICBjb25zdCBuZXdWcyA9IEFycmF5KGlkcy5sZW5ndGgpXG4gIGZvciAobGV0IGk9MCwgbj1pZHMubGVuZ3RoOyBpPG47ICsraSkge1xuICAgIGNvbnN0IGlkID0gaWRzW2ldXG4gICAgY29uc3QgayA9IGlkLnRvU3RyaW5nKClcbiAgICBpZiAoayBpbiBuZXdJZHMpXG4gICAgICBuZXdWc1tpXSA9IG5ld0lkc1trXVxuICAgIGVsc2VcbiAgICAgIG5ld0lkc1trXSA9IG5ld1ZzW2ldID0gayBpbiBvbGRJZHMgPyBvbGRJZHNba10gOiBmcm9tSWQoaWQpXG4gIH1cbiAgcmV0dXJuIFtuZXdJZHMsIG5ld1ZzXVxufSkubWFwKHMgPT4gc1sxXSlcblxuZnVuY3Rpb24gQigpIHtcbiAgY29uc3QgbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgaWYgKDEgPT09IG4pIHtcbiAgICBjb25zdCBmbiA9IGFyZ3VtZW50c1swXVxuICAgIHJldHVybiAoLi4ueHMpID0+IEIoZm4sIC4uLnhzKVxuICB9IGVsc2Uge1xuICAgIGZvciAobGV0IGk9MDsgaTxuOyArK2kpIHtcbiAgICAgIGNvbnN0IHggPSBhcmd1bWVudHNbaV1cbiAgICAgIGNvbnN0IGMgPSB4ICYmIHguY29uc3RydWN0b3JcbiAgICAgIGlmIChjID09PSBPYmplY3QgfHwgYyA9PT0gQXJyYXkpXG4gICAgICAgIGFyZ3VtZW50c1tpXSA9IEJhY29uLmNvbWJpbmVUZW1wbGF0ZSh4KVxuICAgIH1cbiAgICBpZiAoMiA9PT0gbikge1xuICAgICAgaWYgKGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mIEJhY29uLk9ic2VydmFibGUpXG4gICAgICAgIHJldHVybiB0b1Byb3BlcnR5KGFyZ3VtZW50c1swXSkubWFwKGFyZ3VtZW50c1sxXSkuc2tpcER1cGxpY2F0ZXMoUi5lcXVhbHMpXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgQmFjb24uT2JzZXJ2YWJsZSlcbiAgICAgICAgcmV0dXJuIHRvUHJvcGVydHkoYXJndW1lbnRzWzFdKS5tYXAoYXJndW1lbnRzWzBdKS5za2lwRHVwbGljYXRlcyhSLmVxdWFscylcbiAgICB9XG4gICAgcmV0dXJuIEJhY29uLmNvbWJpbmVXaXRoLmFwcGx5KEJhY29uLCBhcmd1bWVudHMpLnNraXBEdXBsaWNhdGVzKFIuZXF1YWxzKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJcbiJdfQ==