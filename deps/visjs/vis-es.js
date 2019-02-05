"use strict";

/**
 * @file
 * 
 * This file exposes vis.js as an es module. 
 */

 // get the global object -- 'window' in the browser or 'global' on the server
const globalObj = (typeof window !== 'undefined') ? window : global;

const vis = globalObj.vis;

// and export it
export default vis;