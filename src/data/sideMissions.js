export const sideMissions = [
  {id:'coffee_run',title:'Morning Coffee Run',district:'Little Italy',icon:'☕',type:'delivery',minutes:3,reward:{cash:120,xp:25},objective:'Pick up a local café order and deliver it to a nearby startup team.'},
  {id:'market_setup',title:'Market Booth Setup',district:'Chula Vista',icon:'🧰',type:'service',minutes:5,reward:{cash:180,xp:35},objective:'Help a neighborhood seller prepare their booth before customers arrive.'},
  {id:'customer_pulse',title:'Customer Pulse',district:'Gaslamp Quarter',icon:'🗣️',type:'research',minutes:4,reward:{cash:150,xp:40},objective:'Collect five quick customer opinions for an independent business.'},
  {id:'beach_cleanup',title:'Keep the Coast Great',district:'Mission Bay',icon:'♻️',type:'community',minutes:6,reward:{cash:200,xp:50},objective:'Join a sponsored shoreline cleanup and sort recyclable material.'},
  {id:'listing_photos',title:'Property Photo Shoot',district:'La Jolla',icon:'📷',type:'creative',minutes:5,reward:{cash:260,xp:45},objective:'Photograph a new rental listing for a local property manager.'},
  {id:'inventory_count',title:'After-Hours Inventory',district:'Downtown San Diego',icon:'📦',type:'operations',minutes:5,reward:{cash:220,xp:45},objective:'Help a retailer count stock and flag items that need reordering.'},
  {id:'airport_pickup',title:'Executive Airport Pickup',district:'San Diego International Airport',icon:'🚘',type:'driving',minutes:6,reward:{cash:300,xp:55},objective:'Provide a safe, professional ride from the airport to Downtown.'},
  {id:'park_event',title:'Community Event Crew',district:'Balboa Park',icon:'🎪',type:'service',minutes:7,reward:{cash:280,xp:60},objective:'Set up signs, tables, and guest materials for a community event.'},
  {id:'food_delivery',title:'Food Truck Supply Run',district:'National City',icon:'🚚',type:'delivery',minutes:5,reward:{cash:240,xp:45},objective:'Deliver fresh supplies to a food-truck owner before the lunch rush.'},
  {id:'social_content',title:'Local Brand Content',district:'North Park',icon:'📱',type:'creative',minutes:5,reward:{cash:260,xp:55},objective:'Capture three positive social-media clips for a neighborhood shop.'},
  {id:'store_mystery',title:'Customer Experience Check',district:'Mission Valley',icon:'📝',type:'research',minutes:6,reward:{cash:275,xp:60},objective:'Visit a store and complete a fair customer-service evaluation.'},
  {id:'mentor_runner',title:'Mentor Meeting Runner',district:'El Cajon',icon:'💼',type:'business',minutes:6,reward:{cash:320,xp:65},objective:'Deliver printed pitch materials to a small-business mentoring session.'},
  {id:'campus_flyers',title:'Campus Promotion',district:'University City',icon:'📣',type:'marketing',minutes:5,reward:{cash:210,xp:50},objective:'Place approved event flyers at designated campus business boards.'},
  {id:'marina_detail',title:'Marina Detail Job',district:'Point Loma',icon:'🧽',type:'service',minutes:7,reward:{cash:350,xp:65},objective:'Complete a premium exterior detail for a marina client.'},
  {id:'open_house',title:'Open House Assistant',district:'Del Mar',icon:'🏡',type:'property',minutes:8,reward:{cash:400,xp:75},objective:'Prepare visitor materials and welcome guests at a luxury open house.'},
  {id:'vendor_books',title:'Vendor Receipt Sort',district:'Old Town',icon:'🧾',type:'finance',minutes:5,reward:{cash:230,xp:55},objective:'Help a market vendor organize receipts into clear expense categories.'}
];

export function dailySideMissions(date=new Date()){
  const key=Number(`${date.getFullYear()}${date.getMonth()+1}${date.getDate()}`);
  return Array.from({length:6},(_,index)=>sideMissions[(key*7+index*5)%sideMissions.length]);
}
