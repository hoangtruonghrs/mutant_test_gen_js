#!/usr/bin/env node

/**
 * Post-installation script
 * Displays helpful information after successful installation
 */

const { displayPostInstallInfo } = require('./preinstall.js');

displayPostInstallInfo();
