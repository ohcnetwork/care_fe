# Todo

Do keep this updated if you have completed something, also mark your name to the issue if you have working on something.

x : Done

- : In Progress/Assigned/Blocked

# Tags & Identifiers

- [x] i18n -- Khavin
- [x] Add patient identifier config button doesn’t work -- Khavin
- [BE] Identifier: search and filter (status) not working, (needs to be added in backend)
- [BE] Backend throws 500 while updating the identifier
- [BE] Tag search not working
- [-] Once Identifier is added to an encounter, it doesn’t show up while editing -- Khavin
- [BE] Add identifiers to patient serializer or add an api to get the patient's identifiers
- [-] When a edit identifier sheet is refreshed and opened, the config doesn't get populated

# Pharmacy

- [BE] Add facility-based filter & pagination in the inventory items list - Jeevan. Vignesh will add filter queryset by facility later

- [ ] Location navbar - back button breaks when browser back is used in between - Check with Aravind
- [-] Bill Medication - Button to return to dispense after invoice creation - Bodhi
- [-] Clean up and more reuse and organization of the inventory code between external and internal inventory - Yash

## Billing

- [-] Add support for information components in chargeDef and Charge Item. - Rithvik
- [BE] Replace Charge Item Create with ChargeItemDef to ChargeItem API - Vignesh
- [BE] Change default account name to {patient-name} + date to keep it a little bit unique and searchable in billing account dashboard - Amjith, Vignesh
- [BE] When a billing account of a patient is on hold, we should restrict users from creating any charge item to the patient, as per doc, but our platform will be creating a new wallet by ignoring the on-hold account (BE) - Vignesh
- [BE] Allow only one active billing account for a patient at a time , Take a product suggestion before working on this
- [BE] When an invoice is marked as 'entered in error' the transaction details should be removed from the balance summary (total amount due, net payable, etc.) - Jeevan/Vignesh

## Labs

- [-] Add support for multiple diagnostic report for a service request - [hold till @bodhi confirms]
- [-] In the Specimen Definition edit form, removing data from optional fields is not working and Fix some types and cleanup in Specimen Definition Form. - Manyu & Yash
- [ ] Specimen Definition - Add frontend permission check for the Specimen Definition page at the facility level.
- [BE] SR details page - fix decimal points to two and round off amounts in charge items.
- [BE] SR details page - Add a hyperlink to the payment page, for better UX
- [BE] Encounter can be closed even if the SR is ACTIVE. But if encounter is closer SR cannot be marked as completed ( Showing error as encounter is already closed) - Fix can be not allow top close encounter if SR is open - Vignesh
- [BE] Roles access for Labs. Only users with lab role should have access to lab services - Vignesh
- [ ] Add support to create Observations without Observation definition
- [ ] Loading skeletons
- [ ] Disable save if no changes in all forms
- [x] Specimen Def - URI validation failing - Not a bug
- [x] Definitions - Add Delete button - Manyu
- [-] Valueset - Wrap long text on mobile - Manyu
- [x] Observation Def - validation for empty components - Manyu
- [x] Observation Def - Preview mobile - status badge & button clash - Manyu
- [ ] SR form - Improve
- [-] SR - Scan existing specimen QR (Use Access identifier instead of uuid) - Yash
- [-] SR Details page - Disable the collect specimen for completed SR - Yash
- [x] Product Knowledge form - Validations - Yash
- [x] SR Details page - Disable the process step once the report generation is done

## Back End

- [-] Service Request - Show specimen.collection.collector details instead of UUID (After BE change) - Aakash
- [-] Service Request - Show specimen.processing.performer details instead of UUID (After BE change) - Aakash
- [ ] Patient - There shouldn't be more than one active account at any point in time
- [ ] BE need to sort by internal id by default, all apis has jumping issue
- [ ] Replace Charge Item Create with ChargeItemDef to ChargeItem API
- [ ] Add support for information codes (such as MRP)
- [ ] Create Charge Item from Charge Definition
- [ ] Observation Interpretation
- [ ] Spec for Ingredients, Nutrients, Drug_characteristic are incomplete in Product Knowledge
- [ ] Find which location a product is in within a facility
- [ ] Not able to mark a SR as closed - Showing error location not found
- [ ] Roles access for Labs. Only users with lab role should have access to lab services
- [ ] Encounter can be closed even if the SR is ACTIVE. But if encounter is closer SR cannot be marked as completed ( Showing error as encounter is already closed) - - [ ] Fix can be not allow top close encounter if SR is open
- [x] Need sort by payment_datetime for Payment Reconciliation list - Aakash
- [x] Medication Administration API needs support for product knowledge
- [x] Supply Request - Add supplier[] - Added supplier
- [x] New service request should be shown first within the list - Aakash

