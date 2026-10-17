const demoLocations = [
    {
        id: 1,
        name: "Dagdusheth Halwai Ganpati Mandir Prasadam",
        address: "Budhwar Peth, Pune",
        lat: 18.5158,
        lng: 73.8567,
        type: "daily",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        timings: "7:00 AM - 12:00 PM, 4:00 PM - 9:00 PM",
        description: "Famous Ganpati temple serving prasadam daily to devotees",
        active: true,
        todayOpen: true,
        rating: 4.7,
        checkinsToday: 89,
        totalCheckins: 3421,
        reviews: ["Delicious modak prasadam", "Very organized distribution", "Peaceful atmosphere", "Traditional taste"]
    },
    {
        id: 2,
        name: "Gurudwara Guru Nanak Darbar Langar",
        address: "Koregaon Park, Pune",
        lat: 18.5362,
        lng: 73.8933,
        type: "daily",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        timings: "6:00 AM - 10:00 PM",
        description: "24/7 langar seva serving fresh meals to all visitors",
        active: true,
        todayOpen: true,
        rating: 4.9,
        checkinsToday: 156,
        totalCheckins: 8934,
        reviews: ["Excellent seva", "Always fresh food", "Welcoming volunteers", "Great dal chawal"]
    },
    {
        id: 3,
        name: "Iskcon Pune Prasadam",
        address: "Kondhwa Road, Pune",
        lat: 18.4610,
        lng: 73.9044,
        type: "regular",
        days: ["Tuesday", "Thursday", "Saturday", "Sunday"],
        timings: "6:30 PM - 8:30 PM",
        description: "Krishna prasadam distribution after evening aarti",
        active: true,
        todayOpen: true,
        rating: 4.5,
        checkinsToday: 67,
        totalCheckins: 1245,
        reviews: ["Pure vegetarian prasadam", "Spiritual atmosphere", "Good for families", "Quality food"]
    },
    {
        id: 4,
        name: "Shaniwar Wada Area Bhandaara",
        address: "Shaniwar Peth, Pune",
        lat: 18.5196,
        lng: 73.8553,
        type: "festival",
        days: ["Saturday"],
        timings: "12:00 PM - 4:00 PM",
        description: "Traditional Maharashtrian bhandaara every Saturday",
        active: false,
        todayOpen: false,
        rating: 4.2,
        checkinsToday: 0,
        totalCheckins: 567,
        reviews: ["Authentic Maharashtrian food", "Good bhaji poli", "Cultural experience", "Friendly locals"]
    },
    {
        id: 5,
        name: "Parvati Hill Temple Prasadam",
        address: "Parvati Paytha, Pune",
        lat: 18.4967,
        lng: 73.8591,
        type: "regular",
        days: ["Monday", "Wednesday", "Friday"],
        timings: "8:00 AM - 11:00 AM, 5:00 PM - 8:00 PM",
        description: "Hilltop temple serving prasadam thrice weekly",
        active: true,
        todayOpen: true,
        rating: 4.3,
        checkinsToday: 34,
        totalCheckins: 892,
        reviews: ["Beautiful temple location", "Simple but tasty prasadam", "Peaceful environment", "Good climb exercise"]
    },
    {
        id: 6,
        name: "FC Road Jain Mandir Anna Seva",
        address: "Fergusson College Road, Pune",
        lat: 18.5296,
        lng: 73.8358,
        type: "regular",
        days: ["Tuesday", "Friday", "Sunday"],
        timings: "1:00 PM - 4:00 PM",
        description: "Pure Jain food distribution center",
        active: false,
        todayOpen: false,
        rating: 4.4,
        checkinsToday: 0,
        totalCheckins: 678,
        reviews: ["Very pure food preparation", "Jain dietary compliant", "Clean environment", "Good dal rice"]
    },
    {
        id: 7,
        name: "Viman Nagar Community Kitchen",
        address: "Viman Nagar, Pune",
        lat: 18.5679,
        lng: 73.9143,
        type: "regular",
        days: ["Saturday", "Sunday"],
        timings: "11:00 AM - 3:00 PM",
        description: "Modern community kitchen serving weekend meals",
        active: false,
        todayOpen: false,
        rating: 4.1,
        checkinsToday: 0,
        totalCheckins: 445,
        reviews: ["Modern facility", "Good for IT crowd", "Nutritious meals", "Easy parking"]
    },
    {
        id: 8,
        name: "Kothrud Marathi Seva Mandal",
        address: "Kothrud, Pune",
        lat: 18.5074,
        lng: 73.8077,
        type: "regular",
        days: ["Thursday", "Sunday"],
        timings: "12:30 PM - 3:30 PM",
        description: "Local community service organization meal program",
        active: false,
        todayOpen: false,
        rating: 4.0,
        checkinsToday: 0,
        totalCheckins: 356,
        reviews: ["Local community favorite", "Home-style cooking", "Marathi culture", "Affordable area"]
    },
    {
        id: 9,
        name: "Vishrambaug Wada Bhandaara",
        address: "Bajirao Road, Pune",
        lat: 18.5180,
        lng: 73.8450,
        type: "festival",
        days: ["Tuesday", "Friday"],
        timings: "2:00 PM - 5:00 PM",
        description: "Historic wada hosting traditional bhandaara",
        active: true,
        todayOpen: true,
        rating: 4.6,
        checkinsToday: 23,
        totalCheckins: 1123,
        reviews: ["Historic location", "Traditional recipes", "Cultural significance", "Good organization"]
    },
    {
        id: 10,
        name: "Hadapsar Gurudwara Langar",
        address: "Hadapsar, Pune",
        lat: 18.5089,
        lng: 73.9259,
        type: "daily",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        timings: "7:00 AM - 9:00 PM",
        description: "Community gurudwara serving fresh langar daily",
        active: true,
        todayOpen: true,
        rating: 4.8,
        checkinsToday: 78,
        totalCheckins: 2345,
        reviews: ["Fresh daily meals", "Helpful seva", "Clean kitchen", "All welcome"]
    }
];

const demoActivity = [
    {
        type: "checkin",
        user: "Priya M.",
        location: "Gurudwara Guru Nanak Darbar Langar",
        time: "1 hour ago",
        feedback: "Excellent fresh rotis today"
    },
    {
        type: "checkin",
        user: "Rahul K.",
        location: "Dagdusheth Halwai Ganpati Mandir Prasadam",
        time: "3 hours ago",
        feedback: "Morning prasadam was delicious"
    },
    {
        type: "addition",
        user: "Sneha P.",
        location: "New Bhandaara in Baner",
        time: "6 hours ago"
    },
    {
        type: "checkin",
        user: "Amit S.",
        location: "Vishrambaug Wada Bhandaara",
        time: "8 hours ago",
        feedback: "Traditional taste, well organized"
    },
    {
        type: "review",
        user: "Kavita D.",
        location: "Iskcon Pune Prasadam",
        time: "1 day ago",
        rating: 5,
        comment: "Beautiful prasadam and peaceful darshan"
    }
];

const demoStats = {
    totalLocations: 89,
    activeToday: 17,
    totalCheckins: 23567,
    checkinsToday: 447
};



const demoData = {
    bhandaaras: demoLocations,
    recentActivity: demoActivity,
    stats: demoStats
};

export function createDemoData() {
    return JSON.parse(JSON.stringify(demoData));
}

