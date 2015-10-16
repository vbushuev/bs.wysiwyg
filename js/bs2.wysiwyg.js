$(document).ready(function(){
    $(".textarea").bs2editor();
    var text = $(".textarea").html();

    console.debug("match:   "+text.match(/\b(ipsum)\b/ig));
    console.debug("search:  "+text.search(/\b(ipsum)\b/ig));
    $(".textarea").on('keyup',function(){

        /*var tt=text,
        t=$(".textarea"),
        regex=/\b(ipsum)\b/ig,
        pos=text.search(regex),
        sel=window.getSelection(),
        word=text.match(regex)[0],
        insertion = document.createDocumentFragment();
        insertion.appendChild($('<a href="#">'+word+'</a>').get(0));
        var range = document.createRange();
        range.setStart(t.get(0).firstChild, pos);
        range.setEnd(t.get(0).firstChild, word.length);
        //range.deleteContents();
        //range.insertNode(insertion);
        sel.removeAllRanges();
        sel.addRange(range);*/
    });
    
});
