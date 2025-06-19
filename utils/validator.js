const validator = require('validator');

const isNotValidString = (value) => {
	return typeof value !== 'string' || value.trim().length === 0 || value === '';
}

const isValidUUID = (value) => {
	return typeof value === 'string' && validator.isUUID(value);
}

const isNotFound = (entity) => {
	return entity === null || entity === undefined;
}

module.exports = {
	isNotValidString,
	isValidUUID,
	isNotFound,
};

