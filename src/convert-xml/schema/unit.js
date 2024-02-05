
// https://github.com/IfcOpenShell/IfcOpenShell/blob/0da3270c7f18259b09ee8c3795082e0a7a8162c9/src/ifcopenshell-python/ifcopenshell/util/unit.py#L284
const unit_symbols = {
    // si units
    "CUBIC_METRE": "m3",
    "GRAM": "g",
    "SECOND": "s",
    "SQUARE_METRE": "m2",
    "METRE": "m",
    // non si units
    "cubic inch": "in3",
    "cubic foot": "ft3",
    "cubic yard": "yd3",
    "square inch": "in2",
    "square foot": "ft2",
    "square yard": "yd2",
    "square mile": "mi2",
    // conversion based units
    "thou": "th",
    "inch": "in",
    "foot": "ft",
    "yard": "yd",
    "mile": "mi",
    "square thou": "th2",
    "square inch": "in2",
    "square foot": "ft2",
    "square yard": "yd2",
    "acre": "ac",
    "square mile": "mi2",
    "cubic thou": "th3",
    "cubic inch": "in3",
    "cubic foot": "ft3",
    "cubic yard": "yd3",
    "cubic mile": "mi3",
    "litre": "L",
    "fluid ounce UK": "fl oz",
    "fluid ounce US": "fl oz",
    "pint UK": "pt",
    "pint US": "pt",
    "gallon UK": "gal",
    "gallon US": "gal",
    "degree": "°",
    "ounce": "oz",
    "pound": "lb",
    "ton UK": "ton",
    "ton US": "ton",
    "lbf": "lbf",
    "kip": "kip",
    "psi": "psi",
    "ksi": "ksi",
    "minute": "min",
    "hour": "hr",
    "day": "day",
    "btu": "btu",
    "fahrenheit": "°F",
}

// https://github.com/IfcOpenShell/IfcOpenShell/blob/0da3270c7f18259b09ee8c3795082e0a7a8162c9/src/ifcopenshell-python/ifcopenshell/util/unit.py#L265
const prefix_symbols = {
    "EXA": "E",
    "PETA": "P",
    "TERA": "T",
    "GIGA": "G",
    "MEGA": "M",
    "KILO": "k",
    "HECTO": "h",
    "DECA": "da",
    "DECI": "d",
    "CENTI": "c",
    "MILLI": "m",
    "MICRO": "μ",
    "NANO": "n",
    "PICO": "p",
    "FEMTO": "f",
    "ATTO": "a",
}

const createUnitIds = (unitEls) => {
    const unitIdx = {};
    for(let unitEl of unitEls) {
        if (!unitEl.attributes.UnitType) {
            console.log(`Unit with ifcType ${unitEl.ifcType} was skipped`);
            continue;
        }
        const _unitType = unitEl.attributes.UnitType.toUpperCase();
        unitIdx[_unitType] = get_unit_symbol(unitEl);
    }
    return unitIdx
}

// Rewrite of get_unit_symbol
// https://github.com/IfcOpenShell/IfcOpenShell/blob/0da3270c7f18259b09ee8c3795082e0a7a8162c9/src/ifcopenshell-python/ifcopenshell/util/unit.py#L501C1-L508C18
const get_unit_symbol = (unitEl) => {
    let symbol = "";
    if (unitEl.ifcType === "IfcSIUnit") {
        symbol += _prefix(unitEl);
    }
    symbol += _unit_symbol(unitEl);

    /* Didn't copy from Py func part below because don't have files to Test

       if unit.is_a("IfcContextDependentUnit") and unit.UnitType == "USERDEFINED":
            symbol = unit.Name
     */

    return symbol;
}

const _unit_symbol = (unitEl) => {
    const name = unitEl.attributes.Name.replace("METER", "METRE");
    const symbol = unit_symbols[name];
    if (!symbol) {
        // !!! Commented as it's not a big problem
        // console.warn(`No unit symbol for ${name}`);
        return name;
    }
    return unit_symbols[name];
}

const _prefix = (unitEl) => {
    return prefix_symbols[unitEl.attributes.Prefix] || ""
}

exports.createUnitIds = createUnitIds;
