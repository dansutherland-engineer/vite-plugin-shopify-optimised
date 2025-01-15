'use strict';

const os = require('os');


function isValid(address, options) {
	if (typeof options.internal === 'boolean' && address.internal !== options.internal) {
		return false;
	}

	if (options.ipVersion === 4 && address.family !== 'IPv4') {
		return false;
	}

	if (options.ipVersion === 6 && address.family !== 'IPv6') {
		return false;
	}

	return true;
}


function findAddresses(interfaceName, options = {}) {
	const addresses = os.networkInterfaces()[interfaceName];
	if (!addresses) {
		throw new Error(`Network interface "${interfaceName}" does not exist`);
	}

	const result = [];


	for (const address of addresses) {
		if (isValid(address, options)) {
			result.push(address);
		}
	}

	return result;
}


/**
 * Returns an IP address on the given interface name, filtered by the given options
 *
 * @param {string} interfaceName
 * @param {Object} [options]
 * @param {boolean} [options.internal]   If given, returns only internal addresses if true, or only external if false
 * @param {integer} [options.ipVersion]  If given, returns only addresses who match this IP version (4 or 6)
 * @returns {string}                     The first IP address found
 */
exports.toIp = function (interfaceName, options) {
	const addresses = findAddresses(interfaceName, options);

	if (addresses.length === 0) {
		throw new Error(`No suitable IP address found on interface "${interfaceName}"`);
	}

	return addresses[0].address;
};


/**
 * Returns all IP addresses on the given interface name, filtered by the given options
 *
 * @param {string} interfaceName
 * @param {Object} [options]
 * @param {boolean} [options.internal]   If given, returns only internal addresses if true, or only external if false
 * @param {integer} [options.ipVersion]  If given, returns only addresses who match this IP version (4 or 6)
 * @returns {string[]}                   All matching IP addresses
 */
exports.toIps = function (interfaceName, options) {
	return findAddresses(interfaceName, options).map((address) => address.address);
};


/**
 * Returns a network interface name for the given IP address, filtered by the given options
 *
 * @param {string} ip
 * @param {Object} [options]
 * @param {boolean} [options.internal]   If given, only evaluates internal addresses if true, or only external if false
 * @param {integer} [options.ipVersion]  If given, only evaluates addresses who match this IP version (4 or 6)
 * @returns {string}                     The interface name that the given IP is bound to
 */
exports.fromIp = function (ip, options) {
	const interfaces = os.networkInterfaces();
	const interfaceNames = Object.keys(interfaces);

	for (const interfaceName of interfaceNames) {
		for (const address of interfaces[interfaceName]) {
			if (address.address === ip && isValid(address, options)) {
				return interfaceName;
			}
		}
	}

	throw new Error(`No suitable interfaces were found with IP address "${ip}"`);
};


/**
 * Returns the first network interface name that contains at least one IP address that matches the given options
 *
 * @param {Object} [options]
 * @param {boolean} [options.internal]   If given, only evaluates internal addresses if true, or only external if false
 * @param {integer} [options.ipVersion]  If given, only evaluates addresses who match this IP version (4 or 6)
 * @returns {string}                     The matching interface name
 */
exports.getInterface = function (options) {
	const interfaces = os.networkInterfaces();
	const interfaceNames = Object.keys(interfaces);

	for (const interfaceName of interfaceNames) {
		if (findAddresses(interfaceName, options).length > 0) {
			return interfaceName;
		}
	}

	throw new Error(`No suitable interfaces were found`);
};


/**
 * Returns all network interface names that contain at least one IP address that matches the given options
 *
 * @param {Object} [options]
 * @param {boolean} [options.internal]   If given, only evaluates internal addresses if true, or only external if false
 * @param {integer} [options.ipVersion]  If given, only evaluates addresses who match this IP version (4 or 6)
 * @returns {string[]}                   The matching interface names
 */
exports.getInterfaces = function (options) {
	const interfaces = os.networkInterfaces();
	const interfaceNames = Object.keys(interfaces);

	const result = [];

	for (const interfaceName of interfaceNames) {
		if (findAddresses(interfaceName, options).length > 0) {
			result.push(interfaceName);
		}
	}

	return result;
};
