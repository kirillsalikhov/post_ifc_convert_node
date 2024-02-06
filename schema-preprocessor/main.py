import os
import sys
from pprint import pprint as pp

sys.path.append(os.path.join(os.path.dirname(__file__), "ifcopenshell"))

import ifcopenshell
import ifcopenshell.util.pset
import ifcopenshell.util.element
from ifcopenshell import util

from entities_defs import serialize_entity_defs
from psets_defs import serialize_psets


GEN_PATH = "../src/convert-xml/schema/gen"

# https://github.com/IfcOpenShell/IfcOpenShell/blob/0da3270c7f18259b09ee8c3795082e0a7a8162c9/src/ifcopenshell-python/ifcopenshell/util/pset.py#L39

SCHEMAS = [
    "IFC2X3",
    "IFC4",
    "IFC4X3"
]

for schema_name in SCHEMAS:
    schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name)
    serialize_psets(schema, f"{GEN_PATH}/{schema_name}/psets.json")
    serialize_entity_defs(schema, f"{GEN_PATH}/{schema_name}/entities.json")
