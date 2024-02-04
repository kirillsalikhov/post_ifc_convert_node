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

# TODO move somehere
# debug func
uniq_pp_cache = {}
def uniq_pp(o_1, o_2):
    if o_1 not in uniq_pp_cache:
        uniq_pp_cache[o_1] = o_2
        print("---")        
        pp(o_1)
        pp(o_2)


GEN_PATH = "../src/convert-xml/schema/gen"

schema_name = "IFC2X3"
schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name)
serialize_psets(schema, f"{GEN_PATH}/{schema_name}/psets.json")
serialize_entity_defs(schema, f"{GEN_PATH}/{schema_name}/entities.json")
