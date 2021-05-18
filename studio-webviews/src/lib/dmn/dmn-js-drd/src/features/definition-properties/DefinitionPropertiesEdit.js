/* eslint-disable */

import {
  debounce
} from 'min-dash';

var DEBOUNCE_DELAY = 300;

import {
  query as domQuery
} from 'min-dom';


export default function DefinitionIdEdit(eventBus, modeling, canvas) {
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._canvas = canvas;

  eventBus.on('definitionIdView.create', function(event) {
    var container = event.html,
        nameElement = domQuery('.dmn-definitions-name', container),
        idElement = domQuery('.dmn-definitions-id', container);

    this._setup(nameElement, 'name');
    this._setup(idElement, 'id');
  }, this);
}

DefinitionIdEdit.$inject = [
  'eventBus',
  'modeling',
  'canvas'
];


DefinitionIdEdit.prototype.update = function(type, newValue, evt) {
  if (type === 'id') {
    newValue = this.checkIdValue(newValue, evt.target);
  }

  var newProperties = {};
  newProperties[type] = newValue;

  this._modeling.updateProperties(this._canvas.getRootElement(), newProperties);
};

DefinitionIdEdit.prototype.checkIdValue = function(newId, target) {
  const originalValue = newId;

  if (newId === undefined || newId.trim() === '') {
    newId = 'Definitions';
  }

  newId = newId.replace(/\s/g, "");

  if (originalValue !== newId) {
    target.value = newId;
  }

  return newId;
}

DefinitionIdEdit.prototype._setup = function(node, type) {
  var self = this;

  node.setAttribute('contenteditable', true);

  node.addEventListener('input', debounce(function(evt) {
    var value = evt.target.textContent || evt.target.value;

    self.update(type, value.trim(), evt);
  }, DEBOUNCE_DELAY));

  node.addEventListener('keydown', function(evt) {
    if (evt.keyCode === 13) {
      node.blur();
      window.getSelection().removeAllRanges();
    }
  });

};
