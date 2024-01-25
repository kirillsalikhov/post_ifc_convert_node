const {hierarchyIfc2x3} = require("./ifc2x3");

const _createAncestorsIdx = (hierarchy) => {
    const idx = {};
    const traverse = (rows, ancestors = []) => {
        for(let row of rows) {
            const name = Array.isArray(row) ? row[0]: row;
            const _ancestors = [name, ...ancestors];
            idx[name] = _ancestors;
            if (Array.isArray(row)) {
                traverse(row[1], _ancestors);
            }
        }
    }
    traverse(hierarchy);
    return idx;
}

const ifc2x3Idx = _createAncestorsIdx(hierarchyIfc2x3);

const getCategory = (typeName) => {
    const ancestors = ifc2x3Idx[typeName];
    if (!ancestors) {
        // commented but if CategoryId is not determined properly => uncomment
        // console.warn(`Typename not found in hierarchy: ${typeName}`);
        return typeName
    }

    return ancestors.at(-1);
}

exports.getCategory = getCategory;
