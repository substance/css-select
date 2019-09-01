/*
	pseudo selectors

	---

	they are available in two forms:
	* filters called when the selector
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/

var getNCheck         = require("nth-check"),
	BaseFuncs         = require("boolbase"),
	attributesFactory = require("./attributes.js"),
	trueFunc          = BaseFuncs.trueFunc,
	falseFunc         = BaseFuncs.falseFunc;

function filtersFactory(adapter){
	var attributes  = attributesFactory(adapter),
		checkAttrib = attributes.rules.get('equals')

	//helper methods
	function equals(a, b){
		if(typeof adapter.equals === "function") return adapter.equals(a, b);

		return a === b;
	}

	function getAttribFunc(name, value){
		var data = {name: name, value: value};
		return function attribFunc(next){
			return checkAttrib(next, data);
		};
	}

	function getChildFunc(next){
		return function(elem){
			return !!adapter.getParent(elem) && next(elem);
		};
	}

	function _contains (next, text){
		return function (elem){
			return next(elem) && adapter.getText(elem).indexOf(text) >= 0;
		}
	}

	function _icontains (next, text){
		var itext = text.toLowerCase();
		return function (elem){
			return next(elem) &&
				adapter.getText(elem).toLowerCase().indexOf(itext) >= 0;
		}
	}

	function _nthChild (next, rule){
		var func = getNCheck(rule);
		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);
		return function (elem) {
			var siblings = adapter.getSiblings(elem);
			for(var i = 0, pos = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}
			return func(pos) && next(elem);
		}
	}

	function _nthLastChild (next, rule){
		var func = getNCheck(rule)
		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function (elem){
			var siblings = adapter.getSiblings(elem);
			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}
			return func(pos) && next(elem);
		}
	}

	function _nthOfType (next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function (elem) {
			var siblings = adapter.getSiblings(elem);

			for(var pos = 0, i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
				}
			}

			return func(pos) && next(elem);
		}
	}

	function _nthLastOfType (next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc)  return getChildFunc(next);

		return function nthLastOfType(elem){
			var siblings = adapter.getSiblings(elem);

			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
				}
			}

			return func(pos) && next(elem);
		}
	}

	function _root (next){
		return function (elem){
			return !adapter.getParent(elem) && next(elem);
		}
	}

	function _scope (next, rule, options, context){
		if(!context || context.length === 0){
			//equivalent to :root
			return filters.get('root')(next);
		}
		if(context.length === 1){
			//NOTE: can't be unpacked, as :has uses this for side-effects
			return function (elem){
				return equals(context[0], elem) && next(elem);
			}
		}
		return function (elem){
			return context.indexOf(elem) >= 0 && next(elem);
		};
	}

	const filters = new Map([
		['contains', _contains],
		['icontains', _icontains],
		['nth-child', _nthChild],
		['nth-last-child', _nthLastChild],
		['nth-of-type', _nthOfType],
		['nth-last-of-type', _nthLastOfType],
		['root', _root],
		['scope', _scope],
		['checkbox', getAttribFunc("type", "checkbox")],
		['file', getAttribFunc("type", "file")],
		['password', getAttribFunc("type", "password")],
		['radio', getAttribFunc("type", "radio")],
		['reset', getAttribFunc("type", "reset")],
		['image', getAttribFunc("type", "image")],
		['submit', getAttribFunc("type", "submit")]
	])

	return filters
}

function pseudosFactory(adapter){
	//helper methods
	function getFirstElement(elems){
		for(var i = 0; elems && i < elems.length; i++){
			if(adapter.isTag(elems[i])) return elems[i];
		}
	}

	function _empty(elem){
		return !adapter.getChildren(elem).some(function(elem){
			return adapter.isTag(elem) || elem.type === "text";
		})
	}

	function _firstChild(elem){
		return getFirstElement(adapter.getSiblings(elem)) === elem;
	}

	function _lastChild(elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = siblings.length - 1; i >= 0; i--){
			if(siblings[i] === elem) return true;
			if(adapter.isTag(siblings[i])) break;
		}

		return false;
	}

	function _firstOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0; i < siblings.length; i++){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) return true;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
			}
		}

		return false;
	}

	function _lastOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = siblings.length - 1; i >= 0; i--){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) return true;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) break;
			}
		}

		return false;
	}

	function _onlyOfType (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0, j = siblings.length; i < j; i++){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem) continue;
				if(adapter.getName(siblings[i]) === adapter.getName(elem)) return false;
			}
		}

		return true;
	}

	function _onlyChild (elem){
		var siblings = adapter.getSiblings(elem);

		for(var i = 0; i < siblings.length; i++){
			if(adapter.isTag(siblings[i]) && siblings[i] !== elem) return false;
		}

		return true;
	}

	//:matches(a, area, link)[href]
	function _link (elem){
		return adapter.hasAttrib(elem, "href");
	}

	//:matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
	function _selected (elem){
		if(adapter.hasAttrib(elem, "selected")) return true;
		else if(adapter.getName(elem) !== "option") return false;

		//the first <option> in a <select> is also selected
		var parent = adapter.getParent(elem);

		if(
			!parent ||
			adapter.getName(parent) !== "select" ||
			adapter.hasAttrib(parent, "multiple")
		) return false;

		var siblings = adapter.getChildren(parent),
			sawElem  = false;

		for(var i = 0; i < siblings.length; i++){
			if(adapter.isTag(siblings[i])){
				if(siblings[i] === elem){
					sawElem = true;
				} else if(!sawElem){
					return false;
				} else if(adapter.hasAttrib(siblings[i], "selected")){
					return false;
				}
			}
		}

		return sawElem;
	}

	//https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
	//:matches(
	//  :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
	//  optgroup[disabled] > option),
	// fieldset[disabled] * //TODO not child of first <legend>
	//)
	function _disabled (elem){
		return adapter.hasAttrib(elem, "disabled");
	}

	function _enabled(elem){
		return !adapter.hasAttrib(elem, "disabled");
	}

	//:matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
	function _checked (elem){
		return adapter.hasAttrib(elem, "checked") || pseudos.get('selected')(elem);
	}

	//:matches(input, select, textarea)[required]
	function _required(elem){
		return adapter.hasAttrib(elem, "required");
	}

	//:matches(input, select, textarea):not([required])
	function _optional(elem){
		return !adapter.hasAttrib(elem, "required");
	}

	//:not(:empty)
	function _parent (elem){
		return !pseudos.get('empty')(elem);
	}

	//:matches(h1, h2, h3, h4, h5, h6)
	function _header (elem){
		var name = adapter.getName(elem);
		return name === "h1" ||
				name === "h2" ||
				name === "h3" ||
				name === "h4" ||
				name === "h5" ||
				name === "h6";
	}

	//:matches(button, input[type=button])
	function _button(elem){
		var name = adapter.getName(elem);
		return name === "button" ||
				name === "input" &&
				adapter.getAttributeValue(elem, "type") === "button";
	}

	//:matches(input, textarea, select, button)
	function _input(elem){
		var name = adapter.getName(elem);
		return name === "input" ||
				name === "textarea" ||
				name === "select" ||
				name === "button";
	}

	//input:matches(:not([type!='']), [type='text' i])
	function _text(elem){
		var attr;
		return adapter.getName(elem) === "input" && (
			!(attr = adapter.getAttributeValue(elem, "type")) ||
			attr.toLowerCase() === "text"
		);
	}


	const pseudos = new Map([
		['empty', _empty],
		['first-child', _firstChild],
		['last-child', _lastChild],
		['first-of-type', _firstOfType],
		['last-of-type', _lastOfType],
		['only-of-type', _onlyOfType],
		['only-child', _onlyChild],
		['link', _link],
		['visited', falseFunc],
		['selected', _selected],
		['disabled', _disabled],
		['enabled', _enabled],
		['required', _required],
		['optional', _optional],
		['parent', _parent],
		['header', _header],
		['button', _button],
		['input', _input],
		['text', _text]
	])

	return pseudos;
}

function verifyArgs(func, name, subselect){
	if(subselect === null){
		if(func.length > 1 && name !== "scope"){
			throw new Error("pseudo-selector :" + name + " requires an argument");
		}
	} else {
		if(func.length === 1){
			throw new Error("pseudo-selector :" + name + " doesn't have any arguments");
		}
	}
}

//FIXME this feels hacky
var re_CSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

function factory(adapter){
	var pseudos = pseudosFactory(adapter);
	var filters = filtersFactory(adapter);

	return {
		compile: function(next, data, options, context){
			var name = data.name,
				subselect = data.data;

			if(options && options.strict && !re_CSS3.test(name)){
				throw new Error(":" + name + " isn't part of CSS3");
			}

			let filter = filters.get(name)
			let pseudo = pseudos.get(name)
			if(typeof filter === "function"){
				verifyArgs(filter, name,  subselect);
				return filter(next, subselect, options, context);
			} else if(typeof pseudo === "function"){
				verifyArgs(pseudo, name, subselect);
				if(next === trueFunc) return pseudo;
				return function pseudoArgs(elem){
					return pseudo(elem, subselect) && next(elem);
				};
			} else {
				throw new Error("unmatched pseudo-class :" + name);
			}
		},
		filters,
		pseudos
	};
}

module.exports = factory;
