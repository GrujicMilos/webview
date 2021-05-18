import Ids from 'ids';
import { Moddle } from 'moddle';

export default function FlowModdle(packages, options) {
	Moddle.call(this, packages, options);
	this.ids = new Ids();
}

function is(element, type) {
	return element.$instanceOf(type);
}

FlowModdle.prototype = Object.create(Moddle.prototype);


FlowModdle.prototype.fromJSON = function (doc, uiDoc, relationList, done) {
	let states = [];
	let related = [];
	let relationships = [];
	let stateMap = {};
	let relatedMap = {};
	let shapeMap = {};

	try {
		let shapes = [];

		doc.states.forEach((state) => {
			let obj = {};
			for (var prop in state) {
				obj[prop] = state[prop];
			}

			let mState = this.create(`flow:State`, obj);

			mState.id = this.ids.nextPrefixed(`state_`, mState);

			states.push(mState)
			stateMap[state.name] = mState;

			let labelBounds = null;
			let shapeBounds = null;

			let stateID = 'state_' + state.name;
			if (uiDoc && uiDoc.findIndex(n => n.id === stateID) > -1) {
				let index = uiDoc.findIndex(n => n.id === stateID);
				let ui = uiDoc[index];
				labelBounds = {
					x: ui.label.bounds.x,
					y: ui.label.bounds.y,
					width: ui.label.bounds.width,
					height: ui.label.bounds.height
				};
				shapeBounds = { x: ui.bounds.x, y: ui.bounds.y, width: ui.bounds.width, height: ui.bounds.height }
			} else {
				let positionX = Math.floor(Math.random() * 20) * 60;
				let positionY = Math.floor(Math.random() * 20) * 60;
				labelBounds = { x: positionX - 20, y: positionY + 60, width: 90, height: 20 };
				shapeBounds = { x: positionX, y: positionY + 20, width: 40, height: 40 }
			}

			let mLBounds = this.create(`dc:Bounds`, labelBounds);
			let mLabel = this.create(`flowdi:FLOWLabel`, { bounds: mLBounds });

			let mBounds = this.create(`dc:Bounds`, shapeBounds);

			let mShape = this.create(`flowdi:FLOWShape`, {
				id: this.ids.nextPrefixed(`shape_`, state),
				label: mLabel,
				bounds: mBounds,
				flowElement: mState
			});

			shapes.push(mShape);

			shapeMap[state.name] = mShape;
		});

		if (relationList) {
			relationList.names.forEach((relation) => {
				let obj = {};
				for (var prop in relation) {
					obj[prop] = relation[prop];
				}

				let mRelated = this.create(`flow:Related`, obj);

				mRelated.id = this.ids.nextPrefixed(`related_`, mRelated);

				related.push(mRelated)
				relatedMap[relation.name] = mRelated;
				let shapeBounds = null;

				let relatedDocumentID = 'related_' + relation.name;

				if (uiDoc && uiDoc.findIndex(n => n.id === relatedDocumentID) > -1) {
					let index = uiDoc.findIndex(n => n.id === relatedDocumentID);
					let ui = uiDoc[index];
					shapeBounds = { x: ui.bounds.x, y: ui.bounds.y, width: ui.bounds.width, height: ui.bounds.height }
				} else {
					let positionX = Math.floor(Math.random() * 20) * 60;
					let positionY = Math.floor(Math.random() * 20) * 60;
					shapeBounds = { x: positionX, y: positionY + 20, width: 100, height: 80 }
				}

				let mBounds = this.create(`dc:Bounds`, shapeBounds);

				let mShape = this.create(`flowdi:FLOWShape`, {
					id: this.ids.nextPrefixed(`related_`, relation),
					bounds: mBounds,
					flowElement: mRelated
				});

				shapes.push(mShape);
				shapeMap[relation.name] = mShape;
			});

			relationList.transitions.forEach((transition) => {
				let obj = {};
				for (var prop in transition) {
					if (prop != `from` && prop != `to`) {
						obj[prop] = transition[prop];
					}
				}
				obj.source = stateMap[transition.from];
				obj.target = relatedMap[transition.to];
				obj.direction = `Forward`;

				let mRelationship = this.create(`flow:Relationship`, obj);
				mRelationship.id = this.ids.nextPrefixed(`transition_`, mRelationship);

				relationships.push(mRelationship)

				if (!shapeMap[transition.from]) {
					throw new Error(`Transition '${transition.name}' has invalid 'from' state '${transition.from}'.`);
				}
				let mSourceBounds = shapeMap[transition.from].bounds;

				if (!shapeMap[transition.to]) {
					throw new Error(`Transition '${transition.name}' has invalid 'to' state '${transition.to}'.`);
				}
				let mTargetBounds = shapeMap[transition.to].bounds;

				let mWaypoints = [];
				let relatedDocumentTransitionID = 'transition_RD_' + transition.from + `_` + transition.to;

				if (uiDoc && uiDoc.findIndex(n => n.id === relatedDocumentTransitionID) > -1) {

					let index = uiDoc.findIndex(n => n.id === relatedDocumentTransitionID);
					let ui = uiDoc[index];

					ui.waypoints.forEach((waypoint) => {
						mWaypoints.push(this.create('dc:Point', { x: waypoint.x, y: waypoint.y }))
					})

				} else {
					let middle = (mSourceBounds.y + mTargetBounds.y) / 2;
					mWaypoints = [
						this.create(`dc:Point`, { x: mSourceBounds.x + 20, y: mSourceBounds.y + 20 }),
						this.create(`dc:Point`, { x: mSourceBounds.x + 20, y: middle + 20 }),
						this.create(`dc:Point`, { x: mTargetBounds.x + 20, y: middle + 20 }),
						this.create(`dc:Point`, { x: mTargetBounds.x + 20, y: mTargetBounds.y })
					];
				}

				let mEdge = this.create(`flowdi:FLOWEdge`, {
					id: this.ids.nextPrefixed(`edge_`, transition),
					waypoint: mWaypoints,
					flowElement: mRelationship
				});

				shapes.push(mEdge);
			});
		}

		doc.transitions.forEach((transition) => {
			let obj = {};
			for (var prop in transition) {
				if (prop != `from` && prop != `to`) {
					obj[prop] = transition[prop];
				}
			}
			obj.source = stateMap[transition.from];
			obj.target = stateMap[transition.to];
			obj.direction = `Forward`;

			let mRelationship = this.create(`flow:Relationship`, obj);
			mRelationship.id = this.ids.nextPrefixed(`transition_`, mRelationship);

			relationships.push(mRelationship)

			if (!shapeMap[transition.from]) {
				throw new Error(`Transition '${transition.name}' has invalid 'from' state '${transition.from}'.`);
			}
			let mSourceBounds = shapeMap[transition.from].bounds;

			if (!shapeMap[transition.to]) {
				throw new Error(`Transition '${transition.name}' has invalid 'to' state '${transition.to}'.`);
			}
			let mTargetBounds = shapeMap[transition.to].bounds;

			let mWaypoints = [];
			let labelBounds = null;

			let stateTransitionID = 'transition_' + transition.name;

			if (uiDoc && uiDoc.findIndex(n => n.id === stateTransitionID) > -1) {
				let index = uiDoc.findIndex(n => n.id === stateTransitionID);
				let ui = uiDoc[index];
				labelBounds = {
					x: ui.label.bounds.x,
					y: ui.label.bounds.y,
					width: ui.label.bounds.width,
					height: ui.label.bounds.height
				};

				ui.waypoints.forEach((waypoint) => {
					mWaypoints.push(this.create(`dc:Point`, { x: waypoint.x, y: waypoint.y }))
				})

			} else {
				let middle = (mSourceBounds.y + mTargetBounds.y) / 2;
				labelBounds = {
					x: Math.abs(mSourceBounds.x + mTargetBounds.x) / 2,
					y: Math.abs(mSourceBounds.y + mTargetBounds.y) / 2 - 10,
					width: 90,
					height: 20
				};
				mWaypoints = [
					this.create(`dc:Point`, { x: mSourceBounds.x + 20, y: mSourceBounds.y + 20 }),
					this.create(`dc:Point`, { x: mSourceBounds.x + 20, y: middle + 20 }),
					this.create(`dc:Point`, { x: mTargetBounds.x + 20, y: middle + 20 }),
					this.create(`dc:Point`, { x: mTargetBounds.x + 20, y: mTargetBounds.y })
				];
			}

			let mBounds = this.create(`dc:Bounds`, labelBounds);
			let mLabel = this.create(`flowdi:FLOWLabel`, { bounds: mBounds });

			let mEdge = this.create(`flowdi:FLOWEdge`, {
				id: this.ids.nextPrefixed(`edge_`, transition),
				label: mLabel,
				waypoint: mWaypoints,
				flowElement: mRelationship
			});

			shapes.push(mEdge);
		});

		let planeObj = this.create(`flow:Plane`, {
			nodes: [].concat(states, relationships, related)
		});

		planeObj.id = this.ids.nextPrefixed(`rootPlane_`, planeObj);

		let mPlane = this.create(`flowdi:FLOWPlane`, {
			id: this.ids.nextPrefixed(`plane_`, planeObj),
			planeElement: shapes,
			flowElement: planeObj
		});

		let mDiagram = this.create(`flowdi:FLOWDiagram`, {
			id: this.ids.nextPrefixed(`diagram_`, { diagram: true }),
			plane: mPlane
		})

		let definitions = this.create(`flow:Definitions`, {
			name: `Main definition`,
			id: this.ids.nextPrefixed(`definitions_`, { definition: true }),
			rootElements: [planeObj],
			relationships: relationships,
			diagrams: [mDiagram]
		});

		done(null, definitions, this);

	} catch (err) {
		return done(err, undefined, this);
	}
};


