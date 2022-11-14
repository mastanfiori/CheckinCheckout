/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/nttdata/acumed/Z27CheckInCheckOut/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
