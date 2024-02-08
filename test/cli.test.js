const cp = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const xml2js = require('xml2js');

const PROJECT_ROOT = path.resolve(__dirname, '..');

//name: a sampleName of a subdirectory in the directory "samples"
const spawnConvertXml = (sampleName, xmlFileName) => {
    const inputXmlFilePath = path.join(PROJECT_ROOT, 'samples', sampleName, xmlFileName);
    const outputDirectoryPath = path.join(PROJECT_ROOT, 'tmp', sampleName);

    const spawnResult = cp.spawnSync('src/cli.js', [
        'convert-xml',
        '--input-xml', inputXmlFilePath,
        '--output', outputDirectoryPath
    ], {
        encoding: 'utf-8'
    });

    return { spawnResult, inputXmlFilePath, outputDirectoryPath };
};

const spawnGlbToGltf = (sampleName, glbFileName, gltfFileName) => {
    return cp.spawnSync('npm', [
        'run', 'glb-gltf', '--',
        path.join(PROJECT_ROOT, 'samples', sampleName, glbFileName),
        path.join(PROJECT_ROOT, 'tmp', sampleName, gltfFileName)
    ], {
        encoding: 'utf-8',
        shell: true
    });
};

const spawnRenameGltfNodes = (inputDir, sampleName, inputGltfFileName, inputObjectsJsonFileName, outputGltfFileName) => {

    const inputObjectsJsonPath = path.join(PROJECT_ROOT, inputDir, sampleName, inputObjectsJsonFileName);
    const inputGltfPath = path.join(PROJECT_ROOT, inputDir, sampleName, inputGltfFileName);
    const outputGltfPath = path.join(PROJECT_ROOT, 'tmp', sampleName, outputGltfFileName);

    const spawnResult = cp.spawnSync('src/cli.js', [
        'rename-gltf-nodes',
        '--input-objects', inputObjectsJsonPath,
        '--input-gltf', inputGltfPath,
        '--output-gltf', outputGltfPath
    ], {
        encoding: 'utf-8'
    });

    return {
        spawnResult,
        inputObjectsJsonPath,
        inputGltfPath,
        outputGltfPath
    };
};

const spawnAdjustMaterials = (inputDir, sampleName, inputGltfFileName, outputGltfFileName) => {
    const inputGltfPath = path.join(PROJECT_ROOT, inputDir, sampleName, inputGltfFileName);
    const outputGltfPath = path.join(PROJECT_ROOT, 'tmp', sampleName, outputGltfFileName);

    const spawnResult = cp.spawnSync('src/cli.js', [
        'adjust-materials',
        '--input-gltf', inputGltfPath,
        '--output-gltf', outputGltfPath
    ], {
        encoding: 'utf-8'
    });

    return {
        spawnResult,
        inputGltfPath,
        outputGltfPath
    };
};



const validateSpawnResult = (spawnResult) => {
    const { error, status } = spawnResult;
    try {
        expect(error).toBe(undefined);
        expect(status).toBe(0);
    } catch (e) {
        console.log(spawnResult);
        throw e;
    }
};

const validateAgainstSmeta5d = (smeta5dXmlJs, objects) => {
    const objById = new Map(objects.map(o => [o.GlobalId, o]));

    //note: this relies on the XML structure being very specific.
    for (const s5dElement of smeta5dXmlJs.Document.Elements[0].Element) {
        const {Id, CategoryId, FamilyName, TypeName} = s5dElement.$;
        // TODO add issue on their repo
        // this is here for AC20-FZK-Haus
        // Note this element also doesn't exist in glb, otherwise error in would be raised validateNodesRenaming
        if ( CategoryId === "IfcVirtualElement") {
            continue;
        }

        const obj = objById.get(Id);
        try {
            expect(obj).not.toBeUndefined();
            expect(obj.CategoryId).toBe(CategoryId);
            if (!obj.FamilyName.includes(':') && !(FamilyName ?? "").includes(':')) {
                expect(obj.FamilyName).toBe(FamilyName ?? "");
            }
            if (!obj.TypeName.includes(':') && !(TypeName ?? "").includes(':')) {
                expect(obj.TypeName).toBe(TypeName ?? "");
            }
        } catch (e) {
            e.message = `${e.message}\n\nsmeta5dElement.id = ${Id}`;
            throw e;
        }
    }
};

