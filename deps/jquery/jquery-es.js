"use strict";

/**
 * @file
 * 
 * This file imports jQuery, jQuery UI and JSTree. 
 * It then exposes the jQuery constant as an ES6 module and enabled 'no-conflict' mode.  
 */

import * as _ from './jquery-3.3.1.min.js';
import * as __ from '../jqueryui/jquery-ui.min.js';
import * as ___ from  '../jstree/jstree.min.js';

// get the global object -- 'window' in the browser or '$' on the server
const globalObj = (typeof window !== 'undefined') ? window : global;

// fetch jQuery -- it got stored in the global object for some reason
const jQuery = globalObj.jQuery;

// turn it into no-conflict mode
jQuery.noConflict();

// and export it
export default jQuery;