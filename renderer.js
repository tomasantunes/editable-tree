// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const electron = require('electron');
const os = require('os');
const path = require("path");
const fs = require("fs");
const jsonfile = require('jsonfile');
const {dialog} = require('electron').remote;
const mainWindow = require('electron').remote.getCurrentWindow();
const Datastore = require('nedb');
var later = require('later');

function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd
  } 

  if(mm<10) {
      mm = '0'+mm
  } 

  today = mm + '/' + dd + '/' + yyyy;
  return today;
}

/**
 * Simple decision tree parser and traversal.
 * @author njmcode
 * @param data - object {
 *     initial: [], (list of choice IDs for the root node)
 *     choices: {}  (keyed object of all possible choices)
 * }
**/
var DecisionTree = function(data) {
  
  this.initial = data.initial;
  this.choices = data.choices;
  
  /* Return an array of choice objects for the root of the tree */
  this.getInitial = function() {
    
    if (!this.initial) throw 'DecisionTree: no initial choice(s) specified';
    return this.getChoices(this.initial);
    
  };
  
  /* Get full choice data by specific id */
  this.getChoice = function(id) {

    if (!(id in this.choices)) return false;
    if (!('id' in this.choices[id])) this.choices[id].id = id;
    return this.choices[id];
    
  };
  
  /* As above, but passing an array of choice IDs */
  this.getChoices = function(idList) {
    if(!idList) return [];
    var list = [];
    for(var i = 0, ln = idList.length; i < ln; i++) {
      var childChoice = this.getChoice(idList[i]);
      list.push(childChoice);
    }
    return list;
    
  };
  
  /* Get an array of choice data for a parent id */
  this.getChildren = function(parentId) {
    
    if (!(parentId in this.choices)) return false;
    if (!('children' in this.choices[parentId])) return false;
    
    var childIds = this.choices[parentId].children;
    return this.getChoices(childIds);
    
  };

  /* Get an array of links data for a parent id */
  this.getLinks = function(parentId) {
    
    if (!(parentId in this.choices)) return false;
    if (!('children' in this.choices[parentId])) return false;
    
    var links = this.choices[parentId].links;
    return links;
    
  };
  
  /* Get an array of choice data for the parent(s) of an id */
  this.getParents = function(id) {
    
    var parents = [];
    var node = this.getChoice(id);
    
    while(node.parent) {
      node = this.getChoice(node.parent);
      parents.unshift(node);
    }
    
    return parents;
    
  };
  
  /* Get just an array of ids for the parents of a specific id */
  this.getParentIds = function(id) {
    var parents = this.getParents(id);
    var parentIds = [];
    for(var i = 0, ln = parents.length; i < ln; i++) {
      parentIds.push(parents[i].id);
    }
    return parentIds;
  };
  
  /* Get the 'name' prop for the parent of an id */
  this.getParentName = function(id) {
    var parent = this.getParents(id).pop();
    if(!parent) {
      return false;
    } else {
      return parent.name;
    }
  };
  
  /* Init - insert ids into choice objects, check dups, associate parents, etc */
  this.init = function() {
    
    var idList = [];
    for(var k in this.choices) {
      if(idList.indexOf(k) !== -1) throw 'DecisionTree: duplicate ID "' + k + '" in choice set';
      
      var choice = this.getChoice(k);
      choice.id = k;
      
      var children = this.getChildren(k);
      for(var i = 0; i < children.length; i++) {
        
        var child = children[i];
        if(!child.parent) {
          child.parent = k;
        }
      }
      
    }
    
    console.log('init', this.initial, this.choices);
    
  };
  
  this.init();
  
};


/*** TEST DATA ***/

var data = {
  initial: [],
  choices: {},
};

/** TEST CODE **/

$(function() {
  
  var tree = new DecisionTree(data);
  var $list = $('#choices');
  var $title = $('#choices-title');
  var $links = $('#links');
  
  var current_id = null;
  
  var renderList = function(items, parent_title) {
    

    if (current_id != null) {
      var title = data['choices'][current_id]['name'];
    }
    if(title) {
      $title.text(title);
    } else {
      $title.text('Start');
    }
    
    $list.empty();
    for(var i = 0; i < items.length; i++) {
      var item = items[i];
      $list.append('<tr><td><a href="#" data-choice="' + item.id + '">' + item.name + '</a></td><td style="width: 40px;"><button data-choice="' + item.id + '" class="btn btn-default remove-btn"><i class="fa fa-times"></button></td></tr>');
    }
    renderLinks();
  };

  var renderLinks = function() {
    $links.empty();
    if (current_id != null) {
      links = data['choices'][current_id]['links'];
      $.each(links, function(i, val) {
        $links.append('<tr><td><a href="'+val+'">'+val+'</a></td></tr>');
      });
    }
  }
  
  var _doInitial = function() {
      if (!fs.existsSync('data.json')) {
        jsonfile.writeFileSync('data.json', data)
      }
      else {
        var load_data = jsonfile.readFileSync('data.json');
        data = load_data;
        tree = new DecisionTree(data);
      }
      var initData = tree.getInitial();
      current_id = null;
      renderList(initData);
  };

  var reload = function() {
      var initData = tree.getInitial();
      current_id = null;
      renderList(initData);
      renderLinks();
  };

  $(document).on('click', '#choices a', function(e) {
    e.preventDefault();
    var choiceId = $(this).data('choice');
    console.log('clicked', choiceId);
    
    var children = tree.getChildren(choiceId);
    current_id = choiceId;
    renderList(children);
  });

  $(document).on('click', '.remove-btn', function(e) {
    var choiceId = $(this).data('choice');
    var index = data['initial'].indexOf(data['choices'][choiceId]['name'])
    data['initial'].splice(index, 1);
    delete data['choices'][choiceId];

    if (current_id) {
      var children = tree.getChildren(choiceId);
      renderList(children);
    }
    else {
      _doInitial();
    }
  });
  
  $('#back').on('click', function(e) {
    e.preventDefault();
    if(!current_id) return false;
    console.log('back button clicked', current_id);
    
    var parents = tree.getParents(current_id);
   
    if(parents.length > 0) {
      var prev_node = parents.pop();
      current_id = prev_node.id;
      renderList(tree.getChildren(prev_node.id));
      renderLinks();
    } else {
      reload();
    }
    
  });
  
  $('#go').on('click', function(e) {
    e.preventDefault();
    
    var cid = $('#show-id').val();
    if(!cid || !(cid in data,choices)) return false;
    console.log('show parents for', cid);
    
    var parentData = tree.getParents(cid);
    $('#results').val(JSON.stringify(parentData, null, 4));
    
  });

  $('#add-submit').click(function() {
    var text = $('#add-input').val();
    var id = text.replace(/[^a-z0-9]/gi,'');
    if (current_id) {
      if (!data['choices'][current_id].hasOwnProperty('children')) {
        data['choices'][current_id]['children'] = [];
      }
      data['choices'][current_id]['children'].push(id);
      data['choices'][id] = {name: text, children: [], links: []};
      var children = tree.getChildren(current_id);
      renderList(children);
    }
    else {
      data['initial'].push(id);
      data['choices'][id] = {name: text, children: [], links: []};
      reload();
    }
    jsonfile.writeFileSync('data.json', data);
    $('#add-input').val("");
  });

  $('#add-link-submit').click(function() {
    var link = $('#add-link-input').val();
    data['choices'][current_id]['links'].push(link);
    jsonfile.writeFileSync('data.json', data);
    renderLinks();
    $('#add-link-input').val("");
  });

  _doInitial();

  
});

