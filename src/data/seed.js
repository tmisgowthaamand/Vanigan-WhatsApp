require('dotenv').config();
const mongoose = require('mongoose');
const District = require('../models/District');
const Business = require('../models/Business');
const Organizer = require('../models/Organizer');
const Member = require('../models/Member');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vanigan';

// ── All 38 Tamil Nadu Districts with Assembly Constituencies ──
const districts = [
  { name: 'Ariyalur', nameTamil: 'அரியலூர்', code: 'ARI', assemblies: [
    { name: 'Ariyalur', nameTamil: 'அரியலூர்' }, { name: 'Jayankondam', nameTamil: 'ஜெயங்கொண்டம்' }, { name: 'Sendurai', nameTamil: 'செந்துரை' }
  ]},
  { name: 'Chengalpattu', nameTamil: 'செங்கல்பட்டு', code: 'CGP', assemblies: [
    { name: 'Chengalpattu', nameTamil: 'செங்கல்பட்டு' }, { name: 'Thiruporur', nameTamil: 'திருப்போரூர்' }, { name: 'Cheyyur', nameTamil: 'செய்யூர்' },
    { name: 'Madurantakam', nameTamil: 'மதுராந்தகம்' }, { name: 'Alandur', nameTamil: 'ஆலந்தூர்' }
  ]},
  { name: 'Chennai', nameTamil: 'சென்னை', code: 'CHE', assemblies: [
    { name: 'Royapuram', nameTamil: 'ராயபுரம்' }, { name: 'Harbour', nameTamil: 'துறைமுகம்' }, { name: 'Chepauk-Thiruvallikeni', nameTamil: 'சேப்பாக்கம்-திருவல்லிக்கேணி' },
    { name: 'Thousand Lights', nameTamil: 'ஆயிரம் விளக்கு' }, { name: 'Anna Nagar', nameTamil: 'அண்ணா நகர்' }, { name: 'Virugambakkam', nameTamil: 'விருகம்பாக்கம்' },
    { name: 'Saidapet', nameTamil: 'சைதாப்பேட்டை' }, { name: 'T. Nagar', nameTamil: 'தி. நகர்' }, { name: 'Mylapore', nameTamil: 'மயிலாப்பூர்' },
    { name: 'Velachery', nameTamil: 'வேளச்சேரி' }, { name: 'Sholinganallur', nameTamil: 'சோழிங்கநல்லூர்' }, { name: 'Perambur', nameTamil: 'பெரம்பூர்' },
    { name: 'Kolathur', nameTamil: 'கொளத்தூர்' }, { name: 'Villivakkam', nameTamil: 'வில்லிவாக்கம்' }, { name: 'Egmore', nameTamil: 'எழும்பூர்' }
  ]},
  { name: 'Coimbatore', nameTamil: 'கோயம்புத்தூர்', code: 'CBE', assemblies: [
    { name: 'Coimbatore North', nameTamil: 'கோயம்புத்தூர் வடக்கு' }, { name: 'Coimbatore South', nameTamil: 'கோயம்புத்தூர் தெற்கு' },
    { name: 'Singanallur', nameTamil: 'சிங்காநல்லூர்' }, { name: 'Kavundampalayam', nameTamil: 'கவுண்டம்பாளையம்' },
    { name: 'Sulur', nameTamil: 'சூலூர்' }, { name: 'Pollachi', nameTamil: 'பொள்ளாச்சி' }, { name: 'Valparai', nameTamil: 'வால்பாறை' }
  ]},
  { name: 'Cuddalore', nameTamil: 'கடலூர்', code: 'CDL', assemblies: [
    { name: 'Cuddalore', nameTamil: 'கடலூர்' }, { name: 'Kurinjipadi', nameTamil: 'குறிஞ்சிப்பாடி' }, { name: 'Bhuvanagiri', nameTamil: 'புவனகிரி' },
    { name: 'Chidambaram', nameTamil: 'சிதம்பரம்' }, { name: 'Kattumannarkoil', nameTamil: 'கட்டுமன்னார்கோயில்' }
  ]},
  { name: 'Dharmapuri', nameTamil: 'தர்மபுரி', code: 'DHP', assemblies: [
    { name: 'Dharmapuri', nameTamil: 'தர்மபுரி' }, { name: 'Pappireddipatti', nameTamil: 'பாப்பிரெட்டிப்பட்டி' },
    { name: 'Pennagaram', nameTamil: 'பென்னாகரம்' }, { name: 'Harur', nameTamil: 'ஹரூர்' }, { name: 'Palcode', nameTamil: 'பால்கோடு' }
  ]},
  { name: 'Dindigul', nameTamil: 'திண்டுக்கல்', code: 'DGL', assemblies: [
    { name: 'Dindigul', nameTamil: 'திண்டுக்கல்' }, { name: 'Palani', nameTamil: 'பழனி' }, { name: 'Oddanchatram', nameTamil: 'ஒட்டன்சத்திரம்' },
    { name: 'Athoor', nameTamil: 'ஆத்தூர்' }, { name: 'Nilakottai', nameTamil: 'நிலக்கோட்டை' }, { name: 'Natham', nameTamil: 'நத்தம்' }
  ]},
  { name: 'Erode', nameTamil: 'ஈரோடு', code: 'ERD', assemblies: [
    { name: 'Erode East', nameTamil: 'ஈரோடு கிழக்கு' }, { name: 'Erode West', nameTamil: 'ஈரோடு மேற்கு' }, { name: 'Modakkurichi', nameTamil: 'மொடக்குறிச்சி' },
    { name: 'Perundurai', nameTamil: 'பெருந்துறை' }, { name: 'Bhavani', nameTamil: 'பவானி' }, { name: 'Anthiyur', nameTamil: 'ஆந்தியூர்' },
    { name: 'Gobichettipalayam', nameTamil: 'கோபிச்செட்டிப்பாளையம்' }
  ]},
  { name: 'Kallakurichi', nameTamil: 'கள்ளக்குறிச்சி', code: 'KLK', assemblies: [
    { name: 'Kallakurichi', nameTamil: 'கள்ளக்குறிச்சி' }, { name: 'Sankarapuram', nameTamil: 'சங்கராபுரம்' },
    { name: 'Ulundurpet', nameTamil: 'உளுந்தூர்பேட்டை' }, { name: 'Rishivandiyam', nameTamil: 'ரிஷிவந்தியம்' }, { name: 'Tirukoilur', nameTamil: 'திருக்கோயிலூர்' }
  ]},
  { name: 'Kancheepuram', nameTamil: 'காஞ்சிபுரம்', code: 'KPM', assemblies: [
    { name: 'Kancheepuram', nameTamil: 'காஞ்சிபுரம்' }, { name: 'Uthiramerur', nameTamil: 'உத்திரமேரூர்' }, { name: 'Sriperumbudur', nameTamil: 'ஸ்ரீபெரும்புதூர்' }
  ]},
  { name: 'Kanniyakumari', nameTamil: 'கன்னியாகுமரி', code: 'KNY', assemblies: [
    { name: 'Nagercoil', nameTamil: 'நாகர்கோயில்' }, { name: 'Padmanabhapuram', nameTamil: 'பத்மநாபபுரம்' }, { name: 'Colachel', nameTamil: 'கொளச்சல்' },
    { name: 'Killiyoor', nameTamil: 'கிள்ளியூர்' }, { name: 'Vilavancode', nameTamil: 'விளவங்கோடு' }
  ]},
  { name: 'Karur', nameTamil: 'கரூர்', code: 'KRR', assemblies: [
    { name: 'Karur', nameTamil: 'கரூர்' }, { name: 'Aravakurichi', nameTamil: 'அரவக்குறிச்சி' }, { name: 'Kulithalai', nameTamil: 'குளித்தலை' },
    { name: 'Krishnarayapuram', nameTamil: 'கிருஷ்ணராயபுரம்' }
  ]},
  { name: 'Krishnagiri', nameTamil: 'கிருஷ்ணகிரி', code: 'KGI', assemblies: [
    { name: 'Krishnagiri', nameTamil: 'கிருஷ்ணகிரி' }, { name: 'Veppanahalli', nameTamil: 'வேப்பனஹள்ளி' }, { name: 'Hosur', nameTamil: 'ஓசூர்' },
    { name: 'Thalli', nameTamil: 'தள்ளி' }, { name: 'Denkanikottai', nameTamil: 'தேன்கனிக்கோட்டை' }, { name: 'Bargur', nameTamil: 'பர்கூர்' }
  ]},
  { name: 'Madurai', nameTamil: 'மதுரை', code: 'MDU', assemblies: [
    { name: 'Madurai East', nameTamil: 'மதுரை கிழக்கு' }, { name: 'Madurai West', nameTamil: 'மதுரை மேற்கு' }, { name: 'Madurai Central', nameTamil: 'மதுரை மத்திய' },
    { name: 'Madurai North', nameTamil: 'மதுரை வடக்கு' }, { name: 'Madurai South', nameTamil: 'மதுரை தெற்கு' },
    { name: 'Thiruparankundram', nameTamil: 'திருப்பரங்குன்றம்' }, { name: 'Melur', nameTamil: 'மேலூர்' }, { name: 'Sholavandan', nameTamil: 'சோளவந்தான்' }
  ]},
  { name: 'Mayiladuthurai', nameTamil: 'மயிலாடுதுறை', code: 'MYL', assemblies: [
    { name: 'Mayiladuthurai', nameTamil: 'மயிலாடுதுறை' }, { name: 'Poompuhar', nameTamil: 'பூம்புகார்' }, { name: 'Sirkazhi', nameTamil: 'சீர்காழி' }, { name: 'Kuthalam', nameTamil: 'குத்தாலம்' }
  ]},
  { name: 'Nagapattinam', nameTamil: 'நாகப்பட்டினம்', code: 'NGP', assemblies: [
    { name: 'Nagapattinam', nameTamil: 'நாகப்பட்டினம்' }, { name: 'Kilvelur', nameTamil: 'கீழ்வேளூர்' }, { name: 'Vedaranyam', nameTamil: 'வேதாரண்யம்' }
  ]},
  { name: 'Namakkal', nameTamil: 'நாமக்கல்', code: 'NMK', assemblies: [
    { name: 'Namakkal', nameTamil: 'நாமக்கல்' }, { name: 'Rasipuram', nameTamil: 'ராசிபுரம்' }, { name: 'Tiruchengode', nameTamil: 'திருச்செங்கோடு' },
    { name: 'Paramathi-Velur', nameTamil: 'பரமத்தி-வேலூர்' }, { name: 'Senthamangalam', nameTamil: 'செந்தமங்கலம்' }
  ]},
  { name: 'Nilgiris', nameTamil: 'நீலகிரி', code: 'NLG', assemblies: [
    { name: 'Udhagamandalam', nameTamil: 'உதகமண்டலம்' }, { name: 'Coonoor', nameTamil: 'குன்னூர்' }, { name: 'Gudalur', nameTamil: 'குடலூர்' }
  ]},
  { name: 'Perambalur', nameTamil: 'பெரம்பலூர்', code: 'PMB', assemblies: [
    { name: 'Perambalur', nameTamil: 'பெரம்பலூர்' }, { name: 'Kunnam', nameTamil: 'குன்னம்' }
  ]},
  { name: 'Pudukkottai', nameTamil: 'புதுக்கோட்டை', code: 'PDK', assemblies: [
    { name: 'Pudukkottai', nameTamil: 'புதுக்கோட்டை' }, { name: 'Aranthangi', nameTamil: 'அறந்தாங்கி' }, { name: 'Thirumayam', nameTamil: 'திருமயம்' },
    { name: 'Alangudi', nameTamil: 'ஆலங்குடி' }, { name: 'Gandarvakottai', nameTamil: 'கந்தர்வக்கோட்டை' }
  ]},
  { name: 'Ramanathapuram', nameTamil: 'ராமநாதபுரம்', code: 'RMD', assemblies: [
    { name: 'Ramanathapuram', nameTamil: 'ராமநாதபுரம்' }, { name: 'Paramakudi', nameTamil: 'பரமக்குடி' },
    { name: 'Tiruvadanai', nameTamil: 'திருவாடானை' }, { name: 'Mudukulathur', nameTamil: 'முதுகுளத்தூர்' }
  ]},
  { name: 'Ranipet', nameTamil: 'ராணிப்பேட்டை', code: 'RNP', assemblies: [
    { name: 'Ranipet', nameTamil: 'ராணிப்பேட்டை' }, { name: 'Arcot', nameTamil: 'ஆற்காடு' }, { name: 'Sholingur', nameTamil: 'சோளிங்கர்' },
    { name: 'Arakkonam', nameTamil: 'அரக்கோணம்' }, { name: 'Walajah', nameTamil: 'வாலாஜா' }
  ]},
  { name: 'Salem', nameTamil: 'சேலம்', code: 'SLM', assemblies: [
    { name: 'Salem North', nameTamil: 'சேலம் வடக்கு' }, { name: 'Salem South', nameTamil: 'சேலம் தெற்கு' }, { name: 'Salem West', nameTamil: 'சேலம் மேற்கு' },
    { name: 'Veerapandi', nameTamil: 'வீரபாண்டி' }, { name: 'Yercaud', nameTamil: 'ஏற்காடு' }, { name: 'Gangavalli', nameTamil: 'கங்கவள்ளி' },
    { name: 'Attur', nameTamil: 'ஆத்தூர்' }, { name: 'Mettur', nameTamil: 'மேட்டூர்' }, { name: 'Edappadi', nameTamil: 'எடப்பாடி' }
  ]},
  { name: 'Sivaganga', nameTamil: 'சிவகங்கை', code: 'SVG', assemblies: [
    { name: 'Sivaganga', nameTamil: 'சிவகங்கை' }, { name: 'Karaikudi', nameTamil: 'காரைக்குடி' }, { name: 'Devakottai', nameTamil: 'தேவகோட்டை' },
    { name: 'Manamadurai', nameTamil: 'மானாமதுரை' }, { name: 'Tirupathur', nameTamil: 'திருப்பத்தூர்' }
  ]},
  { name: 'Tenkasi', nameTamil: 'தென்காசி', code: 'TNK', assemblies: [
    { name: 'Tenkasi', nameTamil: 'தென்காசி' }, { name: 'Sankarankoil', nameTamil: 'சங்கரன்கோயில்' }, { name: 'Vasudevanallur', nameTamil: 'வாசுதேவநல்லூர்' },
    { name: 'Kadayanallur', nameTamil: 'கடையநல்லூர்' }, { name: 'Alangulam', nameTamil: 'ஆலங்குளம்' }
  ]},
  { name: 'Thanjavur', nameTamil: 'தஞ்சாவூர்', code: 'TNJ', assemblies: [
    { name: 'Thanjavur', nameTamil: 'தஞ்சாவூர்' }, { name: 'Thiruvaiyaru', nameTamil: 'திருவையாறு' }, { name: 'Kumbakonam', nameTamil: 'கும்பகோணம்' },
    { name: 'Papanasam', nameTamil: 'பாபநாசம்' }, { name: 'Orathanadu', nameTamil: 'ஒரத்தநாடு' }, { name: 'Pattukkottai', nameTamil: 'பட்டுக்கோட்டை' }
  ]},
  { name: 'Theni', nameTamil: 'தேனி', code: 'THN', assemblies: [
    { name: 'Theni', nameTamil: 'தேனி' }, { name: 'Periyakulam', nameTamil: 'பெரியகுளம்' }, { name: 'Bodinayakanur', nameTamil: 'போடிநாயக்கனூர்' },
    { name: 'Cumbum', nameTamil: 'கம்பம்' }, { name: 'Andipatti', nameTamil: 'ஆண்டிப்பட்டி' }
  ]},
  { name: 'Thoothukudi', nameTamil: 'தூத்துக்குடி', code: 'TUT', assemblies: [
    { name: 'Thoothukudi', nameTamil: 'தூத்துக்குடி' }, { name: 'Kovilpatti', nameTamil: 'கோவில்பட்டி' }, { name: 'Ottapidaram', nameTamil: 'ஓட்டப்பிடாரம்' },
    { name: 'Tiruchendur', nameTamil: 'திருச்செந்தூர்' }, { name: 'Srivaikuntam', nameTamil: 'ஸ்ரீவைகுண்டம்' }
  ]},
  { name: 'Tiruchirappalli', nameTamil: 'திருச்சிராப்பள்ளி', code: 'TRY', assemblies: [
    { name: 'Tiruchirappalli East', nameTamil: 'திருச்சி கிழக்கு' }, { name: 'Tiruchirappalli West', nameTamil: 'திருச்சி மேற்கு' },
    { name: 'Srirangam', nameTamil: 'ஸ்ரீரங்கம்' }, { name: 'Thiruverumbur', nameTamil: 'திருவெறும்பூர்' },
    { name: 'Lalgudi', nameTamil: 'லால்குடி' }, { name: 'Manachanallur', nameTamil: 'மணச்சநல்லூர்' },
    { name: 'Musiri', nameTamil: 'முசிறி' }, { name: 'Thuraiyur', nameTamil: 'துறையூர்' }
  ]},
  { name: 'Tirunelveli', nameTamil: 'திருநெல்வேலி', code: 'TNV', assemblies: [
    { name: 'Tirunelveli', nameTamil: 'திருநெல்வேலி' }, { name: 'Ambasamudram', nameTamil: 'அம்பாசமுத்திரம்' },
    { name: 'Palayamkottai', nameTamil: 'பாளையங்கோட்டை' }, { name: 'Nanguneri', nameTamil: 'நாங்குநேரி' },
    { name: 'Radhapuram', nameTamil: 'ராதாபுரம்' }
  ]},
  { name: 'Tirupathur', nameTamil: 'திருப்பத்தூர்', code: 'TPR', assemblies: [
    { name: 'Tirupathur', nameTamil: 'திருப்பத்தூர்' }, { name: 'Ambur', nameTamil: 'ஆம்பூர்' }, { name: 'Vaniyambadi', nameTamil: 'வாணியம்பாடி' },
    { name: 'Natrampalli', nameTamil: 'நாட்றாம்பள்ளி' }, { name: 'Jolarpet', nameTamil: 'ஜோலார்பேட்டை' }
  ]},
  { name: 'Tiruppur', nameTamil: 'திருப்பூர்', code: 'TPU', assemblies: [
    { name: 'Tiruppur North', nameTamil: 'திருப்பூர் வடக்கு' }, { name: 'Tiruppur South', nameTamil: 'திருப்பூர் தெற்கு' },
    { name: 'Avanashi', nameTamil: 'அவினாசி' }, { name: 'Palladam', nameTamil: 'பல்லடம்' }, { name: 'Dharapuram', nameTamil: 'தாராபுரம்' },
    { name: 'Kangayam', nameTamil: 'கங்கயம்' }, { name: 'Udumalpet', nameTamil: 'உடுமலைப்பேட்டை' }
  ]},
  { name: 'Tiruvallur', nameTamil: 'திருவள்ளூர்', code: 'TRV', assemblies: [
    { name: 'Tiruvallur', nameTamil: 'திருவள்ளூர்' }, { name: 'Poonamallee', nameTamil: 'பூந்தமல்லி' }, { name: 'Avadi', nameTamil: 'ஆவடி' },
    { name: 'Ambattur', nameTamil: 'அம்பத்தூர்' }, { name: 'Madhavaram', nameTamil: 'மாதவரம்' }, { name: 'Tiruttani', nameTamil: 'திருத்தணி' },
    { name: 'Ponneri', nameTamil: 'பொன்னேரி' }, { name: 'Gummidipoondi', nameTamil: 'கும்மிடிப்பூண்டி' }
  ]},
  { name: 'Tiruvannamalai', nameTamil: 'திருவண்ணாமலை', code: 'TVN', assemblies: [
    { name: 'Tiruvannamalai', nameTamil: 'திருவண்ணாமலை' }, { name: 'Kilpennathur', nameTamil: 'கீழ்பெண்ணாத்தூர்' },
    { name: 'Kalasapakkam', nameTamil: 'கலசப்பாக்கம்' }, { name: 'Chengam', nameTamil: 'செங்கம்' },
    { name: 'Polur', nameTamil: 'போளூர்' }, { name: 'Arani', nameTamil: 'ஆரணி' }, { name: 'Cheyyar', nameTamil: 'செய்யாறு' }
  ]},
  { name: 'Tiruvarur', nameTamil: 'திருவாரூர்', code: 'TVR', assemblies: [
    { name: 'Tiruvarur', nameTamil: 'திருவாரூர்' }, { name: 'Nannilam', nameTamil: 'நன்னிலம்' }, { name: 'Thiruthuraipoondi', nameTamil: 'திருத்துறைப்பூண்டி' },
    { name: 'Mannargudi', nameTamil: 'மன்னார்குடி' }, { name: 'Needamangalam', nameTamil: 'நீடாமங்கலம்' }
  ]},
  { name: 'Vellore', nameTamil: 'வேலூர்', code: 'VLR', assemblies: [
    { name: 'Vellore', nameTamil: 'வேலூர்' }, { name: 'Gudiyatham', nameTamil: 'குடியாத்தம்' }, { name: 'Katpadi', nameTamil: 'காட்பாடி' },
    { name: 'Anaikattu', nameTamil: 'அணைக்கட்டு' }, { name: 'KV Kuppam', nameTamil: 'கே.வி.குப்பம்' }
  ]},
  { name: 'Viluppuram', nameTamil: 'விழுப்புரம்', code: 'VPM', assemblies: [
    { name: 'Viluppuram', nameTamil: 'விழுப்புரம்' }, { name: 'Tindivanam', nameTamil: 'திண்டிவனம்' }, { name: 'Gingee', nameTamil: 'செஞ்சி' },
    { name: 'Vanur', nameTamil: 'வானூர்' }, { name: 'Vikravandi', nameTamil: 'விக்கிரவாண்டி' }
  ]},
  { name: 'Virudhunagar', nameTamil: 'விருதுநகர்', code: 'VRD', assemblies: [
    { name: 'Virudhunagar', nameTamil: 'விருதுநகர்' }, { name: 'Sivakasi', nameTamil: 'சிவகாசி' }, { name: 'Sattur', nameTamil: 'சாத்தூர்' },
    { name: 'Rajapalayam', nameTamil: 'ராஜபாளையம்' }, { name: 'Srivilliputtur', nameTamil: 'ஸ்ரீவில்லிபுத்தூர்' }, { name: 'Aruppukottai', nameTamil: 'அருப்புக்கோட்டை' }
  ]}
];

