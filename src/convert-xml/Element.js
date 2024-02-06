const {getSerializer} = require('./serializers');

class Element {
    constructor(parser, tagName, attributes={}) {
        // ???
        this.parser = parser;

        this.tagName = tagName;
        this.attributes = attributes;
        this.parent = null;
        this.children = [];

        const [serializer, serializerTitle] = getSerializer(this, parser.serializersConfig);
        this._serializer = serializer;
        this._groupName = serializerTitle;
    }

    isNode() {
        //note: if this will ever use any info from gltf, remember, that gltf only includes nodes with geometry
        return !!this.attributes["ObjectPlacement"]
            || this.tagName === "IfcProject";
    }

    get id() { return this.attributes.id; }
    get ref() { return this.attributes["xlink:href"]; }
    get ifcType() { return this.tagName; }

    get nodeChildren() {
        return this.children.filter(el => el.isNode());
    }

    get dataChildren() {
        return this.children.filter(el => !el.isNode());
    }

    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    setText(text) {
        const val = text.trim();
        if (val) {
            this.text = val;
        }
    }

    setInternalId(_id) {
        this._id = _id;
    }

    getAttrDefs(attrName) {
        return this.parser.schema.getAttrsDef(this.ifcType, attrName);
    }

    getPsetDef(propName) {
        if (this.ifcType !== "IfcPropertySet") {
            console.warn(`Method getPsetDef was called not on Pset, element ${this.id}`)
        }
        return this.parser.schema.getPsetDef(this.attributes.Name, propName);
    }
    // CategoryId like in smeta5d,
    // one ancestor down from IfcBuildingElement or ifcType
    getCategory() {
        return this.parser.schema.getAncestor(this.ifcType) || this.ifcType;
    }

    // returns other entity
    // IfcWall => IfcWallType
    getTypeEntity() {
        const typeNames = this.parser.schema.getTypeEntity(this.ifcType) || [];
        let typeEl = this.dataChildren.find(el => typeNames.includes(el.ifcType));
        if (typeEl) {
            typeEl = typeEl.ref ? this.parser.getByRef(typeEl.ref) : typeEl;
        }
        return typeEl;
    }

    // used for key in parent json
    get groupingName() {
        return this._groupName(this);
    }

    toJson() {
        return this._serializer(this);
    }
}

exports.Element = Element;
