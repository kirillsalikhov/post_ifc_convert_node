from pprint import pprint as pp

def get_attr_types(attr_type):

    def _enum_values(enum_val_str):
        return enum_val_str.strip("()> ").split(", ")

    def _select_values(val_str):
        # only one level, see func description
        return _trashSplit(val_str)
    
    # Need when there nested selects like:
    # <select IfcValue: (<select IfcDerivedMeasureValue: (<real> | <type IfcWarpingMomentMeasure: <real>>)>
    #   | <select IfcMeasureValue: (<type IfcAmountOfSubstanceMeasure: <real>> | <real>)>
    #   | <select IfcSimpleValue: (<type IfcBoolean: <boolean>> | <type IfcText: <string>>)>)>>
    def _trashSplit(str):
        str = str.strip("()")
        split_indices = [0]
        open_brackets = 0
        for i, c in enumerate(str):
            if c == "(":
                open_brackets+=1
            if c == ")":
                open_brackets-=1
            if (c == "|"):
                if (str[i-1] != " " and c[i+1] == ""):
                    continue
                if open_brackets == 0:
                    split_indices.append(i)
        
        if len(split_indices) > 1:
            parts = [str[i:j] for i,j in zip(split_indices, split_indices[1:]+[None])]
            parts = [x.strip(" | ") for x in parts]
            return parts
        
        return [str]
                    

    def _split(type_str, delimiter, strip_prefix):
        [first, last] = type_str.split(delimiter, 1)
        first = first.replace(strip_prefix, "")
        return [first, last]


    def _traverse(data_type):
        # from right side can be removed more that one >, e.g. >>
        data_type = data_type.strip("<>")

        if data_type.find("type") == 0:
            [ current_type, child_str ] = _split(data_type, ": ", "type ")   
            return [(current_type, "type")] + _traverse(child_str)
        
        elif data_type.find("enumeration") == 0:
            [ current_type, child_str ] = _split(data_type, ": ", "enumeration ")   
            return [(current_type, "enum", _enum_values(child_str))]
       
        elif data_type.find("select") == 0:
            [ current_type, child_str ] = _split(data_type, ": ", "select ")
            select_opts = [_traverse(x) for x in _select_values(child_str)]
            return [(current_type, "select", select_opts)]  
        
        elif data_type.find("list") == 0:
            [ current_type, child_str ] = _split(data_type, " of ", "list ")
            return [(current_type, "list", _traverse(child_str))]

        elif data_type.find("set") == 0:
            [current_type, child_str ] = _split(data_type, " of ", "set ")
            return [(current_type, "set", _traverse(child_str))]

        elif data_type.find("array") == 0:
            [current_type, child_str ] = _split(data_type, " of ", "array ")
            return [(current_type, "array", _traverse(child_str))]

        elif data_type.find("entity") == 0:
            current_type = data_type.replace("entity ", "")
            return [(current_type, "entity")]
        
        elif data_type.find("binary") == 0:
            current_type = data_type.replace("entity ", "")
            return [(current_type, "binary")]        

        elif "string" == data_type:
            return [("string", "primitive")]
        elif "real" == data_type:
            return [("real", "primitive")]
        elif ("number" == data_type) or ("integer" == data_type):
            return [("integer", "primitive")]
        elif ("boolean" == data_type) or ("logical" == data_type):
            return [("boolean", "primitive")]
        else:
            raise AssertionError("Not parsed type case!", data_type)
        
    type_arr = _traverse(str(attr_type))
    # for consistency return results 
    if not isinstance(type_arr, list):
        type_arr = [type_arr] 
    
    return type_arr

def erp_short_type(attr_type):
    # [(main_type, type_name, ?values)]
    type_arr = get_attr_types(attr_type)

    main_type = type_arr[0][1]
    type_name = type_arr[0][0]

    if main_type in ["primitive", "entity"]:
        return {"type": type_name}

    if main_type == "type":
        # second type from last element
        if len(type_arr) >= 2:
            return {"type": type_arr[-2][0]}
        
        raise AssertionError("len(type_arr) should not be less than 2", type_arr)
        
    if main_type == "enum":
        return {
            "type": "IfcEnum",
            "enumValues": type_arr[0][2]
        }
    
    # cases that weren't talked about
    if main_type == "select":
        return {"type": type_arr[0][0]}
    
    if main_type in ["list", "set", "array"]:
        values_arr = type_arr[0][2]        
        return {"type": values_arr[0][0]}
    
    raise AssertionError("Not parsed erp_short_type!", type_arr)

smoke_test_types = [
    "<type IfcIdentifier: <string>>",
    "<type IfcPositiveLengthMeasure: <type IfcLengthMeasure: <real>>>",
    "<type IfcLengthMeasure: <real>>",
    "<entity IfcCurve>",
    "<boolean>",
    "<enumeration IfcLayerSetDirectionEnum: (AXIS1, AXIS2, AXIS3)> ",
    "<list [1:?] of <entity IfcCompositeCurveSegment>>",
    "<list [2:3] of <real>>",
    "<set [1:?] of <entity IfcPropertySetDefinition>>",
    "<select IfcActorSelect: (<entity IfcOrganization> | <entity IfcPerson> | <entity IfcPersonAndOrganization>)>",
    "<set [1:?] of <select IfcActorSelect: (<entity IfcOrganization> | <entity IfcPerson> | <entity IfcPersonAndOrganization>)>>",
    "<enumeration IfcAddressTypeEnum: (DISTRIBUTIONPOINT, HOME, OFFICE, SITE, USERDEFINED)>",
    "<set [1:?] of <select IfcDraughtingCalloutElement: (<entity IfcAnnotationCurveOccurrence> | <entity IfcAnnotationSymbolOccurrence> | <entity IfcAnnotationTextOccurrence>)>>"
    "<list [1:?] of <select IfcValue: (<select IfcDerivedMeasureValue: (<type IfcAbsorbedDoseMeasure: <real>> | <real>)> | <select IfcMeasureValue: (<real> | <type IfcPositiveLengthMeasure: <type IfcLengthMeasure: <real>>> | <type IfcVolumeMeasure: <real>>)> | <select IfcSimpleValue: (<boolean> | <type IfcText: <string>>)>)>>",
    "<type IfcComplexNumber: <array [1:2] of <real>>>"
]

# for t in smoke_test_types:
#    print("---")
#    pp(t)
#    # pp(get_attr_types(t))
#    pp(erp_short_type(t))
    