// ── Auto-generate sample data for ALL 38 districts ──
// 10 businesses, 10 organizers, 10 members per district

const firstNames = ['Rajesh', 'Senthil', 'Karthik', 'Murugan', 'Arun', 'Prakash', 'Ganesh', 'Lakshmi', 'Priya', 'Kavitha', 'Selvam', 'Bharathi', 'Kumaran', 'Velu', 'Anitha', 'Deepa', 'Gopi', 'Shankar', 'Revathi', 'Bala'];
const lastNames = ['Kumar', 'Raj', 'Pandian', 'Moorthy', 'Devi', 'Subramanian', 'Nathan', 'Babu', 'Kannan', 'Swamy', 'Narayanan', 'Rajan', 'Murugesan', 'Krishnan', 'Sundaram', 'Mani', 'Perumal', 'Velmurugan', 'Palanisamy', 'Ramasamy'];
const positions = ['District President', 'Secretary', 'Treasurer', 'Joint Secretary', 'Vice President', 'Organizer', 'Coordinator', 'Area Head', 'Youth Wing Leader', 'Women Wing Leader'];
const memberPositions = ['Business Owner', 'Entrepreneur', 'Trader', 'Manufacturer', 'Exporter', 'Retailer', 'Farmer', 'IT Professional', 'Artisan', 'Service Provider'];
const bizTypes = ['Textiles', 'Electronics', 'Grocery', 'Furniture', 'Hardware', 'Pharmacy', 'Jewellery', 'Restaurant', 'Auto Parts', 'Stationery'];
const bizCategories = ['Retail', 'Manufacturing', 'Trading', 'Services', 'Food', 'IT Services', 'Textiles', 'Exports', 'Agriculture', 'Healthcare'];
const bizPrefixes = ['Sri', 'New', 'Royal', 'Golden', 'Star', 'Modern', 'Classic', 'Premium', 'Super', 'Grand'];

