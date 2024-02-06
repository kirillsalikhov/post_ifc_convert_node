const _formatAttr = (def, value) => {
    if (def) {
        return {value, ...def};
    }
    return value;
}

const _formatProp = (def, value) => {
    if (typeof value === 'object' && value !== null) {
        console.warn(`Complex type is formatted as def ${value}`);
    }
    if (def) {
        return {value, ...def};
    }

    return value;
}

const attrsWithDef = (el, res) => {
    for(const [key, value] of Object.entries(el.attributes)) {
        const attrDef = el.getAttrDefs(key);
        res[key] = _formatAttr(attrDef, value);
    }
}

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

//note: this is a workaround; there is currently (2024, Feb 5) no other clean way to pass metadata up in the hierarchy
const IS_UNKNOWN_PSET = Symbol('unknown_pset');
const dataChildren = (el, res) => {
    const unknown_psets = [];
    for (let child of el.dataChildren) {
        let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
        const newValue = childEl.toJson();
        if (newValue[IS_UNKNOWN_PSET]) {
            //note: custom psets can have non-unique names, so we don't warn about overrides in this case.
            unknown_psets.push({
                name: childEl.groupingName,
                props: newValue
            });
        } else {
            if ((childEl.groupingName in res) && res[childEl.groupingName] !== newValue) {
                console.warn(`Serialize: Element (${childEl.id}) overrides an already existing prop in ${el.id}`);
            }
            res[childEl.groupingName] = newValue;
        }
    }

    if (unknown_psets.length > 0) {
        res.custom_property_sets = unknown_psets;
    }
}

const dataChildrenPsetWithDef = (el, res) => {
    for (let child of el.dataChildren) {
        let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
        if (res[childEl.groupingName]) {
            console.warn(`Serialize: Element (${childEl.id}) overrides an already existing prop in ${el.id}`)
        }
        const propDef = el.getPsetDef(childEl.groupingName);
        res[childEl.groupingName] = _formatProp(propDef, childEl.toJson());
    }

    const psetDef = el.parser.schema.getPset(el.groupingName);
    if (!psetDef) {
        res[IS_UNKNOWN_PSET] = true;
    }
}

const dataChildrenPset = (el, res) => {
    //note: fully duplicates dataChildren. May want to simplify.
    for (let child of el.dataChildren) {
        let childEl = child.ref ? el.parser.getByRef(child.ref) : child;
        if (res[childEl.groupingName]) {
            console.warn(`Serialize: Element (${childEl.id})overrides already existing prop in ${el.id}`)
        }
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

const filterDataForIV = (el, res) => {
    // when Industrial Viewer sees an array, it simply does array.join(', ')
    // it only makes sense, for arrays of primitives.
    // Otherwise, arbitrarily nested structures work fine.
    // So this function only removes arrays whose elements aren't primitives.
    // Coincidentally it also keeps "children" intact. So no need to handle that explicitly.
    const filterDataForIVRecursive = (current) => {
        if (Array.isArray(current)) {
            return current.every(element => typeof element !== 'object')
                ? current
                : undefined;
        }
        if (typeof current === 'object') {
            const filteredCurrent = {};
            for (const prop in current) {
                if (Object.hasOwn(current, prop)) {
                    filteredCurrent[prop] = filterDataForIVRecursive(current[prop]);
                }
            }
            return filteredCurrent;
        }
        return current;
    }

    const newRes = filterDataForIVRecursive(res);

    for (const prop in res) {
        if (Object.hasOwn(res, prop)) {
            res[prop] = undefined;
        }
    }

    Object.assign(res, newRes);
}

const type = (el, res) => {
    res["ifcType"] = el.ifcType;
}

// returns Ancestor in Ifc classes hierarchy from IfcBuildingElement
// or himself if not found
// see getCategory for more info
const categoryId = (el, res) => {
    res["CategoryId"] = el.getCategory();
}

const revitFamilyAttrs = (el, res) => {
    let familyName = "", typeName = "";

    if (el.attributes["ObjectType"]) {
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
    } else {
        const typeEntity = el.getTypeEntity();
        if (typeEntity?.attributes.Name) {
            typeName = typeEntity?.attributes.Name
        } else if (el.attributes?.Name) {
            typeName = el.attributes.Name
        }
    }
    res["FamilyName"] = familyName;
    res["TypeName"] = typeName;
}

const internal = (el, res) => {
    res["_id"] = el._id;
    res["GlobalId"] = el.id;
    res["parent_id"] = el.parent._id;
    res["originalName"] = el.attributes.Name;
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

// used for IfcPropertyEnumeratedValue
// will produce IfcPropertyEnumeratedValue.Name => true
const propTrue = (el) => { return true }

// should not be used for Pset
const singleAttrWithDef = (attrName) => {
    return (el) => {
        const attrDef = el.getAttrDefs(attrName)
        const value = el.attributes[attrName];
        return _formatAttr(attrDef, value);
    }
}

module.exports = {
    attrs,
    attrsWithDef,
    nodeChildren,
    dataChildren,
    dataChildrenPsetWithDef,
    dataChildrenPset,
    dataChildrenArr,
    filterDataForIV,
    type,
    categoryId,
    revitFamilyAttrs,
    internal,
    typeTitle,
    customTitle,
    nameTitle,
    combineModifiers,
    singleAttr,
    propTrue,
    singleAttrWithDef
}
