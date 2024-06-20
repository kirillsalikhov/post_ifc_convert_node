# Post ifc converter 

## Description

Extracts attributes data from ifc, fixes gltf materials, flattens nodes hierarchy
Runs inside Conversion Services after ifc2xml, ifc2glb converters in separate operations

## Setup

```
npm ci
```

For updating ifc scheme files 
```
cd schema-preprocessor
poetry install
```

## Run

Extract model attributes from xml
```
src/cli.js convert-xml --input-xml XML_PATH --output ATTRIBUTES_PATH --serializer SERIALIZER_NAME
```
- XML_PATH - input path to xml file from ifc2xml
- ATTRIBUTES_PATH - output path for objects.json file for Industrial Viewer
- SERIALIZER_NAME - attributes extraction scheme name: "min" | "iv" | "erp" | ...

Fix gltf materials
```
src/cli.js adjust-materials --input-gltf INPUT_GLTF_PATH --output-gltf OUTPUT_GLTF_PATH;
```

Flatten gltf node hierarchy
```
src/cli.js rename-gltf-nodes --input-gltf INPUT_GLTF_PATH --input-objects ATTRIBUTES_PATH --output-gltf OUTPUT_GLTF_PATH`);
```
- INPUT_GLTF_PATH - input path to gltf file
- ATTRIBUTES_PATH - input path to objects.json file 
- OUTPUT_GLTF_PATH - output path to gltf file

## Test

```
npm run test
```

## Update ifc schema json files
```
cd schema-preprocessor
poetry run python main.py
```
Note: resulting files should be saved in git