function generateBusinesses() {
  const businesses = [];
  districts.forEach((district, dIdx) => {
    const assemblies = district.assemblies;
    for (let i = 0; i < 10; i++) {
      const assembly = assemblies[i % assemblies.length];
      const phone = `98${String(dIdx).padStart(2, '0')}${String(100 + i).padStart(6, '0')}`;
      businesses.push({
        businessName: `${bizPrefixes[i]} ${district.name} ${bizTypes[i]}`,
        address: `${10 + i}, Main Road, ${assembly.name}, ${district.name}`,
        district: district.name,
        assembly: assembly.name,
        contact: phone,
        ownerWhatsapp: `91${phone}`,
        category: bizCategories[i],
        status: 'approved'
      });
    }
  });
  return businesses;
}

function generateOrganizers() {
  const organizers = [];
  districts.forEach((district, dIdx) => {
    const assemblies = district.assemblies;
    for (let i = 0; i < 10; i++) {
      const assembly = assemblies[i % assemblies.length];
      const nameIdx = (dIdx + i) % firstNames.length;
      const lastIdx = (dIdx + i + 3) % lastNames.length;
      const phone = `97${String(dIdx).padStart(2, '0')}${String(200 + i).padStart(6, '0')}`;
      organizers.push({
        name: `${firstNames[nameIdx]} ${lastNames[lastIdx]}`,
        district: district.name,
        assembly: assembly.name,
        contact: phone,
        position: positions[i],
        whatsappNumber: `91${phone}`
      });
    }
  });
  return organizers;
}

