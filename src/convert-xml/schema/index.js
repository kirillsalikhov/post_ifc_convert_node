const fs = require('fs-extra');
const path = require('path');

// TODO probably move somewhere
// Attrs that are not in entities.json but is ok not to have types for them
const IGNORE_ATTRS = new Set(["id"]);

class Schema {

    entityAttrsIdx = null;
    psetsIdx = null;

    constructor(name) {
        this.name = name
    }

    async init() {
        [this.entityAttrsIdx, this.psetsIdx] = await Promise.all([
            this._load('entities.json'),
            this._load('psets.json')
        ]);
    }

    get schemaName() { return this.name}

    async _load(fileName) {
        return await fs.readJson(
            path.resolve(__dirname, `gen/${this.schemaName.toUpperCase()}/${fileName}`)
        );
    }

    getAttrsDef(ifcType, attrName) {
        const entity = this.entityAttrsIdx[ifcType];
        if (!entity) {
            console.warn(`No entityDef for ifcType: ${ifcType}`);
            return null;
        }
        let attr = entity[attrName];

        if (!attr) {
            if (IGNORE_ATTRS.has(attrName)) {
                return null;
            }
            if (this._ifcOpenShellAttrsMods(ifcType, attrName)) {
                return this._ifcOpenShellAttrsMods(ifcType, attrName);
            }

            console.warn(`No ${attrName} for ifcType: ${ifcType}`)
        }
        return attr;
    }

    _ifcOpenShellAttrsMods(ifcType, attrName) {
        // IfcMaterialLayer use name form IfcMaterial
        if (ifcType === "IfcMaterialLayer" && attrName === "Name") {
            return this.entityAttrsIdx["IfcMaterial"][attrName];
        }

        // IfcMaterialLayerSetUsage use LayerSetName from IfcMaterialLayerSet
        if (ifcType === "IfcMaterialLayerSetUsage" && attrName === "LayerSetName") {
            return this.entityAttrsIdx["IfcMaterialLayerSet"][attrName];
        }
        return null;
    }
}

exports.Schema = Schema;
