/**
 *
 */
(function($) {
	if ($.fn.bs2editor === undefined) {
		function getSelected(){
			var txt = (window.getSelection)?window.getSelection().toString():document.selection.createRange().text;
			if(!txt.length)return false;
			console.debug("selection "+txt);
			return window.getSelection();
		}
		function findButtonBySelector(t,selector){
			var b=t.parent().find(selector.toString());
			b=(b.length>1)?b[0]:b;
			if(!b.length)console.warn("no "+selector+" button found");
			return b;
		}
		function isUrl(str) {
			var regex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
			var url = new RegExp(regex, 'img');
			return str.length < 2083 && url.test(str);
		}
		function saveSelection(containerEl) {
			if (window.getSelection && document.createRange) {
				var range = window.getSelection().getRangeAt(0);
				var preSelectionRange = range.cloneRange();
				preSelectionRange.selectNodeContents(containerEl);
				preSelectionRange.setEnd(range.startContainer, range.startOffset);
				var start = preSelectionRange.toString().length;
				return {
					start: start,
					end: start + range.toString().length
				}
			} else if (document.selection) {
				var selectedTextRange = document.selection.createRange();
				var preSelectionTextRange = document.body.createTextRange();
				preSelectionTextRange.moveToElementText(containerEl);
				preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
				var start = preSelectionTextRange.text.length;

				return {
					start: start,
					end: start + selectedTextRange.text.length
				}
			}
		}
		function restoreSelection(containerEl, savedSel) {
			if (window.getSelection && document.createRange) {
				var charIndex = 0, range = document.createRange();
				range.setStart(containerEl, 0);
				range.collapse(true);
				var nodeStack = [containerEl], node, foundStart = false, stop = false;
				while (!stop && (node = nodeStack.pop())) {
					if (node.nodeType == 3) {
						var nextCharIndex = charIndex + node.length;
						if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
							range.setStart(node, savedSel.start - charIndex);
							foundStart = true;
						}
						if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
							range.setEnd(node, savedSel.end - charIndex);
							stop = true;
						}
						charIndex = nextCharIndex;
					} else {
						var i = node.childNodes.length;
						while (i--) {
							nodeStack.push(node.childNodes[i]);
						}
					}
				}

				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
		    } else if (document.selection) {
				var textRange = document.body.createTextRange();
				textRange.moveToElementText(containerEl);
				textRange.collapse(true);
				textRange.moveEnd("character", savedSel.end);
				textRange.moveStart("character", savedSel.start);
				textRange.select();
		    }
		}
		function surroundInElement(el, regex, surrounderCreateFunc, shouldSurroundFunc) {
			var child = el.lastChild;
			while (child) {
				if (child.nodeType == 1 && shouldSurroundFunc(el)) {
					surroundInElement(child, regex, surrounderCreateFunc, shouldSurroundFunc);
				} else if (child.nodeType == 3) {
					surroundMatchingText(child, regex, surrounderCreateFunc);
				}
				child = child.previousSibling;
			}
		}
		function surroundMatchingText(textNode, regex, surrounderCreateFunc) {
			var parent = textNode.parentNode;
			var result, surroundingNode, matchedTextNode, matchLength, matchedText;
			while (textNode && (result = regex.exec(textNode.data))) {
				matchedTextNode = textNode.splitText(result.index);
				matchedText = result[0];
				matchLength = matchedText.length;
				textNode = (matchedTextNode.length > matchLength) ?
					matchedTextNode.splitText(matchLength) : null;
				surroundingNode = surrounderCreateFunc(matchedTextNode.cloneNode(true));
				parent.insertBefore(surroundingNode, matchedTextNode);
				parent.removeChild(matchedTextNode);
			}
		}
		$.bs2editor={
			defaults:{
				buttons:{
					bold: '.bs2editor-bold',
					link: '.bs2editor-link'
				},
				urlRegex:/http(s?):\/\/($|[^ ]+)/ig
			},
			keyCode: {
				ALT: 18, BACKSPACE: 8, CAPS_LOCK: 20, COMMA: 188, COMMAND: 91, COMMAND_LEFT: 91, COMMAND_RIGHT: 93, CONTROL: 17, DELETE: 46, DOWN: 40, END: 35, ENTER: 13, ESCAPE: 27, HOME: 36, INSERT: 45, LEFT: 37, MENU: 93, NUMPAD_ADD: 107, NUMPAD_DECIMAL: 110, NUMPAD_DIVIDE: 111, NUMPAD_ENTER: 108,
				NUMPAD_MULTIPLY: 106, NUMPAD_SUBTRACT: 109, PAGE_DOWN: 34, PAGE_UP: 33, PERIOD: 190, RIGHT: 39, SHIFT: 16, SPACE: 32, TAB: 9, UP: 38, WINDOWS: 91
			}
		}
		$.fn.bs2editor = function(options) {
			return this.each(function(options) {
	            var t = $(this),
	            data = t.data(),
				opts=$.extend(true,{},$.bs2editor.defaults,options);

				if (data.bs2editorInitialized) return;
				t.data('bs2editor-initialized', true);

	            $(document).on('click', function(event) {
					if (($(event.target).closest(t).length == 1)) return;
				});
				t.on('keyup blur paste',function(){
					surroundInElement(
						t.get(0)
						,opts.urlRegex
						,(function(matchedTextNode) {
							var el = document.createElement("a");
							el.href = matchedTextNode.data;
							el.target = "_blank";
							el.appendChild(matchedTextNode);
							return el;
						})
						,(function(el){return el.tagName != "A";})
					);
				    restoreSelection(t.get(0), saveSelection(t.get(0)));
				});

				this.btnBold = (typeof opts.buttons.bold == "string") ?findButtonBySelector(t,opts.buttons.bold) :opts.buttons.bold;
				this.btnBold.on('click',function(e){
					e.preventDefault();
			        var sel=getSelected();
			        if(sel){
			            var txt=sel.toString();
			            var rep = sel.getRangeAt(0);
			            rep.deleteContents();
			            rep.insertNode(rep.createContextualFragment('<b>'+txt+'</b>'))
					}
		        });

				this.btnLink = (typeof opts.buttons.bold == "string") ?findButtonBySelector(t,opts.buttons.link) :opts.buttons.link;
				this.btnLink.on('click',function(e){
					e.preventDefault();
			        var sel=getSelected();
			        if(sel){
			            var txt=sel.toString();
			            var rep = sel.getRangeAt(0);
			            rep.deleteContents();
			            rep.insertNode(rep.createContextualFragment('<a href="'+txt+'">'+txt+'</a>'))
			        }
				});
	        });
	    }
	}
	return $.fn.bs2editor;
})(jQuery);