function generateMembers() {
  const members = [];
  districts.forEach((district, dIdx) => {
    const assemblies = district.assemblies;
    for (let i = 0; i < 10; i++) {
      const assembly = assemblies[i % assemblies.length];
      const nameIdx = (dIdx + i + 5) % firstNames.length;
      const lastIdx = (dIdx + i + 7) % lastNames.length;
      const phone = `96${String(dIdx).padStart(2, '0')}${String(300 + i).padStart(6, '0')}`;
      members.push({
        name: `${firstNames[nameIdx]} ${lastNames[lastIdx]}`,
        district: district.name,
        assembly: assembly.name,
        contact: phone,
        position: memberPositions[i],
        businessName: `${firstNames[nameIdx]} ${bizTypes[i]}`,
        whatsappNumber: `91${phone}`
      });
    }
  });
  return members;
}

const businesses = generateBusinesses();
const organizers = generateOrganizers();
const members = generateMembers();

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      District.deleteMany({}),
      Business.deleteMany({}),
      Organizer.deleteMany({}),
      Member.deleteMany({})
    ]);
    console.log('Cleared existing data.');

    // Insert districts
    await District.insertMany(districts);
    console.log(`Inserted ${districts.length} districts.`);

    // Insert businesses
    await Business.insertMany(businesses);
    console.log(`Inserted ${businesses.length} businesses.`);

    // Insert organizers
    await Organizer.insertMany(organizers);
    console.log(`Inserted ${organizers.length} organizers.`);

    // Insert members
    await Member.insertMany(members);
    console.log(`Inserted ${members.length} members.`);

    console.log('\nSeed completed successfully!');
    console.log(`Districts: ${districts.length}`);
    console.log(`Total assemblies: ${districts.reduce((sum, d) => sum + d.assemblies.length, 0)}`);
    console.log(`Businesses: ${businesses.length}`);
    console.log(`Organizers: ${organizers.length}`);
    console.log(`Members: ${members.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
