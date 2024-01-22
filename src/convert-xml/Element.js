class Element {
    constructor(tagName, attributes={}, parent) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.parent = parent;

        if (this.parent) {
            this.parent.addChild(this);
        }
    }

    isNode() {
        // TODO may be check it in gltf ?
        return !!this.attributes["OBJECTPLACEMENT"]
            || this.tagName === "IFCPROJECT";
    }

    get id() {
        return this.attributes.ID;
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
}

exports.Element = Element;
