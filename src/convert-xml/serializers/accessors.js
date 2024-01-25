const {getCategory} = require("./dicts");

const attrs = (el, res) => {
    Object.assign(res, el.attributes);
}

const nodeChildren = (el, res) => {
    const childrenIds = el.nodeChildren
        .map(el => el._id);

    if (childrenIds.length) {
        res["children"] = childrenIds;
    }
}

const dataChildren = (el, res) => {
    for (let child of el.dataChildren) {
        let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
        res[childEl.groupingName] = childEl.toJson();
    }
}

const dataChildrenArr = (groupingName) => {
    return (el, res) => {
        for (let child of el.dataChildren) {
            let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
            res[groupingName] ||= [];
            res[groupingName].push(childEl.toJson());
        }
    }
}

const type = (el, res) => {
    res["ifcType"] = el.ifcType;
}

// returns Ancestor in Ifc classes hierarchy from IfcBuildingElement
// or himself is not found
// see getCategory for more info
const categoryId = (el, res) => {
    res["CategoryId"] = getCategory(el.ifcType);
}

const internal = (el, res) => {
    res["_id"] = el._id;
    res["GlobalId"] = el.id;
    res["parent_id"] = el.parent._id;
}

const typeTitle = (el) => el.ifcType;
const nameTitle = (el) => el.attributes["Name"];

const combineModifiers = (accessors) => {
    return (el) => {
        let res = {};
        for (const accessor of accessors) {
            accessor(el, res);
        }
        return res;
    }
}

// this one returns value, NOT modify res
const singleAttr = (attrName) => {
    return (el) => { return el.attributes[attrName] }
}

module.exports = {
    attrs,
    nodeChildren,
    dataChildren,
    dataChildrenArr,
    type,
    categoryId,
    internal,
    typeTitle,
    nameTitle,
    combineModifiers,
    singleAttr
}