# Archived

## Billing

- [x] Wire the actual amounts in all payment pages once backend is done - Amjith
- [x] Make currency configurable - Rithvik
- [x] Add paymenthistory in invoices page - Amjith
- [x] Account - Record payment without invoice - Jeevan
- [x] Account balance
- [x] Invoice list cleanup - Amjith
- [x] Invoice View cleanup - Amjith
- [x] Invoice Print Screen - Amjith
- [x] Invoice - Show record payment button only when in issued status - Jeevan
- [x] Invoice - Show Issue Invoice button when in draft status - Jeevan
- [x] Invoice - Remove status dropdown in Invoice create & edit - Jeevan
- [x] Invoice - Balance Invoice button - Confirm popup - Jeevan
- [x] Invoice - Add charge items when draft - Jeevan
- [x] Invoice - Payment history filter by invoice - Amjith
- [x] Account - Payments tab - filter by Account - BE
- [x] Invoice View & Print - Show tax split up & Discounts (code with group in brackets) - Amjith
- [x] Invoice - Cancel button (API) & Mark as entered-in-error - Jeevan
- [x] View for Cancelled invoices list (Tab - by invoice Status) - Jeevan
- [x] Charge items list (Tab - by Charge item Status) - Jeevan
- [x] Payments list (Tab - by Charge item Status) - Jeevan
- [x] Show page for cancelled invoice (render charge items from cache)
- [x] Create invoice inside Account charge item list - Jeevan
- [x] Charge Item Definition Update - Rithvik
- [x] Invoice - Entered in error in action menu - Jeevan
- [x] [!BUG!] Charge Item create is broken now. - Amjith (Data Issue)
- [x] We should also make it billable by deafault - Amjith
- [x] We should only show active charge defanitions in questionnaire - Manyu & Rithvik
- [x] Description and Purpose (Additional Details) for a charge item def should be above the price component - Manyu
- [x] Lets have a list like styling for the discount codes as their would be a lot of these options. - Rithvik
- [x] The UX for creating a new code should be better, the flow is quite ambigious to pick one. - Rithvik
- [x] We should also show instance level tax components in the billing page - Rithvik
- [x] Charge Item Update - Jeevan & Rithvik
- [x] Build a flow for account balanceing and closing (Close button - mark as inactive and select close reason dropdown) - Jeevan
- [x] Allow serch for discount codes - Rithvik
- [x] When Creating charge item in questionnaire we should display applicable discounts and tax and amounts from the charge item def as read-only - Yaswanth
- [x] Move account as a pill in the encounter, it should only fetch the account if its clicked, show the account details in a sheet and show option to navigate to the accounts page (Sheet - Render account details/Create account button) - Yash
- [x] Start date is missing for the automatically created billing account - Amjith
- [x] Remove -- in the end date column if the billing account still ongoing - Amjith
- [x] When we click past account button in the account details page, it should redirect to the patient account overview page, rather than the entire hospital account overview page - Jeevan
- [x] Disable record payment button in billing account details page, if the account status is not active - Amjith
- [x] Wire the issue date and update the invoice activity timeline to use it - Yaswanth
- [x] Display the negative balance in the 'Amount Due' section as well to indicate that the user has overpaid beyond their actual bill. - Manyu
- [x] Modify back button links in Payment details page (back to accountId/payments if navigating from there) - Jeevan
- [x] When attempting to close a billing account with pending charge items that haven't been invoiced, disable the 'Close Account' button in the pop-up and display a message stating: 'You cannot close an account with pending charge items. - Manyu.
- [x] All instance level tax codes should be shown as an option in the charge item def creator - Check with Vignesh
- [x] Consider disabling onWheelChange for input[type=number] fields. - [hold till @bodhi confirms]

## Labs

