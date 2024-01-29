import os
import sys
import json
from pprint import pprint as pp

sys.path.append(os.path.join(os.path.dirname(__file__), "ifcopenshell"))

import ifcopenshell
import ifcopenshell.util.pset
import ifcopenshell.util.unit
import ifcopenshell.util.element
from ifcopenshell import util

## пока план
# вытащить все declaration, для них pset
# внутри pset, HasPropertyTemplates, если пройтись по нему то будет primaryUnit, primaryType
# в PrimaryType, можно вытащить через declaration_by_name declared_type это будет boolean, real и пр.

def serialize_psets():
    schemaName = "IFC2X3"
    pset_qto = util.pset.PsetQto(schemaName)
    # schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schemaName)
    # for entity in schema.entities():
    #     get
    #     pp(r)
    pset_qto = util.pset.PsetQto(schemaName)
    psets = pset_qto.get_applicable()
    for pset in psets[:1]:
        print(pset.Name)
        pp(pset.get_info(recursive=True))

def _is_type(declaration, name):
    return type(declaration).__name__ == name


# TODO cache somewhere
def unit_types(schema):
    # ??? may be add IfcConversionBasedUnit or other units ?
    si_unit = schema.declaration_by_name("IfcSIUnit")
    #UnitType: LenghtUnit, AreaUnit...
    unit_type = si_unit.attribute_by_index(1).type_of_attribute().declared_type()
    return unit_type.enumeration_items()


# util.unit.get_measure_unit_type just replaces some words in type name and produce UnitName
# and can produce LogicalUnit for example 
# then we check that UnitName is inside possible unit_types
def get_unit_type(type_declaration):
    measure_unit_type = util.unit.get_measure_unit_type(type_declaration.name())
    if (measure_unit_type in unit_types(type_declaration.schema())):
        return measure_unit_type
    else:
        return None

    
def serializee_entity_defs(schema, out_path):
    data = {}
    for entity in schema.entities():
        data[entity.name()] = entity_attr_defs(entity)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    

def entity_attr_defs(entity):
    entity_d = {}

    for a in entity.all_attributes():
        attr_name = a.name()
        attr_type = a.type_of_attribute()
        
        attr_d = {
            "name": attr_name,
            "type": str(attr_type),
            "unit": None
        }
        entity_d[attr_name] = attr_d
        
        if (_is_type(attr_type, "named_type")):
            declared_type = attr_type.declared_type()
            if (_is_type(declared_type, "type_declaration")):
                attr_d["unit"] = get_unit_type(declared_type)
    return entity_d

# serialize_psets()


schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name("IFC2X3")
entity = schema.declaration_by_name("IfcMaterialLayer")
# pp(entity_attr_types(entity))
serializee_entity_defs(schema, '../tmp/ifc2x3-entities.json')
# g = schema.declaration_by_name("IfcLogical")

exit()

schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name("IFC2X3")

entityName = "IfcRoof"
entity = schema.declaration_by_name(entityName)
print(f"Attributes for entity {entityName}")
pp(entity.all_attributes())
# d = schema.declaration_by_name("IfcQuantityArea")
# pp(d.subtypes())
# pp(d.all_attributes())

# #r = util.unit.get_measure_unit_type("IfcAreaMeasure")
# print("---")
# r = util.element.get_property_definition(d)
# pp(r)


pset_qto = util.pset.PsetQto("IFC2X3")
r = pset_qto.get_applicable_names(entityName)
print(f"psets: for {entityName}")
pp(r)
print('***')
# template = pset_qto.templates[0], ifc file from where pset
pset_wallCommon_template = pset_qto.get_by_name("Pset_RoofCommon")
print("Pset get_info() :")
pp(pset_wallCommon_template.get_info(recursive=True))
r = util.element.get_property_definition(pset_wallCommon_template)
for prop in r["HasPropertyTemplates"]:
    print("---")
    pp(prop.get_info())

print("---TYPES---")
e = schema.declaration_by_name("IfcAreaMeasure")
pp(e.declared_type())   

print("---IfcQuantityArea ----")
entity = schema.declaration_by_name("IfcQuantityArea")
for a in entity.all_attributes(): 
    print("---")
    pp(a)
    pp(a.type_of_attribute())
print("---IfcAreaMeasure ----")
entity = schema.declaration_by_name("IfcAreaMeasure")
pp(util.unit.get_measure_unit_type("IfcAreaMeasure"))

print('---IfcMaterialLayer ---')
entity = schema.declaration_by_name("IfcMaterialLayer")
pp(entity.all_attributes())
pp(util.unit.get_measure_unit_type("IfcPositiveLengthMeasure"))


# pp(entity.all_attributes())

# pp(r["HasPropertyTemplates"][0].get_info())
#pp(util.element.get_properties(r))
# pp(pset_wallCommon_template)



# r = pset_qto.get_applicable("IfcWall")

# ps = r[0]
# pp(ps.get_info())
# for prop in ps.HasPropertyTemplates:
#     pp(prop.get_info())
# for p in r:
#     print("---")
#     pp(p.all_attributes())

# ifcopenshell.util.element.get_psets(wall)

# pp (r)

# r = ifcopenshell.util.element.get_psets(wall)

# pp(rr)