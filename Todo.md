# Todo

Do keep this updated if you have completed something, also mark your name to the issue if you have working on something.
x : Done
- : In Progress/Assigned/Blocked

## Billing

- [ ] Wire the actual amounts in all payment pages once backend is done
- [ ] Make currency configurable
- [ ] Add paymenthistory in invoices page
- [ ] Add payment as transactions tab in account page
- [ ] Build a flow for account balanceing and closing
- [ ] Make it easy for users to mark an invoice as issued from draft state
- [ ] Replace Charge Item Create with ChargeItemDef to ChargeItem API
- [x] Account balance
- [ ] Invoice list
- [ ] Invoice View
- [ ] Invoice Print
- [ ] Invoice update statuses- Call different APIs
- [ ] Invoice - Add charge items when draft
- [ ] Invoice - Payment history filter by invoice
- [ ] Account - Payments tab - filter by Account
- [ ] Invoice View & Print - Show tax split up & Discounts (code with group in brackets)
- [ ] Invoice - Cancel button (API) & Mark as entered-in-error
- [x] View for Cancelled invoices list (Tab - by invoice Status) - Jeevan
- [x] Charge items list (Tab - by Charge item Status) - Jeevan
- [x] Payments list (Tab - by Charge item Status) - Jeevan
- [ ] Show page for cancelled invoice (render charge items from cache)
- [-] Create invoice inside Account charge item list - Jeevan
- [-] Charge Item Definition Update - Rithvik


## Labs

- [x] Build service request list page based on design
- [-] Rewamp design of service request show page based on design - Yaswanth
- [-] Add support for search by specimen ID in the UI based on design - Manyu
- [x] Add filters for statues in service request page as of the UI
- [-] Add support for multiple diagnostic report for a service request - [hold till @bodhi confirms]
- [-] Service Request - Show specimen.collection.collector details instead of UUID (After BE change) - Vignesh
- [-] Service Request - Show specimen.processing.performer details instead of UUID (After BE change) - Vignesh
- [x] Add support for xray and file uploads service request - Amjith

- [ ] In service request create from AD lets remove status, intent, category, do not perform and locations. (These should be shown along with the name for information purpose)
- [x] If no specimen def is avilable then lets not empty state - Amjith
- [-] Lets move uploaded files list to above the Choose file Card - Yash
- [ ] Implement barcode in service request after creating the Specimen
- [-] Print all Barcodes button for a service request with page setup - [hold till @bodhi confirms]
- [-] When you have uploaded the file the result section should always be present. - Yash
- [-] Link to diganostic report page should be added to the service request - Yash
- [-] We should have an option to capture conclusion in diagnostic report- Yash
- [ ] workflow statuses on the right side as per design should be created.
- [ ] Service request should show linked cahrge items along with its status [check for backend support]
