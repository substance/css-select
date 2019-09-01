var attributeFactory = require("./attributes.js");

function generalFactory(adapter, Pseudos){

	//tags
	function _tag(next, data){
		var name = data.name;
		return function tag(elem){
			return adapter.getNameWithoutNS(elem) === name && next(elem);
		}
	}

	//traversal
	function _descendant(next){
		return function descendant(elem){
			var found = false;
			while(!found && (elem = adapter.getParent(elem))){
				found = next(elem);
			}
			return found;
		};
	}

	function __flexibleDescendant(next){
		// Include element itself, only used while querying an array
		return function descendant(elem){
			var found = next(elem);
			while(!found && (elem = adapter.getParent(elem))){
				found = next(elem);
			}
			return found;
		};
	}

	function _parent(next, data, options){
		if(options && options.strict) throw new Error("Parent selector isn't part of CSS3");

		return function parent(elem){
			return adapter.getChildren(elem).some(test);
		};

		function test(elem){
			return adapter.isTag(elem) && next(elem);
		}
	}

	function _child(next){
		return function child(elem){
			var parent = adapter.getParent(elem);
			return !!parent && next(parent);
		};
	}

	function _sibling(next){
		return function sibling(elem){
			var siblings = adapter.getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(next(siblings[i])) return true;
				}
			}

			return false;
		};
	}

	function _adjacent(next){
		return function adjacent(elem){
			var siblings = adapter.getSiblings(elem),
				lastElement;

			for(var i = 0; i < siblings.length; i++){
				if(adapter.isTag(siblings[i])){
					if(siblings[i] === elem) break;
					lastElement = siblings[i];
				}
			}

			return !!lastElement && next(lastElement);
		};
	}

	function _universal(next){
		return next;
	}

	const generalRules = new Map([
		['attribute', attributeFactory(adapter).compile],
		['pseudo', Pseudos.compile],
		['tag', _tag],
		['descendant', _descendant],
		['_flexibleDescendant', __flexibleDescendant],
		['parent', _parent],
		['child', _child],
		['sibling', _sibling],
		['adjacent', _adjacent],
		['universal', _universal],
	])

	return generalRules
}

module.exports = generalFactory;
