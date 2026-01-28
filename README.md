# SkillSwap

A peer-to-peer skill exchange platform for students and enthusiasts. Learn new skills through community-driven mentorship and earn virtual coins for your contributions.

## 🌟 Features

- **User Profiles**: Create profiles with skills you offer and want to learn
- **Skill Discovery**: Search for mentors by skill name
- **Mentorship Requests**: Send and manage mentorship requests
- **Virtual Coin System**: Earn coins by helping others (no real money involved)
- **Feedback System**: Rate and review completed mentorships

## 🚀 Tech Stack

### Frontend
- HTML5
- CSS3 (Modern design with gradients and animations)
- Vanilla JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)

## 🛠️ Installation

1. **Clone or download this repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   - **Windows**: MongoDB should start automatically as a service
   - **Mac/Linux**: Run `mongod` in a terminal

4. **Start the application**
   ```bash
   npm start
   ```
   
   Or for development:
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to: `http://localhost:3000`

## 📁 Project Structure

```
Skills-Swap/
├── client/                 # Frontend files
│   ├── index.html         # Home page
│   ├── profile.html       # User profile & skills
│   ├── search.html        # Search mentors
│   ├── requests.html      # Manage requests
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       └── main.js        # Shared utilities
├── server/                # Backend files
│   ├── index.js          # Express server
│   ├── config/
│   │   └── db.js         # Database connection
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── Skill.js
│   │   ├── MentorshipRequest.js
│   │   └── Feedback.js
│   └── routes/           # API routes
│       ├── userRoutes.js
│       ├── skillRoutes.js
│       ├── requestRoutes.js
│       └── feedbackRoutes.js
└── package.json
```

## 🎮 How to Use

### 1. Create an Account
- Visit the home page
- Fill in your name, email, and bio
- You'll start with **10 free coins**!

### 2. Add Skills
- Go to the **Profile** page
- Add skills you can teach (Skills I Offer)
- Add skills you want to learn (Skills I Want)

### 3. Find Mentors
- Go to the **Search** page
- Search for a skill (e.g., "JavaScript", "Design")
- Browse available mentors
- Send a mentorship request (**costs 1 coin**)

### 4. Manage Requests
- Go to the **Requests** page
- **As a Mentor**: Accept incoming requests and mark them as completed (**earn 5 coins**)
- **As a Learner**: Track your outgoing requests and leave feedback

### 5. Earn Coins
- Complete mentorships as a mentor: **+5 coins**
- Coins represent your reputation and contribution to the community

## 🔌 API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users` - Get all users

### Skills
- `POST /api/skills` - Add a skill
- `GET /api/skills/search?skillName=<name>` - Search mentors by skill
- `GET /api/skills/user/:userId` - Get user's skills

### Mentorship Requests
- `POST /api/requests` - Send a request (costs 1 coin)
- `PUT /api/requests/:id/accept` - Accept a request
- `PUT /api/requests/:id/complete` - Complete mentorship (mentor gets 5 coins)
- `GET /api/requests/user/:userId` - Get user's requests

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/mentor/:mentorId` - Get mentor's feedback
- `GET /api/feedback/request/:requestId` - Get feedback for a request

## 💡 Coin System

- **New User**: Starts with **10 coins**
- **Send Request**: Costs **1 coin**
- **Complete Mentorship** (as mentor): Earn **5 coins**
- **No Real Money**: This is a virtual reputation system only

## 🎨 Design Features

- Modern dark theme with vibrant gradients
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Glassmorphism effects
- Interactive hover states
- Clean, intuitive UI

## ⚠️ Important Notes

- **No Authentication**: This is an MVP without login/password (user ID stored in localStorage)
- **No Real-time Chat**: Communication happens through mentorship requests
- **No Payments**: Virtual coins only, no real money exchange
- **Local Development**: Designed for local testing and demos

## 🐛 Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod`
- Check connection string in `server/config/db.js`

### Port Already in Use
- Change the port in `server/index.js` (default: 3000)

### API Not Responding
- Check if the server is running
- Verify MongoDB is connected (check console logs)

## 🚧 Future Enhancements

- User authentication (JWT)
- Real-time chat
- Video call integration
- Advanced search filters
- User ratings and leaderboard
- Email notifications
- Profile pictures

## 📝 License

MIT License - Feel free to use this project for learning and hackathons!

## 👨‍💻 Author

Built as a full-stack demo project for skill exchange platforms.

---

**Happy Learning! 🎓✨**
