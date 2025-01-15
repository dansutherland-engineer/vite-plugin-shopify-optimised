# network-interfaces for Node.js

Utility functions for dealing with network interfaces and IP addresses in Node.js.

## Installation

```sh
npm install --save network-interfaces
```

## Usage

All functions take an options object that contains filter instructions. Every property is optional, and leaving one out
means no effort will be made to filter on that specific property.

```js
const ni = require('network-interfaces');

const options = {
  internal: false, // boolean: only acknowledge internal or external addresses (undefined: both)
  ipVersion: 4     // integer (4 or 6): only acknowledge addresses of this IP address family (undefined: both)
};
```

**Interface name to IP address**

Returns the first IP address found on the interface with the given name. Throws if none can be found.

```js
const ip = ni.toIp('eth0', options);
```

**Interface name to IP addresses**

Returns all IP addresses found on the interface with the given name. Returns empty array if none can be found.

```js
const ips = ni.toIps('eth0', options);
```

**IP address to interface name**

Returns a network interface name for the given IP address. Throws if none can be found.

```js
const interfaceName = ni.fromIp('127.0.0.1', options);
```

**Getting one interface name**

Returns the first network interface name that contains at least one IP address that matches the given options. Throws
if none can be found.

```js
const interfaceName = ni.getInterface(options);
```

**Getting all interface names**

Returns all network interface names that contain at least one IP address that matches the given options. Returns empty
array if none can be found.

```js
const interfaceNames = ni.getInterfaces(options);
```

## License

MIT