- [x] Build service request list page based on design - Manyu
- [x] Rewamp design of service request show page based on design - Yaswanth
- [x] Add support for search by specimen ID in the UI based on design - Manyu
- [x] Add filters for statues in service request page as of the UI - Manyu
- [x] Add support for xray and file uploads service request - Amjith
- [x] [!BUG!] Specimen Discard broken - Hide from SR after discard, should be able to collect the same specimen again - Yaswanth
- [x] Currently when ever we interact with discard specimen dialog the below specimen collapsible is getting expanded and collapsed. This should not happen. - Yaswanth
- [x] Implement barcode in service request after creating the Specimen - Manyu & Amjith
- [x] In service request create from AD lets remove status, intent, category, do not perform and locations. (These should be shown along with the name for information purpose) - Manyu
- [x] If no specimen def is avilable then lets not empty state - Amjith
- [x] Lets move uploaded files list to above the Choose file Card - Yash
- [x] Diagnostic Report - Print uploaded files as well - Yash
- [x] When you have uploaded the file the result section should always be present. - Yash
- [x] Link to diganostic report page should be added to the service request - Yash
- [x] We should have an option to capture conclusion in diagnostic report- Yash
- [x] Workflow statuses on the right side as per design should be created. - Amjith
- [x] Move the workflow progress into a sheet for small devices - Yaswanth
- [x] Hide the sidebar on SR show - (Sugegstion from Vinu) - Yaswanth
- [x] Show the specimen history inside a sheet on SR show - Yaswanth
- [x] [!BUG!] Allow re-creating the draft specimen after discrard - when the specimen is not in available or draft status - Yaswanth
- [x] Service request should show linked cahrge items along with its status - Amjith
- [x] Print all Barcodes button for a service request with page setup - Yaswanth
- [x] Make Activity Definiton search inside the service request question working
- [x] Specimen Definition - Remove 0 prefilled value in Retention time, capacity, and minimum value - Yash
- [x] Healthcare Service edit - Location expand missing in sheet - Manyu
- [x] Specimen Definition - Add \* for required fields and frontend validation for Retention Time, Capacity, Minimum Volume, Type Collected, Title, and Slug
- [x] Specimen Definition - The cancel button in the form is not working - Amjith
- [x] Specimen Definition - Increase the width of retention time and capacity to full width in the edit page - Jeevan
- [x] Specimen Definition - Add URL validation to the field Derived from URL - Jeevan
- [x] Create Observation Definition - Add \* to Title, Slug, Description, Category, Status, and Data Type fields. - Jeevan
- [x] Create Observation Definition - Add missing asterisk and frontend validation for the LOINC field
- [x] Create Observation Definition - Add missing translation for edit_observation_definition form heading - Amjith
- [x] Create Observation Definition - The category filter in the list view is not working - Amjith, Vignesh
- [x] Active Definition - Add asterisks to Title, Slug, Description, Usage, and Category fields. - Amjith
- [x] Active Definition - Add asterisk and frontend validation for code field - Amjith
- [x] Active Definition - In the questionnaire of SR, change the autocomplete border colour from blue to keep them consistent - Amjith
- [x] Specimen Definition - The 2x2 grid UI breaks when the error message is triggered and only one of the fields/columns is filled - Amjith
- [x] Charge Item - Add an asterisk to the Title field. - Jeevan
- [x] Charge Item - Add asterisk and frontend validation for the Base Price field. - Jeevan
- [x] Charge Item - Remove the ? from the discount dropdown - Jeevan - Nothing to be done, data was just saved that way.
- [x] Charge Item - Removing prefilled data from the Discount and Tax fields causes the field state to freeze, requiring a manual page reload. - Jeevan
- [x] Charge Item - Limit the discount and tax field input to 100 max - Jeevan
- [x] SR details page — In the Add Charge Item slide over, display the final amount after discount and tax, and the amount split when hovering over the (!) icon. -> We can't show the total here as backend deos not return the total for CID and we decided to not do any manual calculations in FE, see item below: - Yash
- [x] Add info on Charge Item created on SR show (This includes total from BE). - Yash
- [x] SR Questionnaire - Investigate placement of Priority and Urgent text fields, as the text field appears in Overview and the request in the SR tab upon submission. Currently, Priority is recorded both as structured data and plain text in the same question. - This was a mistake in Questionnaire - Amjith
- [x] Pass only the active and draft specimens to multi QR print - Yash
- [x] Get all matching specimens for a requierment so that draftspecimen creation works as expected, -> when there are multiple specimens for a requirement -> when a previous specimen is discarded - Yash
- [x] Fix the draft badge in SR show - Amjith & Yash
- [x] SR details page- Remove the back button from the sample identification QR print preview pop-up. / adjust the behavior to only close the pop-up - Manyu
- [x] SR details page - Specimen ID cannot be hidden in the Service Request QR - Manyu
- [x] Fix the explicit type casting and add proper types to SDF - Yash
- [x] In the service request questionnaire, additional details can be added within an information button Eg. "Snomed code", Fasting blood glucose measurement | http://snomed.info/sct. - Manyu
- [x] Back to encounter button in service request should be browser back and not to the encounter back. Coz if encounter is closed, it will show error - Manyu
- [x] From the SR screen, clicking on back button take to the care dashboard and not the SR listing page. - Manyu [this happens when you relogin after timeout]
- [x] SR listing page should have tabs to identify SRs in different status. Eg Prescription queue - Manyu
- [x] In the Test Results, additional details can be added within an information button Eg. http://loinc.org,1558-6. - Manyu
- [x] Able to generate report even without collecting sample - Manyu
- [x] When create report is pressed, report gets generated but need to reload the page to get report and only after refresh the timeline gets updated - Manyu
- [x] After collecting specimen, the page needs to be refreshed to get status of collected specimen - Manyu
- [x] SR overview page - Show the current status of the service request. Upon completion, update the status from active to complete - Manyu [Backend change pending]
- [x] If no entries are given to a report and click on Save Result, it shows Conclusion updated successfully but report is not generated. Since report cant be blank, there should be validation and show error is no entries are there for result and conclusion. - Manyu
- [x] If a long conclusion is given to a report, UI is breaking (Diagnostic Report) - Manyu
- [x] Not able to mark a SR as closed - Showing error location not found - Vignesh - Data issue
- [x] Activity Def, Observation def form - Enter goes back - Yash
- [x] Diagnostic Report - Filter out inactive observations - Yash
- [x] Diag Report View - Browser back - Yash
- [x] AD form - Location Sheet - remove cursor pointer on hover on name - Amjith
- [x] New service request should be shown first within the list - Vignesh
- [x] AD form - Selected location alignment - Amjith