/*
$(document).ready(function(){
    var ta=$(".textarea-1");
    var controlledText='';
    ta.on("keydown",function(e){
        console.debug("keydown::"+e.keyCode);
        if(e.keyCode==8)controlledText=controlledText.substr(0,controlledText.length-1);
    }).on("keypress",function(e){
        //ta.html(highlightUrls(ta.html()));return;
        var key=e.keyCode,
        pattern=/[\,\s;]/i;
        if(pattern.test(String.fromCharCode(key))){
            controlledText='';
            return;
        }
        controlledText+=String.fromCharCode(key);
        console.debug("word:"+controlledText);
        if(isURL(controlledText)){
            var html='<a href="'+controlledText+'">'+controlledText+'</a>';
            try {
                var selection = window.getSelection(),
                range = selection.getRangeAt(0),
                linkNode = document.createElement('a'),
                linkHref = document.createAttribute('href',controlledText),
                linkText = document.createTextNode(controlledText),
                insertion = document.createDocumentFragment();
                linkNode.appendChild(linkHref).appendChild(linkText);
                insertion.appendChild(linkNode);
                console.debug("selection:["+selection.toString()+"]");
                console.debug("range:["+range.toString()+"]");
                range.deleteContents();
                range.insertNode(insertion);
            } catch (z) {
                try {
                    document.selection.createRange().pasteHTML(html);
                } catch (z) {}
            }
        }
    });
});
*/
