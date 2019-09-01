var falseFunc = require("boolbase").falseFunc;

//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

function factory(adapter){

	function _equals(next, data){
		var name  = data.name,
			value = data.value;

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function equalsIC(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.toLowerCase() === value && next(elem);
			};
		}

		return function equals(elem){
			return adapter.getAttributeValue(elem, name) === value && next(elem);
		};
	}

	function _hyphen(next, data){
		var name  = data.name,
			value = data.value,
			len = value.length;

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function hyphenIC(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null &&
						(attr.length === len || attr.charAt(len) === "-") &&
						attr.substr(0, len).toLowerCase() === value &&
						next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null &&
					attr.substr(0, len) === value &&
					(attr.length === len || attr.charAt(len) === "-") &&
					next(elem);
		};
	}

	function _element(next, data){
		var name = data.name,
			value = data.value;
		if (data.name === 'class') {
			let value = data.value
			if (/\s/.test(value)) return function() { return false }
			return function(elem) {
				let classes = elem.classes
				return classes && classes.has(value) && next(elem)
			}
		} else {
			if(/\s/.test(value)){
				return falseFunc;
			}

			value = value.replace(reChars, "\\$&");

			var pattern = "(?:^|\\s)" + value + "(?:$|\\s)",
				flags = data.ignoreCase ? "i" : "",
				regex = new RegExp(pattern, flags);

			return function(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && regex.test(attr) && next(elem);
			}
		}
	}

	function _exists(next, data){
		var name = data.name;
		return function(elem){
			return adapter.hasAttrib(elem, name) && next(elem);
		};
	}

	function _start(next, data){
		var name  = data.name,
			value = data.value,
			len = value.length;

		if(len === 0){
			return falseFunc;
		}

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function (elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.substr(0, len) === value && next(elem);
		}
	}

	function _end(next, data){
		var name  = data.name,
			value = data.value,
			len   = -value.length;

		if(len === 0){
			return falseFunc;
		}

		if(data.ignoreCase){
			value = value.toLowerCase();

			return function endIC(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.substr(len).toLowerCase() === value && next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.substr(len) === value && next(elem);
		};
	}

	function _any(next, data){
		var name  = data.name,
			value = data.value;

		if(value === ""){
			return falseFunc;
		}

		if(data.ignoreCase){
			var regex = new RegExp(value.replace(reChars, "\\$&"), "i");

			return function (elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && regex.test(attr) && next(elem);
			};
		}

		return function (elem){
			var attr = adapter.getAttributeValue(elem, name);
			return attr != null && attr.indexOf(value) >= 0 && next(elem);
		};
	}

	function _not(next, data){
		var name  = data.name,
			value = data.value;

		if(value === ""){
			return function notEmpty(elem){
				return !!adapter.getAttributeValue(elem, name) && next(elem);
			};
		} else if(data.ignoreCase){
			value = value.toLowerCase();

			return function notIC(elem){
				var attr = adapter.getAttributeValue(elem, name);
				return attr != null && attr.toLowerCase() !== value && next(elem);
			};
		}

		return function not(elem){
			return adapter.getAttributeValue(elem, name) !== value && next(elem);
		};
	}

	let attributeRules = new Map([
		['equals', _equals],
		['hyphen', _hyphen],
		['element', _element],
		['exists', _exists],
		['start', _start],
		['end', _end],
		['any', _any],
		['not', _not]
	])

	return {
		compile: function(next, data, options){
			if(options && options.strict && (
				data.ignoreCase || data.action === "not"
			)) throw new Error("Unsupported attribute selector");
			return attributeRules.get(data.action)(next, data);
		},
		rules: attributeRules
	};
}

module.exports = factory;
