const {getSerializer} = require('./serializers');

class Element {
    constructor(parser, tagName, attributes={}, parent) {
        // ???
        this.parser = parser;

        this.tagName = tagName;
        this.attributes = attributes;
        this.parent = parent;

        if (this.parent) {
            this.parent.addChild(this);
        }
        const [serializer, serializerTitle] = getSerializer(this);
        this._serializer = serializer;
        this._groupName = serializerTitle;
    }

    isNode() {
        // TODO may be check it in gltf ?
        return !!this.attributes["ObjectPlacement"]
            || this.tagName === "IfcProject";
    }

    get id() {
        return this.attributes.id;
    }

    get ifcType() {
        return this.tagName;
    }

    addChild(child) {
        this.children ||= [];
        this.children.push(child)
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

    // used for key in parent json
    get groupingName() {
        return this._groupName(this);
    }

    toJson() {
        return this._serializer(this);
    }
}

exports.Element = Element;
