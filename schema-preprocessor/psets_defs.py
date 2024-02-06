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

    def _prop_type(type_name):
        # strip because there was ' IfcPowerMeasure' with leading space
        return schema.declaration_by_name(type_name.strip())

    def _serialize_prop(prop):
        primary_mesure_type = prop.PrimaryMeasureType

        if primary_mesure_type == "PEnum_AirTerminalAirflowType":
            return _ifc4_PEnum_AirTerminalAirflowType(schema)

        # case for TypeTemplate and some extras for ifc4
        if not primary_mesure_type:
            prop_type_name = _prop_type_from_template_type(prop.TemplateType, schema, pset, prop )
            prop_type = _prop_type(prop_type_name)
            return {
                **erp_short_type(prop_type),
                "unit": get_unit_type(prop_type) # ! not the same as below
            }

        return {
             **erp_short_type(_prop_type(primary_mesure_type)), # merge
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
            **erp_short_type(prop_type),
            "unit": get_unit_type(prop_type)
        }
        return self

    def get_name(self):
        return self.name.upper()

    def as_json(self):
        return self.props_defs

# https://github.com/IfcOpenShell/IfcOpenShell/blob/6d7a6eeda740069efd9d9d47e9bac049acfd5ed7/src/blenderbim/blenderbim/bim/schema/enum_descriptions.json#L1457
# it's a bit wrong:
# on the link above, there is mapping "Q_VOLUME" => "IfcQuantityVolume"
# here "Q_VOLUME" => "IfcVolumeMeasure" (type for IfcQuantityVolume.VolumeValue)
TEMPLATE_TYPES = {
    # NOTE !!! I commented some keys, bacause I didn't find apropreate types
    # "P_BOUNDEDVALUE": "IfcPropertyBoundedValue",
    # "P_ENUMERATEDVALUE": "IfcPropertyEnumeratedValue",
    # "P_LISTVALUE": "IfcPropertyListValue",
    # "P_REFERENCEVALUE": "IfcObjectReferenceSelect",
    #"P_SINGLEVALUE": "IfcValue",
    # "P_TABLEVALUE": "IfcPropertyTableValue",
    "Q_AREA": "IfcAreaMeasure",
    "Q_COUNT": "IfcCountMeasure",
    "Q_LENGTH": "IfcLengthMeasure",
    "Q_TIME": "IfcTimeMeasure",
    "Q_VOLUME": "IfcVolumeMeasure",
    "Q_WEIGHT": "IfcMassMeasure"
}

# For some reason in IFC$ there are no PrimareyMeasureType for some props
# Prop.templateType is set to P_SINGLEVALUE
# these are overrides for IFC4 not IFC4x3
IFC4_EXTRA_PROP_TYPES = {
    "Pset_CivilElementCommon__Reference": "IfcIdentifier",
    "Pset_ElementAssemblyCommon__Reference": "IfcIdentifier",
    "Pset_SpatialZoneCommon__Reference": "IfcIdentifier",
    "Pset_RampCommon__ThermalTransmittance": "IfcThermalTransmittanceMeasure",
    "Pset_RampCommon__LoadBearing": "IfcBoolean",
    "Pset_RoofCommon__LoadBearing": "IfcBoolean",
    "Pset_StairCommon__ThermalTransmittance": "IfcThermalTransmittanceMeasure",
    "Pset_StairCommon__LoadBearing": "IfcBoolean",
    "Pset_FurnitureTypeCommon__Reference": "IfcIdentifier",
    "Pset_ElectricalDeviceCommon__IK_Code": "IfcLabel",
    "Pset_ElectricFlowStorageDeviceTypeCommon__RadiativeFraction": "IfcRatioMeasure",
    "Pset_ElectricFlowStorageDeviceTypeCommon__ModuleCapacity": "IfcElectricCapacitanceMeasure",
    "Pset_ElectricFlowStorageDeviceTypeCommon__ModulesInParallel": "IfcInteger",
    "Pset_ElectricFlowStorageDeviceTypeCommon__ModulesInSeries": "IfcInteger",
    "Pset_ReinforcingMeshCommon__MeshLength": "IfcPositiveLengthMeasure",
    "Pset_ReinforcingMeshCommon__MeshWidth": "IfcPositiveLengthMeasure"
}

# Ifc4 psets has some properties without PrimaryMeasureType
# but it has TemplateType
# also see
# http://docs.buildingsmartalliance.org/MVD_BAMIE/schema/ifckernel/lexical/ifcsimplepropertytemplatetypeenum.htm
def _prop_type_from_template_type(template_type, schema, pset, prop):
    if template_type == 'P_SINGLEVALUE':
        if schema.name() != "IFC4":
            raise AssertionError("Should not be applied for schema other than IFC4 (P_SINGLEVALUE))")
        _prop_id = f"{pset.Name}__{prop.Name}"

        if _prop_id in IFC4_EXTRA_PROP_TYPES:
            return IFC4_EXTRA_PROP_TYPES[_prop_id]

        raise AssertionError(f"Property {prop.Name} in {pset.Name} not found in extras")

    return TEMPLATE_TYPES[template_type]


# Problem: in ifc4 thereis pset Pset_AirTerminalOccurrence
# with field AirflowType with type PEnum_AirTerminalAirflowType
# but there is no PEnum_AirTerminalAirflowType type in schema !!!
#
# Although it's possible to get it though prop.Enumerators.get_info() somehow
def _ifc4_PEnum_AirTerminalAirflowType(schema):
    # https://standards.buildingsmart.org/MVD/RELEASE/IFC4/ADD2_TC1/RV1_2/HTML/schema/ifchvacdomain/pset/penum_airterminalairflowtype.htm
    if schema.name() != "IFC4":
        raise AssertionError("Should not be applied for schema other than IFC4 (PEnum_AirTerminalAirflowType)")
    # NOTE !!! It's erp style
    return {
        "type": "IfcEnum",
        "enumValues": ["SUPPLYAIR", "RETURNAIR", "EXHAUSTAIR", "OTHER", "NOTKNOWN", "UNSET"],
        "unit": None
    }
