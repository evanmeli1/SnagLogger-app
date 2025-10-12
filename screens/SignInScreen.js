import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithGoogle } from '../utils/oauth';
import * as Linking from 'expo-linking';
import { syncGuestDataSafely } from '../utils/syncHelpers';
import { sanitizeInput, validateEmail } from '../utils/validation';
import { signInWithApple } from '../utils/appleAuth';
import { Platform } from 'react-native';




export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchBlobs, setTouchBlobs] = useState([]);

  // Animation values
  const contentSlideAnim = useRef(new Animated.Value(30)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const inputAnim1 = useRef(new Animated.Value(0)).current;
  const inputAnim2 = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const socialAnim = useRef(new Animated.Value(0)).current;
  const linkAnim = useRef(new Animated.Value(0)).current;

  // Floating blob animations
  const blob1Float = useRef(new Animated.Value(0)).current;
  const blob2Float = useRef(new Animated.Value(0)).current;
  const blob3Float = useRef(new Animated.Value(0)).current;

  // Touch blob creation (same as welcome screen)
  const createTouchBlob = (x, y) => {
    const id = Date.now() + Math.random();
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0.8);
    
    const newBlob = {
      id,
      x: x - 25,
      y: y - 25,
      scaleAnim,
      opacityAnim,
    };
    
    setTouchBlobs(prev => [...prev, newBlob]);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTouchBlobs(prev => prev.filter(blob => blob.id !== id));
    });
  };

  // Pan responder for touch detection
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      createTouchBlob(locationX, locationY);
    },
  });

  useEffect(() => {
    // Content entrance animation
    Animated.parallel([
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations
    setTimeout(() => {
      Animated.timing(inputAnim1, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 200);

    setTimeout(() => {
      Animated.timing(inputAnim2, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 350);

    setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 500);

    setTimeout(() => {
      Animated.timing(socialAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 650);

    setTimeout(() => {
      Animated.timing(linkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 800);

    // Floating blob animations
    const createFloatingAnimation = (animValue) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnimation(blob1Float).start();
    createFloatingAnimation(blob2Float).start();
    createFloatingAnimation(blob3Float).start();
  }, []);


  const handleSignIn = async () => {
    // Validate email
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }
    
    if (email.length > 100) {
      Alert.alert('Invalid Email', 'Email is too long');
      return;
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    // Validate password
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password');
      return;
    }
    
    if (password.length > 72) {
      Alert.alert('Invalid Password', 'Password is too long');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Customize error message
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      Alert.alert('Error', errorMessage);
    } else {
      if (data.user) {
        await syncGuestDataSafely(data.user.id);
        navigation.navigate('MainTabs');
      }
    }
    setLoading(false);
  };


  const animatedButtonPress = (callback) => {
    const scaleAnim = new Animated.Value(1);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  return (
    <LinearGradient
      colors={['#E8D5FF', '#D1BAF5', '#B79CED']}
      locations={[0, 0.5, 1]}
      style={styles.container}
      {...panResponder.panHandlers}
    >
      {/* Floating blobs */}
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob1,
          {
            transform: [
              {
                translateY: blob1Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -18],
                })
              },
              { rotate: '12deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob2,
          {
            transform: [
              {
                translateY: blob2Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 22],
                })
              },
              { rotate: '-18deg' }
            ]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.blob, 
          styles.blob3,
          {
            transform: [
              {
                translateY: blob3Float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -12],
                })
              },
              { rotate: '30deg' }
            ]
          }
        ]} 
      />

      {/* Touch-responsive blobs */}
      {touchBlobs.map((blob) => (
        <Animated.View
          key={blob.id}
          style={[
            styles.touchBlob,
            {
              left: blob.x,
              top: blob.y,
              opacity: blob.opacityAnim,
              transform: [
                {
                  scale: blob.scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  })
                }
              ]
            }
          ]}
        />
      ))}

      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => animatedButtonPress(() => navigation.goBack())}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: contentFadeAnim,
            transform: [{ translateY: contentSlideAnim }]
          }
        ]}
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        
        <Animated.View style={{ opacity: inputAnim1 }}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#6A6A6A"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Animated.View>
        
        <Animated.View style={{ opacity: inputAnim2 }}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#6A6A6A"
            secureTextEntry
          />
        </Animated.View>
        
        <Animated.View style={{ opacity: buttonAnim }}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => animatedButtonPress(handleSignIn)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Signing In...' : 'SIGN IN'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ opacity: socialAnim }}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => animatedButtonPress(async () => {
                try {
                  setLoading(true);
                  console.log('🟢 Starting Google OAuth...');
                  const success = await signInWithGoogle();

                  if (success) {
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                      console.log('🟢 Checking if safe to sync...');
                      await syncGuestDataSafely(user.id);
                    }

                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  } else {
                    Alert.alert('Error', 'Google sign-in failed or was canceled.');
                  }
                } catch (error) {
                  Alert.alert('Error', error.message || 'Google sign-in failed.');
                } finally {
                  setLoading(false);
                }
              })}

            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => animatedButtonPress(async () => {
                if (Platform.OS !== 'ios') {
                  Alert.alert('iOS Only', 'Apple Sign In is only available on iOS devices.');
                  return;
                }

                try {
                  setLoading(true);
                  const success = await signInWithApple();
                  
                  if (success) {
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (user) {
                      await syncGuestDataSafely(user.id);
                    }
                    
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'MainTabs' }],
                    });
                  } else {
                    Alert.alert('Error', 'Apple sign-in failed or was canceled.');
                  }
                } catch (error) {
                  Alert.alert('Error', error.message || 'Apple sign-in failed.');
                } finally {
                  setLoading(false);
                }
              })}
            >
              <View style={styles.appleIcon}>
                <Text style={styles.appleSymbol}></Text>
              </View>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: linkAnim }}>
          <TouchableOpacity onPress={() => animatedButtonPress(() => navigation.navigate('SignUp'))}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: linkAnim }}>
          <TouchableOpacity onPress={() => animatedButtonPress(() => navigation.navigate('MainTabs'))}>
            <Text style={[styles.linkText, { marginTop: 16 }]}>Continue as guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  blob: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 100,
  },
  blob1: {
    width: 90,
    height: 160,
    top: 70,
    right: -25,
  },
  blob2: {
    width: 110,
    height: 190,
    bottom: 150,
    left: -35,
  },
  blob3: {
    width: 70,
    height: 120,
    top: 300,
    right: 10,
  },
  touchBlob: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    pointerEvents: 'none',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  backText: {
    color: '#4A4A4A',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'PoppinsRegular',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: '#6A6A6A',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
    fontWeight: '400',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    color: '#4A4A4A',
    fontWeight: '400',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    backgroundColor: '#2D2D2D',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: 320,
    marginBottom: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6A6A6A',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(106, 106, 106, 0.3)',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#6A6A6A',
    fontWeight: '400',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
  },
  appleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  appleSymbol: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'PoppinsMedium',
    color: '#4A4A4A',
  },
  linkText: {
    color: '#6A6A6A',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
  },
});

 