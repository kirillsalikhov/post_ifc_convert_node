module.exports = {
    defaultSerializersConfigName: 'erp',
    serializersConfigsMap: {
        'erp': require('./erp'),
        'iv': require('./iv'),
        'min': require('./min')
    }
};