## Pharmacy

- [x] Clean up product knowledge and fix update - Khavin
- [x] Clean up product and support edit form product knowledge
- [x] List - Supply request & delivery - Incoming/Requested filter - url wise - Amjith
- [x] Request inside delivery, and vice versa - Amjith
- [x] Create delivery inside request - Amjith
- [x] Charge item inside Product (Select and Create new)
- [x] Inventory list
- [x] Fix search, navigation and scroll for Suppliers page - Yash
- [x] Add option to archive suppliers - Yash
- [x] Add status based filters for product knowledge - Amjith
- [x] Undo absolute net quantity after video recorded - Amjith
- [x] Healthcare Service Details View page : Hide the unwanted metadata details page & add translation for extra_details - Jeevan
- [x] Add pagination where it's missing - Jeevan
- [x] Add a warning colour for low stock items in the inventory item list - Jeevan
- [x] Remove unknown from Specimen Definition Status - Jeevan
- [x] Edit page of the supply delivery details is crashing - Khavin
- [x] Medications added from our product cannot be administered due to missing code - Jeevan/Vignesh; Medication Administration API needs support for product knowledge
- [x] Each modification to the pre-filled quantity in bill medication triggers a component re-render, which disrupts the editing experience. - Khavin
- [x] Supply Request - Disallow selecting current location - Jeevan
- [x] Supply Request - Add supplier[] after backend done - Jeevan
- [x] No pagination in dispense history sheet - Yash
- [x] Medication Administration - Product knowledge - Amjith
- [x] Dispense - Select all - Jeevan
- [x] Dispense screen - Flip paid/unpaid filter - default to paid - Jeevan
- [x] Dispense queue - delete - update dispense_status - Jeevan
- [x] Medication Request & Dispense - add facility param in list apis - Amjith
- [x] Dispense screen - Create Invoice button opening the sheet with billable charge items from unpaid dispense objects in preparation tab - Jeevan
- [x] Medication Request - Prefill unit from product knowledge and disallow modification - Yash
- [x] Purchase Order - Receive stock sheet - show only active Supply Requests - Yash
- [x] Bill medication - Add validation for days > 0 - Yash
- [x] Bill medication - Add validation for quantity to be less than selected lot's quantity - Yash
- [x] Prescription queue - partially billed - Mark as all given for each row - Jeevan
