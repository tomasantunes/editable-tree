function get(id)        { return document.getElementById(id);  }
function hide(id)       { get(id).style.visibility = 'hidden'; }
function show(id)       { get(id).style.visibility = null;     }
function html(id, html) { get(id).innerHTML = html;            }
function timestamp()           { return new Date().getTime();                             }
function random(min, max)      { return (min + (Math.random() * (max - min)));            }
function randomChoice(choices) { return choices[randomInt(0, choices.length-1)]; }
function randomBool() { return Math.random() >= 0.5; };
function randomInt(min, max) { return Math.floor(min + (Math.random() * ((max + 1) - min))); }
function inArray(needle, haystack) { return haystack.indexOf(needle) != -1 }

function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}