const {getSerializer} = require('./serializers');

class Element {
    constructor(parser, tagName, attributes={}) {
        // ???
        this.parser = parser;

        this.tagName = tagName;
        this.attributes = attributes;
        this.parent = null;
        this.children = [];

        const [serializer, serializerTitle] = getSerializer(this);
        this._serializer = serializer;
        this._groupName = serializerTitle;
    }

    isNode() {
        // TODO may be check it in gltf ?
        return !!this.attributes["ObjectPlacement"]
            || this.tagName === "IfcProject";
    }

    get id() { return this.attributes.id; }
    get ref() { return this.attributes["xlink:href"]; }
    get ifcType() { return this.tagName; }

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

    // used for key in parent json
    get groupingName() {
        return this._groupName(this);
    }

    toJson() {
        return this._serializer(this);
    }
}

exports.Element = Element;
