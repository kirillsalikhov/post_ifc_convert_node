import ifcopenshell.util.unit
from ifcopenshell import util


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

# TODO cache somewhere
def unit_types(schema):
    # ??? may be add IfcConversionBasedUnit or other units ?
    si_unit = schema.declaration_by_name("IfcSIUnit")
    #UnitType: LenghtUnit, AreaUnit...
    unit_type = si_unit.attribute_by_index(1).type_of_attribute().declared_type()
    return unit_type.enumeration_items()
