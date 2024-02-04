import json

from units import get_unit_type
from utils import erp_short_type

def serialize_entity_defs(schema, out_path):
    data = {}
    for entity in schema.entities():
        data[entity.name()] = entity_attr_defs(entity)
    
    # TODO move out
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def entity_attr_defs(entity):
    entity_d = {}

    def _is_type(declaration, name):
        return type(declaration).__name__ == name

    for a in entity.all_attributes():
        attr_name = a.name()
        attr_type = a.type_of_attribute()

        attr_d = {
            **erp_short_type(attr_type), # this is merge
            "unit": None            
        }
        entity_d[attr_name] = attr_d

        if (_is_type(attr_type, "named_type")):
            declared_type = attr_type.declared_type()
            if (_is_type(declared_type, "type_declaration")):
                attr_d["unit"] = get_unit_type(declared_type)
    return entity_d