FlowModdle.prototype.toJSON = function (definitions, rootChildren, options, done) {

	let transitions = [];
	let states = [];
	let shapes = [];
	let processedList = [];
	let isValid = true;

	try {
		let nodes = definitions.rootElements[0].nodes;
		nodes.forEach((node) => {
			let allProperties = node.$descriptor.properties;
			let attributes = allProperties.filter((prop) => prop.isAttr && !prop.isId);

			if (is(node, `flow:State`)) {
				if (rootChildren.findIndex(n => n.id === node.id) === -1) {
					return;
				} else {
					if (!node.name) {
						isValid = false;
						throw new Error('State name is mandatory.');
					} else if (!checkIsPascalCase(node.name)) {
						throw new Error(`Inserted State name '${node.name}' should be pascalCase`);
					}
					let nodeName = `state_` + node.name;
					let nodeId = node.id;

					if (processedList.some(n => n.nodeId === nodeName)) {
						if (processedList.some(n => n.id === nodeId)) {
							return;
						} else {
							isValid = false;
							throw new Error(`Inserted State name '${node.name}' already exists.`);
						}
					}
					processedList.push({ nodeId: nodeName, id: nodeId });

					let obj = {};
					attributes.forEach((attr) => {
						if (node[attr.name] !== undefined) {
							obj[attr.name] = node[attr.name];
						}
					})

					states.push(obj);

					let di = node.di;
					let bounds = di.bounds;
					let labelBounds = di.label.bounds;

					shapes.push({
						id: nodeName,
						bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
						label: {
							bounds: { x: labelBounds.x, y: labelBounds.y, width: labelBounds.width, height: labelBounds.height },
						}
					});

				}


			} else if (is(node, `flow:Relationship`)) {
				if (rootChildren.findIndex(n => n.id === node.id) === -1) {
					return;
				} else if (node.target && node.target.$type === `flow:State`) {
					if (!node.name) {
						isValid = false;
						throw new Error('Transition name is mandatory.');
					} else if (!checkIsPascalCase(node.name)) {
						throw new Error(`Inserted Transition name '${node.name}' should be pascalCase`);
					}
					let nodeId = `transition_` + node.name;

					if (processedList.indexOf(nodeId) != -1 || !node.source || !node.target) {
						isValid = false;
						throw new Error(`Inserted Transition name '${node.name}' already exists.`);
					}

					processedList.push(nodeId);

					let obj = {};
					attributes.forEach((attr) => {
						if (node[attr.name] !== undefined && attr.name === 'name') {
							obj[attr.name] = node[attr.name];
						}
					})
					obj['from'] = node.source.name;
					obj['to'] = node.target.name;

					attributes.forEach((attr) => {
						if (node[attr.name] !== undefined && attr.name !== 'name') {
							obj[attr.name] = node[attr.name];
						}
					})
					let waypoint = node.di.waypoint;
					let labelB;
					if (node.di.label) {
						labelB = node.di.label.bounds;
					} else {
						return;
					}
					transitions.push(obj);
					shapes.push({
						id: nodeId,
						waypoints: waypoint.map((point) => {
							return { x: point.x, y: point.y }
						}),
						label: {
							bounds: { x: labelB.x, y: labelB.y, width: labelB.width, height: labelB.height },
						}
					});
				} else if (node.target && node.target.$type === `flow:Related`) {
					let nodeId = `transition_RD_` + node.source.name + `_` + node.target.name;

					if (!node.source || !node.target) {
						return;
					}

					processedList.push(nodeId);

					let waypoint = node.di.waypoint;
					shapes.push({
						id: nodeId,
						waypoints: waypoint.map((point) => {
							return { x: point.x, y: point.y }
						}),
						source: `state_` + node.source.name
					});
				}
			}
			else if (is(node, `flow:Related`)) {
				if (rootChildren.findIndex(n => n.id === node.id) === -1) {
					return;
				} else {
					let nodeName = `related_` + node.name;
					let nodeId = node.id;

					if (!node.name) {
						isValid = false;
						throw new Error('Please add label for related document.');
					} else if (!checkIsPascalCase(node.name)) {
						throw new Error(`Inserted Related document name '${node.name}' should be pascalCase`);
					}
					else if (processedList.some(n => n.nodeId === nodeName)) {
						if (processedList.some(n => n.id === nodeId)) {
							return;
						} else {
							isValid = false;
							throw new Error(`Inserted Related document name '${node.name}' already exists.`);
						}
					}

					processedList.push({ nodeId: nodeName, id: nodeId });

					let di = node.di;
					let bounds = di.bounds;

					shapes.push({
						id: nodeName,
						bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
					});
				}
			}
		});
	} catch (err) {
		return done(err);
	}

	if (isValid) {
		done(null, { states, transitions, shapes });
	}
}

function checkIsPascalCase(shapeName) {
	const regexp = new RegExp('^(_*[A-Z]+[a-z0-9]+)');
	return regexp.test(shapeName);
}
