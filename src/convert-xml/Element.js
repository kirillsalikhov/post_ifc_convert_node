class Element {
    constructor(tagName, attributes={}, parent) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.parent = parent;

        if (this.parent) {
            this.parent.addChild(this);
        }
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
