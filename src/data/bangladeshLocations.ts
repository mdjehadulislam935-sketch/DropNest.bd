export interface District {
  id: string;
  name: string;
  division: string;
  upazilas: string[];
}

export const BANGLADESH_DISTRICTS: District[] = [
  // Dhaka Division
  {
    id: "dhaka",
    name: "Dhaka",
    division: "Dhaka",
    upazilas: [
      "Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar", "Tejgaon", "Mirpur",
      "Mohammadpur", "Gulshan", "Dhanmondi", "Uttara", "Badda", "Motijheel", "Jatrabari"
    ]
  },
  {
    id: "faridpur",
    name: "Faridpur",
    division: "Dhaka",
    upazilas: ["Alfadanga", "Bhangga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"]
  },
  {
    id: "gazipur",
    name: "Gazipur",
    division: "Dhaka",
    upazilas: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"]
  },
  {
    id: "gopalganj",
    name: "Gopalganj",
    division: "Dhaka",
    upazilas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"]
  },
  {
    id: "kishoreganj",
    name: "Kishoreganj",
    division: "Dhaka",
    upazilas: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"]
  },
  {
    id: "madaripur",
    name: "Madaripur",
    division: "Dhaka",
    upazilas: ["Barhamganj", "Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar"]
  },
  {
    id: "manikganj",
    name: "Manikganj",
    division: "Dhaka",
    upazilas: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"]
  },
  {
    id: "munshiganj",
    name: "Munshiganj",
    division: "Dhaka",
    upazilas: ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"]
  },
  {
    id: "narayanganj",
    name: "Narayanganj",
    division: "Dhaka",
    upazilas: ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"]
  },
  {
    id: "narsingdi",
    name: "Narsingdi",
    division: "Dhaka",
    upazilas: ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"]
  },
  {
    id: "rajbari",
    name: "Rajbari",
    division: "Dhaka",
    upazilas: ["Baliakandi", "Goalandaghat", "Kalukhali", "Pangsha", "Rajbari Sadar"]
  },
  {
    id: "shariatpur",
    name: "Shariatpur",
    division: "Dhaka",
    upazilas: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"]
  },
  {
    id: "tangail",
    name: "Tangail",
    division: "Dhaka",
    upazilas: ["Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"]
  },

  // Chittagong (Chattogram) Division
  {
    id: "bandarban",
    name: "Bandarban",
    division: "Chittagong",
    upazilas: ["Ali Kadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"]
  },
  {
    id: "brahmanbaria",
    name: "Brahmanbaria",
    division: "Chittagong",
    upazilas: ["Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"]
  },
  {
    id: "chandpur",
    name: "Chandpur",
    division: "Chittagong",
    upazilas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"]
  },
  {
    id: "chittagong",
    name: "Chittagong",
    division: "Chittagong",
    upazilas: [
      "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari",
      "Karnaphuli", "Lohagara", "Mirsharai", "Patiya", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda", "Kotwali", "Panchlaish", "Khulshi"
    ]
  },
  {
    id: "comilla",
    name: "Comilla",
    division: "Chittagong",
    upazilas: ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Comilla Sadar", "Comilla Sadar Dakshin", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Meghna", "Monohargonj", "Muradnagar", "Nangalkot", "Titas"]
  },
  {
    id: "coxs-bazar",
    name: "Cox's Bazar",
    division: "Chittagong",
    upazilas: ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"]
  },
  {
    id: "feni",
    name: "Feni",
    division: "Chittagong",
    upazilas: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Fulgazi", "Parshuram", "Sonagazi"]
  },
  {
    id: "khagrachhari",
    name: "Khagrachhari",
    division: "Chittagong",
    upazilas: ["Dighinala", "Guimara", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"]
  },
  {
    id: "lakshmipur",
    name: "Lakshmipur",
    division: "Chittagong",
    upazilas: ["Kamalnagar", "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"]
  },
  {
    id: "noakhali",
    name: "Noakhali",
    division: "Chittagong",
    upazilas: ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Noakhali Sadar", "Senbagh", "Sonaimuri", "Subarnachar"]
  },
  {
    id: "rangamati",
    name: "Rangamati",
    division: "Chittagong",
    upazilas: ["Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali", "Rangamati Sadar"]
  },

  // Rajshahi Division
  {
    id: "bogra",
    name: "Bogra",
    division: "Rajshahi",
    upazilas: ["Adamdighi", "Bogra Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatola"]
  },
  {
    id: "joypurhat",
    name: "Joypurhat",
    division: "Rajshahi",
    upazilas: ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"]
  },
  {
    id: "naogaon",
    name: "Naogaon",
    division: "Rajshahi",
    upazilas: ["Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"]
  },
  {
    id: "natore",
    name: "Natore",
    division: "Rajshahi",
    upazilas: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Natore Sadar", "Singra"]
  },
  {
    id: "nawabganj",
    name: "Chapainawabganj",
    division: "Rajshahi",
    upazilas: ["Bholahat", "Chapainawabganj Sadar", "Gomastapur", "Nachole", "Shibganj"]
  },
  {
    id: "pabna",
    name: "Pabna",
    division: "Rajshahi",
    upazilas: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"]
  },
  {
    id: "rajshahi",
    name: "Rajshahi",
    division: "Rajshahi",
    upazilas: ["Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"]
  },
  {
    id: "sirajganj",
    name: "Sirajganj",
    division: "Rajshahi",
    upazilas: ["Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullapara"]
  },

  // Khulna Division
  {
    id: "bagerhat",
    name: "Bagerhat",
    division: "Khulna",
    upazilas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"]
  },
  {
    id: "chuadanga",
    name: "Chuadanga",
    division: "Khulna",
    upazilas: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"]
  },
  {
    id: "jessore",
    name: "Jessore",
    division: "Khulna",
    upazilas: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Jessore Sadar", "Manirampur", "Sharsha"]
  },
  {
    id: "jhenaidah",
    name: "Jhenaidah",
    division: "Khulna",
    upazilas: ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"]
  },
  {
    id: "khulna",
    name: "Khulna",
    division: "Khulna",
    upazilas: ["Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada"]
  },
  {
    id: "kushtia",
    name: "Kushtia",
    division: "Khulna",
    upazilas: ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"]
  },
  {
    id: "magura",
    name: "Magura",
    division: "Khulna",
    upazilas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"]
  },
  {
    id: "meherpur",
    name: "Meherpur",
    division: "Khulna",
    upazilas: ["Gangni", "Meherpur Sadar", "Mujibnagar"]
  },
  {
    id: "narail",
    name: "Narail",
    division: "Khulna",
    upazilas: ["Kalia", "Lohagara", "Narail Sadar"]
  },
  {
    id: "satkhira",
    name: "Satkhira",
    division: "Khulna",
    upazilas: ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"]
  },

  // Barishal Division
  {
    id: "barguna",
    name: "Barguna",
    division: "Barishal",
    upazilas: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"]
  },
  {
    id: "barisal",
    name: "Barishal",
    division: "Barishal",
    upazilas: ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barishal Sadar", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"]
  },
  {
    id: "bhola",
    name: "Bhola",
    division: "Barishal",
    upazilas: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"]
  },
  {
    id: "jhalokati",
    name: "Jhalokati",
    division: "Barishal",
    upazilas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"]
  },
  {
    id: "patuakhali",
    name: "Patuakhali",
    division: "Barishal",
    upazilas: ["Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali", "Dumki"]
  },
  {
    id: "pirojpur",
    name: "Pirojpur",
    division: "Barishal",
    upazilas: ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Pirojpur Sadar", "Zianagar"]
  },

  // Sylhet Division
  {
    id: "habiganj",
    name: "Habiganj",
    division: "Sylhet",
    upazilas: ["Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj"]
  },
  {
    id: "moulvibazar",
    name: "Moulvibazar",
    division: "Sylhet",
    upazilas: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"]
  },
  {
    id: "sunamganj",
    name: "Sunamganj",
    division: "Sylhet",
    upazilas: ["Bishwamvarpur", "Chhatak", "Dakshin Sunamganj", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Sunamganj Sadar", "Tahirpur"]
  },
  {
    id: "sylhet",
    name: "Sylhet",
    division: "Sylhet",
    upazilas: ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmani Nagar", "South Surma", "Sylhet Sadar", "Zakiganj"]
  },

  // Rangpur Division
  {
    id: "dinajpur",
    name: "Dinajpur",
    division: "Rangpur",
    upazilas: ["Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"]
  },
  {
    id: "gaibandha",
    name: "Gaibandha",
    division: "Rangpur",
    upazilas: ["Fulchhari", "Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"]
  },
  {
    id: "kurigram",
    name: "Kurigram",
    division: "Rangpur",
    upazilas: ["Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Rajarhat", "Raomari", "Rowmari", "Ulipur"]
  },
  {
    id: "lalmonirhat",
    name: "Lalmonirhat",
    division: "Rangpur",
    upazilas: ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"]
  },
  {
    id: "nilphamari",
    name: "Nilphamari",
    division: "Rangpur",
    upazilas: ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"]
  },
  {
    id: "panchagarh",
    name: "Panchagarh",
    division: "Rangpur",
    upazilas: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"]
  },
  {
    id: "rangpur",
    name: "Rangpur",
    division: "Rangpur",
    upazilas: ["Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Rangpur Sadar", "Taraganj"]
  },
  {
    id: "thakurgaon",
    name: "Thakurgaon",
    division: "Rangpur",
    upazilas: ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"]
  },

  // Mymensingh Division
  {
    id: "jamalpur",
    name: "Jamalpur",
    division: "Mymensingh",
    upazilas: ["Baksiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"]
  },
  {
    id: "mymensingh",
    name: "Mymensingh",
    division: "Mymensingh",
    upazilas: ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Mymensingh Sadar", "Muktagachha", "Nandail", "Phulpur", "Tara Khanda", "Trishal"]
  },
  {
    id: "netrokona",
    name: "Netrokona",
    division: "Mymensingh",
    upazilas: ["Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala", "Khaliajuri"]
  },
  {
    id: "sherpur",
    name: "Sherpur",
    division: "Mymensingh",
    upazilas: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"]
  }
];

export function getDistrictByNameOrId(query: string): District | undefined {
  const q = query.trim().toLowerCase();
  return BANGLADESH_DISTRICTS.find(
    (d) => d.id.toLowerCase() === q || d.name.toLowerCase() === q
  );
}

export function getUpazilasForDistrict(districtNameOrId: string): string[] {
  const district = getDistrictByNameOrId(districtNameOrId);
  return district ? district.upazilas : [];
}

export function isValidDistrictUpazila(districtName: string, upazilaName: string): boolean {
  const district = getDistrictByNameOrId(districtName);
  if (!district) return false;
  return district.upazilas.some(
    (u) => u.toLowerCase() === upazilaName.trim().toLowerCase()
  );
}
