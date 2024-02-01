const cp = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

//name: a sampleName of a subdirectory in the directory "samples"
const spawnConvertXml = (sampleName, xmlFileName) => {
    return cp.spawnSync('src/cli.js', [
        'convert-xml',
        '--input-xml', path.join(PROJECT_ROOT, 'samples', sampleName, xmlFileName),
        '--output', path.join(PROJECT_ROOT, 'tmp', sampleName)
    ], {
        encoding: 'utf-8'
    });
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
    const { error, status, stdout, stderr } = spawnResult;
    expect(error).toBe(undefined);
    expect(status).toBe(0);
    expect(stdout).toBe("");
    expect(stderr).toBe("");
};

const validateNodesRenaming = (gltf, objects) => {
    //validate that every gltf node has a corresponding object in objects
    const ids = new Set(objects.map(obj => obj._id));
    for (let node of gltf.nodes ?? []) {
        const _id = parseInt(node.name);
        expect(_id).not.toBeNaN();
        expect(ids.has(_id)).toEqual(true);
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
        {sampleName: 'erp-sample', xml: 'origin.xml'},
        {sampleName: 'small-ifc', xml: 'origin.xml'},
        {sampleName: 'erp-sample-big', xml: '10116_Р_АР_published_new_2x3_view2_величины.xml'},
    ])('doesn\'t fail', ({sampleName, xml}) => {
        const spawnResult = spawnConvertXml(sampleName, xml);
        validateSpawnResult(spawnResult);
        // todo: should also validate against smeta5d
    })
});

describe('rename-gltf-nodes', () => {
    test('produces valid result on erp-sample-big', () => {
        const {spawnResult, inputObjectsJsonPath, outputGltfPath} = spawnRenameGltfNodes('samples', 'erp-sample-big', 'model.gltf', 'objects.json', 'model.gltf');
        validateSpawnResult(spawnResult);

        const gltf = JSON.parse(fs.readFileSync(outputGltfPath, 'utf8'));
        const objects = JSON.parse(fs.readFileSync(inputObjectsJsonPath, 'utf8'));
        validateNodesRenaming(gltf, objects);
    });
});

describe('adjust-materials', () => {
    test('produces valid result on erp-sample-big', () => {
        const {spawnResult, inputGltfPath, outputGltfPath} = spawnAdjustMaterials('samples','erp-sample-big', 'model.gltf', 'model.gltf');
        validateSpawnResult(spawnResult);

        const inputGltf = JSON.parse(fs.readFileSync(inputGltfPath, 'utf8'));
        const outputGltf = JSON.parse(fs.readFileSync(outputGltfPath, 'utf8'));
        validateMaterialsAdjustment(inputGltf, outputGltf);
    });
});

describe('full-conversion', () => {
    test('works for erp-sample-big', () => {
        const sampleName = 'erp-sample-big';
        const convertXmlSpawnResult = spawnConvertXml(sampleName, '10116_Р_АР_published_new_2x3_view2_величины.xml');
        validateSpawnResult(convertXmlSpawnResult);
        const glbToGltfSpawnResult = spawnGlbToGltf(sampleName, '10116_Р_АР_published_new_2x3_view2_величины.glb', 'model.glb.gltf');
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

        validateNodesRenaming(outputGltf, objects);
        validateMaterialsAdjustment(inputGltf, outputGltf);
        // todo: should also validate against smeta5d
    });
});