const validateNodesRenaming = (gltf, objects) => {
    //validate that every gltf node has a corresponding object in objects
    const ids = new Set(objects.map(obj => obj._id));
    for (let node of gltf.nodes ?? []) {
        try {
            const _id = parseInt(node.name);
            expect(_id).not.toBeNaN();
            expect(ids.has(_id)).toEqual(true);
        } catch (e) {
            e.message += `\n\nnode.name=${JSON.stringify(node.name)}`;
            throw e;
        }
    }
};

const validateMaterialsAdjustment = (inputGltf, outputGltf) => {
    const inputMaterials = inputGltf.materials ?? [];
    const outputMaterials = outputGltf.materials ?? [];

    //make sure every material is still there
    expect(inputMaterials.length).toEqual(outputMaterials.length);

    //make sure every material is double-sided
    for (let i = 0; i < outputMaterials.length; i++) {
        const mat = outputMaterials[i];
        expect(mat.doubleSided).toBe(true);
    }
};

describe('convert-xml', () => {
    test.each([
        {sampleName: 'erp-sample', xml: 'origin.xml', smeta5d: 'smeta5d.xml'},
        {sampleName: 'small-ifc', xml: 'origin.xml', smeta5d: 'small-smeta5d.xml'},
        {sampleName: 'erp-sample-big', xml: '10116_Р_АР_published_new_2x3_view2_величины.xml', smeta5d: '10116_Р_АР_published_new_2x3_view2_величины.smeta_5d.xml'},
        {sampleName: 'AC20-FZK-Haus', xml: 'AC20-FZK-Haus.ifc.xml', smeta5d: 'AC20-FZK-Haus.smeta5d.xml'},
        {sampleName: 'Duplex_Electrical_20121207', xml: 'Duplex_Electrical_20121207.ifc.xml', smeta5d: 'Duplex_Electrical_20121207.smeta5d.xml'},
        {sampleName: 'PFV-IFC4-V08-1-final', xml: 'PFV-IFC4-V08-1-final.ifc.xml', smeta5d: 'PFV-IFC4-V08-1-final.smeta5d.xml'},
    ])('doesn\'t fail on $sampleName', async ({sampleName, xml, smeta5d}) => {
        const { spawnResult, outputDirectoryPath} = spawnConvertXml(sampleName, xml);
        validateSpawnResult(spawnResult);

        const smeta5dXml = fs.readFileSync(path.join(PROJECT_ROOT, 'samples', sampleName, smeta5d), 'utf8');
        const smeta5dXml2Js = await xml2js.parseStringPromise(smeta5dXml);
        const objects = JSON.parse(fs.readFileSync(path.join(outputDirectoryPath, 'objects.json'), 'utf8'));
        validateAgainstSmeta5d(smeta5dXml2Js, objects);
    })
});

describe('rename-gltf-nodes', () => {
    test.each([
        {sampleName: 'erp-sample-big'},
        {sampleName: 'circles'},
        {sampleName: 'AC20-FZK-Haus'},
        {sampleName: 'Duplex_Electrical_20121207'},
        {sampleName: 'PFV-IFC4-V08-1-final'},
    ])('produces valid result for $sampleName', ({sampleName}) => {
        const {spawnResult, inputObjectsJsonPath, outputGltfPath} = spawnRenameGltfNodes('samples', sampleName, 'model.gltf', 'objects.json', 'model.gltf');
        validateSpawnResult(spawnResult);

        try {
            const gltf = JSON.parse(fs.readFileSync(outputGltfPath, 'utf8'));
            const objects = JSON.parse(fs.readFileSync(inputObjectsJsonPath, 'utf8'));
            validateNodesRenaming(gltf, objects);
        } catch (e) {
            console.log(`rename-gltf-nodes spawnResult for ${sampleName}`, spawnResult);
            throw e;
        }
    });
});

