const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Student = require('../models/Student');

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 * Restricts login to emails matching ALLOWED_EMAIL_DOMAIN
 */
const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const domain = email.split('@')[1];

          // Restrict to college email domain
          if (domain !== process.env.ALLOWED_EMAIL_DOMAIN) {
            return done(null, false, {
              message: `Only @${process.env.ALLOWED_EMAIL_DOMAIN} emails are allowed`,
            });
          }

          // Find or create student
          let student = await Student.findOne({ googleId: profile.id });

          if (!student) {
            student = await Student.create({
              googleId: profile.id,
              name: profile.displayName,
              email: email,
            });
            console.log(`📝 New student registered: ${email}`);
          }

          return done(null, student);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  // Serialize user ID into session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const student = await Student.findById(id);
      done(null, student);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = configurePassport;
