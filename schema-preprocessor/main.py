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
    if (type_declaration is None):
        return None

    measure_unit_type = util.unit.get_measure_unit_type(type_declaration.name())
    if (measure_unit_type in unit_types(type_declaration.schema())):
        return measure_unit_type
    else:
        return None


def _is_type(declaration, name):
    return type(declaration).__name__ == name


def serialize_entity_defs(schema, out_path):
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


def serialize_psets(schema, out_path):
    data = {}
    
    psets = util.pset.PsetQto(schema.name()).get_applicable()

    for pset in psets:
        data[pset.Name] = pset_def(pset, schema)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        

def pset_def(pset, shema):
    def _unit_type(unit):
        if (unit is None):
            return None
        if (not unit.is_a("IfcNamedUnit")):
            return None
        return unit.UnitType

    def _type_str(type_name):
        # strip because there was ' IfcPowerMeasure' with leading space
        declaration = schema.declaration_by_name(type_name.strip())
        return str(declaration)

    def _serialize_prop(prop):
        return {
            "name": prop.Name,
            "type": _type_str(prop.PrimaryMeasureType),
            "unit": _unit_type(prop.PrimaryUnit)
        }

    pset_d = {}
    for prop in pset.HasPropertyTemplates:
        if (prop.TemplateType == "P_COMPLEX"):
            prop_d = {
                "name": prop.Name,
                "props": {}
            }
            for sub_prop in prop.HasPropertyTemplates:
                prop_d["props"][sub_prop.Name] = _serialize_prop(sub_prop)
        else:
            prop_d = _serialize_prop(prop)

        pset_d[prop.Name] = prop_d

    return pset_d


schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name("IFC2X3")
serialize_psets(schema, '../tmp/ifc2x3-psets.json')
# serialize_entity_defs(schema, '../tmp/ifc2x3-entities.json')

exit()

# get styles for materials
model = ifcopenshell.open('../samples/big.ifc')
#el = model.by_guid("2rNkWe9Bn5fR0InBCJ3Rwp")
#materials = util.element.get_materials(el)
#pp(materials)
#pp(el.get_info())
#pp(util.element.get_styles(el))

# get materials for element
mm = util.element.get_materials(model.by_type("IfcPlate")[0])

styles = []
materials = model.by_type("IfcMaterial")

# for i in model.get_inverse(materials[0]):
#     pp(i.get_info())




# get styles
for material in materials[:1]:
    pp(material)
    
    for material_definition_representation in material.HasRepresentation or []:
        for representation in material_definition_representation.Representations:
            for item in representation.Items:
                pp(item)
                for s in item.Styles:
                    for ss in s.Styles:
                        if(ss.is_a("IfcSurfaceStyle")):
                            # TODO level deeper in Styles
                            styles.append(ss.get_info(recursive=True))

pp(styles)

#schema = ifcopenshell.ifcopenshell_wrapper.schema_by_name("IFC2X3")
#entity = schema.declaration_by_name("IfcMaterialLayer")
# pp(entity_attr_types(entity))
# serialize_entity_defs(schema, '../tmp/ifc2x3-entities.json')
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