describe('adjust-materials', () => {
    test.each([
        {sampleName: 'erp-sample-big'},
        {sampleName: 'circles'},
        {sampleName: 'AC20-FZK-Haus'},
        {sampleName: 'Duplex_Electrical_20121207'},
        {sampleName: 'PFV-IFC4-V08-1-final'},
    ])('produces valid result on $sampleName', ({sampleName}) => {
        const {spawnResult, inputGltfPath, outputGltfPath} = spawnAdjustMaterials('samples', sampleName, 'model.gltf', 'model.gltf');
        validateSpawnResult(spawnResult);

        const inputGltf = JSON.parse(fs.readFileSync(inputGltfPath, 'utf8'));
        const outputGltf = JSON.parse(fs.readFileSync(outputGltfPath, 'utf8'));
        validateMaterialsAdjustment(inputGltf, outputGltf);
    });
});

describe('full-conversion', () => {
    test.each([
        {
            sampleName: 'erp-sample-big',
            xml: '10116_Р_АР_published_new_2x3_view2_величины.xml',
            glb: '10116_Р_АР_published_new_2x3_view2_величины.glb',
            smeta5d: '10116_Р_АР_published_new_2x3_view2_величины.smeta_5d.xml'
        },
        {
            sampleName: 'AC20-FZK-Haus',
            xml: 'AC20-FZK-Haus.ifc.xml',
            glb: 'AC20-FZK-Haus.ifc.glb',
            smeta5d: 'AC20-FZK-Haus.smeta5d.xml'
        },
        {
            sampleName: 'Duplex_Electrical_20121207',
            xml: 'Duplex_Electrical_20121207.ifc.xml',
            glb: 'Duplex_Electrical_20121207.ifc.glb',
            smeta5d: 'Duplex_Electrical_20121207.smeta5d.xml'
        },
        {
            sampleName: 'PFV-IFC4-V08-1-final',
            xml: 'PFV-IFC4-V08-1-final.ifc.xml',
            glb: 'PFV-IFC4-V08-1-final.ifc.glb',
            smeta5d: 'PFV-IFC4-V08-1-final.smeta5d.xml'
        },
    ])('works for $sampleName', async ({sampleName, xml, glb, smeta5d}) => {
        const { spawnResult: convertXmlSpawnResult } = spawnConvertXml(sampleName, xml);
        validateSpawnResult(convertXmlSpawnResult);
        const glbToGltfSpawnResult = spawnGlbToGltf(sampleName, glb, 'model.glb.gltf');
        //general validateSpawnResult won't work while we still use gltf-transform
        try {
            expect(glbToGltfSpawnResult.status).toBe(0);
        } catch (e) {
            console.log(glbToGltfSpawnResult);
            throw e;
        }
        const { spawnResult: adjustMaterialsSpawnResult, inputGltfPath } = spawnAdjustMaterials('tmp', sampleName, 'model.glb.gltf', 'model.glb.gltf.double-sided.gltf');
        validateSpawnResult(adjustMaterialsSpawnResult);
        const { spawnResult: renameNodesSpawnResult, outputGltfPath, inputObjectsJsonPath } = spawnRenameGltfNodes('tmp', sampleName, 'model.glb.gltf.double-sided.gltf', 'objects.json', 'model.gltf');
        validateSpawnResult(renameNodesSpawnResult);

        // validate files end to end
        const inputGltf = JSON.parse(fs.readFileSync(inputGltfPath, 'utf8'));
        const objects = JSON.parse(fs.readFileSync(inputObjectsJsonPath, 'utf8'));
        const outputGltf = JSON.parse(fs.readFileSync(outputGltfPath, 'utf8'));
        const smeta5dXml = await xml2js.parseStringPromise(fs.readFileSync(path.join(PROJECT_ROOT, 'samples', sampleName, smeta5d), 'utf8'));

        validateNodesRenaming(outputGltf, objects);
        validateMaterialsAdjustment(inputGltf, outputGltf);
        validateAgainstSmeta5d(smeta5dXml, objects);
    });
});
