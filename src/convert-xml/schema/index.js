const fs = require('fs-extra');
const path = require('path');

class Schema {
    constructor(name) {
        this.name = name
    }

    async init() {
        [this.entitiesAttrsIdx, this.psetsIdx] = await Promise.all([
            this._load('entities.json'),
            this._load('psets.json')
        ]);
    }

    get schemaName() { return this.name}

    async _load(fileName) {
        return await fs.readJson(
            path.resolve(__dirname, `../../../tmp/${this.schemaName.toUpperCase()}-${fileName}`)
        );
    }
}

exports.Schema = Schema;
