sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
	"use strict";
	var oCheckInTable, oCheckoutTable, oGoodsIssueTable, oView, checkinData;
	return BaseController.extend("com.nttdata.acumed.Z27CheckInCheckOut.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay;
			oCheckInTable = this.byId("CheckInTab");
			oCheckoutTable = this.byId("CheckOutTab");
			oGoodsIssueTable = this.byId("GoodsIssueTab");
			oView = this.getView();

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			// iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			// this._aTableSearchState = [];

			// Check In Table dummy data

			checkinData = [{
				"ProductionOrder": "1229413",
				"OperationNumber": "10",
				"SetupRun": "Run",
				"EquipmentNumber": "L20-01",
				"CheckInDate": "05-24-2022",
				"CheckInTime": "12:00 AM",
				"Material": "30-0258",
				"MaterialRev": "K",
				"OperationDescription": "MACHINE PER WORK-0278"
			}, {
				"ProductionOrder": "1229414",
				"OperationNumber": "10",
				"SetupRun": "Run",
				"EquipmentNumber": "L20-02",
				"CheckInDate": "05-24-2022",
				"CheckInTime": "01:00 AM",
				"Material": "30-0258",
				"MaterialRev": "K",
				"OperationDescription": "MACHINE PER WORK-0278"
			}];

			var oCheckInViewModel = new JSONModel({

			});
			oCheckInViewModel.setData(checkinData);
			this.setModel(oCheckInViewModel, "CheckInModel");
			
			var oCheckOutViewModel = new JSONModel({

			});
			oCheckOutViewModel.setData([]);
			this.setModel(oCheckOutViewModel, "CheckOutModel");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			// oTable.attachEventOnce("updateFinished", function(){
			// 	// Restore original busy indicator delay for worklist's table
			// 	oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			// });
			// Add the worklist page to the flp routing history
			this.addHistoryEntry({
				title: this.getResourceBundle().getText("worklistViewTitle"),
				icon: "sap-icon://table-view",
				intent: "#CheckInCheckOut-display"
			}, true);
		},

		onCheckInItemsSelect: function (oEvt) {
			var selectedItems = oEvt.getSource().getSelectedIndices();
			if (selectedItems.length > 0) {
				oView.byId("CheckInBtn").setEnabled(true);
			} else {
				oView.byId("CheckInBtn").setEnabled(false);
			}
		},
		
		onCheckOutItemsSelect: function (oEvt) {
			var selectedItems = oEvt.getSource().getSelectedIndices();
			if (selectedItems.length > 0) {
				oView.byId("CheckOutBtn").setEnabled(true);
			} else {
				oView.byId("CheckOutBtn").setEnabled(false);
			}
		},

		onCheckIn: function (oEvt) {
			var selectedItems = oCheckInTable.getSelectedIndices();
			var checkinModel = this.getModel("CheckInModel");
			var checkoutModel = this.getModel("CheckOutModel");
			if (selectedItems.length > 0) {
				checkinModel.setData([]);
				checkinData.CheckInDate = new Date("MM-DD-YYYY");
				checkinData.CheckInTime = new Date().getTime();
				checkoutModel.setData(checkinData);
				checkinModel.refresh();
				checkoutModel.refresh();
			}
			
			var iconTabBar = oView.byId("idIconTabBar");
			iconTabBar.setSelectedKey("Checkout");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("GuaranteeDate", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("GuaranteedateInternalid")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});