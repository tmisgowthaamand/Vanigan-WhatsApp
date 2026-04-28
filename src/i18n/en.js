module.exports = {
  welcome: `*Welcome to Vanigan App!*\n\nDiscover Businesses, Members, and Organizers across your district.\n\nPlease choose an option below:`,
  mainMenu: `*Main Menu*\n\n1. Business List\n2. Organizer List\n3. Member List\n4. Add Business\n5. Subscription Plans\n\nReply with the number to proceed.`,
  selectDistrict: `*Select District*\n\nReply with the district number:\n\n`,
  selectAssembly: `*Select Assembly*\n\nReply with the assembly number:\n\n`,
  businessListTitle: `*Businesses in {district} - {assembly}*\n\n`,
  businessDetailsTitle: `*Business Details*\n\n`,
  organizerListTitle: `*Organizers in {district} - {assembly}*\n\n`,
  memberListTitle: `*Members in {district} - {assembly}*\n\n`,
  noResults: `No results found. Try a different selection.`,
  backToMenu: `\n\n0. Back\n9. Main Menu`,
  
  // Add Business Flow
  addBusinessName: `Please enter your *Business Name*:`,
  addBusinessAddress: `Please enter the *Full Address* (with pincode/landmark):`,
  addBusinessDistrict: `Select the *District* for your business:\n\n`,
  addBusinessAssembly: `Select the *Assembly* for your business:\n\n`,
  addBusinessContact: `Please enter *Contact Number*:`,
  addBusinessPhoto: `Please *upload a photo* of your business (send as image):`,
  addBusinessSuccess: `*Your business has been submitted successfully!*\n\nOur team will review and publish it shortly.\n\nBusiness Name: {businessName}\nDistrict: {district}\nAssembly: {assembly}\n\nReply 9 for Main Menu.`,
  
  // Subscription
  subscriptionPlans: `*Choose a Subscription Plan*\n\n1. Monthly Plan - Rs.10 (test)\n2. Yearly Plan - Rs.20 (test)\n3. Lifetime Plan - Rs.30 (test)\n\nReply with the plan number.`,
  paymentLinkMsg: `*{plan} Plan*\nAmount: Rs.{amount}\n\nClick the link below to complete payment:\n{paymentLink}\n\nAfter payment, you will receive a confirmation message.`,
  paymentSuccess: `*Payment Successful!*\n\nYour *{plan}* subscription is now active.\nValid till: {endDate}\n\nThank you for subscribing!\n\nReply 9 for Main Menu.`,
  paymentFailed: `*Payment Failed*\n\nPlease try again or contact support.\n\nReply 9 for Main Menu.`,
  waitingPayment: `We are waiting for your payment confirmation.\n\nIf you have already paid, please wait a moment.\nIf not, reply 5 to see plans again.\n\nReply 9 for Main Menu.`,
  
  // Errors
  invalidInput: `Invalid input. Please try again or reply *9* for Main Menu.`,
  error: `Something went wrong. Please try again.\n\nReply 9 for Main Menu.`,
  
  // Pagination
  nextPage: `\n\nN. Next Page\nP. Previous Page`,
  pageInfo: `Page {current} of {total}`,
};
