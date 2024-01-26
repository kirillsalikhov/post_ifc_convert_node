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

const revitFamilyAttrs = (el, res) => {
    if (el.attributes["ObjectType"]) {
        let familyName = "", typeName = "";

        const parts = el.attributes["ObjectType"].split(":")

        if (parts.length === 2) {
            [familyName, typeName] = parts;
        } else if (parts.length === 1) {
            // for some reason in smeta5d xml file
            // if there's no ':', only typeName is used
            typeName = parts[0];
        } else if (parts.length > 2) {
            // was one example with two ':' 'Монолитная площадка:Толщина: 300 мм'
            familyName = parts.shift();
            typeName = parts.join(":")
        } else {
            // should not get here
            console.warn(`Object type strange split for element ${el.id}`);
        }
        res["FamilyName"] = familyName;
        res["TypeName"] = typeName;
    }
}

const internal = (el, res) => {
    res["_id"] = el._id;
    res["GlobalId"] = el.id;
    res["parent_id"] = el.parent._id;
}

const typeTitle = (el) => el.ifcType;
const nameTitle = (el) => el.attributes["Name"];
const customTitle = (title) => (el) => title;

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
    revitFamilyAttrs,
    internal,
    typeTitle,
    customTitle,
    nameTitle,
    combineModifiers,
    singleAttr
}
