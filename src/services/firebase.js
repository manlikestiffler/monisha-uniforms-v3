// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, getDoc, doc, query, orderBy, limit, where, addDoc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, sendEmailVerification, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

// IMPORTANT: Replace the placeholder values above with your actual Firebase configuration
// Create a .env file in the project root with the following variables:
// VITE_FIREBASE_API_KEY=your_api_key
// VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
// VITE_FIREBASE_PROJECT_ID=your_project_id
// VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// VITE_FIREBASE_APP_ID=your_app_id
// VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

let app;
let analytics;
let db;
let auth;
let storage;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  
  // Create mock implementations if Firebase fails to initialize
  db = {
    collection: () => ({
      // Mock implementation
    })
  };
  
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  };
  
  storage = {
    ref: () => ({
      // Mock implementation
    })
  };
}

// Helper function to generate a unique user ID or get existing one
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Generate a random verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Firebase service functions
const firebaseService = {
  // Get all uniforms
  getAllUniforms: async () => {
    try {
      const uniformsRef = collection(db, "uniforms");
      const uniformsSnapshot = await getDocs(uniformsRef);
      return uniformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting uniforms:", error);
      throw error;
    }
  },

  // Get recent uniforms
  getRecentUniforms: async (limitCount = 4) => {
    try {
      const uniformsRef = collection(db, "uniforms");
      const q = query(uniformsRef, orderBy("createdAt", "desc"), limit(limitCount));
      const uniformsSnapshot = await getDocs(q);
      return uniformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting recent uniforms:", error);
      throw error;
    }
  },

  // Get top rated uniforms
  getTopRatedUniforms: async (limitCount = 4) => {
    try {
      const uniformsRef = collection(db, "uniforms");
      // Note: If your uniforms collection doesn't have a rating field,
      // you might need to modify this query
      const q = query(uniformsRef, orderBy("rating", "desc"), limit(limitCount));
      const uniformsSnapshot = await getDocs(q);
      return uniformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting top rated uniforms:", error);
      // If rating field doesn't exist, fall back to recent uniforms
      return await firebaseService.getRecentUniforms(limitCount);
    }
  },

  // Get uniform by ID
  getUniformById: async (id) => {
    try {
      const uniformRef = doc(db, "uniforms", id);
      const uniformSnapshot = await getDoc(uniformRef);
      
      if (uniformSnapshot.exists()) {
        return {
          id: uniformSnapshot.id,
          ...uniformSnapshot.data()
        };
      } else {
        throw new Error("Uniform not found");
      }
    } catch (error) {
      console.error("Error getting uniform:", error);
      throw error;
    }
  },

  // Get uniforms by category
  getUniformsByCategory: async (category) => {
    try {
      const uniformsRef = collection(db, "uniforms");
      const q = query(uniformsRef, where("category", "==", category));
      const uniformsSnapshot = await getDocs(q);
      return uniformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting uniforms by category:", error);
      throw error;
    }
  },

  // Get uniforms by school
  getUniformsBySchool: async (schoolId) => {
    try {
      const uniformsRef = collection(db, "uniforms");
      const q = query(uniformsRef, where("school", "==", schoolId));
      const uniformsSnapshot = await getDocs(q);
      return uniformsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting uniforms by school:", error);
      throw error;
    }
  },

  // Get all schools
  getAllSchools: async () => {
    try {
      const schoolsRef = collection(db, "schools");
      const schoolsSnapshot = await getDocs(schoolsRef);
      return schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting schools:", error);
      throw error;
    }
  },

  // Get school by ID
  getSchoolById: async (id) => {
    try {
      const schoolRef = doc(db, "schools", id);
      const schoolSnapshot = await getDoc(schoolRef);
      
      if (schoolSnapshot.exists()) {
        return {
          id: schoolSnapshot.id,
          ...schoolSnapshot.data()
        };
      } else {
        throw new Error("School not found");
      }
    } catch (error) {
      console.error("Error getting school:", error);
      throw error;
    }
  },

  // CART FUNCTIONS
  // Get cart items
  getCart: async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Return localStorage cart if not logged in
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        return localCart;
      }
      
      // Get cart from Firebase
      const cartRef = collection(db, "ecom users", user.uid, "cart");
      const snapshot = await getDocs(cartRef);
      const cart = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return cart;
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  },

  // Add item to cart
  addToCart: async (cartItem) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Store in localStorage if not logged in
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = currentCart.findIndex(item => item.id === cartItem.id);
        
        if (existingItemIndex >= 0) {
          // If item exists, update quantity
          currentCart[existingItemIndex].quantity += cartItem.quantity || 1;
        } else {
          // Add new item
          currentCart.push(cartItem);
        }
        
        localStorage.setItem('cart', JSON.stringify(currentCart));
        return true;
      }
      
      // Check if item already exists in cart
      const cartRef = collection(db, "ecom users", user.uid, "cart");
      const q = query(cartRef, where("id", "==", cartItem.id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Add new item to cart
        await addDoc(cartRef, {
          ...cartItem,
          addedAt: serverTimestamp()
        });
      } else {
        // Update quantity of existing item
        const existingCartItem = snapshot.docs[0];
        const existingQuantity = existingCartItem.data().quantity || 0;
        await updateDoc(existingCartItem.ref, {
          quantity: existingQuantity + (cartItem.quantity || 1)
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Remove from localStorage if not logged in
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        const updatedCart = currentCart.filter(item => item.id !== cartItemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return true;
      }
      
      // Remove from Firestore
      await deleteDoc(doc(db, "users", user.uid, "cart", cartItemId));
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  },

  // Update cart item quantity
  updateCartItemQuantity: async (cartItemId, quantity) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Update in localStorage if not logged in
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        const updatedCart = currentCart.map(item => {
          if (item.id === cartItemId) {
            return { ...item, quantity };
          }
          return item;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        return true;
      }
      
      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid, "cart", cartItemId), {
        quantity,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      return false;
    }
  },

  // Check if item is in cart
  isInCart: async (productId) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Check localStorage if not logged in
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        return currentCart.some(item => item.id === productId);
      }
      
      // Check Firestore
      const cartRef = collection(db, "users", user.uid, "cart");
      const q = query(cartRef, where("id", "==", productId));
      const snapshot = await getDocs(q);
      
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking if in cart:", error);
      return false;
    }
  },

  // WISHLIST FUNCTIONS
  // Get user's wishlist
  getWishlist: async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Return localStorage wishlist if not logged in
        const localWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        return localWishlist;
      }
      
      // Get wishlist from Firebase
      const wishlistRef = collection(db, "ecom users", user.uid, "wishlist");
      const snapshot = await getDocs(wishlistRef);
      const wishlist = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return wishlist;
    } catch (error) {
      console.error("Error getting wishlist:", error);
      return [];
    }
  },

  // Add item to wishlist
  addToWishlist: async (wishlistItem) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Store in localStorage if not logged in
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        if (!currentWishlist.some(item => item.id === wishlistItem.id)) {
          currentWishlist.push(wishlistItem);
          localStorage.setItem('wishlist', JSON.stringify(currentWishlist));
        }
        return true;
      }
      
      // Check if item already exists in wishlist
      const wishlistRef = collection(db, "ecom users", user.uid, "wishlist");
      const q = query(wishlistRef, where("id", "==", wishlistItem.id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Add new item to wishlist
        await addDoc(wishlistRef, {
          ...wishlistItem,
          addedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  },

  // Remove item from wishlist
  removeFromWishlist: async (itemId) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Remove from localStorage if not logged in
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const updatedWishlist = currentWishlist.filter(item => item.id !== itemId);
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        return true;
      }
      
      // Find and remove item from Firebase wishlist
      const wishlistRef = collection(db, "ecom users", user.uid, "wishlist");
      const q = query(wishlistRef, where("id", "==", itemId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docToDelete = snapshot.docs[0];
        await deleteDoc(docToDelete.ref);
      }
      
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  },

  // Check if item is in wishlist
  isInWishlist: async (itemId) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        // Check localStorage if not logged in
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        return currentWishlist.some(item => item.id === itemId);
      }
      
      // Check Firebase wishlist
      const wishlistRef = collection(db, "ecom users", user.uid, "wishlist");
      const q = query(wishlistRef, where("id", "==", itemId));
      const snapshot = await getDocs(q);
      
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking wishlist:", error);
      return false;
    }
  },

  // Toggle wishlist (add if not present, remove if present)
  toggleWishlist: async (item) => {
    try {
      const isInWishlist = await firebaseService.isInWishlist(item.id);
      
      if (isInWishlist) {
        return await firebaseService.removeFromWishlist(item.id);
      } else {
        return await firebaseService.addToWishlist(item);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      return false;
    }
  },

  // Sync localStorage cart and wishlist with Firebase
  syncCartAndWishlist: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, error: "No user logged in" };
      
      // Sync cart
      const localCart = JSON.parse(localStorage.getItem('cart')) || [];
      if (localCart.length > 0) {
        const cartRef = collection(db, "ecom users", user.uid, "cart");
        
        // Get existing cart items
        const snapshot = await getDocs(cartRef);
        const existingCartItems = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        // Add or update items from localStorage
        for (const item of localCart) {
          const existingItem = existingCartItems.find(cartItem => 
            cartItem.id === item.id
          );
          
          if (existingItem) {
            // Update quantity
            await updateDoc(doc(db, "ecom users", user.uid, "cart", existingItem.docId), {
              quantity: (existingItem.quantity || 0) + (item.quantity || 1),
              updatedAt: serverTimestamp()
            });
          } else {
            // Add new item
            await addDoc(cartRef, {
              ...item,
              addedAt: serverTimestamp()
            });
          }
        }
        
        // Clear localStorage cart
        localStorage.setItem('cart', JSON.stringify([]));
      }
      
      // Sync wishlist
      const localWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      if (localWishlist.length > 0) {
        const wishlistRef = collection(db, "ecom users", user.uid, "wishlist");
        
        // Get existing wishlist items
        const snapshot = await getDocs(wishlistRef);
        const existingWishlistItems = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        // Add items from localStorage that don't exist in Firebase
        for (const item of localWishlist) {
          const existingItem = existingWishlistItems.find(wishlistItem => 
            wishlistItem.id === item.id
          );
          
          if (!existingItem) {
            // Add new item
            await addDoc(wishlistRef, {
              ...item,
              addedAt: serverTimestamp()
            });
          }
        }
        
        // Clear localStorage wishlist
        localStorage.setItem('wishlist', JSON.stringify([]));
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error syncing cart and wishlist:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign up new user
  signUp: async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with name
      await updateProfile(user, {
        displayName: name
      });

      // Generate and send verification code
      const verificationCode = generateVerificationCode();
      
      // Store verification code in Firestore
      await setDoc(doc(db, "verification_codes", user.uid), {
        code: verificationCode,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
      });

      // Store the user in "ecom users" collection to separate from inventory app users
      await setDoc(doc(db, "ecom users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        userType: 'ecommerce'
      });

      // Send verification email
      await sendEmailVerification(user, {
        actionCodeSettings: {
          url: `${window.location.origin}/verify-email?uid=${user.uid}`,
          handleCodeInApp: true
        }
      });

      return { success: true, user };
    } catch (error) {
      console.error("Error signing up:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign in user
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time in ecom users collection
      const userDocRef = doc(db, "ecom users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        // Update existing ecom user
        await updateDoc(userDocRef, {
          lastLoginAt: serverTimestamp()
        });
      } else {
        // If user exists in auth but not in ecom users collection, add them
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          userType: 'ecommerce'
        });
      }
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error signing in:", error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message };
    }
  },

  // Send password reset email
  sendPasswordReset: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Error sending password reset:", error);
      return { success: false, error: error.message };
    }
  },

  // Verify email with code
  verifyEmail: async (uid, code) => {
    try {
      const verificationDoc = await getDoc(doc(db, "verification_codes", uid));
      
      if (!verificationDoc.exists()) {
        return { success: false, error: "Verification code not found" };
      }

      const verificationData = verificationDoc.data();
      
      // Check if code is expired
      if (verificationData.expiresAt.toDate() < new Date()) {
        return { success: false, error: "Verification code has expired" };
      }

      // Check if code matches
      if (verificationData.code !== code) {
        return { success: false, error: "Invalid verification code" };
      }

      // Delete verification code after successful verification
      await deleteDoc(doc(db, "verification_codes", uid));

      // Update user's email verification status
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          emailVerified: true
        });
        
        // Also update emailVerified status in ecom users collection
        const userDocRef = doc(db, "ecom users", uid);
        await updateDoc(userDocRef, {
          emailVerified: true
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error verifying email:", error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: () => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },

  // REVIEW FUNCTIONS
  // Add a review
  addReview: async (productId, review) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "User must be logged in to review" };
      }

      const reviewRef = collection(db, "products", productId, "reviews");
      const reviewData = {
        ...review,
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(reviewRef, reviewData);

      // Update product rating
      const productRef = doc(db, "products", productId);
      const productDoc = await getDoc(productRef);
      const productData = productDoc.data();
      
      const currentReviews = await getDocs(reviewRef);
      const totalRating = currentReviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
      const averageRating = totalRating / currentReviews.size;

      await updateDoc(productRef, {
        rating: averageRating,
        totalReviews: currentReviews.size
      });

      return { success: true };
    } catch (error) {
      console.error("Error adding review:", error);
      return { success: false, error: error.message };
    }
  },

  // Get reviews for a product
  getReviews: async (productId) => {
    try {
      const reviewRef = collection(db, "products", productId, "reviews");
      const snapshot = await getDocs(reviewRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting reviews:", error);
      return [];
    }
  },

  // Update a review
  updateReview: async (productId, reviewId, updatedReview) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "User must be logged in to update review" };
      }

      const reviewRef = doc(db, "products", productId, "reviews", reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        return { success: false, error: "Review not found" };
      }

      if (reviewDoc.data().userId !== user.uid) {
        return { success: false, error: "User can only update their own reviews" };
      }

      await updateDoc(reviewRef, {
        ...updatedReview,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating review:", error);
      return { success: false, error: error.message };
    }
  },

  // Delete a review
  deleteReview: async (productId, reviewId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: "User must be logged in to delete review" };
      }

      const reviewRef = doc(db, "products", productId, "reviews", reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        return { success: false, error: "Review not found" };
      }

      if (reviewDoc.data().userId !== user.uid) {
        return { success: false, error: "User can only delete their own reviews" };
      }

      await deleteDoc(reviewRef);

      // Update product rating
      const productRef = doc(db, "products", productId);
      const reviewCollection = collection(db, "products", productId, "reviews");
      const currentReviews = await getDocs(reviewCollection);
      
      if (currentReviews.empty) {
        await updateDoc(productRef, {
          rating: 0,
          totalReviews: 0
        });
      } else {
        const totalRating = currentReviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
        const averageRating = totalRating / currentReviews.size;
        
        await updateDoc(productRef, {
          rating: averageRating,
          totalReviews: currentReviews.size
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting review:", error);
      return { success: false, error: error.message };
    }
  }
};

export default firebaseService; 