import ifcopenshell.util.pset
from ifcopenshell import util

from utils import write_json
from units import get_unit_type
from type_helpers import erp_short_type


def serialize_psets(schema, out_path):
    data = {}

    psets = util.pset.PsetQto(schema.name()).get_applicable()

    for pset in psets:
        data[pset.Name.upper()] = pset_def(pset, schema)

    if (schema.name() == "IFC2X3"):
        for extra_pset in extra_ifc2x3_psets(schema):
            data[extra_pset.get_name()] = extra_pset.as_json()

    write_json(data, out_path)

def _prop_type_str(type_name, schema):
    # strip because there was ' IfcPowerMeasure' with leading space
    declaration = schema.declaration_by_name(type_name.strip())
    return str(declaration)

def pset_def(pset, schema):
    def _unit_type(unit):
        if (unit is None):
            return None
        if (not unit.is_a("IfcNamedUnit")):
            return None
        return unit.UnitType

    # it's needed because there are mismatches in prop names in xml
    def _propKey(prop):
        return prop.Name.upper()

    def _serialize_prop(prop):       
        return {
             **erp_short_type(_prop_type_str(prop.PrimaryMeasureType,  schema)), # merge
            "unit": _unit_type(prop.PrimaryUnit)           
        }

    pset_d = {}
    for prop in pset.HasPropertyTemplates:
        if (prop.TemplateType == "P_COMPLEX"):
            prop_d = {
                "props": {}
            }
            for sub_prop in prop.HasPropertyTemplates:
                prop_d["props"][_propKey(sub_prop)] = _serialize_prop(sub_prop)
        else:
            prop_d = _serialize_prop(prop)

        pset_d[_propKey(prop)] = prop_d

    return pset_d


def extra_ifc2x3_psets(schema):
    # https://standards.buildingsmart.org/documents/Implementation/IFC_Implementation_Agreements/CV-2x3-157.html
    Pset_ProvisionForVoid = ExtraPset("Pset_ProvisionForVoid", schema) \
        .add_prop("Width", "IfcLengthMeasure") \
        .add_prop("Height", "IfcLengthMeasure") \
        .add_prop("Diameter", "IfcLengthMeasure") \
        .add_prop("Depth", "IfcLengthMeasure") \
        .add_prop("Shape", "IfcLabel") \
        .add_prop("System", "IfcLabel") \

    return [Pset_ProvisionForVoid]


class ExtraPset():
    def __init__(self, name, schema):
        self.schema = schema
        self.name = name
        self.props_defs = {}

    def add_prop(self, name, prop_type_name):
        prop_type = self.schema.declaration_by_name(prop_type_name)
        
        self.props_defs[name.upper()] = {
            **erp_short_type(str(prop_type)),
            "unit": get_unit_type(prop_type)
        }
        return self

    def get_name(self):
        return self.name.upper()

    def as_json(self):
        return self.props_defs


