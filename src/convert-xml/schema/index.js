const fs = require('fs-extra');
const path = require('path');
const {createUnitIds} = require("./unit");
const {warnOnce} = require("../warn-once");

// Attrs that are not in entities.json but is ok not to have types for them
const IGNORE_ATTRS = new Set(["id"]);

class Schema {

    entityAttrsIdx = null;
    psetsIdx = null;

    constructor(name, unitEls) {
        this.name = name
        this.unitIdx = createUnitIds(unitEls);
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

    getPset(psetName) {
        const _psetName = psetName.toUpperCase();
        const pset = this.psetsIdx[_psetName];
        if (!pset) {
            warnOnce(`unknown_pset ${psetName}`, `No PsetDef for PropertySet: ${psetName}`);
            return null;
        }
        return pset;
    }

    getPsetDef(psetName, propName) {
        const _propName = propName.toUpperCase();

        const pset = this.getPset(psetName);
        if (!pset) {
            return null;
        }

        let prop = pset[_propName];

        if (!prop) {
            prop = this._ifcOpenShellPsetsMods(pset, _propName);
        }

        if (prop) {
            const unit = this.unitIdx[prop.unit] || null;
            prop = {...prop, unit};
        } else {
            warnOnce(`pset_field ${psetName} ${propName}`, `No ${propName} for PropertySet: ${psetName}`);
        }

        return prop;
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
                // that's ok that we ignore some fields like id
                return null;
            }

            attr = this._ifcOpenShellAttrsMods(ifcType, attrName);
        }

        if (attr) {
            const unit = this.unitIdx[attr.unit] || null;
            attr = {...attr, unit};
        } else {
            console.warn(`No ${attrName} for ifcType: ${ifcType}`);
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

    _ifcOpenShellPsetsMods(pset, propName) {
        // some nested props are flatten to parent pset in xml (e.g. PSet_Draughting and COLOUR)
        const complexProps = Object.entries(pset)
            .filter(([key, value]) => value.props !== undefined);

        for(let [cProp_key, cProp_value] of complexProps) {
            if (cProp_value.props[propName]) {
                // !!! uncomment line below to find nested props that were flattent to parent Pset
                // console.log(`Property ${propName} was found inside Complex property ${cProp_key}`);
                return cProp_value.props[propName];
            }
        }

        return null;
    }
}

exports.Schema = Schema;
